import { error } from '@sveltejs/kit';
import { memberGroup } from '$lib/server/groups.js';
import { doorImageKey } from '$lib/server/advent.js';
import { imageResponse } from '$lib/server/images.js';

/** A door's picture, only for group members whose door it is and whose day has come. */
export async function GET({ locals, params }) {
	if (!locals.user) error(404, 'Not found');
	const group = await memberGroup(locals.env, locals.user, params.id);
	const key = group && (await doorImageKey(locals.env, group, locals.user, params.door));
	if (!key) error(404, 'Not found');
	return (await imageResponse(locals.env, key)) ?? error(404, 'Not found');
}
