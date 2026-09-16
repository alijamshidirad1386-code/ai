const PROVIDERS = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    kind: 'cloud',
    secret: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-5.6-luna'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    kind: 'cloud',
    secret: 'DEEPSEEK_API_KEY',
    modelEnv: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat'
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    kind: 'cloud',
    secret: 'GEMINI_API_KEY',
    modelEnv: 'GEMINI_MODEL',
    defaultModel: 'gemini-2.5-flash'
  },
  ibnsina: {
    id: 'ibnsina',
    name: 'IbnSina-1.5B',
    kind: 'local',
    modelEnv: 'IBNSINA_MODEL',
    defaultModel: 'ibnsina-1.5b'
  }
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...extra }
  });
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Vary': 'Origin'
  };
}

function headersFor(request, extra = {}) {
  return { ...corsHeaders(request), ...extra };
}

function newId(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`;
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i <= 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function base64UrlEncode(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(sig));
}

async function setSessionCookie(env) {
  const secret = env.OMNIAI_SESSION_SECRET || env.OMNIAI_ACCESS_PASSWORD;
  if (!secret) return null;
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ uid: 'owner', exp })));
  const sig = await hmac(secret, payload);
  return [
    `omniai_session=${payload}.${sig}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 30}`
  ].join('; ');
}

async function isAuthed(request, env) {
  if (!env.OMNIAI_ACCESS_PASSWORD) return true;
  const cookies = parseCookies(request.headers.get('Cookie') || '');
  const raw = cookies.omniai_session;
  if (!raw) return false;
  const split = raw.split('.');
  if (split.length !== 2) return false;
  const [payload, signature] = split;
  const secret = env.OMNIAI_SESSION_SECRET || env.OMNIAI_ACCESS_PASSWORD;
  const expected = await hmac(secret, payload);
  if (signature !== expected) return false;
  try {
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    return Number(parsed.exp) > Date.now();
  } catch {
    return false;
  }
}

async function requireAuth(request, env) {
  if (await isAuthed(request, env)) return null;
  return json(
    { ok: false, error: 'unauthorized', message: 'وارد حساب OmniAI شوید.' },
    401,
    headersFor(request)
  );
}

async function ensureDatabase(env) {
  if (!env.DB) return false;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    model_id TEXT NOT NULL,
    title TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'provider_api',
    favorite INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    provider_id TEXT,
    model_id TEXT,
    status TEXT NOT NULL DEFAULT 'complete',
    created_at INTEGER NOT NULL,
    metadata TEXT
  )`).run();
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS provider_accounts (
    provider_id TEXT PRIMARY KEY,
    account_email TEXT,
    label TEXT,
    updated_at INTEGER NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at)`).run();
  return true;
}

async function listConversations(env) {
  if (!env.DB) return [];
  const rs = await env.DB.prepare(`
    SELECT id, provider_id, model_id, title, source, favorite, archived, created_at, updated_at
    FROM conversations
    WHERE user_id='owner'
    ORDER BY updated_at DESC
    LIMIT 500
  `).all();
  return rs.results || [];
}

async function getConversation(env, id) {
  if (!env.DB) return null;
  const conversation = await env.DB.prepare(`
    SELECT * FROM conversations WHERE id=? AND user_id='owner'
  `).bind(id).first();
  if (!conversation) return null;
  const messages = await env.DB.prepare(`
    SELECT id, role, content, provider_id, model_id, status, created_at, metadata
    FROM messages WHERE conversation_id=? ORDER BY created_at ASC
  `).bind(id).all();
  conversation.messages = messages.results || [];
  return conversation;
}

async function saveConversation(env, conversationId, providerId, modelId, title, messages, source = 'provider_api') {
  if (!env.DB) return;
  const now = Date.now();
  const existing = await env.DB.prepare(`SELECT id FROM conversations WHERE id=? AND user_id='owner'`).bind(conversationId).first();
  if (!existing) {
    await env.DB.prepare(`
      INSERT INTO conversations
      (id,user_id,provider_id,model_id,title,source,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?)
    `)
      .bind(conversationId, 'owner', providerId, modelId, title, source, now, now)
      .run();
  } else {
    await env.DB.prepare(`
      UPDATE conversations
      SET provider_id=?, model_id=?, title=?, updated_at=?
      WHERE id=? AND user_id='owner'
    `).bind(providerId, modelId, title, now, conversationId).run();
  }

  for (const message of messages) {
    const messageId = message.id || newId('msg');
    await env.DB.prepare(`
      INSERT OR IGNORE INTO messages
      (id,conversation_id,role,content,provider_id,model_id,status,created_at,metadata)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).bind(
      messageId,
      conversationId,
      message.role,
      String(message.content || ''),
      providerId,
      modelId,
      message.status || 'complete',
      message.createdAt || now,
      JSON.stringify(message.metadata || {})
    ).run();
  }
}

async function providerChat(providerId, model, messages, env) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw new Error('unsupported_provider');
  if (providerId === 'ibnsina') throw new Error('local_provider');

  const apiKey = env[provider.secret];
  if (!apiKey) throw new Error(`missing_secret:${provider.secret}`);

  if (providerId === 'chatgpt') {
    const input = messages.map(message => ({
      role: message.role,
      content: [{ type: 'input_text', text: message.content }]
    }));
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, input })
    });
    const text = await response.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    if (!response.ok) {
      throw new Error(`openai:${data.error?.message || text.slice(0, 400)}`);
    }
    const outputText = typeof data.output_text === 'string'
      ? data.output_text
      : (data.output || []).flatMap(item => item.content || []).map(x => x.text || '').filter(Boolean).join('\n');
    return { text: outputText, raw: data };
  }

  if (providerId === 'deepseek') {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, stream: false })
    });
    const text = await response.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    if (!response.ok) {
      throw new Error(`deepseek:${data.error?.message || text.slice(0, 400)}`);
    }
    return { text: data.choices?.[0]?.message?.content || '', raw: data };
  }

  if (providerId === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const system = messages.find(message => message.role === 'system');
    const contents = messages
      .filter(message => message.role !== 'system')
      .map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      }));
    const body = { contents };
    if (system) body.systemInstruction = { parts: [{ text: system.content }] };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const text = await response.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    if (!response.ok) {
      throw new Error(`gemini:${data.error?.message || text.slice(0, 400)}`);
    }
    const outputText = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('') || '';
    return { text: outputText, raw: data };
  }

  throw new Error('unsupported_provider');
}

async function providerStatus(env) {
  const result = {};
  for (const provider of Object.values(PROVIDERS)) {
    result[provider.id] = {
      id: provider.id,
      name: provider.name,
      kind: provider.kind,
      configured: provider.kind === 'local' ? !!env.IBNSINA_URL : !!env[provider.secret],
      model: env[provider.modelEnv] || provider.defaultModel,
      connectionType: provider.kind === 'local' ? 'local_endpoint' : 'server_api_key'
    };
  }
  return result;
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: headersFor(request) });
  }

  if (path === '/api/health') {
    const hasDb = !!env.DB;
    return json({
      ok: true,
      service: 'omniai',
      runtime: 'cloudflare-worker',
      databaseBound: hasDb,
      providers: await providerStatus(env),
      authConfigured: !!env.OMNIAI_ACCESS_PASSWORD,
      timestamp: new Date().toISOString()
    }, 200, headersFor(request));
  }

  if (path === '/api/auth/status') {
    return json({
      ok: true,
      authenticated: await isAuthed(request, env),
      required: !!env.OMNIAI_ACCESS_PASSWORD
    }, 200, headersFor(request));
  }

  if (path === '/api/auth/login' && method === 'POST') {
    if (!env.OMNIAI_ACCESS_PASSWORD) {
      return json({ ok: true, authenticated: true, required: false }, 200, headersFor(request));
    }
    const body = await request.json().catch(() => ({}));
    if (body.password !== env.OMNIAI_ACCESS_PASSWORD) {
      return json({ ok: false, error: 'invalid_credentials', message: 'رمز ورود نادرست است.' }, 401, headersFor(request));
    }
    const cookie = await setSessionCookie(env);
    return json({ ok: true, authenticated: true }, 200, headersFor(request, { 'Set-Cookie': cookie }));
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return json({ ok: true }, 200, headersFor(request, {
      'Set-Cookie': 'omniai_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
    }));
  }

  const guard = await requireAuth(request, env);
  if (guard) return guard;

  if (env.DB) {
    try {
      await ensureDatabase(env);
    } catch (error) {
      return json({
        ok: false,
        error: 'database_error',
        message: `اتصال D1 برقرار شد ولی schema قابل آماده‌سازی نیست: ${String(error?.message || error)}`
      }, 500, headersFor(request));
    }
  }

  if (path === '/api/providers' && method === 'GET') {
    return json({ ok: true, providers: await providerStatus(env) }, 200, headersFor(request));
  }

  if (path === '/api/provider-accounts' && method === 'GET') {
    if (!env.DB) return json({ ok: true, accounts: {} }, 200, headersFor(request));
    const rows = await env.DB.prepare(`SELECT provider_id, account_email, label, updated_at FROM provider_accounts`).all();
    const accounts = {};
    for (const row of rows.results || []) accounts[row.provider_id] = row;
    return json({ ok: true, accounts }, 200, headersFor(request));
  }

  if (path === '/api/provider-accounts' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const providerId = String(body.providerId || '');
    const email = String(body.email || '').trim();
    const label = String(body.label || '').trim();
    if (!PROVIDERS[providerId]) return json({ ok: false, error: 'provider_invalid' }, 400, headersFor(request));
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'email_invalid', message: 'ایمیل معتبر نیست.' }, 400, headersFor(request));
    }
    if (!env.DB) return json({ ok: false, error: 'database_not_configured' }, 503, headersFor(request));
    await env.DB.prepare(`
      INSERT INTO provider_accounts(provider_id, account_email, label, updated_at)
      VALUES (?,?,?,?)
      ON CONFLICT(provider_id) DO UPDATE SET
        account_email=excluded.account_email,
        label=excluded.label,
        updated_at=excluded.updated_at
    `).bind(providerId, email || null, label || null, Date.now()).run();
    return json({ ok: true }, 200, headersFor(request));
  }

  if (path === '/api/conversations' && method === 'GET') {
    return json({ ok: true, conversations: await listConversations(env) }, 200, headersFor(request));
  }

  if (path.startsWith('/api/conversations/') && method === 'GET') {
    const id = decodeURIComponent(path.split('/').pop() || '');
    const conversation = await getConversation(env, id);
    if (!conversation) return json({ ok: false, error: 'not_found' }, 404, headersFor(request));
    return json({ ok: true, conversation }, 200, headersFor(request));
  }

  if (path.startsWith('/api/conversations/') && method === 'DELETE') {
    if (!env.DB) return json({ ok: false, error: 'database_not_configured' }, 503, headersFor(request));
    const id = decodeURIComponent(path.split('/').pop() || '');
    await env.DB.prepare(`DELETE FROM messages WHERE conversation_id=?`).bind(id).run();
    await env.DB.prepare(`DELETE FROM conversations WHERE id=? AND user_id='owner'`).bind(id).run();
    return json({ ok: true }, 200, headersFor(request));
  }

  if (path === '/api/chat' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const providerId = String(body.providerId || '');
    const provider = PROVIDERS[providerId];
    const model = String(body.model || (provider ? (env[provider.modelEnv] || provider.defaultModel) : ''));
    const userText = String(body.message || '').trim();
    const conversationId = String(body.conversationId || newId('conv'));

    if (!provider) return json({ ok: false, error: 'provider_invalid' }, 400, headersFor(request));
    if (!userText) return json({ ok: false, error: 'message_empty' }, 400, headersFor(request));

    if (providerId === 'ibnsina') {
      return json({
        ok: false,
        error: 'local_provider',
        message: 'IbnSina-1.5B در این نسخه باید از یک endpoint محلی/سازگار با OpenAI استفاده شود.'
      }, 400, headersFor(request));
    }

    const prior = Array.isArray(body.history) ? body.history.slice(-30) : [];
    const messages = [
      ...prior
        .filter(item => item && ['user', 'assistant', 'system'].includes(item.role))
        .map(item => ({ role: item.role, content: String(item.content || '') }))
        .filter(item => item.content),
      { role: 'user', content: userText }
    ];

    try {
      const result = await providerChat(providerId, model, messages, env);
      const title = String(body.title || userText).slice(0, 80);
      await saveConversation(env, conversationId, providerId, model, title, [
        { id: newId('msg'), role: 'user', content: userText, createdAt: Date.now(), status: 'complete' },
        { id: newId('msg'), role: 'assistant', content: result.text || '', createdAt: Date.now(), status: 'complete' }
      ]);
      return json({
        ok: true,
        conversationId,
        providerId,
        model,
        text: result.text || ''
      }, 200, headersFor(request));
    } catch (error) {
      const message = String(error?.message || error);
      if (message.startsWith('missing_secret:')) {
        return json({
          ok: false,
          error: 'provider_not_configured',
          message: `کلید ${PROVIDERS[providerId].name} در Cloudflare تنظیم نشده است.`
        }, 503, headersFor(request));
      }
      return json({ ok: false, error: 'provider_error', message }, 502, headersFor(request));
    }
  }

  return json({ ok: false, error: 'not_found' }, 404, headersFor(request));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
