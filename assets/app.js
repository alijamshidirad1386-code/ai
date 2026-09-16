(function(){
  'use strict';

  const K={theme:'omniai_theme',lang:'omniai_lang',localMessages:'omniai_local_messages',conversation:'omniai_active_conversation',provider:'omniai_provider',ibnUrl:'omniai_ibnsina_url',authHint:'omniai_auth_hint'};
  const PROVIDERS={
    chatgpt:{label:'ChatGPT / OpenAI',model:'gpt-5'},
    deepseek:{label:'DeepSeek',model:'deepseek-chat'},
    gemini:{label:'Google Gemini',model:'gemini-2.5-flash'},
    ibnsina:{label:'IbnSina-1.5B',model:'ibnsina-1.5b'}
  };
  const THEMES=['modern','cat','cyberpunk','retro'];

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const page=location.pathname.split('/').pop()||'index.html';

  function safeJSON(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch{return fallback}}
  function saveJSON(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch{}}
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function nowLabel(){return new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-US':'fa-IR',{hour:'2-digit',minute:'2-digit'}).format(new Date())}
  function toast(message){let t=$('#omniai-toast');if(!t){t=document.createElement('div');t.id='omniai-toast';t.className='omniai-toast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(t._timer);t._timer=setTimeout(()=>t.classList.remove('show'),2600)}

  function applyTheme(theme){
    theme=THEMES.includes(theme)?theme:'modern';
    document.documentElement.dataset.omniTheme=theme;
    document.body.dataset.omniTheme=theme;
    localStorage.setItem(K.theme,theme);
    $$('.theme-card').forEach(c=>c.classList.toggle('active-theme',c.dataset.theme===theme));
    const label={modern:'مدرن',cat:'گربه‌ای',cyberpunk:'سایبرپانک',retro:'دهه ۱۹۹۰'}[theme]||theme;
    $$('[data-active-theme-label]').forEach(e=>e.textContent=label);
    updateThemeStat(label);
    document.dispatchEvent(new CustomEvent('omniai:themechange',{detail:{theme}}));
  }
  function updateThemeStat(label){const e=$('#active-theme-stat');if(e)e.textContent=label}

  const translations={
    fa:{chat:'چت و گفتگو',connections:'مدیریت اتصالات و اکانت‌ها',settings:'تنظیمات و شخصی‌سازی تم',history:'تاریخچه گفتگوها',send:'ارسال',newChat:'گفتگوی تازه',connect:'اتصال',disconnected:'متصل نیست',configured:'پیکربندی‌شده',notConfigured:'نیازمند تنظیم Cloudflare'},
    en:{chat:'Chat',connections:'Connections',settings:'Settings & Themes',history:'Conversation History',send:'Send',newChat:'New chat',connect:'Connect',disconnected:'Not connected',configured:'Configured',notConfigured:'Cloudflare setup required'}
  };
  const EN_MAP={
    'چت و گفتگو':'Chat','مدیریت اتصالات و اکانت‌ها':'Connections','تنظیمات و شخصی‌سازی تم':'Settings & Themes','آمار مصرف و منابع حساب':'Usage & Sources','تاریخچه گفتگوها':'Conversation History','اتصالات':'Connections','تنظیمات':'Settings','ارسال':'Send','گفتگوی تازه':'New Chat','گفتگوی ابری تازه':'New Cloud Chat','تاریخچه گفتگوها':'Conversation History','متصل است':'Connected','در انتظار اتصال':'Awaiting connection','اتصال':'Connect','قطع اتصال':'Disconnect','همگام‌سازی':'Sync','همگام‌سازی زنده':'Live sync','همگام تاریخچه':'Sync history','تغییر جیمیل':'Change account','مدیریت سشن':'Session management','بازنشانی پیش‌فرض':'Reset defaults','زبان':'Language','ظاهر':'Appearance','تم فعال':'Active theme','گربه‌ای':'Cat','سایبرپانک':'Cyberpunk','دهه ۱۹۹۰':'1990s','مدرن':'Modern','پیام‌های ذخیره‌شده در این مرورگر':'Messages saved in this browser','پاک‌سازی تاریخچه محلی':'Clear local history','جستجو در عنوان یا پیام...':'Search title or message...','یک مدل را انتخاب کنید و گفت‌وگو را شروع کنید.':'Choose a model and start a conversation.','چت و گفتگو':'Chat','ذخیره':'Save','پشتیبانی':'Support','وب‌سرچ فعال':'Web search active','کپی':'Copy','تولید مجدد':'Regenerate','پاسخ با مدل دیگر':'Reply with another model','گفتگوهای اخیر':'Recent conversations','جستجو':'Search'};
  function translateStatic(lang){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{if(!n.parentElement)return;if(!n.parentElement.closest('script,style')){if(!n.dataset.omniaiFa)n.dataset.omniaiFa=n.nodeValue;const fa=n.dataset.omniaiFa.trim();if(lang==='en'&&EN_MAP[fa])n.nodeValue=n.nodeValue.replace(fa,EN_MAP[fa]);else if(lang==='fa')n.nodeValue=n.dataset.omniaiFa;}});
  }
  function setLanguage(lang){
    lang=lang==='en'?'en':'fa';
    document.documentElement.lang=lang;document.documentElement.dir=lang==='en'?'ltr':'rtl';localStorage.setItem(K.lang,lang);
    document.body.classList.toggle('omniai-en',lang==='en');
    updateLanguageUI(lang);translateStatic(lang);
  }
  function updateLanguageUI(lang){
    $$('[data-lang-choice]').forEach(b=>b.classList.toggle('active-lang',b.dataset.langChoice===lang));
  }

  async function api(path,opts={}){
    const r=await fetch(path,{credentials:'include',headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});
    const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={ok:false,message:text}}
    if(!r.ok) {const e=new Error(data.message||data.error||`HTTP ${r.status}`);e.data=data;e.status=r.status;throw e}
    return data;
  }

  function ensureModal(){
    if($('#omniai-modal'))return;
    const m=document.createElement('div');m.id='omniai-modal';m.className='omniai-modal';m.innerHTML=`<div class="omniai-modal-backdrop" data-modal-close></div><section class="omniai-modal-card" role="dialog" aria-modal="true"><button class="omniai-modal-close" type="button" data-modal-close>×</button><div id="omniai-modal-icon" class="omniai-modal-icon">◎</div><h3 id="omniai-modal-title"></h3><p id="omniai-modal-text"></p><div id="omniai-modal-actions" class="omniai-modal-actions"></div></section>`;document.body.appendChild(m);$$('[data-modal-close]',m).forEach(e=>e.addEventListener('click',closeModal));
  }
  function openModal(title,text,actions=[]){ensureModal();$('#omniai-modal-title').textContent=title;$('#omniai-modal-text').textContent=text;const a=$('#omniai-modal-actions');a.innerHTML='';actions.forEach(x=>{const b=document.createElement('button');b.className=x.primary?'omniai-btn omniai-btn-primary':'omniai-btn';b.textContent=x.label;b.onclick=()=>{x.onClick?.();closeModal()};a.appendChild(b)});$('#omniai-modal').classList.add('open')}
  function closeModal(){$('#omniai-modal')?.classList.remove('open')}

  async function authGate(){
    try{const s=await api('/api/auth/status');
      if(s.required&&!s.authenticated){
        openModal('ورود به OmniAI','برای امنیت APIها و تاریخچه ابری این سایت، رمز خصوصی Cloudflare را وارد کنید.',[{label:'ورود',primary:true,onClick:async()=>{const p=prompt('رمز ورود OmniAI را وارد کنید:');if(!p)return;try{await api('/api/auth/login',{method:'POST',body:JSON.stringify({password:p})});toast('ورود با موفقیت انجام شد.');location.reload()}catch(e){toast(e.message)}}},{label:'لغو'}]);
        return false;
      }
      return true;
    }catch{return true}
  }

  async function loadProviderStatus(){
    try{return await api('/api/providers')}catch{return {ok:false,providers:{chatgpt:{configured:false},deepseek:{configured:false},gemini:{configured:false},ibnsina:{configured:!!localStorage.getItem(K.ibnUrl)},}}}
  }

  function providerName(key){return PROVIDERS[key]?.label||key}
  function getSelectedProvider(){return localStorage.getItem(K.provider)||'deepseek'}
  function setSelectedProvider(p){localStorage.setItem(K.provider,p)}

  function initModelTabs(){
    const tabs=$$('.model-tab');const title=$('#active-model-title');
    if(!tabs.length)return;
    let selected=getSelectedProvider();if(!tabs.some(t=>t.dataset.model===selected))selected=tabs[0].dataset.model||'deepseek';
    const activate=tab=>{
      tabs.forEach(t=>{t.classList.toggle('bg-primary',t===tab);t.classList.toggle('text-on-primary',t===tab);t.classList.toggle('shadow-sm',t===tab);t.classList.toggle('bg-surface-container-high/60',t!==tab);t.classList.toggle('text-on-surface-variant',t!==tab)});
      const p=tab.dataset.model||'deepseek';setSelectedProvider(p);
      const meta={chatgpt:'ChatGPT / OpenAI',deepseek:'DeepSeek',gemini:'Google Gemini',ibnsina:'IbnSina-1.5B'};
      if(title)title.textContent=meta[p]||p;
      $$('[data-selected-provider-label]').forEach(e=>e.textContent=meta[p]||p);
    };
    tabs.forEach(t=>t.addEventListener('click',()=>activate(t)));activate(tabs.find(t=>t.dataset.model===selected)||tabs[0]);
  }

  function renderMessage(m){
    const role=m.role==='user'?'user':'assistant';
    const box=document.createElement('div');
    box.className=role==='user'?'omniai-msg user-msg':'omniai-msg ai-msg';
    const provider=m.providerId?providerName(m.providerId):'OmniAI';
    box.innerHTML=role==='user'
      ?`<div class="omniai-avatar user-avatar">AR</div><div class="omniai-msg-main"><div class="omniai-msg-meta"><strong>شما</strong><span>${esc(m.time||nowLabel())}</span></div><div class="omniai-bubble user-bubble"></div><div class="omniai-msg-actions"><button type="button" data-copy-msg>کپی</button></div></div>`
      :`<div class="omniai-avatar ai-avatar">◎</div><div class="omniai-msg-main"><div class="omniai-msg-meta"><strong>${esc(provider)}</strong><span>${esc(m.time||nowLabel())}</span></div><div class="omniai-bubble ai-bubble"></div><div class="omniai-msg-actions"><button type="button" data-copy-msg>کپی</button><button type="button" data-retry>تولید مجدد</button></div></div>`;
    box.querySelector('.omniai-bubble').textContent=m.content||'';
    box.dataset.role=role;box.dataset.messageId=m.id||'';
    return box;
  }
  function conversationHistoryLocal(){return safeJSON(K.localMessages,[])}
  function saveLocalMessage(m){const a=conversationHistoryLocal();a.push(m);saveJSON(K.localMessages,a.slice(-300))}

  async function getCloudConversations(){try{return (await api('/api/conversations')).conversations||[]}catch{return []}}

  function clearChatArea(){const c=$('#chat-messages-scroll');if(!c)return;c.innerHTML='';}
  function renderChatMessages(messages){
    const c=$('#chat-messages-scroll');if(!c)return;clearChatArea();
    if(!messages.length){c.innerHTML='<div data-chat-placeholder class="omniai-empty-chat"><div class="omniai-empty-icon">◎</div><strong>یک مدل را انتخاب کنید و گفت‌وگو را شروع کنید.</strong><span>پیام‌های جدید در تاریخچه OmniAI ذخیره می‌شوند؛ در حالت محلی نیز در مرورگر نگهداری می‌شوند.</span></div>';return}
    messages.forEach(m=>c.appendChild(renderMessage(m)));c.scrollTop=c.scrollHeight;
    $$('[data-copy-msg]',c).forEach(b=>b.addEventListener('click',async()=>{const t=b.closest('.omniai-msg').querySelector('.omniai-bubble').textContent;try{await navigator.clipboard.writeText(t);toast('پیام کپی شد.')}catch{toast('کپی در این مرورگر در دسترس نیست.')}}));
  }

  async function initChat(){
    const input=$('#prompt-input'),send=$('#send-button');if(!input||!send)return;
    initModelTabs();
    const activeConversation=localStorage.getItem(K.conversation);
    let cloudLoaded=false;
    if(activeConversation){
      try{
        const d=await api('/api/conversations/'+encodeURIComponent(activeConversation));
        const msgs=(d.conversation?.messages||[]).map(m=>({id:m.id,role:m.role,content:m.content,providerId:m.provider_id,time:new Intl.DateTimeFormat(document.documentElement.lang==='en'?'en-US':'fa-IR',{hour:'2-digit',minute:'2-digit'}).format(new Date(m.created_at))}));
        if(msgs.length){renderChatMessages(msgs);cloudLoaded=true;}
      }catch{}
    }
    if(!cloudLoaded){const local=conversationHistoryLocal();if(local.length) renderChatMessages(local.slice(-40));else renderChatMessages([]);}

    $$('.prompt-chip').forEach(chip=>chip.addEventListener('click',()=>{input.value=chip.textContent.trim();input.focus()}));
    input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send.click()}});
    input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,220)+'px'});
    send.addEventListener('click',()=>sendChat());
    async function sendChat(){
      const text=input.value.trim();if(!text)return;
      const provider=getSelectedProvider();
      const conversationId=localStorage.getItem(K.conversation)||crypto.randomUUID();localStorage.setItem(K.conversation,conversationId);
      const history=conversationHistoryLocal().slice(-30).map(m=>({role:m.role,content:m.content}));
      const userMsg={id:crypto.randomUUID(),role:'user',content:text,providerId:provider,time:nowLabel()};saveLocalMessage(userMsg);renderChatMessages(conversationHistoryLocal().slice(-40));
      input.value='';input.style.height='auto';send.disabled=true;send.dataset.busy='1';
      const pending={id:'pending',role:'assistant',content:'در حال ارتباط با '+providerName(provider)+' ...',providerId:provider,time:nowLabel()};
      const c=$('#chat-messages-scroll');c.appendChild(renderMessage(pending));c.scrollTop=c.scrollHeight;
      try{
        let result;
        if(provider==='ibnsina'){
          const endpoint=localStorage.getItem(K.ibnUrl)||'http://127.0.0.1:11434/v1/chat/completions';
          const payload={model:PROVIDERS.ibnsina.model,messages:[...history,{role:'user',content:text}],stream:false};
          const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error?.message||`IbnSina HTTP ${r.status}`);result=d.choices?.[0]?.message?.content||d.response||'';
        }else{
          const d=await api('/api/chat',{method:'POST',body:JSON.stringify({providerId:provider,model:PROVIDERS[provider].model,message:text,history,conversationId,title:text.slice(0,80)})});result=d.text||'';
        }
        const a=conversationHistoryLocal().filter(m=>m.id!=='pending');a.push({id:crypto.randomUUID(),role:'assistant',content:result||'پاسخی دریافت نشد.',providerId:provider,time:nowLabel()});saveJSON(K.localMessages,a.slice(-300));renderChatMessages(a.slice(-40));toast('پاسخ دریافت شد.');
      }catch(e){
        const a=conversationHistoryLocal();const msg=(e.data?.message||e.message||'خطا در اتصال به سرویس.');a.push({id:crypto.randomUUID(),role:'assistant',content:'خطا: '+msg,providerId:provider,time:nowLabel()});saveJSON(K.localMessages,a.slice(-300));renderChatMessages(a.slice(-40));toast(msg);
      }finally{send.disabled=false;delete send.dataset.busy}
    }

    const webSearch=$('#web-search-toggle');webSearch?.addEventListener('click',()=>{webSearch.classList.toggle('ring-2');toast('وب‌سرچ در این نسخه فقط وضعیت UI است و بدون provider tool فعال نمی‌شود.')});
    const newBtns=$$('button').filter(b=>/گفتگوی.*تازه|new chat/i.test(b.textContent));newBtns.forEach(b=>b.addEventListener('click',()=>{localStorage.removeItem(K.conversation);saveJSON(K.localMessages,[]);renderChatMessages([]);toast('گفتگوی تازه ساخته شد.')}));
  }

  function patchStaticClaims(){
    const replacements=[
      ['بدون نیاز به API Key اختصاصی — نشست امن فعال از طریق اکانت متصل جیمیل','اتصال امن با روش رسمی provider؛ هیچ کلید مخفی در مرورگر قرار نمی‌گیرد.'],
      ['مصرف مستقیم از سهمیه جیمیل','ارسال از مسیر رسمی provider در صورت فعال بودن اتصال'],
      ['اشتراک حساب جیمیل: Plus / نامحدود','وضعیت حساب/سهمیه فقط در صورت ارائه‌شدن توسط provider نمایش داده می‌شود'],
      ['بدون نیاز به توکن دستی','اعتبارنامه‌ها باید سمت Cloudflare مدیریت شوند'],
      ['بدون نیاز به API Key! فقط با لاگین امن جیمیل یا حساب کاربری‌تان، تاریخچه‌ها و سهمیه‌های قبلی شما به صورت خودکار به اینجا منتقل می‌شوند.','ایمیل به‌تنهایی مجوز دسترسی به تاریخچه خصوصی سرویس‌ها نیست؛ اتصال فقط با روش رسمی provider انجام می‌شود.'],
      ['با اتصال جیمیل ثبت‌نامی در سامانه ابن‌سینا، دسترسی رایگان و پایدار به مدل بومی فارسی و شبیه‌ساز بالینی پزشکی فورا فعال می‌شود.','IbnSina-1.5B در این پروژه به‌صورت مدل محلی و از طریق endpoint سازگار با OpenAI/Ollama متصل می‌شود.'],
      ['همگام‌سازی ابری','API و تاریخچه ابری OmniAI'],
      ['فعال','وضعیت واقعی']
    ];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>replacements.forEach(([a,b])=>{if(n.nodeValue?.includes(a))n.nodeValue=n.nodeValue.replaceAll(a,b)}));
  }

  function wireNavigation(){
    $$('a[href]').forEach(a=>{const h=a.getAttribute('href')||'';if(/^(index|history|connections|settings)\.html$/.test(h))a.dataset.omniaiNav='1'});
    const current=page;$$('[data-omniai-nav]').forEach(a=>{const h=(a.getAttribute('href')||'').split('/').pop();a.setAttribute('aria-current',h===current?'page':'false')});
  }

  function wireMobileNav(){const aside=document.querySelector('body > aside');if(!aside)return;if(!$('#omniai-mobile-toggle')){const b=document.createElement('button');b.id='omniai-mobile-toggle';b.className='omniai-mobile-toggle';b.textContent='☰';b.type='button';document.body.appendChild(b);b.onclick=()=>{aside.classList.toggle('omniai-open');b.textContent=aside.classList.contains('omniai-open')?'×':'☰'}}}

  async function initConnections(){
    const status=await loadProviderStatus();const cards=$$('main .grid > div').filter(x=>/ChatGPT|DeepSeek|Gemini|ابن‌سینا|IbnSina/.test(x.textContent||''));
    const map={chatgpt:cards.find(c=>/ChatGPT/.test(c.textContent)),deepseek:cards.find(c=>/DeepSeek/.test(c.textContent)),gemini:cards.find(c=>/Gemini/.test(c.textContent)),ibnsina:cards.find(c=>/ابن‌سینا|IbnSina/.test(c.textContent))};
    Object.entries(map).forEach(([id,card])=>{if(!card)return;const configured=status.providers?.[id]?.configured;const badge=Array.from(card.querySelectorAll('span')).find(s=>/متصل است|در انتظار اتصال/.test(s.textContent||''));if(badge){badge.textContent=configured?'● متصل/آماده':'○ نیازمند اتصال';badge.className=configured?'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-label-sm text-label-sm':'inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container/20 text-error font-label-sm text-label-sm'}
      $$('button',card).forEach(btn=>{btn.addEventListener('click',async()=>{const t=btn.textContent.replace(/\s+/g,' ').trim();if(id==='ibnsina'&&/ورود سریع|اتصال از طریق یاهو/.test(t)){openModal('IbnSina 1.5B','برای این پروژه اتصال معتبر، endpoint محلی یا سرویس سازگار با API را وارد کنید؛ Gmail/Yahoo به‌تنهایی دسترسی به مدل داخلی نمی‌دهد.',[{label:'تنظیم endpoint',primary:true,onClick:()=>{const u=prompt('آدرس endpoint مدل محلی را وارد کنید:',localStorage.getItem(K.ibnUrl)||'http://127.0.0.1:11434/v1/chat/completions');if(u){localStorage.setItem(K.ibnUrl,u);toast('Endpoint ذخیره شد.')}}},{label:'لغو'}]);return}
        if(/تغییر جیمیل|مدیریت سشن|پیکربندی دامنه|اتصال/.test(t)&&id!=='ibnsina'){openModal(providerName(id),`این صفحه فقط از اتصال رسمی provider پشتیبانی می‌کند. ورود با Gmail/Yahoo به‌تنهایی تاریخچه خصوصی ${providerName(id)} را در اختیار سایت قرار نمی‌دهد. برای API chat، اعتبارنامه امن باید در Cloudflare تنظیم شود.`,[{label:'باشه',primary:true}]);return}
        if(/همگام/.test(t)){toast('همگام‌سازی فقط برای داده‌هایی انجام می‌شود که provider API واقعاً ارائه کند.');}
        if(/قطع اتصال/.test(t)){toast('اتصال محلی/سمت مرورگر پاک شد. اعتبارنامه Cloudflare از Dashboard حذف می‌شود.');}
      })});
    });
    patchStaticClaims();
  }

  async function initHistory(){
    const filter=$('#history-filter');const local=conversationHistoryLocal();
    const list=$('#history-list');
    if(list){list.innerHTML='';let cloud=[];try{cloud=await getCloudConversations()}catch{}
      const all=[...cloud.map(c=>({id:c.id,title:c.title,provider:c.provider_id,updated:c.updated_at,source:'cloud'})),...local.reduce((acc,m)=>{const id='local';if(!acc.some(x=>x.id===id))acc.push({id,title:'گفتگوی محلی',provider:m.providerId||'unknown',updated:Date.now(),source:'local'});return acc},[])];
      if(!all.length)list.innerHTML='<div class="history-row">هنوز گفتگویی ذخیره نشده است.</div>';
      all.slice(0,100).forEach(c=>{const row=document.createElement('div');row.className='history-row';row.dataset.search=`${c.title||''} ${c.provider||''}`.toLowerCase();row.innerHTML=`<div><div class="font-title-sm text-title-sm text-on-surface">${esc(c.title||'گفتگو')}</div><div class="font-label-sm text-label-sm text-on-surface-variant">${esc(providerName(c.provider||''))} • ${c.source==='cloud'?'ابر Cloudflare':'محلی مرورگر'}</div></div><span class="text-primary">${c.source==='cloud'?'Cloud':'Local'}</span>`;row.addEventListener('click',()=>{if(c.source==='local'){location.href='index.html';return}localStorage.setItem(K.conversation,c.id);location.href='index.html'});list.appendChild(row)});
    }
    filter?.addEventListener('input',()=>{const q=filter.value.trim().toLowerCase();$$('.history-row',list||document).forEach(r=>r.style.display=(r.dataset.search||r.textContent.toLowerCase()).includes(q)?'flex':'none')});
    const clear=$('#clear-local-history');clear?.addEventListener('click',()=>{saveJSON(K.localMessages,[]);toast('تاریخچه محلی پاک شد.');setTimeout(()=>location.reload(),300)});
    const stat=$('#active-theme-stat');updateThemeStat({modern:'مدرن',cat:'گربه‌ای',cyberpunk:'سایبرپانک',retro:'دهه ۱۹۹۰'}[localStorage.getItem(K.theme)||'modern']);
    if(stat)stat.textContent=stat.textContent;
  }

  function injectLocalModelSettings(){
    if(document.getElementById('omniai-local-model-panel')) return;
    const main=document.querySelector('main');if(!main)return;
    const panel=document.createElement('section');panel.id='omniai-local-model-panel';panel.className='rounded-xl bg-surface-container-low p-6 shadow-sm mt-6';
    panel.innerHTML=`<div class="flex items-center justify-between gap-3 flex-wrap"><div><h2 class="font-title-lg text-title-lg text-on-surface">اتصال IbnSina-1.5B محلی</h2><p class="font-body-md text-body-md text-on-surface-variant mt-1">برای اجرای مدل روی سیستم خود، endpoint سازگار با OpenAI یا Ollama را ثبت کنید.</p></div><span class="omniai-local-badge">LOCAL</span></div><div class="mt-4 flex flex-col sm:flex-row gap-2"><input id="ibnsina-endpoint" class="flex-1 bg-surface-container rounded-lg px-3 py-2 text-on-surface border border-white/10" dir="ltr" placeholder="http://127.0.0.1:11434/v1/chat/completions"/><button id="save-ibnsina" class="omniai-btn omniai-btn-primary">ذخیره endpoint</button></div><p class="text-xs text-on-surface-variant mt-2">برای localhost، سرویس مدل باید روی همان دستگاه روشن باشد و CORS درخواست‌های سایت را بپذیرد.</p>`;main.appendChild(panel);
  }

  function initSettings(){
    injectLocalModelSettings();
    $$('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>applyTheme(b.dataset.themeChoice)));
    $$('.theme-card').forEach(c=>c.addEventListener('click',()=>applyTheme(c.dataset.theme||'modern')));
    $$('[data-lang-choice]').forEach(b=>b.addEventListener('click',()=>{setLanguage(b.dataset.langChoice);toast(b.dataset.langChoice==='en'?'English enabled.':'زبان فارسی فعال شد.')}));
    $$('button').forEach(b=>{if(/بازنشانی پیش‌فرض/.test(b.textContent))b.addEventListener('click',()=>{applyTheme('modern');setLanguage('fa');toast('تنظیمات به حالت پیش‌فرض برگشت.')})});
    const ibn=$('#ibnsina-endpoint');if(ibn)ibn.value=localStorage.getItem(K.ibnUrl)||'';
    $('#save-ibnsina')?.addEventListener('click',()=>{localStorage.setItem(K.ibnUrl,$('#ibnsina-endpoint').value.trim());toast('Endpoint ابن‌سینا ذخیره شد.')});
  }

  async function boot(){
    const authOk=await authGate();if(!authOk)return;
    applyTheme(localStorage.getItem(K.theme)||'modern');setLanguage(localStorage.getItem(K.lang)||'fa');wireNavigation();wireMobileNav();patchStaticClaims();
    if(page==='index.html'||page==='')await initChat();
    if(page==='connections.html')await initConnections();
    if(page==='history.html')await initHistory();
    if(page==='settings.html')initSettings();
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
    // Keep provider status badges honest on the sidebar.
    const s=await loadProviderStatus();Object.keys(PROVIDERS).forEach(id=>{const dots=$$('.provider-dot-'+id);dots.forEach(d=>d.classList.toggle('is-ready',!!s.providers?.[id]?.configured))});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
