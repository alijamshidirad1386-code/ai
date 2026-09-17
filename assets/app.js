const copy = {
  fa: {
    privateWorkspace: 'فضای خصوصی', workspace: 'فضای کار', chat: 'گفت‌وگو', connections: 'اتصالات', customize: 'شخصی‌سازی', settings: 'تنظیمات', siteInfo: 'اطلاعات سایت', creatorRole: 'سازنده و طراح', encryptedNote: 'اعتبارنامه‌ها قبل از ذخیره‌سازی رمزنگاری می‌شوند.', breadcrumb: 'ALUNA / فضای کار', newConversation: 'گفت‌وگوی جدید', commandCenter: 'مرکز فرمان', chatHeadline: 'تمام هوش‌های تو، در یک فضای آرام.', chatSubheadline: 'بین مدل‌ها جابه‌جا شو بدون اینکه رشتهٔ فکرت را از دست بدهی. ALUNA فضای کارت را منظم و متمرکز نگه می‌دارد.', yourThreads: 'رشته‌های تو', conversations: 'گفت‌وگو', searchThreads: 'جست‌وجوی گفتگوها', ready: 'آماده', officialRoute: 'پیام‌ها از API رسمی سرویس‌دهنده عبور می‌کنند.', messagePlaceholder: 'هر چیزی می‌خواهی بپرس...', today: 'امروز', emptyThreads: 'هنوز گفت‌وگویی در ALUNA نساخته‌ای.', emptyMessages: 'این گفت‌وگو آمادهٔ شروع است.', connectToChat: 'برای شروع، ابتدا این مدل را از صفحهٔ اتصالات وصل کن.', goConnections: 'رفتن به اتصالات', you: 'تو', assistant: 'ALUNA', sending: 'در حال ارسال...', connectionRequired: 'برای گفتگو باید سرویس را وصل کنی.',
    connectionsKicker: 'اتصالات تو', connectionsHeadline: 'مدل‌هایت را به ALUNA بیاور.', connectionsSubheadline: 'با API رسمی سرویس‌دهنده وصل شو. ایمیل فقط برچسب اتصال است؛ ALUNA هیچ‌وقت رمز حساب سرویس‌دهنده را نمی‌خواهد.', serverEncrypted: 'رمزنگاری سمت سرور', providerTruthTitle: 'مرز روشن بین حساب و API', providerTruth: 'ورود به سایت مصرف‌کنندهٔ یک هوش مصنوعی با Gmail، به یک سایت دیگر اجازهٔ خواندن تاریخچهٔ خصوصی آن را نمی‌دهد. برای اینکه چت واقعاً کار کند، کلید API رسمی همان سرویس را اینجا وارد کن. تاریخچهٔ ALUNA سپس واقعاً در D1 ذخیره می‌شود.', emailLabel: 'ایمیل حساب', apiKeyLabel: 'کلید API رسمی', emailPlaceholder: 'you@example.com', apiKeyPlaceholder: 'کلید فقط برای اتصال امن', connect: 'اتصال و بررسی کلید', disconnect: 'قطع اتصال', connected: 'متصل', notConnected: 'وصل نشده', verifyHint: 'کلید در مرورگر ذخیره نمی‌شود؛ Worker آن را رمزنگاری می‌کند.', providerOpenaiDesc: 'گفتگو با مدل‌های رسمی OpenAI از مسیر API.', providerDeepseekDesc: 'پاسخ‌های عمیق و سریع از API رسمی DeepSeek.', providerGeminiDesc: 'تجربهٔ Gemini با endpoint رسمی Google.',
    settingsKicker: 'فضای تو', settingsHeadline: 'ALUNA را شبیه خودت کن.', settingsSubheadline: 'هر جزئیات در فضای کارت ذخیره می‌شود و در جلسه‌های بعدی برمی‌گردد.', lookAndFeel: 'ظاهر و حس', themes: 'تم‌ها', auroraTheme: 'آرورا', auroraThemeSub: 'پریمیوم و آرام', catTheme: 'باشگاه گربه‌ها', catThemeSub: 'نرم و بازیگوش', cyberTheme: 'نئون سایبر', cyberThemeSub: 'آیندهٔ الکتریکی', retroTheme: 'سیگنال دهه ۹۰', retroThemeSub: 'نوستالژی دیجیتال', accentKicker: 'تأکید', accentColor: 'رنگ اصلی', accentHint: 'در تمام فضای کار اعمال می‌شود', preferencesKicker: 'ترجیحات', preferences: 'ترجیحات', language: 'زبان رابط', languageSub: 'فارسی یا انگلیسی', saveHistory: 'ذخیرهٔ تاریخچه ALUNA', saveHistorySub: 'ذخیرهٔ گفتگوها در D1', alwaysOn: 'همیشه فعال', dataKicker: 'داده', dataControl: 'کنترل فضای کار', dataControlText: 'قطع اتصال، اعتبارنامهٔ رمزنگاری‌شده را از ALUNA حذف می‌کند. گفتگوهای ALUNA تا زمان حذف دستی باقی می‌مانند.', refreshData: 'به‌روزرسانی داده‌های فضا',
    infoHeadline: 'راهی آگاهانه‌تر برای استفاده از هوش مصنوعی.', infoSubheadline: 'ALUNA برای کسانی ساخته شده که بیش از یک مدل استفاده می‌کنند، اما یک فضای روشن برای فکر کردن، ساختن و جلو رفتن می‌خواهند.', theMaker: 'سازنده', creatorBio: 'ALIRAHIMI سازنده‌ای محصول‌محور است که باور دارد ابزارهای قدرتمند باید آرام، انسانی و زیبا باشند. ALUNA پاسخ او به شلوغی دنیای هوش مصنوعی است: یک مرکز فرمان متمرکز که در آن هر مدل جای خودش را دارد، هر رشته حافظه دارد و هر تعامل با دقت طراحی شده است.', featureOneTitle: 'یک فضای واحد', featureOneText: 'با سه API رسمی از یک رابط پریمیوم گفتگو کن.', featureTwoTitle: 'ماندگاری واقعی', featureTwoText: 'رشته‌ها و پیام‌های ALUNA در Cloudflare D1 ذخیره می‌شوند، نه در یک آرایهٔ نمایشی.', featureThreeTitle: 'صادق از ابتدا', featureThreeText: 'محصول روشن می‌کند که اعتبارنامهٔ سرویس‌دهنده چه چیزی را باز می‌کند و چه چیزی را نه.', featureFourTitle: 'ساخته‌شده برای کنترل', featureFourText: 'اعتبارنامه‌های رمزنگاری‌شده، معماری شفاف و مسیر آماده برای حساب‌های کاربری تأییدشده.', craftedBy: 'ساخته‌شده توسط ALIRAHIMI برای فردایی متمرکزتر.', siteInfo: 'اطلاعات سایت', stateLoaded: 'فضای کار با موفقیت بارگذاری شد.', stateOffline: 'اتصال به Worker برقرار نشد. پروژه را با Wrangler اجرا کن.', saved: 'ذخیره شد', disconnected: 'اتصال قطع شد', connectedSuccess: 'اتصال با موفقیت بررسی و ذخیره شد.', loading: 'در حال بارگذاری...', noProvider: 'این مدل هنوز وصل نشده است.', providerError: 'پاسخ از سرویس‌دهنده دریافت نشد.'
  },
  en: {
    privateWorkspace: 'Private workspace', workspace: 'Workspace', chat: 'Chat', connections: 'Connections', customize: 'Customize', settings: 'Settings', siteInfo: 'Site information', creatorRole: 'Creator & builder', encryptedNote: 'Credentials are encrypted before storage.', breadcrumb: 'ALUNA / Workspace', newConversation: 'New chat', commandCenter: 'COMMAND CENTER', chatHeadline: 'All your AI, in one calm place.', chatSubheadline: 'Switch between models without losing your thread. ALUNA keeps your workspace focused and your conversations beautifully organized.', yourThreads: 'YOUR THREADS', conversations: 'conversations', searchThreads: 'Search threads', ready: 'Ready', officialRoute: "Messages route through the provider's official API.", messagePlaceholder: 'Ask anything...', today: 'Today', emptyThreads: 'You have not created an ALUNA conversation yet.', emptyMessages: 'This conversation is ready to begin.', connectToChat: 'Connect this model from the Connections page to start.', goConnections: 'Open connections', you: 'You', assistant: 'ALUNA', sending: 'Sending...', connectionRequired: 'Connect this provider before chatting.',
    connectionsKicker: 'YOUR CONNECTIONS', connectionsHeadline: 'Bring your models into ALUNA.', connectionsSubheadline: 'Connect with an official provider API. Your account email labels the connection; ALUNA never asks for your provider password.', serverEncrypted: 'Server-side encrypted', providerTruthTitle: 'A clear line between account and API', providerTruth: "Logging into a consumer AI website with Gmail does not give another website access to its private web history. To make chat genuinely work, use the provider's official API key here. ALUNA then stores its own real history in D1.", emailLabel: 'Account email', apiKeyLabel: 'Official API key', emailPlaceholder: 'you@example.com', apiKeyPlaceholder: 'Used only for secure connection', connect: 'Connect & verify key', disconnect: 'Disconnect', connected: 'Connected', notConnected: 'Not connected', verifyHint: 'The key is not stored in the browser; the Worker encrypts it.', providerOpenaiDesc: 'Chat with official OpenAI models through the API.', providerDeepseekDesc: 'Fast, thoughtful responses from DeepSeek API.', providerGeminiDesc: 'Gemini through Google’s official endpoint.',
    settingsKicker: 'YOUR SPACE', settingsHeadline: 'Make ALUNA feel like yours.', settingsSubheadline: 'Every detail is saved to your workspace and follows you across sessions.', lookAndFeel: 'LOOK & FEEL', themes: 'Themes', auroraTheme: 'Aurora', auroraThemeSub: 'Quiet premium', catTheme: 'Cat club', catThemeSub: 'Soft & playful', cyberTheme: 'Cyber neon', cyberThemeSub: 'Electric future', retroTheme: '90s signal', retroThemeSub: 'Digital nostalgia', accentKicker: 'ACCENT', accentColor: 'Accent color', accentHint: 'Applied across the workspace', preferencesKicker: 'PREFERENCES', preferences: 'Preferences', language: 'Interface language', languageSub: 'Persian or English', saveHistory: 'Save ALUNA history', saveHistorySub: 'Persist conversations in D1', alwaysOn: 'Always on', dataKicker: 'DATA', dataControl: 'Workspace control', dataControlText: 'Disconnecting a provider removes its encrypted credential from ALUNA. Your saved ALUNA conversations stay available until you delete them.', refreshData: 'Refresh workspace data',
    infoHeadline: 'A more intentional way to use AI.', infoSubheadline: 'ALUNA is built for people who use more than one model, but want one clear place to think, create, and move forward.', theMaker: 'THE MAKER', creatorBio: 'ALIRAHIMI is a product-minded creator who believes powerful tools should feel calm, human, and beautifully made. ALUNA is his answer to a noisy AI landscape: a focused command center where every model has a place, every thread has a memory, and every interaction feels considered.', featureOneTitle: 'One workspace', featureOneText: 'Chat with three official provider APIs from one premium interface.', featureTwoTitle: 'Real persistence', featureTwoText: 'Your ALUNA threads and messages are stored in Cloudflare D1, not a demo array.', featureThreeTitle: 'Honest by design', featureThreeText: 'The product explains what provider credentials can and cannot unlock.', featureFourTitle: 'Built for control', featureFourText: 'Encrypted credentials, a clean architecture, and a path to verified user accounts.', craftedBy: 'Crafted by ALIRAHIMI for a more focused tomorrow.', siteInfo: 'Site information', stateLoaded: 'Workspace loaded successfully.', stateOffline: 'The Worker is not reachable. Run the project with Wrangler.', saved: 'Saved', disconnected: 'Connection removed', connectedSuccess: 'Connection verified and saved.', loading: 'Loading...', noProvider: 'This model is not connected yet.', providerError: 'The provider did not return a response.'
  }
};

const providers = {
  openai: { name: 'ChatGPT', short: 'GPT', icon: '✺', descriptionKey: 'providerOpenaiDesc' },
  deepseek: { name: 'DeepSeek', short: 'DS', icon: 'D', descriptionKey: 'providerDeepseekDesc' },
  gemini: { name: 'Gemini', short: 'G', icon: '✦', descriptionKey: 'providerGeminiDesc' }
};

const state = { lang: 'fa', settings: { language: 'fa', theme: 'aurora', accent: '#8b5cf6' }, connections: [], conversations: [], provider: 'openai', conversationId: null, messages: [], search: '', online: true };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const t = (key) => copy[state.lang][key] || key;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const providerInfo = (provider) => providers[provider] || providers.openai;

async function api(path, options = {}) {
  const response = await fetch(`/api/${path}`, { credentials: 'same-origin', headers: { 'content-type': 'application/json', ...(options.headers || {}) }, ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || t('providerError'));
  return data;
}

function toast(message) {
  const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('show'), 3500);
}

function applyCopy() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'fa' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach((node) => { node.innerHTML = t(node.dataset.i18n); });
  $$('[data-i18n-placeholder]').forEach((node) => { node.placeholder = t(node.dataset.i18nPlaceholder); });
  $('#pageTitle').textContent = t(document.querySelector('.nav-item.active')?.dataset.page === 'info' ? 'siteInfo' : document.querySelector('.nav-item.active')?.dataset.page || 'chat');
  $('#languageButton').innerHTML = state.lang === 'fa' ? 'FA <span>↔</span> EN' : 'EN <span>↔</span> FA';
}

function applySettings() {
  document.body.dataset.theme = state.settings.theme || 'aurora';
  document.documentElement.style.setProperty('--brand', state.settings.accent || '#8b5cf6');
  document.documentElement.style.setProperty('--brand-soft', `${state.settings.accent || '#8b5cf6'}20`);
  $$('.theme-tile').forEach((node) => node.classList.toggle('selected', node.dataset.theme === state.settings.theme));
  $$('.accent').forEach((node) => node.classList.toggle('selected', node.dataset.accent === state.settings.accent));
  $$('#languageSwitch button').forEach((node) => node.classList.toggle('active', node.dataset.lang === state.lang));
}

function connected(provider = state.provider) { return state.connections.some((item) => item.provider === provider); }

function renderModels() {
  $('#modelSwitcher').innerHTML = Object.entries(providers).map(([key, item]) => `<button class="model-chip ${key === state.provider ? 'active' : ''}" data-provider="${key}"><i class="${key}">${item.icon}</i>${item.name}</button>`).join('');
  $$('.model-chip').forEach((node) => node.addEventListener('click', () => { state.provider = node.dataset.provider; state.conversationId = state.conversations.find((item) => item.provider === state.provider)?.id || null; loadConversation(); }));
  $('#connectedLabel').innerHTML = connected() ? `<span class="status-dot"></span><span>${t('ready')}</span>` : `<span class="status-dot" style="background:var(--danger)"></span><span>${t('noProvider')}</span>`;
}

function formatDate(value) {
  if (!value) return '';
  try { return new Intl.DateTimeFormat(state.lang === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z'))); } catch { return value; }
}

function renderThreads() {
  const query = state.search.toLowerCase();
  const list = state.conversations.filter((item) => item.title.toLowerCase().includes(query));
  $('#threadCount').textContent = `${state.conversations.length} ${t('conversations')}`;
  $('#chatCount').textContent = state.conversations.length;
  $('#threadList').innerHTML = list.length ? list.map((item) => { const info = providerInfo(item.provider); return `<button class="thread-item ${item.id === state.conversationId ? 'selected' : ''}" data-conversation="${item.id}"><span class="thread-provider ${item.provider}">${info.icon}</span><span class="thread-copy"><b>${escapeHtml(item.title)}</b><small>${info.name} · ${formatDate(item.updated_at)}</small></span></button>`; }).join('') : `<div class="empty-state">${t('emptyThreads')}</div>`;
  $$('.thread-item').forEach((node) => node.addEventListener('click', () => { state.conversationId = node.dataset.conversation; state.provider = state.conversations.find((item) => item.id === state.conversationId)?.provider || state.provider; renderModels(); loadConversation(); }));
}

function renderMessages() {
  const info = providerInfo(state.provider);
  if (!state.messages.length) {
    const body = connected() ? t('emptyMessages') : t('connectToChat');
    $('#messageStream').innerHTML = `<div class="stream-date">${t('today')}</div><div class="empty-state"><div class="intro-orb" style="margin:0 auto 18px;width:66px;height:66px;border-radius:21px"><span>${info.icon}</span></div><strong>${escapeHtml(body)}</strong>${connected() ? '' : `<br /><button class="outline-button" style="margin-top:14px" id="inlineConnect">${t('goConnections')}</button>`}</div>`;
    $('#inlineConnect')?.addEventListener('click', () => switchPage('connections'));
  } else {
    $('#messageStream').innerHTML = `<div class="stream-date">${t('today')}</div>` + state.messages.map((item) => `<div class="message-row ${item.role === 'user' ? 'user' : ''}"><div class="message-avatar">${item.role === 'user' ? 'AR' : escapeHtml(info.icon)}</div><div class="message-bubble">${escapeHtml(item.content).replace(/\n/g, '<br>')}<span class="message-meta">${item.role === 'user' ? t('you') : info.name} · ${formatDate(item.created_at)}</span></div></div>`).join('');
  }
  $('#messageStream').scrollTop = $('#messageStream').scrollHeight;
}

function renderProviders() {
  $('#providerGrid').innerHTML = Object.entries(providers).map(([key, item]) => {
    const connection = state.connections.find((entry) => entry.provider === key);
    const isConnected = Boolean(connection);
    return `<article class="provider-card"><div class="provider-card-top"><div class="provider-logo ${key}">${item.icon}</div><span class="provider-state ${isConnected ? 'connected' : ''}">${isConnected ? t('connected') : t('notConnected')}</span></div><h3>${item.name}</h3><p>${t(item.descriptionKey)}</p>${isConnected ? `<div class="account-line"><span>◉</span><b>${escapeHtml(connection.email)}</b></div><button class="provider-submit disconnect" data-disconnect="${key}">${t('disconnect')}</button>` : `<form class="connection-form" data-connect="${key}"><label><span class="field-label">${t('emailLabel')}</span><input class="field-input" name="email" type="email" required placeholder="${t('emailPlaceholder')}" autocomplete="email" /></label><label><span class="field-label">${t('apiKeyLabel')}</span><input class="field-input" name="apiKey" type="password" required minlength="8" placeholder="${t('apiKeyPlaceholder')}" autocomplete="off" /></label><button class="provider-submit" type="submit">${t('connect')}</button></form>`}<div class="provider-footnote">⌁ ${t('verifyHint')}</div></article>`;
  }).join('');
  $$('[data-connect]').forEach((form) => form.addEventListener('submit', connectProvider));
  $$('[data-disconnect]').forEach((button) => button.addEventListener('click', () => disconnectProvider(button.dataset.disconnect)));
}

async function connectProvider(event) {
  event.preventDefault();
  const form = event.currentTarget; const button = form.querySelector('button'); button.disabled = true; button.textContent = t('loading');
  const body = Object.fromEntries(new FormData(form).entries()); body.provider = form.dataset.connect;
  try {
    await api('connections', { method: 'POST', body: JSON.stringify(body) });
    await loadState();
    toast(t('connectedSuccess'));
  } catch (error) { toast(error.message); button.disabled = false; button.textContent = t('connect'); }
}

async function disconnectProvider(provider) {
  try { await api(`connections/${provider}`, { method: 'DELETE' }); await loadState(); toast(t('disconnected')); }
  catch (error) { toast(error.message); }
}

async function loadConversation() {
  renderModels(); renderThreads();
  if (!state.conversationId) { state.messages = []; renderMessages(); return; }
  try { const data = await api(`conversations/${state.conversationId}`); state.messages = data.messages || []; renderMessages(); }
  catch (error) { state.messages = []; renderMessages(); toast(error.message); }
}

async function loadState() {
  try {
    const data = await api('state');
    const previousConversation = state.conversationId;
    state.connections = data.connections || [];
    state.conversations = data.conversations || [];
    state.settings = data.settings || state.settings;
    state.lang = state.settings.language || state.lang;
    const preserved = state.conversations.find((item) => item.id === previousConversation);
    state.provider = preserved?.provider || state.conversations[0]?.provider || state.provider;
    state.conversationId = preserved?.id || state.conversations.find((item) => item.provider === state.provider)?.id || null;
    state.online = true;
    applyCopy(); applySettings(); renderModels(); renderThreads(); renderProviders(); await loadConversation();
    toast(t('stateLoaded'));
  } catch (error) {
    state.online = false; renderModels(); renderThreads(); renderProviders(); renderMessages(); toast(t('stateOffline'));
  }
}

async function sendMessage() {
  const input = $('#messageInput'); const message = input.value.trim();
  if (!message || !connected()) { if (!connected()) toast(t('connectionRequired')); return; }
  const button = $('#sendButton'); button.disabled = true; input.value = ''; input.style.height = '31px';
  const optimistic = { id: `temp-${Date.now()}`, role: 'user', content: message, created_at: new Date().toISOString() };
  state.messages.push(optimistic); renderMessages();
  const previous = button.textContent; button.textContent = '…';
  try {
    const data = await api('chat', { method: 'POST', body: JSON.stringify({ provider: state.provider, conversationId: state.conversationId, message }) });
    state.conversationId = data.conversationId;
    await loadState();
  } catch (error) { state.messages = state.messages.filter((item) => item !== optimistic); renderMessages(); toast(error.message); }
  finally { button.disabled = false; button.textContent = previous; }
}

async function createConversation() {
  if (!connected()) { switchPage('connections'); toast(t('connectionRequired')); return; }
  state.conversationId = null; state.messages = []; renderThreads(); renderMessages(); $('#messageInput').focus();
}

async function saveSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  applySettings();
  try { await api('settings', { method: 'PATCH', body: JSON.stringify(state.settings) }); toast(t('saved')); }
  catch (error) { toast(error.message); }
}

function switchPage(name) {
  $$('.page').forEach((page) => page.classList.toggle('active', page.id === `page-${name}`));
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.page === name));
  $('#pageTitle').textContent = t(name === 'info' ? 'siteInfo' : name);
  $('#sidebar').classList.remove('open');
}

$$('.nav-item').forEach((button) => button.addEventListener('click', () => switchPage(button.dataset.page)));
$('#sidebarInfo').addEventListener('click', () => switchPage('info'));
$('#menuButton').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#newConversation').addEventListener('click', createConversation);
$('#railNew').addEventListener('click', createConversation);
$('#sendButton').addEventListener('click', sendMessage);
$('#messageInput').addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
$('#messageInput').addEventListener('input', (event) => { event.target.style.height = '31px'; event.target.style.height = `${Math.min(event.target.scrollHeight, 130)}px`; });
$('#conversationSearch').addEventListener('input', (event) => { state.search = event.target.value; renderThreads(); });
$('#languageButton').addEventListener('click', () => saveSettings({ language: state.lang === 'fa' ? 'en' : 'fa' }).then(() => { state.lang = state.settings.language; applyCopy(); renderModels(); renderThreads(); renderProviders(); renderMessages(); }));
$$('#languageSwitch button').forEach((button) => button.addEventListener('click', () => saveSettings({ language: button.dataset.lang }).then(() => { state.lang = state.settings.language; applyCopy(); renderModels(); renderThreads(); renderProviders(); renderMessages(); })));
$$('.theme-tile').forEach((button) => button.addEventListener('click', () => saveSettings({ theme: button.dataset.theme })));
$$('.accent').forEach((button) => button.addEventListener('click', () => saveSettings({ accent: button.dataset.accent })));
$('#quickTheme').addEventListener('click', () => { const themes = ['aurora', 'cat', 'cyber', 'retro']; saveSettings({ theme: themes[(themes.indexOf(state.settings.theme) + 1) % themes.length] }); });
$('#refreshState').addEventListener('click', loadState);

const requestedView = new URLSearchParams(window.location.search).get('view');
if (['chat', 'connections', 'settings', 'info'].includes(requestedView)) switchPage(requestedView);
applyCopy(); applySettings(); renderModels(); renderThreads(); renderProviders(); renderMessages(); loadState();
