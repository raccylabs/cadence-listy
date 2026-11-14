import { error } from '@sveltejs/kit';
import { imageResponse } from '$lib/server/images.js';

/** Your own photo, for the account page. */
export async function GET({ locals }) {
	const key = locals.user?.avatar_key;
	if (!key) error(404, 'Not found');
	return (await imageResponse(locals.env, key)) ?? error(404, 'Not found');
}
