import { error } from '@sveltejs/kit';
import { one } from '$lib/server/db.js';
import { sharedList, pinPassed } from '$lib/server/lists.js';
import { imageResponse } from '$lib/server/images.js';

/** A list item's photo, under the same rules as the list: link, PIN and closing date. */
export async function GET({ params, locals, cookies }) {
	const found = await sharedList(locals.env, params.token, locals.user);
	if (!found?.open || !(await pinPassed(found.list, found.isOwner, cookies))) error(404, 'Not found');
	const item = await one(locals.env, 'SELECT photo_key FROM list_items WHERE id = ? AND list_id = ?', Number(params.item), found.list.id);
	if (!item?.photo_key) error(404, 'Not found');
	return (await imageResponse(locals.env, item.photo_key)) ?? error(404, 'Not found');
}
