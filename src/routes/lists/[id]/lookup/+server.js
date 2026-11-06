import { error, json } from '@sveltejs/kit';
import { rateLimited } from '$lib/server/auth.js';
import { ownedList } from '$lib/server/lists.js';
import { lookupProduct } from '$lib/server/lookup.js';

/** Fetch a product's details for the item form. Owner only, and rate limited. */
export async function POST({ locals, params, request }) {
	const user = locals.user;
	if (!user || !(await ownedList(locals.env, user, params.id))) error(404, 'Not found');
	if (await rateLimited(locals.env, `lookup:${user.id}`, 40)) return json({ error: 'Too many lookups for now. Try again in a few minutes.' }, { status: 429 });
	const { url } = await request.json().catch(() => ({}));
	const found = await lookupProduct(locals.env, /^https?:/i.test(String(url)) ? String(url) : `https://${url}`);
	return json({ found });
}
