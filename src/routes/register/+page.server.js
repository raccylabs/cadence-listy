import { fail, redirect } from '@sveltejs/kit';
import { createUser, createSession, SESSION_COOKIE, sessionCookie, rateLimited, sameText } from '$lib/server/auth.js';
import { ValidationError } from '$lib/server/errors.js';

export function load({ locals, url }) {
	if (locals.user) redirect(303, '/');
	return { open: !!locals.env.INVITE_CODE, invite: url.searchParams.get('invite') ?? '' };
}

export const actions = {
	default: async ({ request, cookies, url, locals, getClientAddress }) => {
		const env = locals.env;
		const f = await request.formData();
		const username = String(f.get('username') ?? '').trim();
		if (!env.INVITE_CODE) return fail(403, { username, error: 'Sign-ups are closed.' });
		if (await rateLimited(env, `register:${getClientAddress()}`)) return fail(429, { username, error: 'Too many tries. Wait 15 minutes, then try again.' });
		if (!sameText(String(f.get('invite') ?? '').trim(), env.INVITE_CODE)) return fail(400, { username, error: "That invite code isn't right." });
		let id;
		try {
			id = await createUser(env, { username, key: String(f.get('key') ?? ''), timezone: String(f.get('timezone') ?? 'UTC') });
		} catch (e) {
			if (e instanceof ValidationError) return fail(400, { username, error: e.message });
			throw e;
		}
		const { token, expires } = await createSession(env, id);
		cookies.set(SESSION_COOKIE, token, sessionCookie(url, expires));
		redirect(303, '/');
	}
};
