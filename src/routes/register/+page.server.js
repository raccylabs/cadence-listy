import { fail, redirect } from '@sveltejs/kit';
import { createUser, createSession, SESSION_COOKIE, sessionCookie, rateLimited, sameText } from '$lib/server/auth.js';
import { ValidationError } from '$lib/server/errors.js';
import { openInvite, useInvite } from '$lib/server/people.js';
import { joinGroup } from '$lib/server/groups.js';

export async function load({ locals, url }) {
	if (locals.user) redirect(303, '/');
	const invite = url.searchParams.get('invite') ?? '';
	return { open: !!locals.env.INVITE_CODE || !!(await openInvite(locals.env, invite)), invite };
}

export const actions = {
	default: async ({ request, cookies, url, locals, getClientAddress }) => {
		const env = locals.env;
		const f = await request.formData();
		const username = String(f.get('username') ?? '').trim();
		if (await rateLimited(env, `register:${getClientAddress()}`)) return fail(429, { username, error: 'Too many tries. Wait 15 minutes, then try again.' });
		const code = String(f.get('invite') ?? '').trim();
		const invite = await openInvite(env, code);
		if (!invite && !(env.INVITE_CODE && sameText(code, env.INVITE_CODE))) return fail(400, { username, error: "That invite code isn't right, or it's already been used." });
		let id;
		try {
			id = await createUser(env, { username, key: String(f.get('key') ?? ''), timezone: String(f.get('timezone') ?? 'UTC') });
		} catch (e) {
			if (e instanceof ValidationError) return fail(400, { username, error: e.message });
			throw e;
		}
		if (invite) {
			await useInvite(env, invite, id);
			if (invite.group_id) await joinGroup(env, { id }, { id: invite.group_id }).catch(() => {});
		}
		const { token, expires } = await createSession(env, id);
		cookies.set(SESSION_COOKIE, token, sessionCookie(url, expires));
		redirect(303, '/');
	}
};
