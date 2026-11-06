import { error, json } from '@sveltejs/kit';
import { ownedList, reorderItems } from '$lib/server/lists.js';

/** Save the order of a list's items. Owner only. */
export async function POST({ locals, params, request }) {
	const list = locals.user && (await ownedList(locals.env, locals.user, params.id));
	if (!list) error(404, 'Not found');
	const { ids } = await request.json().catch(() => ({}));
	if (!Array.isArray(ids)) error(400, 'Send a list of item ids.');
	await reorderItems(locals.env, list, ids);
	return json({ saved: true });
}
