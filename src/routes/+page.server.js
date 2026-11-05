import { redirect } from '@sveltejs/kit';
import { requireUser, guarded, readForm } from '$lib/server/guard.js';
import { userLists, createList, keepUntil, today, daysUntil } from '$lib/server/lists.js';

export async function load({ locals, url }) {
	const user = requireUser(locals, url);
	const now = today(user);
	const lists = await userLists(locals.env, user);
	return { today: now, lists: lists.map((l) => ({ ...l, keepUntil: keepUntil(l), days: daysUntil(l.event_date, now) })) };
}

export const actions = {
	create: guarded(async ({ locals, url, request }) => {
		const user = requireUser(locals, url);
		const id = await createList(locals.env, user, await readForm(request));
		redirect(303, `/lists/${id}`);
	})
};
