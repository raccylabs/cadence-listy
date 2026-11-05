import { error, fail } from '@sveltejs/kit';
import { guarded, readForm } from '$lib/server/guard.js';
import { rateLimited, clearRateLimit } from '$lib/server/auth.js';
import { sharedList, pinPassed, rememberPin, publicList, addNote, checkPin } from '$lib/server/lists.js';

const CLOSED = "This list isn't open right now. Ask the person who sent you the link.";

/** Same answer for a wrong link, a closed list and an expired one. */
async function reach({ params, locals }) {
	const found = await sharedList(locals.env, params.token, locals.user);
	if (!found?.open) error(404, CLOSED);
	return found;
}

export async function load(event) {
	const { list, isOwner, now } = await reach(event);
	if (!(await pinPassed(list, isOwner, event.cookies))) return { locked: true, edition: list.edition };
	return { locked: false, isOwner, ownerListId: isOwner ? list.id : null, list: await publicList(event.locals.env, list, now) };
}

export const actions = {
	unlock: async (event) => {
		const { list } = await reach(event);
		const { locals, request, cookies, url } = event;
		const f = await readForm(request);
		const key = `list-pin:${list.id}`;
		if (await rateLimited(locals.env, key)) return fail(429, { pinError: 'Too many tries. Wait 15 minutes, then try again.' });
		if (!(await checkPin(list, String(f.pin ?? '')))) return fail(400, { pinError: "That PIN isn't right." });
		await clearRateLimit(locals.env, key);
		await rememberPin(list, cookies, url);
		return { unlocked: true };
	},
	note: guarded(async (event) => {
		const { list, isOwner } = await reach(event);
		const { locals, request, cookies, getClientAddress } = event;
		if (!(await pinPassed(list, isOwner, cookies))) error(403, 'Enter the PIN first.');
		const f = await readForm(request);
		const where = f.item_id ? `item-${f.item_id}` : 'list';
		// Bots fill in every field; people never see this one.
		if (f.website) return { noted: where };
		if (await rateLimited(locals.env, `list-note:${list.id}:${getClientAddress()}`)) return fail(429, { error: 'Too many notes for now. Try again in a few minutes.' });
		await addNote(locals.env, list, f);
		return { noted: where };
	})
};
