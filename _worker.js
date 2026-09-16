const PROVIDERS = {
  chatgpt: { id:'chatgpt', name:'ChatGPT / OpenAI', kind:'cloud', secret:'OPENAI_API_KEY', modelEnv:'OPENAI_MODEL', defaultModel:'gpt-5' },
  deepseek: { id:'deepseek', name:'DeepSeek', kind:'cloud', secret:'DEEPSEEK_API_KEY', modelEnv:'DEEPSEEK_MODEL', defaultModel:'deepseek-chat' },
  gemini: { id:'gemini', name:'Google Gemini', kind:'cloud', secret:'GEMINI_API_KEY', modelEnv:'GEMINI_MODEL', defaultModel:'gemini-2.5-flash' },
  ibnsina: { id:'ibnsina', name:'IbnSina-1.5B', kind:'local', modelEnv:'IBNSINA_MODEL', defaultModel:'ibnsina-1.5b' }
};

function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...extra } });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  return origin ? { 'Access-Control-Allow-Origin': origin, 'Vary':'Origin', 'Access-Control-Allow-Credentials':'true' } : {};
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return b64u(new Uint8Array(sig));
}
function b64u(bytes) { let s=''; bytes.forEach(b=>s+=String.fromCharCode(b)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function tokenValue(payload) { return b64u(new TextEncoder().encode(JSON.stringify(payload))); }
function parseCookies(header='') { const out={}; header.split(';').forEach(p=>{ const i=p.indexOf('='); if(i>0) out[p.slice(0,i).trim()]=decodeURIComponent(p.slice(i+1).trim()); }); return out; }
async function setSessionCookie(env) {
  const secret = env.OMNIAI_SESSION_SECRET || env.OMNIAI_ACCESS_PASSWORD;
  if (!secret) return null;
  const exp = Date.now()+1000*60*60*24*30;
  const payload = tokenValue({uid:'owner',exp});
  const sig = await hmac(secret,payload);
  return `omniai_session=${payload}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60*60*24*30}`;
}
async function isAuthed(request, env) {
  if (!env.OMNIAI_ACCESS_PASSWORD) return true;
  const c=parseCookies(request.headers.get('Cookie')||'');
  if(!c.omniai_session) return false;
  const [payload,sig]=c.omniai_session.split('.'); if(!payload||!sig) return false;
  const expected=await hmac(env.OMNIAI_SESSION_SECRET||env.OMNIAI_ACCESS_PASSWORD,payload);
  if(sig!==expected) return false;
  try { const p=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))); return p.exp>Date.now(); } catch { return false; }
}

async function requireAuth(request, env) {
  if (await isAuthed(request, env)) return null;
  return json({ok:false,error:'unauthorized',message:'وارد حساب OmniAI شوید.'},401,corsHeaders(request));
}

async function dbEnsure(env) {
  if (!env.DB) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY,user_id TEXT NOT NULL,provider_id TEXT NOT NULL,model_id TEXT NOT NULL,title TEXT NOT NULL,source TEXT NOT NULL DEFAULT 'provider_api',favorite INTEGER NOT NULL DEFAULT 0,archived INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY,conversation_id TEXT NOT NULL,role TEXT NOT NULL,content TEXT NOT NULL,provider_id TEXT,model_id TEXT,status TEXT NOT NULL DEFAULT 'complete',created_at INTEGER NOT NULL,metadata TEXT)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id,created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id,updated_at)`).run();
}
function newId(prefix='id') { return `${prefix}_${crypto.randomUUID()}`; }

async function listConversations(env) {
  if (!env.DB) return [];
  const rs = await env.DB.prepare(`SELECT id,provider_id,model_id,title,source,favorite,archived,created_at,updated_at FROM conversations WHERE user_id='owner' ORDER BY updated_at DESC LIMIT 200`).all();
  return rs.results||[];
}

async function getConversation(env, id) {
  if (!env.DB) return null;
  const c = await env.DB.prepare(`SELECT * FROM conversations WHERE id=? AND user_id='owner'`).bind(id).first();
  if (!c) return null;
  const ms = await env.DB.prepare(`SELECT id,role,content,provider_id,model_id,status,created_at,metadata FROM messages WHERE conversation_id=? ORDER BY created_at ASC`).bind(id).all();
  c.messages = ms.results||[]; return c;
}

async function saveConversation(env, convId, providerId, modelId, title, messages, source='provider_api') {
  if (!env.DB) return;
  const now=Date.now();
  const existing=await env.DB.prepare(`SELECT id FROM conversations WHERE id=? AND user_id='owner'`).bind(convId).first();
  if(!existing) await env.DB.prepare(`INSERT INTO conversations (id,user_id,provider_id,model_id,title,source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).bind(convId,'owner',providerId,modelId,title,source,now,now).run();
  else await env.DB.prepare(`UPDATE conversations SET provider_id=?,model_id=?,title=?,updated_at=? WHERE id=? AND user_id='owner'`).bind(providerId,modelId,title,now,convId).run();
  for (const m of messages) {
    if(!m.id) m.id=newId('msg');
    await env.DB.prepare(`INSERT OR IGNORE INTO messages (id,conversation_id,role,content,provider_id,model_id,status,created_at,metadata) VALUES (?,?,?,?,?,?,?,?,?)`).bind(m.id,convId,m.role,m.content,providerId,modelId,m.status||'complete',m.createdAt||now,JSON.stringify(m.metadata||{})).run();
  }
}

function extractOpenAIText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  const out = data.output || [];
  return out.flatMap(item=>item.content||[]).map(x=>x.text||'').filter(Boolean).join('\n');
}

async function providerChat(providerId, model, messages, env) {
  if(providerId==='ibnsina') throw new Error('local_provider');
  const p=PROVIDERS[providerId]; if(!p) throw new Error('unknown_provider');
  const key=env[p.secret]; if(!key) throw new Error(`missing_secret:${p.secret}`);

  if(providerId==='chatgpt') {
    const input=messages.map(m=>({role:m.role,content:[{type:'input_text',text:m.content}]}));
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,input})});
    const txt=await r.text(); let data; try{data=JSON.parse(txt)}catch{data={}};
    if(!r.ok) throw new Error(`openai:${data.error?.message||txt.slice(0,300)}`);
    return {text:extractOpenAIText(data),raw:data};
  }
  if(providerId==='deepseek') {
    const r=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model,messages,stream:false})});
    const txt=await r.text(); let data; try{data=JSON.parse(txt)}catch{data={}};
    if(!r.ok) throw new Error(`deepseek:${data.error?.message||txt.slice(0,300)}`);
    return {text:data.choices?.[0]?.message?.content||'',raw:data};
  }
  if(providerId==='gemini') {
    const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
    const contents=messages.filter(m=>m.role!=='system').map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}));
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents,systemInstruction:messages.find(m=>m.role==='system')?{parts:[{text:messages.find(m=>m.role==='system').content}]}:undefined})});
    const txt=await r.text(); let data; try{data=JSON.parse(txt)}catch{data={}};
    if(!r.ok) throw new Error(`gemini:${data.error?.message||txt.slice(0,300)}`);
    const text=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'';
    return {text,raw:data};
  }
  throw new Error('unsupported_provider');
}

async function handleApi(request, env) {
  const url=new URL(request.url);
  const path=url.pathname;
  if(request.method==='OPTIONS') return new Response('',{status:204,headers:{...corsHeaders(request),'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});

  if(path==='/api/health') return json({ok:true,service:'omniai',cloudflare:true,database:!!env.DB,authConfigured:!!env.OMNIAI_ACCESS_PASSWORD},200,corsHeaders(request));

  if(path==='/api/auth/status') return json({ok:true,authenticated:await isAuthed(request,env),required:!!env.OMNIAI_ACCESS_PASSWORD},200,corsHeaders(request));
  if(path==='/api/auth/login' && request.method==='POST') {
    if(!env.OMNIAI_ACCESS_PASSWORD) return json({ok:true,authenticated:true,required:false},200,corsHeaders(request));
    const body=await request.json().catch(()=>({}));
    if(body.password!==env.OMNIAI_ACCESS_PASSWORD) return json({ok:false,error:'invalid_credentials',message:'رمز ورود نادرست است.'},401,corsHeaders(request));
    const cookie=await setSessionCookie(env);
    return json({ok:true,authenticated:true},200,{'Set-Cookie':cookie,...corsHeaders(request)});
  }
  if(path==='/api/auth/logout') return json({ok:true},{'Set-Cookie':'omniai_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',...corsHeaders(request)});

  const guard=await requireAuth(request,env); if(guard) return guard;
  if(env.DB) await dbEnsure(env);

  if(path==='/api/providers') {
    const result={};
    for(const p of Object.values(PROVIDERS)) result[p.id]={id:p.id,name:p.name,kind:p.kind,configured:p.kind==='local'?!!env.IBNSINA_URL:!!env[p.secret],model:env[p.modelEnv]||p.defaultModel};
    return json({ok:true,providers:result},200,corsHeaders(request));
  }
  if(path==='/api/conversations' && request.method==='GET') return json({ok:true,conversations:await listConversations(env)},200,corsHeaders(request));
  if(path.startsWith('/api/conversations/') && request.method==='GET') {
    const id=path.split('/').pop(); const c=await getConversation(env,id); if(!c) return json({ok:false,error:'not_found'},404,corsHeaders(request)); return json({ok:true,conversation:c},200,corsHeaders(request));
  }
  if(path.startsWith('/api/conversations/') && request.method==='DELETE') {
    if(!env.DB) return json({ok:false,error:'database_not_configured'},503,corsHeaders(request));
    const id=path.split('/').pop(); await env.DB.prepare(`DELETE FROM messages WHERE conversation_id=?`).bind(id).run(); await env.DB.prepare(`DELETE FROM conversations WHERE id=? AND user_id='owner'`).bind(id).run(); return json({ok:true},200,corsHeaders(request));
  }
  if(path==='/api/chat' && request.method==='POST') {
    const body=await request.json().catch(()=>({}));
    const providerId=body.providerId; const model=body.model||PROVIDERS[providerId]?.defaultModel; const userText=String(body.message||'').trim(); const conversationId=body.conversationId||newId('conv');
    if(!providerId||!PROVIDERS[providerId]) return json({ok:false,error:'provider_invalid'},400,corsHeaders(request));
    if(!userText) return json({ok:false,error:'message_empty'},400,corsHeaders(request));
    if(providerId==='ibnsina') return json({ok:false,error:'local_provider','message':'مدل ابن‌سینا محلی است؛ از حالت اتصال محلی مرورگر استفاده کنید.'},400,corsHeaders(request));
    const prior=body.history?.slice?.(-30)||[];
    const messages=[...prior.filter(m=>m&&['user','assistant','system'].includes(m.role)).map(m=>({role:m.role,content:String(m.content||'')})),{role:'user',content:userText}];
    try {
      const result=await providerChat(providerId,model,messages,env);
      const title=(body.title||userText).slice(0,80);
      await saveConversation(env,conversationId,providerId,model,title,[{id:newId('msg'),role:'user',content:userText,createdAt:Date.now(),status:'complete'},{id:newId('msg'),role:'assistant',content:result.text,createdAt:Date.now(),status:'complete'}]);
      return json({ok:true,conversationId,providerId,model,text:result.text},200,corsHeaders(request));
    } catch(e) {
      const msg=String(e?.message||e);
      if(msg.startsWith('missing_secret:')) return json({ok:false,error:'provider_not_configured',message:`اتصال ${PROVIDERS[providerId].name} در Cloudflare تنظیم نشده است.`},503,corsHeaders(request));
      return json({ok:false,error:'provider_error',message:msg},502,corsHeaders(request));
    }
  }
  return json({ok:false,error:'not_found'},404,corsHeaders(request));
}

export default {
  async fetch(request, env, ctx) {
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/')) return handleApi(request,env);
    return env.ASSETS.fetch(request);
  }
};
