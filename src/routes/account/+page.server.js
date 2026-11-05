import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guard.js';
import { checkPassword, setPassword, SESSION_COOKIE, sessionCookie } from '$lib/server/auth.js';
import { deleteUser } from '$lib/server/lists.js';

export function load({ locals, url }) {
	return { username: requireUser(locals, url).username };
}

export const actions = {
	password: async ({ locals, url, request }) => {
		const user = requireUser(locals, url);
		const f = await request.formData();
		if (!(await checkPassword(user, String(f.get('current') ?? '')))) return fail(400, { error: 'Your current password is not right.' });
		await setPassword(locals.env, user.id, String(f.get('next') ?? ''));
		return { saved: true };
	},
	delete: async ({ locals, url, request, cookies }) => {
		const user = requireUser(locals, url);
		const f = await request.formData();
		if (!(await checkPassword(user, String(f.get('current') ?? '')))) return fail(400, { deleteError: 'Your password is not right.' });
		await deleteUser(locals.env, user);
		cookies.delete(SESSION_COOKIE, sessionCookie(url));
		redirect(303, '/login');
	}
};
