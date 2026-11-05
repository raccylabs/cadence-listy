import { one, run } from './db.js';
import { ValidationError } from './errors.js';

export const SESSION_COOKIE = 'listy_session';
const SESSION_DAYS = 30;

export const randomToken = (bytes = 32) =>
	btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(bytes)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function sha256(text) {
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
	return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compare two secrets without leaking where they differ. */
export function sameText(a, b) {
	const x = new TextEncoder().encode(String(a));
	const y = new TextEncoder().encode(String(b));
	let diff = x.length ^ y.length;
	for (let i = 0; i < Math.min(x.length, y.length); i++) diff |= x[i] ^ y[i];
	return diff === 0;
}

// `key` is the slow hash from the browser (see $lib/passwordKey.js).
const keyHash = (salt, key) => sha256(`${salt}:${key}`);

export async function setPassword(env, userId, key) {
	if (!key) throw new ValidationError('Enter a password.');
	const salt = randomToken(16);
	await run(env, 'UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?', salt, await keyHash(salt, key), userId);
}

export async function checkPassword(user, key) {
	return !!key && sameText(await keyHash(user.password_salt, key), user.password_hash);
}

export const getUserById = (env, id) => one(env, 'SELECT * FROM users WHERE id = ?', id);
export const getUserByName = (env, name) => one(env, 'SELECT * FROM users WHERE username = ?', name);

export async function createUser(env, { username, key, timezone }) {
	if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,28}[a-zA-Z0-9])?$/.test(username))
		throw new ValidationError('Use letters, numbers and hyphens for your username, up to 30 characters.');
	if (await getUserByName(env, username)) throw new ValidationError('That username is taken.');
	if (!key) throw new ValidationError('Enter a password.');
	let zone = 'UTC';
	try {
		zone = new Intl.DateTimeFormat('en', { timeZone: timezone }).resolvedOptions().timeZone;
	} catch {
		// Keep UTC.
	}
	const salt = randomToken(16);
	const made = await run(env, 'INSERT INTO users (username, password_salt, password_hash, timezone) VALUES (?, ?, ?, ?)', username, salt, await keyHash(salt, key), zone);
	return made.meta.last_row_id;
}

export async function createSession(env, userId) {
	const token = randomToken();
	const expires = Date.now() + SESSION_DAYS * 86400000;
	await run(env, 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', await sha256(token), userId, expires);
	return { token, expires: new Date(expires) };
}

/** The user for a session token, extending the session once it's half used. */
export async function validateSession(env, token) {
	if (!token) return null;
	const id = await sha256(token);
	const s = await one(env, 'SELECT * FROM sessions WHERE id = ?', id);
	if (!s || s.expires_at < Date.now()) return null;
	if (s.expires_at - Date.now() < (SESSION_DAYS / 2) * 86400000)
		await run(env, 'UPDATE sessions SET expires_at = ? WHERE id = ?', Date.now() + SESSION_DAYS * 86400000, id);
	return getUserById(env, s.user_id);
}

export const deleteSession = async (env, token) => token && run(env, 'DELETE FROM sessions WHERE id = ?', await sha256(token));

export const sessionCookie = (url, expires) => ({ path: '/', httpOnly: true, sameSite: 'lax', secure: url.protocol === 'https:', expires });

/** True once a key has been used more than `limit` times in 15 minutes. Workers keep no memory, so this lives in D1. */
export async function rateLimited(env, key, limit = 10) {
	const now = Date.now();
	const row = await one(
		env,
		`INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
		 ON CONFLICT (key) DO UPDATE SET
			count = CASE WHEN reset_at < ? THEN 1 ELSE count + 1 END,
			reset_at = CASE WHEN reset_at < ? THEN excluded.reset_at ELSE reset_at END
		 RETURNING count`,
		key, now + 15 * 60000, now, now
	);
	return row.count > limit;
}

export const clearRateLimit = (env, key) => run(env, 'DELETE FROM rate_limits WHERE key = ?', key);

export const oldSignIns = (env) =>
	env.DB.batch([
		env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Date.now()),
		env.DB.prepare('DELETE FROM rate_limits WHERE reset_at < ?').bind(Date.now())
	]);

