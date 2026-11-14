import { redirect } from '@sveltejs/kit';
import { requireUser, guarded, readForm } from '$lib/server/guard.js';
import { myGroups, createGroup } from '$lib/server/groups.js';

export async function load({ locals, url }) {
	return { groups: await myGroups(locals.env, requireUser(locals, url)) };
}

export const actions = {
	create: guarded(async ({ locals, url, request }) => {
		const id = await createGroup(locals.env, requireUser(locals, url), await readForm(request));
		redirect(303, `/groups/${id}`);
	})
};
