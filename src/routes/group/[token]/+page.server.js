import { error, fail } from '@sveltejs/kit';
import { readForm } from '$lib/server/guard.js';
import { rateLimited, clearRateLimit } from '$lib/server/auth.js';
import { sharedGroup, isMember, groupPinPassed, checkGroupPin, rememberGroupPin, publicGroup } from '$lib/server/groups.js';

const GONE = "This page isn't here. Ask the person who sent you the link.";

async function reach({ params, locals }) {
	const group = await sharedGroup(locals.env, params.token);
	if (!group) error(404, GONE);
	const member = !!locals.user && (await isMember(locals.env, group, locals.user.id));
	return { group, member };
}

export async function load(event) {
	const { group, member } = await reach(event);
	if (!(await groupPinPassed(group, member, event.cookies))) return { locked: true, edition: group.edition, name: group.name };
	return { locked: false, member, manageId: member ? group.id : null, group: await publicGroup(event.locals.env, group) };
}

export const actions = {
	unlock: async (event) => {
		const { group } = await reach(event);
		const { locals, request, cookies, url } = event;
		const key = `group-pin:${group.id}`;
		if (await rateLimited(locals.env, key)) return fail(429, { pinError: 'Too many tries. Wait 15 minutes, then try again.' });
		if (!(await checkGroupPin(group, String((await readForm(request)).pin ?? '')))) return fail(400, { pinError: "That PIN isn't right." });
		await clearRateLimit(locals.env, key);
		await rememberGroupPin(group, cookies, url);
		return { unlocked: true };
	}
};
