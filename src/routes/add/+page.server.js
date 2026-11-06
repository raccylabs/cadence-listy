import { userLists, today } from '$lib/server/lists.js';

/** Where the Add to Listy button lands. It stays public so the details can survive a sign-in. */
export async function load({ locals }) {
	if (!locals.user) return { signedIn: false, lists: [] };
	const now = today(locals.user);
	const lists = (await userLists(locals.env, locals.user)).filter((l) => l.event_date >= now);
	return { signedIn: true, lists: lists.map(({ id, title, edition }) => ({ id, title, edition })) };
}
