import { error, fail } from '@sveltejs/kit';
import { requireUser, guarded } from '$lib/server/guard.js';
import { memberGroup } from '$lib/server/groups.js';
import { setupData, saveDoor, clearDoor, copyLastYear } from '$lib/server/advent.js';
import { ValidationError } from '$lib/server/errors.js';

async function mine({ locals, url, params }) {
	const user = requireUser(locals, url);
	const group = await memberGroup(locals.env, user, params.id);
	if (!group) error(404, 'No group here.');
	if (!group.mine) error(403, 'Only the person who made this group can set up its calendar.');
	return { user, group, env: locals.env };
}

export async function load(event) {
	const { user, group, env } = await mine(event);
	return { group: { id: group.id, name: group.name }, setup: await setupData(env, group, user) };
}

export const actions = {
	save: async (event) => {
		const { user, group, env } = await mine(event);
		try {
			await saveDoor(env, group, user, await event.request.formData());
		} catch (e) {
			if (e instanceof ValidationError) return fail(400, { error: e.message });
			throw e;
		}
		return { saved: true };
	},
	clear: guarded(async (event) => {
		const { user, group, env } = await mine(event);
		await clearDoor(env, group, user, await event.request.formData());
		return { cleared: true };
	}),
	copy: guarded(async (event) => {
		const { user, group, env } = await mine(event);
		return { copied: await copyLastYear(env, group, user) };
	})
};
