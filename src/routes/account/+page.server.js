import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/guard.js';
import { checkPassword, setPassword, SESSION_COOKIE, sessionCookie } from '$lib/server/auth.js';
import { deleteUser } from '$lib/server/lists.js';
import { saveProfile } from '$lib/server/profile.js';
import { ValidationError } from '$lib/server/errors.js';

export function load({ locals, url }) {
	const user = requireUser(locals, url);
	return {
		username: user.username,
		profile: { display_name: user.display_name, avatar: user.avatar, photo: user.avatar_key ? user.avatar_v : 0 }
	};
}

export const actions = {
	profile: async ({ locals, url, request }) => {
		const user = requireUser(locals, url);
		try {
			await saveProfile(locals.env, user, await request.formData());
		} catch (e) {
			if (e instanceof ValidationError) return fail(400, { profileError: e.message });
			throw e;
		}
		return { profileSaved: true };
	},
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
		if (user.is_admin) return fail(400, { deleteError: 'You run this site, so your account has to stay.' });
		await deleteUser(locals.env, user);
		cookies.delete(SESSION_COOKIE, sessionCookie(url));
		redirect(303, '/login');
	}
};
