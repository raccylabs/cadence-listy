import { error } from '@sveltejs/kit';
import { requireUser, guarded, readForm } from '$lib/server/guard.js';
import { myGroups } from '$lib/server/groups.js';
import { allPeople, allLists, pendingInvites, createInvite, cancelInvite, removePerson } from '$lib/server/people.js';

function admin({ locals, url }) {
	const user = requireUser(locals, url);
	if (!user.is_admin) error(404, 'Nothing here.');
	return user;
}

export async function load(event) {
	const me = admin(event);
	const env = event.locals.env;
	return { people: await allPeople(env), lists: await allLists(env), invites: await pendingInvites(env), groups: await myGroups(env, me), origin: event.url.origin };
}

export const actions = {
	invite: guarded(async (event) => {
		const me = admin(event);
		const f = await readForm(event.request);
		await createInvite(event.locals.env, me, f.name, f.group);
		return { invited: true };
	}),
	cancel: guarded(async (event) => {
		admin(event);
		await cancelInvite(event.locals.env, (await readForm(event.request)).token);
	}),
	remove: guarded(async (event) => {
		admin(event);
		await removePerson(event.locals.env, (await readForm(event.request)).id);
	})
};
