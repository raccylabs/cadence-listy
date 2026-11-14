import { ensureSchema } from '$lib/server/db.js';
import { useFakeToday } from '$lib/server/advent.js';
import { SESSION_COOKIE, validateSession, sessionCookie } from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
	const { url } = event;
	const env = event.platform.env;
	event.locals.env = env;
	await ensureSchema(env);
	useFakeToday(env);

	const token = event.cookies.get(SESSION_COOKIE);
	const user = await validateSession(env, token);
	if (token && !user) event.cookies.delete(SESSION_COOKIE, sessionCookie(url));
	event.locals.user = user;

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'same-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	if (url.pathname.startsWith('/share/')) {
		// The address is the secret: keep it out of search engines and shared caches.
		response.headers.set('X-Robots-Tag', 'noindex, nofollow');
		if (!response.headers.has('Cache-Control')) response.headers.set('Cache-Control', 'private, no-store');
	}
	return response;
}
