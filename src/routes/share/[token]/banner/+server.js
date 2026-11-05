import { error } from '@sveltejs/kit';
import { sharedList, pinPassed } from '$lib/server/lists.js';
import { imageResponse } from '$lib/server/images.js';

/** A list's banner image, under the same rules as the list: link, PIN and closing date. */
export async function GET({ params, locals, cookies }) {
	const found = await sharedList(locals.env, params.token, locals.user);
	if (!found?.open || !(await pinPassed(found.list, found.isOwner, cookies))) error(404, 'Not found');
	if (!found.list.banner_key) error(404, 'Not found');
	return (await imageResponse(locals.env, found.list.banner_key)) ?? error(404, 'Not found');
}
