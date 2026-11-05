import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, deleteSession, sessionCookie } from '$lib/server/auth.js';

export const actions = {
	default: async ({ cookies, locals, url }) => {
		await deleteSession(locals.env, cookies.get(SESSION_COOKIE));
		cookies.delete(SESSION_COOKIE, sessionCookie(url));
		redirect(303, '/login');
	}
};
