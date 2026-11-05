import { fail, redirect } from '@sveltejs/kit';
import { getUserByName, checkPassword, createSession, SESSION_COOKIE, sessionCookie, rateLimited, clearRateLimit } from '$lib/server/auth.js';

export function load({ locals }) {
	if (locals.user) redirect(303, '/');
}

export const actions = {
	default: async ({ request, cookies, url, locals, getClientAddress }) => {
		const env = locals.env;
		const f = await request.formData();
		const username = String(f.get('username') ?? '').trim();
		const limit = `login:${getClientAddress()}`;
		if (await rateLimited(env, limit)) return fail(429, { username, error: 'Too many sign-in attempts. Try again in a few minutes.' });
		const user = await getUserByName(env, username);
		if (!user || !(await checkPassword(user, String(f.get('key') ?? '')))) return fail(400, { username, error: 'Incorrect username or password.' });
		await clearRateLimit(env, limit);
		const { token, expires } = await createSession(env, user.id);
		cookies.set(SESSION_COOKIE, token, sessionCookie(url, expires));
		const next = url.searchParams.get('next');
		redirect(303, next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
	}
};
