import { error } from '@sveltejs/kit';
import { requireUser, guarded, readForm } from '$lib/server/guard.js';
import { allPeople, pendingInvites, createInvite, cancelInvite, removePerson } from '$lib/server/people.js';

function admin({ locals, url }) {
	const user = requireUser(locals, url);
	if (!user.is_admin) error(404, 'Nothing here.');
	return user;
}

export async function load(event) {
	admin(event);
	const env = event.locals.env;
	return { people: await allPeople(env), invites: await pendingInvites(env), origin: event.url.origin };
}

export const actions = {
	invite: guarded(async (event) => {
		admin(event);
		await createInvite(event.locals.env, (await readForm(event.request)).name);
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
