'use strict';
// Тренировки — свой сервер вместо Supabase: вход и регистрация (/auth/v1) и доступ к таблицам (/rest/v1).
// Права проверяет сама база: каждый запрос к таблицам идёт от роли anon или authenticated,
// с номером пользователя в request.jwt.claim.sub — те же правила (RLS), что и в Supabase.
const http = require('http');
const crypto = require('crypto');
const { Pool, types } = require('pg');
const bcrypt = require('bcryptjs');
let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch (e) { nodemailer = null; }

types.setTypeParser(20, (v) => (v == null ? null : parseInt(v, 10)));   // bigint → число, как в PostgREST

const ENV = process.env;
const PORT = +ENV.PORT || 8787;
const HOST = ENV.HOST || '127.0.0.1';
const SITE_URL = String(ENV.SITE_URL || 'http://localhost').replace(/\/+$/, '');
const EXTRA_REDIRECTS = String(ENV.EXTRA_REDIRECTS || '').split(',').map((s) => s.trim()).filter(Boolean);
const JWT_SECRET = ENV.JWT_SECRET || '';
const JWT_EXP = Math.max(60, +ENV.JWT_EXP || 3600);
const REFRESH_DAYS = Math.max(1, +ENV.REFRESH_DAYS || 60);
const REUSE_MS = 10000;
const MIN_PASSWORD = 6;
if (JWT_SECRET.length < 32) { console.error('JWT_SECRET не задан или короче 32 символов'); process.exit(1); }

const authPool = new Pool({ connectionString: ENV.DATABASE_URL_AUTH, max: +ENV.AUTH_POOL || 3, idleTimeoutMillis: 30000 });
const restPool = new Pool({ connectionString: ENV.DATABASE_URL_REST, max: +ENV.REST_POOL || 6, idleTimeoutMillis: 30000 });
authPool.on('error', (e) => console.error('auth pool:', e.message));
restPool.on('error', (e) => console.error('rest pool:', e.message));

const SMTP = ENV.SMTP_HOST && nodemailer ? nodemailer.createTransport({
  host: ENV.SMTP_HOST, port: +ENV.SMTP_PORT || 465, secure: (+ENV.SMTP_PORT || 465) === 465,
  auth: ENV.SMTP_USER ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS || '' } : undefined,
}) : null;
const SMTP_FROM = ENV.SMTP_FROM || ENV.SMTP_USER || '';

// ---------- мелочи ----------
const b64u = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64dec = (s) => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const randomToken = (n) => b64u(crypto.randomBytes(n || 24));
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const normEmail = (e) => String(e || '').trim().toLowerCase();

function jwtSign(payload) {
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify(payload));
  const s = b64u(crypto.createHmac('sha256', JWT_SECRET).update(h + '.' + p).digest());
  return h + '.' + p + '.' + s;
}
function jwtVerify(tok) {
  const parts = String(tok || '').split('.');
  if (parts.length !== 3) return { bad: true };
  const expect = b64u(crypto.createHmac('sha256', JWT_SECRET).update(parts[0] + '.' + parts[1]).digest());
  const a = Buffer.from(parts[2]), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { bad: true };
  let header, payload;
  try { header = JSON.parse(b64dec(parts[0])); payload = JSON.parse(b64dec(parts[1])); } catch (e) { return { bad: true }; }
  if (!header || header.alg !== 'HS256') return { bad: true };
  if (!payload || !payload.exp || payload.exp * 1000 < Date.now()) return { expired: true };
  if (payload.role !== 'authenticated' || !payload.sub) return { bad: true };
  return { claims: payload };
}

// простое ограничение частоты: ключ → счётчик в окне
const RL = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  let e = RL.get(key);
  if (!e || e.reset < now) { e = { n: 0, reset: now + windowMs }; RL.set(key, e); }
  e.n += 1;
  return e.n > max;
}
setInterval(() => { const now = Date.now(); for (const [k, v] of RL) if (v.reset < now) RL.delete(k); }, 60000).unref();

class HttpError extends Error { constructor(status, body) { super(body && (body.message || body.msg || body.error_description) || 'error'); this.status = status; this.body = body; } }
const bad = (msg, code) => new HttpError(400, { code: code || 'PGRST100', message: msg });

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'apikey, authorization, content-type, prefer, x-client-info, accept-profile, content-profile, range',
  'Access-Control-Expose-Headers': 'content-range, content-location',
  'Access-Control-Max-Age': '86400',
};
function send(res, status, body, extra) {
  const h = Object.assign({}, CORS, extra || {});
  if (body === undefined || body === null || status === 204) { res.writeHead(status, h); res.end(); return; }
  h['Content-Type'] = 'application/json; charset=utf-8';
  res.writeHead(status, h);
  res.end(JSON.stringify(body));
}
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(new HttpError(413, { message: 'Слишком большой запрос' })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve(null);
      try { resolve(JSON.parse(raw)); } catch (e) { reject(bad('Тело запроса — не JSON')); }
    });
    req.on('error', reject);
  });
}
function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket.remoteAddress || '?';
}
function bearer(req) {
  const m = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ''));
  return m ? m[1].trim() : '';
}

// ---------- вход и регистрация ----------
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
function userJson(u) {
  return {
    id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email,
    email_confirmed_at: u.email_confirmed_at, confirmed_at: u.email_confirmed_at,
    app_metadata: u.raw_app_meta_data || { provider: 'email', providers: ['email'] },
    user_metadata: u.raw_user_meta_data || {},
    created_at: u.created_at, updated_at: u.updated_at, last_sign_in_at: u.last_sign_in_at,
  };
}
function accessToken(u) {
  const now = Math.floor(Date.now() / 1000);
  return jwtSign({
    aud: 'authenticated', iss: SITE_URL + '/auth/v1', iat: now, exp: now + JWT_EXP, sub: u.id, email: u.email,
    role: 'authenticated', app_metadata: u.raw_app_meta_data || { provider: 'email', providers: ['email'] },
    user_metadata: u.raw_user_meta_data || {}, aal: 'aal1',
  });
}
function sessionJson(u, rt) {
  const now = Math.floor(Date.now() / 1000);
  return { access_token: accessToken(u), token_type: 'bearer', expires_in: JWT_EXP, expires_at: now + JWT_EXP, refresh_token: rt, user: userJson(u) };
}
async function newSession(db, u, parent) {
  const rt = randomToken(24);
  await db.query('insert into auth.refresh_tokens (token, user_id, parent) values ($1, $2, $3)', [rt, u.id, parent || null]);
  return sessionJson(u, rt);
}
async function userById(db, id) {
  const r = await db.query('select * from auth.users where id = $1', [id]);
  return r.rows[0] || null;
}
function cleanMeta(data) {
  if (data == null) return {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new HttpError(422, { msg: 'data должен быть объектом' });
  if (JSON.stringify(data).length > 4000) throw new HttpError(422, { msg: 'data слишком большой' });
  return data;
}
function checkPassword(pw) {
  if (typeof pw !== 'string' || pw.length < MIN_PASSWORD) throw new HttpError(422, { code: 422, error_code: 'weak_password', msg: 'Password should be at least ' + MIN_PASSWORD + ' characters.' });
  if (Buffer.byteLength(pw) > 72) throw new HttpError(422, { code: 422, error_code: 'weak_password', msg: 'Пароль длиннее 72 байт' });
}
function authUser(req) {
  const t = bearer(req);
  if (!t) throw new HttpError(401, { code: 401, error_code: 'no_authorization', msg: 'This endpoint requires a Bearer token' });
  const v = jwtVerify(t);
  if (!v.claims) throw new HttpError(401, { code: 401, error_code: 'bad_jwt', msg: v.expired ? 'JWT expired' : 'invalid JWT' });
  return v.claims;
}
function safeRedirect(to) {
  const s = String(to || '');
  const ok = [SITE_URL].concat(EXTRA_REDIRECTS);
  for (const base of ok) if (s === base || s.startsWith(base + '/') || s.startsWith(base + '?') || s.startsWith(base + '#')) return s.split('#')[0];
  return SITE_URL + '/';
}

async function handleAuth(req, res, url) {
  const path = url.pathname.replace(/^\/auth\/v1/, '') || '/';
  const ip = clientIp(req);
  if (path === '/settings' && req.method === 'GET') {
    return send(res, 200, { external: { email: true }, disable_signup: false, mailer_autoconfirm: true, smtp: !!SMTP });
  }
  if (path === '/health') return send(res, 200, { ok: true });
  if (path === '/signup' && req.method === 'POST') {
    const b = (await readBody(req, 16384)) || {};
    const email = normEmail(b.email);
    if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(422, { code: 422, error_code: 'validation_failed', msg: 'Unable to validate email address: invalid format' });
    checkPassword(b.password);
    if (limited('signup:' + ip, +ENV.SIGNUP_PER_HOUR || 10, 3600e3)) throw new HttpError(429, { code: 429, error_code: 'over_request_rate_limit', msg: 'Слишком много регистраций с этого адреса, попробуй через час' });
    const meta = cleanMeta(b.data);
    const hash = await bcrypt.hash(b.password, 10);
    let u;
    try {
      const r = await authPool.query(
        "insert into auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3) returning *",
        [email, hash, JSON.stringify(meta)]);
      u = r.rows[0];
    } catch (e) {
      if (e.code === '23505') throw new HttpError(422, { code: 422, error_code: 'user_already_exists', msg: 'User already registered' });
      throw e;
    }
    await authPool.query('update auth.users set last_sign_in_at = now() where id = $1', [u.id]);
    return send(res, 200, await newSession(authPool, u));
  }
  if (path === '/token' && req.method === 'POST') {
    const grant = url.searchParams.get('grant_type');
    const b = (await readBody(req, 16384)) || {};
    if (grant === 'password') {
      const email = normEmail(b.email);
      if (limited('login-ip:' + ip, +ENV.LOGIN_PER_10MIN || 30, 600e3) || limited('login-mail:' + email, 10, 600e3))
        throw new HttpError(429, { code: 429, error_code: 'over_request_rate_limit', msg: 'Слишком много попыток входа, подожди 10 минут' });
      const r = await authPool.query('select * from auth.users where lower(email) = $1', [email]);
      const u = r.rows[0];
      const ok = await bcrypt.compare(String(b.password || ''), (u && u.encrypted_password) || DUMMY_HASH);
      if (!u || !u.encrypted_password || !ok) throw new HttpError(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
      await authPool.query('update auth.users set last_sign_in_at = now() where id = $1', [u.id]);
      return send(res, 200, await newSession(authPool, u));
    }
    if (grant === 'refresh_token') {
      const rt = String(b.refresh_token || '');
      const invalid = () => new HttpError(400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token: Refresh Token Not Found' });
      if (!rt || rt.length > 200) throw invalid();
      if (limited('refresh-ip:' + ip, 120, 600e3)) throw new HttpError(429, { code: 429, msg: 'Слишком много запросов' });
      const db = await authPool.connect();
      try {
        await db.query('begin');
        const r = await db.query('select *, extract(epoch from now() - updated_at) * 1000 as since_ms, created_at < now() - make_interval(days => $2) as old from auth.refresh_tokens where token = $1 for update', [rt, REFRESH_DAYS]);
        const row = r.rows[0];
        if (!row || row.old) { await db.query('rollback'); throw invalid(); }
        const u = await userById(db, row.user_id);
        if (!u) { await db.query('rollback'); throw invalid(); }
        if (row.revoked) {
          // та же вкладка или соседняя только что обновила вход — отдаём уже выданный следующий токен
          const c = row.since_ms < REUSE_MS ? await db.query('select token from auth.refresh_tokens where parent = $1 and not revoked order by created_at desc limit 1', [rt]) : { rows: [] };
          await db.query('commit');
          if (!c.rows.length) throw invalid();
          return send(res, 200, sessionJson(u, c.rows[0].token));
        }
        await db.query('update auth.refresh_tokens set revoked = true, updated_at = now() where token = $1', [rt]);
        const s = await newSession(db, u, rt);
        await db.query('commit');
        return send(res, 200, s);
      } catch (e) {
        try { await db.query('rollback'); } catch (_) { /* уже закрыта */ }
        throw e;
      } finally { db.release(); }
    }
    throw new HttpError(400, { error: 'unsupported_grant_type', error_description: 'unsupported grant_type' });
  }
  if (path === '/user' && req.method === 'GET') {
    const c = authUser(req);
    const u = await userById(authPool, c.sub);
    if (!u) throw new HttpError(404, { code: 404, msg: 'User not found' });
    return send(res, 200, userJson(u));
  }
  if (path === '/user' && req.method === 'PUT') {
    const c = authUser(req);
    const b = (await readBody(req, 16384)) || {};
    if (b.email !== undefined) throw new HttpError(422, { code: 422, msg: 'Смена почты пока не поддерживается' });
    if (b.password !== undefined) {
      checkPassword(b.password);
      const hash = await bcrypt.hash(b.password, 10);
      await authPool.query('update auth.users set encrypted_password = $2, updated_at = now() where id = $1', [c.sub, hash]);
    }
    if (b.data !== undefined) {
      const meta = cleanMeta(b.data);
      const r = await authPool.query('select raw_user_meta_data from auth.users where id = $1', [c.sub]);
      if (!r.rows.length) throw new HttpError(404, { code: 404, msg: 'User not found' });
      const merged = Object.assign({}, r.rows[0].raw_user_meta_data || {}, meta);
      if (JSON.stringify(merged).length > 8000) throw new HttpError(422, { msg: 'data слишком большой' });
      await authPool.query('update auth.users set raw_user_meta_data = $2, updated_at = now() where id = $1', [c.sub, JSON.stringify(merged)]);
    }
    const u = await userById(authPool, c.sub);
    if (!u) throw new HttpError(404, { code: 404, msg: 'User not found' });
    return send(res, 200, userJson(u));
  }
  if (path === '/logout' && req.method === 'POST') {
    const c = authUser(req);
    await authPool.query('update auth.refresh_tokens set revoked = true, updated_at = now() where user_id = $1 and not revoked', [c.sub]);
    return send(res, 204);
  }
  if (path === '/recover' && req.method === 'POST') {
    const b = (await readBody(req, 16384)) || {};
    if (!SMTP) throw new HttpError(501, { code: 501, msg: 'восстановление пароля по почте пока не настроено. Напиши автору приложения — он поможет войти' });
    const email = normEmail(b.email);
    if (!EMAIL_RE.test(email)) throw new HttpError(422, { code: 422, msg: 'Unable to validate email address: invalid format' });
    if (limited('recover-ip:' + ip, 5, 3600e3) || limited('recover-mail:' + email, 3, 3600e3))
      throw new HttpError(429, { code: 429, msg: 'Письмо уже отправлено, следующее можно запросить позже' });
    const r = await authPool.query('select id, email from auth.users where lower(email) = $1', [email]);
    if (r.rows.length) {
      const tok = randomToken(32);
      await authPool.query("insert into auth.recovery (token_hash, user_id, redirect_to, expires_at) values ($1, $2, $3, now() + interval '1 hour')",
        [sha256(tok), r.rows[0].id, safeRedirect(b.redirect_to)]);
      const link = SITE_URL + '/auth/v1/verify?type=recovery&token=' + encodeURIComponent(tok);
      await SMTP.sendMail({
        from: SMTP_FROM, to: r.rows[0].email, subject: 'Новый пароль для «Тренировок»',
        text: 'Чтобы задать новый пароль в «Тренировках», открой ссылку:\n' + link + '\n\nСсылка действует час. Если ты не просил сбросить пароль, просто ничего не делай.',
        html: '<p>Чтобы задать новый пароль в «Тренировках», нажми на ссылку:</p><p><a href="' + link + '">Задать новый пароль</a></p><p style="color:#586676">Ссылка действует час. Если ты не просил сбросить пароль, просто ничего не делай.</p>',
      });
    }
    return send(res, 200, {});
  }
  if (path === '/verify' && req.method === 'GET') {
    const tok = url.searchParams.get('token') || '';
    const page = (msg) => { res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' }); res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Тренировки</title><p style="font:18px system-ui;margin:40px auto;max-width:480px;padding:0 16px">' + msg + ' <a href="' + SITE_URL + '/">Открыть приложение</a></p>'); };
    if (url.searchParams.get('type') !== 'recovery' || !tok) return page('Ссылка неполная.');
    const r = await authPool.query("update auth.recovery set used = true where token_hash = $1 and not used and expires_at > now() returning user_id, redirect_to", [sha256(tok)]);
    if (!r.rows.length) return page('Ссылка устарела или уже использована — запроси новое письмо.');
    const u = await userById(authPool, r.rows[0].user_id);
    if (!u) return page('Аккаунт не найден.');
    const s = await newSession(authPool, u);
    const to = safeRedirect(r.rows[0].redirect_to) + '#access_token=' + encodeURIComponent(s.access_token) + '&expires_in=' + s.expires_in +
      '&refresh_token=' + encodeURIComponent(s.refresh_token) + '&token_type=bearer&type=recovery';
    res.writeHead(303, { Location: to, 'Cache-Control': 'no-store' });
    return res.end();
  }
  throw new HttpError(404, { code: 404, msg: 'Not found' });
}

// ---------- таблицы и функции (подмножество PostgREST, которое нужно приложению) ----------
const IDENT = /^[a-z_][a-z0-9_]{0,62}$/;
const TABLES = { progress: ['user_id'], profiles: ['user_id'], friends: ['user_id', 'friend_id'], badge_admins: ['user_id'], awards: ['id'], profile_bans: ['user_id'] };
const RPCS = { find_people: 'rows', my_people: 'rows', find_friend: 'rows', delete_me: 'void', admin_hide: 'void' };
const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);
const qi = (id) => { if (!IDENT.test(id)) throw bad('Недопустимое имя: ' + String(id).slice(0, 40)); return '"' + id + '"'; };

function splitTop(s) {
  const out = []; let depth = 0, cur = '', quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"' && s[i - 1] !== '\\') quoted = !quoted;
    if (!quoted && ch === '(') depth++;
    if (!quoted && ch === ')') depth--;
    if (!quoted && depth === 0 && ch === ',') { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur !== '') out.push(cur);
  if (depth !== 0 || quoted) throw bad('Скобки или кавычки не закрыты');
  return out;
}
const unq = (v) => (/^".*"$/s.test(v) ? v.slice(1, -1).replace(/\\"/g, '"') : v);
function cond(col, expr, vals) {
  const m = /^(not\.)?(eq|neq|gt|gte|lt|lte|in|ilike|like|is)\.([\s\S]*)$/.exec(expr);
  if (!m) throw bad('Непонятный фильтр: ' + String(expr).slice(0, 40));
  const c = qi(col), op = m[2], v = m[3];
  let sql;
  if (op === 'in') {
    const inner = /^\(([\s\S]*)\)$/.exec(v);
    if (!inner) throw bad('in.(…) без скобок');
    const items = inner[1] === '' ? [] : splitTop(inner[1]).map(unq);
    if (items.length > 500) throw bad('Слишком длинный список');
    vals.push(items); sql = c + ' = any($' + vals.length + ')';
  } else if (op === 'is') {
    if (!/^(null|true|false)$/.test(v)) throw bad('is.' + v);
    sql = c + ' is ' + v;
  } else if (op === 'ilike' || op === 'like') {
    vals.push(unq(v).replace(/\*/g, '%')); sql = c + ' ' + op + ' $' + vals.length;
  } else {
    const ops = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' };
    vals.push(unq(v)); sql = c + ' ' + ops[op] + ' $' + vals.length;
  }
  return m[1] ? 'not (' + sql + ')' : sql;
}
function logic(kind, body, vals) {
  const inner = /^\(([\s\S]*)\)$/.exec(body);
  if (!inner) throw bad(kind + '=(…) без скобок');
  const parts = splitTop(inner[1]).map((p) => {
    const lm = /^(and|or)(\([\s\S]*\))$/.exec(p);
    if (lm) return logic(lm[1], lm[2], vals);
    const dm = /^([a-z_][a-z0-9_]*)\.([\s\S]+)$/.exec(p);
    if (!dm) throw bad('Непонятное условие: ' + p.slice(0, 40));
    return cond(dm[1], dm[2], vals);
  });
  if (!parts.length) throw bad('Пустое условие');
  return '(' + parts.join(kind === 'and' ? ' and ' : ' or ') + ')';
}
function whereOf(params, vals) {
  const parts = [];
  for (const [k, v] of params) {
    if (RESERVED.has(k)) continue;
    if (k === 'or' || k === 'and') parts.push(logic(k, v, vals));
    else parts.push(cond(k, v, vals));
  }
  return parts.length ? ' where ' + parts.join(' and ') : '';
}
function selectOf(s) {
  if (!s || s === '*') return '*';
  return s.split(',').map((c) => qi(c.trim())).join(', ');
}
function orderOf(s) {
  if (!s) return '';
  return ' order by ' + s.split(',').map((p) => {
    const m = /^([a-z_][a-z0-9_]*)(?:\.(asc|desc))?(?:\.(nullsfirst|nullslast))?$/.exec(p.trim());
    if (!m) throw bad('order: ' + p.slice(0, 40));
    return qi(m[1]) + (m[2] ? ' ' + m[2] : '') + (m[3] ? (m[3] === 'nullsfirst' ? ' nulls first' : ' nulls last') : '');
  }).join(', ');
}
function limitOf(params) {
  let s = '';
  const l = params.get('limit'), o = params.get('offset');
  if (l != null) { if (!/^\d{1,4}$/.test(l)) throw bad('limit'); s += ' limit ' + Math.min(+l, 1000); }
  if (o != null) { if (!/^\d{1,6}$/.test(o)) throw bad('offset'); s += ' offset ' + +o; }
  return s;
}
const cell = (v) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : v);
function prefer(req) {
  const p = String(req.headers.prefer || '');
  return { repr: /return=representation/.test(p), merge: /resolution=merge-duplicates/.test(p), ignore: /resolution=ignore-duplicates/.test(p) };
}

async function asRole(claims, fn) {
  const db = await restPool.connect();
  try {
    await db.query('begin');
    await db.query(claims ? 'set local role authenticated' : 'set local role anon');
    await db.query("set local statement_timeout = '8s'");
    await db.query("select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', $2, true), set_config('request.jwt.claim.email', $3, true), set_config('request.jwt.claims', $4, true)",
      [claims ? claims.sub : '', claims ? 'authenticated' : 'anon', claims ? claims.email || '' : '', JSON.stringify(claims || { role: 'anon' })]);
    const r = await fn(db);
    await db.query('commit');
    return r;
  } catch (e) {
    try { await db.query('rollback'); } catch (_) { /* соединение уже сломано */ }
    throw e;
  } finally { db.release(); }
}

async function handleRest(req, res, url) {
  let claims = null;
  const t = bearer(req);
  if (t) {
    const v = jwtVerify(t);
    if (!v.claims) throw new HttpError(401, { code: 'PGRST301', message: v.expired ? 'JWT expired' : 'JWT invalid' });
    claims = v.claims;
  }
  const ip = clientIp(req);
  if (limited('rest:' + ip, +ENV.REST_PER_MIN || 600, 60e3)) throw new HttpError(429, { message: 'Слишком много запросов' });
  const parts = url.pathname.replace(/^\/rest\/v1\/?/, '').split('/');
  const params = url.searchParams;
  if (parts[0] === 'rpc' && parts.length === 2) {
    const fn = parts[1];
    if (!RPCS[fn] || req.method !== 'POST') throw new HttpError(404, { code: 'PGRST202', message: 'Could not find the function public.' + fn + ' in the schema cache' });
    const b = (await readBody(req, 65536)) || {};
    if (typeof b !== 'object' || Array.isArray(b)) throw bad('Аргументы — объект');
    const keys = Object.keys(b), vals = keys.map((k) => cell(b[k]));
    const args = keys.map((k, i) => qi(k) + ' => $' + (i + 1)).join(', ');
    const sql = RPCS[fn] === 'void' ? 'select public.' + qi(fn) + '(' + args + ')' : 'select * from public.' + qi(fn) + '(' + args + ')';
    const r = await asRole(claims, (db) => db.query(sql, vals));
    return RPCS[fn] === 'void' ? send(res, 204) : send(res, 200, r.rows);
  }
  const table = parts[0];
  if (parts.length !== 1 || !TABLES[table]) throw new HttpError(404, { code: '42P01', message: 'relation "public.' + String(table).slice(0, 40) + '" does not exist' });
  const T = 'public.' + qi(table);
  const pf = prefer(req);
  if (req.method === 'GET') {
    const vals = [];
    const sql = 'select ' + selectOf(params.get('select')) + ' from ' + T + whereOf(params, vals) + orderOf(params.get('order')) + limitOf(params);
    const r = await asRole(claims, (db) => db.query(sql, vals));
    return send(res, 200, r.rows);
  }
  if (req.method === 'POST') {
    let b = await readBody(req, 4 * 1024 * 1024);
    if (b == null) throw bad('Пустое тело');
    if (!Array.isArray(b)) b = [b];
    if (!b.length) return send(res, 201, pf.repr ? [] : null);
    if (b.length > 200) throw bad('Слишком много строк');
    const cols = Array.from(new Set([].concat(...b.map((row) => Object.keys(row || {})))));
    if (!cols.length) throw bad('Нет полей');
    cols.forEach(qi);
    const vals = [];
    const rows = b.map((row) => '(' + cols.map((c) => { vals.push(row && row[c] !== undefined ? cell(row[c]) : null); return '$' + vals.length; }).join(', ') + ')');
    const pk = TABLES[table];
    let conflict = '';
    if (pf.merge || pf.ignore) {
      const upd = cols.filter((c) => pk.indexOf(c) < 0);
      conflict = ' on conflict (' + pk.map(qi).join(', ') + ') ' + (pf.merge && upd.length ? 'do update set ' + upd.map((c) => qi(c) + ' = excluded.' + qi(c)).join(', ') : 'do nothing');
    }
    const sql = 'insert into ' + T + ' (' + cols.map(qi).join(', ') + ') values ' + rows.join(', ') + conflict + (pf.repr ? ' returning ' + selectOf(params.get('select')) : '');
    const r = await asRole(claims, (db) => db.query(sql, vals));
    return send(res, 201, pf.repr ? r.rows : null);
  }
  if (req.method === 'DELETE') {
    const vals = [];
    const where = whereOf(params, vals);
    if (!where) throw bad('Удаление без условия запрещено');
    const sql = 'delete from ' + T + where + (pf.repr ? ' returning ' + selectOf(params.get('select')) : '');
    const r = await asRole(claims, (db) => db.query(sql, vals));
    return pf.repr ? send(res, 200, r.rows) : send(res, 204);
  }
  if (req.method === 'PATCH') {
    const b = await readBody(req, 4 * 1024 * 1024);
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw bad('Тело — объект');
    const keys = Object.keys(b);
    if (!keys.length) throw bad('Нет полей');
    const vals = keys.map((k) => cell(b[k]));
    const set = keys.map((k, i) => qi(k) + ' = $' + (i + 1)).join(', ');
    const where = whereOf(params, vals);
    if (!where) throw bad('Изменение без условия запрещено');
    const sql = 'update ' + T + ' set ' + set + where + (pf.repr ? ' returning ' + selectOf(params.get('select')) : '');
    const r = await asRole(claims, (db) => db.query(sql, vals));
    return pf.repr ? send(res, 200, r.rows) : send(res, 204);
  }
  throw new HttpError(405, { message: 'Метод не поддерживается' });
}

function pgToHttp(e, claims) {
  const code = e && e.code;
  if (code === '42501') return new HttpError(claims ? 403 : 401, { code, message: e.message });
  if (code === '42883') return new HttpError(404, { code: 'PGRST202', message: 'Could not find the function in the schema cache: ' + e.message });
  if (code === '42P01') return new HttpError(404, { code, message: e.message });
  if (code === '23505' || code === '23503') return new HttpError(409, { code, message: e.message, details: e.detail });
  if (code === 'P0001' || code === '22P02' || code === '42703' || code === '23502' || code === '23514' || code === '22001') return new HttpError(400, { code, message: e.message });
  if (code === '57014') return new HttpError(503, { code, message: 'Запрос выполнялся слишком долго' });
  return null;
}

const server = http.createServer(async (req, res) => {
  const t0 = Date.now();
  let url;
  try { url = new URL(req.url, 'http://local'); } catch (e) { return send(res, 400, { message: 'bad url' }); }
  res.on('finish', () => { if (ENV.LOG_REQUESTS !== '0') console.log(req.method, url.pathname, res.statusCode, (Date.now() - t0) + 'ms'); });
  try {
    if (req.method === 'OPTIONS') return send(res, 204);
    if (url.pathname === '/health') {
      await restPool.query('select 1');
      return send(res, 200, { ok: true });
    }
    if (url.pathname.startsWith('/auth/v1/') || url.pathname === '/auth/v1') return await handleAuth(req, res, url);
    if (url.pathname.startsWith('/rest/v1/')) {
      try { return await handleRest(req, res, url); } catch (e) {
        const h = e instanceof HttpError ? null : pgToHttp(e, bearer(req));
        throw h || e;
      }
    }
    return send(res, 404, { message: 'Not found' });
  } catch (e) {
    if (res.headersSent) { res.end(); return; }
    if (e instanceof HttpError) return send(res, e.status, e.body);
    const h = pgToHttp(e, true);
    if (h) return send(res, h.status, h.body);
    console.error('ошибка:', req.method, url.pathname, e && e.message);
    return send(res, 500, { message: 'Ошибка сервера' });
  }
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
server.requestTimeout = 30000;

// уборка: старые токены входа и ссылки восстановления
async function cleanup() {
  try {
    await authPool.query('delete from auth.refresh_tokens where created_at < now() - make_interval(days => $1) or (revoked and updated_at < now() - interval \'2 days\')', [REFRESH_DAYS + 1]);
    await authPool.query("delete from auth.recovery where expires_at < now() - interval '1 day'");
  } catch (e) { console.error('уборка:', e.message); }
}
setInterval(cleanup, 3600e3).unref();

server.listen(PORT, HOST, () => {
  console.log('Тренировки API слушает ' + HOST + ':' + PORT + (SMTP ? ', почта настроена' : ', почта не настроена'));
  cleanup();
});
const stop = () => { server.close(() => Promise.all([authPool.end(), restPool.end()]).then(() => process.exit(0))); setTimeout(() => process.exit(0), 5000).unref(); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
