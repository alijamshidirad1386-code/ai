const PROVIDERS = {
  openai: { label: 'ChatGPT', model: 'gpt-4o-mini' },
  deepseek: { label: 'DeepSeek', model: 'deepseek-chat' },
  gemini: { label: 'Gemini', model: 'gemini-2.0-flash' }
};

const JSON_HEADERS = { 'content-type': 'application/json; charset=UTF-8' };
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

class HttpError extends Error {
  constructor(status, message, code = 'request_error') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function json(data, status = 200, cookie) {
  const headers = new Headers(JSON_HEADERS);
  headers.set('cache-control', 'no-store');
  if (cookie) headers.set('set-cookie', cookie);
  return new Response(JSON.stringify(data), { status, headers });
}

function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  const found = raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return found ? decodeURIComponent(found.slice(name.length + 1)) : null;
}

async function getUser(request, env) {
  const existing = getCookie(request, 'ALUNA_ID');
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return { id: existing, cookie: null };
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO users (id) VALUES (?)').bind(id).run();
  await env.DB.prepare('INSERT INTO settings (user_id) VALUES (?)').bind(id).run();
  return { id, cookie: `ALUNA_ID=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax` };
}

async function parseJson(request) {
  try { return await request.json(); } catch { throw new HttpError(400, 'Invalid JSON body', 'invalid_json'); }
}

function requireProvider(value) {
  if (!Object.hasOwn(PROVIDERS, value)) throw new HttpError(400, 'Unsupported provider', 'unsupported_provider');
  return value;
}

function requireEmail(value) {
  if (typeof value !== 'string' || !/^\S+@\S+\.\S+$/.test(value.trim())) throw new HttpError(400, 'A valid account email is required', 'invalid_email');
  return value.trim().toLowerCase();
}

function requireApiKey(value) {
  if (typeof value !== 'string' || value.trim().length < 8) throw new HttpError(400, 'An official provider API key is required', 'invalid_api_key');
  return value.trim();
}

function toBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function cryptoKey(secret) {
  if (!secret || secret.length < 32) throw new HttpError(500, 'APP_SECRET is missing or too short', 'server_secret_missing');
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(secret));
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encrypt(value, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await cryptoKey(secret);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(value));
  return `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

async function decrypt(value, secret) {
  const [iv, payload] = value.split('.');
  const key = await cryptoKey(secret);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, key, fromBase64(payload));
  return textDecoder.decode(decrypted);
}

async function requestWithTimeout(url, init, timeout = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  catch (error) { throw new HttpError(502, `Provider request failed: ${error.name === 'AbortError' ? 'timeout' : error.message}`, 'provider_unreachable'); }
  finally { clearTimeout(timer); }
}

async function providerJson(response) {
  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw); } catch { data = { error: { message: raw.slice(0, 300) } }; }
  if (!response.ok) throw new HttpError(502, data?.error?.message || data?.message || 'The provider rejected the request', 'provider_rejected');
  return data;
}

async function verifyCredential(provider, apiKey) {
  let response;
  if (provider === 'openai') response = await requestWithTimeout('https://api.openai.com/v1/models', { headers: { authorization: `Bearer ${apiKey}` } }, 12000);
  if (provider === 'deepseek') response = await requestWithTimeout('https://api.deepseek.com/models', { headers: { authorization: `Bearer ${apiKey}` } }, 12000);
  if (provider === 'gemini') response = await requestWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`, {}, 12000);
  await providerJson(response);
}

async function callProvider(provider, apiKey, messages) {
  const config = PROVIDERS[provider];
  if (provider === 'gemini') {
    const contents = messages.map((item) => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.content }] }));
    const response = await requestWithTimeout(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents })
    });
    const data = await providerJson(response);
    const output = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')?.trim();
    if (!output) throw new HttpError(502, 'Gemini returned no text', 'empty_provider_response');
    return output;
  }
  const base = provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' : 'https://api.deepseek.com/chat/completions';
  const response = await requestWithTimeout(base, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: config.model, messages: messages.map(({ role, content }) => ({ role, content })), temperature: 0.7 })
  });
  const data = await providerJson(response);
  const output = data?.choices?.[0]?.message?.content?.trim();
  if (!output) throw new HttpError(502, `${config.label} returned no text`, 'empty_provider_response');
  return output;
}

async function connectionFor(env, userId, provider) {
  const row = await env.DB.prepare('SELECT encrypted_api_key FROM connections WHERE user_id = ? AND provider = ?').bind(userId, provider).first();
  if (!row) throw new HttpError(409, `Connect ${PROVIDERS[provider].label} before chatting`, 'provider_not_connected');
  return decrypt(row.encrypted_api_key, env.APP_SECRET);
}

async function stateResponse(env, user, responseData) {
  return json(responseData, 200, user.cookie);
}

async function getState(env, user) {
  const [connections, conversations, settings] = await Promise.all([
    env.DB.prepare('SELECT provider, email, created_at, updated_at FROM connections WHERE user_id = ? ORDER BY provider').bind(user.id).all(),
    env.DB.prepare('SELECT id, provider, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100').bind(user.id).all(),
    env.DB.prepare('SELECT language, theme, accent FROM settings WHERE user_id = ?').bind(user.id).first()
  ]);
  return { connections: connections.results, conversations: conversations.results, settings: settings || { language: 'fa', theme: 'aurora', accent: '#8b5cf6' } };
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const route = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  const user = await getUser(request, env);

  if (route[0] === 'health') return stateResponse(env, user, { ok: true, service: 'ALUNA', time: new Date().toISOString() });
  if (route[0] === 'state' && request.method === 'GET') return stateResponse(env, user, await getState(env, user));

  if (route[0] === 'connections' && request.method === 'GET') {
    const rows = await env.DB.prepare('SELECT provider, email, created_at, updated_at FROM connections WHERE user_id = ? ORDER BY provider').bind(user.id).all();
    return stateResponse(env, user, { connections: rows.results });
  }
  if (route[0] === 'connections' && request.method === 'POST') {
    const body = await parseJson(request);
    const provider = requireProvider(body.provider);
    const email = requireEmail(body.email);
    const apiKey = requireApiKey(body.apiKey);
    await verifyCredential(provider, apiKey);
    const encrypted = await encrypt(apiKey, env.APP_SECRET);
    await env.DB.prepare('INSERT INTO connections (user_id, provider, email, encrypted_api_key) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, provider) DO UPDATE SET email = excluded.email, encrypted_api_key = excluded.encrypted_api_key, updated_at = CURRENT_TIMESTAMP').bind(user.id, provider, email, encrypted).run();
    return stateResponse(env, user, { ok: true, provider, email });
  }
  if (route[0] === 'connections' && route[1] && request.method === 'DELETE') {
    const provider = requireProvider(route[1]);
    await env.DB.prepare('DELETE FROM connections WHERE user_id = ? AND provider = ?').bind(user.id, provider).run();
    return stateResponse(env, user, { ok: true, provider });
  }

  if (route[0] === 'settings' && request.method === 'PATCH') {
    const body = await parseJson(request);
    const language = body.language === 'en' ? 'en' : 'fa';
    const theme = ['aurora', 'cat', 'cyber', 'retro'].includes(body.theme) ? body.theme : 'aurora';
    const accent = typeof body.accent === 'string' && /^#[0-9a-f]{6}$/i.test(body.accent) ? body.accent : '#8b5cf6';
    await env.DB.prepare('INSERT INTO settings (user_id, language, theme, accent) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET language = excluded.language, theme = excluded.theme, accent = excluded.accent, updated_at = CURRENT_TIMESTAMP').bind(user.id, language, theme, accent).run();
    return stateResponse(env, user, { ok: true, settings: { language, theme, accent } });
  }

  if (route[0] === 'conversations' && !route[1] && request.method === 'GET') {
    const provider = url.searchParams.get('provider');
    const query = provider ? env.DB.prepare('SELECT id, provider, title, created_at, updated_at FROM conversations WHERE user_id = ? AND provider = ? ORDER BY updated_at DESC LIMIT 100').bind(user.id, requireProvider(provider)) : env.DB.prepare('SELECT id, provider, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100').bind(user.id);
    const rows = await query.all();
    return stateResponse(env, user, { conversations: rows.results });
  }
  if (route[0] === 'conversations' && route[1] && request.method === 'GET') {
    const conversation = await env.DB.prepare('SELECT id, provider, title, created_at, updated_at FROM conversations WHERE id = ? AND user_id = ?').bind(route[1], user.id).first();
    if (!conversation) throw new HttpError(404, 'Conversation not found', 'conversation_not_found');
    const rows = await env.DB.prepare('SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').bind(route[1]).all();
    return stateResponse(env, user, { conversation, messages: rows.results });
  }
  if (route[0] === 'conversations' && request.method === 'POST') {
    const body = await parseJson(request);
    const provider = requireProvider(body.provider);
    const id = crypto.randomUUID();
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 90) : 'New conversation';
    await env.DB.prepare('INSERT INTO conversations (id, user_id, provider, title) VALUES (?, ?, ?, ?)').bind(id, user.id, provider, title).run();
    return stateResponse(env, user, { conversation: { id, user_id: user.id, provider, title } });
  }

  if (route[0] === 'chat' && request.method === 'POST') {
    const body = await parseJson(request);
    const provider = requireProvider(body.provider);
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 12000) throw new HttpError(400, 'Message must be between 1 and 12000 characters', 'invalid_message');
    const apiKey = await connectionFor(env, user.id, provider);
    let conversationId = body.conversationId;
    if (conversationId) {
      const owned = await env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ? AND provider = ?').bind(conversationId, user.id, provider).first();
      if (!owned) throw new HttpError(404, 'Conversation not found', 'conversation_not_found');
    } else {
      conversationId = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO conversations (id, user_id, provider, title) VALUES (?, ?, ?, ?)').bind(conversationId, user.id, provider, message.slice(0, 90)).run();
    }
    await env.DB.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), conversationId, 'user', message).run();
    const history = await env.DB.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 40').bind(conversationId).all();
    const output = await callProvider(provider, apiKey, history.results);
    await env.DB.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(), conversationId, 'assistant', output).run();
    await env.DB.prepare('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(conversationId).run();
    return stateResponse(env, user, { ok: true, conversationId, message: { role: 'assistant', content: output } });
  }

  throw new HttpError(404, 'API route not found', 'not_found');
}

export default {
  async fetch(request, env) {
    try {
      if (new URL(request.url).pathname.startsWith('/api/')) return await handleApi(request, env);
      return env.ASSETS.fetch(request);
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const message = error instanceof HttpError ? error.message : 'Unexpected server error';
      return json({ ok: false, error: { code: error.code || 'server_error', message } }, status);
    }
  }
};
