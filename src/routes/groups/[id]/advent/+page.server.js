import { error } from '@sveltejs/kit';
import { requireUser, guarded } from '$lib/server/guard.js';
import { memberGroup } from '$lib/server/groups.js';
import { calendarFor, openDoor, reactTo, useCoupon } from '$lib/server/advent.js';
import { FINALE } from '$lib/advent.js';

async function mine({ locals, url, params }) {
	const user = requireUser(locals, url);
	const group = await memberGroup(locals.env, user, params.id);
	if (!group) error(404, 'No group here.');
	return { user, group, env: locals.env };
}

export async function load(event) {
	const { user, group, env } = await mine(event);
	const q = event.url.searchParams;
	// The group's maker can look at anyone's calendar on any day before it goes live.
	const preview = group.mine && q.has('as') ? { as: Number(q.get('as')), day: Math.min(FINALE, Math.max(1, Number(q.get('day')) || 1)) } : null;
	return {
		group: { id: group.id, name: group.name, mine: group.mine },
		calendar: await calendarFor(env, group, user, preview),
		previewAs: preview?.as ?? null
	};
}

const act = (fn) =>
	guarded(async (event) => {
		const ctx = await mine(event);
		await fn(ctx, await event.request.formData());
		return { ok: true };
	});

export const actions = {
	open: act(({ env, group, user }, f) => openDoor(env, group, user, f.get('day'))),
	react: act(({ env, group, user }, f) => reactTo(env, group, user, f.get('day'), String(f.get('reaction') ?? ''))),
	coupon: act(({ env, group, user }, f) => useCoupon(env, group, user, f.get('day'), f.get('used') === 'on'))
};
