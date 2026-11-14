import { error, redirect } from '@sveltejs/kit';
import { requireUser, guarded } from '$lib/server/guard.js';
import { groupByJoin, joinGroup, isMember } from '$lib/server/groups.js';
import { getUserById } from '$lib/server/auth.js';

const GONE = "This join link doesn't work anymore. Ask for a new one.";

export async function load({ locals, url, params }) {
	const user = requireUser(locals, url);
	const group = await groupByJoin(locals.env, params.token);
	if (!group) error(404, GONE);
	if (await isMember(locals.env, group, user.id)) redirect(303, `/groups/${group.id}`);
	const owner = await getUserById(locals.env, group.owner_id);
	return { name: group.name, by: owner?.display_name || owner?.username || '' };
}

export const actions = {
	default: guarded(async ({ locals, url, params }) => {
		const user = requireUser(locals, url);
		const group = await groupByJoin(locals.env, params.token);
		if (!group) error(404, GONE);
		await joinGroup(locals.env, user, group);
		redirect(303, `/groups/${group.id}`);
	})
};
