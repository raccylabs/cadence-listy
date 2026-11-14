import { error } from '@sveltejs/kit';
import { getUserById } from '$lib/server/auth.js';
import { sharedGroup, isMember, groupPinPassed } from '$lib/server/groups.js';
import { imageResponse } from '$lib/server/images.js';

/** A member's photo, under the same rules as the group page: its link and PIN. */
export async function GET({ params, locals, cookies }) {
	const group = await sharedGroup(locals.env, params.token);
	if (!group) error(404, 'Not found');
	const viewerIn = !!locals.user && (await isMember(locals.env, group, locals.user.id));
	if (!(await groupPinPassed(group, viewerIn, cookies)) || !(await isMember(locals.env, group, params.uid))) error(404, 'Not found');
	const person = await getUserById(locals.env, Number(params.uid));
	if (!person?.avatar_key) error(404, 'Not found');
	return (await imageResponse(locals.env, person.avatar_key)) ?? error(404, 'Not found');
}
