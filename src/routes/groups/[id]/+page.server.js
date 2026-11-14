import { error, redirect } from '@sveltejs/kit';
import { requireUser, guarded, readForm } from '$lib/server/guard.js';
import {
	memberGroup, groupMembers, displayName, updateGroup, newGroupLink, newJoinLink, setGroupPin, removeGroupPin,
	removeMember, leaveGroup, deleteGroup
} from '$lib/server/groups.js';

async function mine({ locals, url, params }) {
	const user = requireUser(locals, url);
	const group = await memberGroup(locals.env, user, params.id);
	if (!group) error(404, 'No group here.');
	return { user, group, env: locals.env };
}

export async function load(event) {
	const { group, env } = await mine(event);
	const origin = event.url.origin;
	return {
		group: {
			id: group.id,
			name: group.name,
			edition: group.edition,
			scene: group.scene,
			mine: group.mine,
			hasPin: !!group.pin_hash,
			shareUrl: `${origin}/group/${group.share_token}`,
			joinUrl: group.mine ? `${origin}/groups/join/${group.join_token}` : null
		},
		members: (await groupMembers(env, group)).map((m) => ({ id: m.id, name: displayName(m), username: m.username, avatar: m.avatar, owner: m.id === group.owner_id,
			photo: m.has_photo ? `/group/${group.share_token}/avatar/${m.id}?v=${m.avatar_v}` : '' }))
	};
}

const act = (fn) =>
	guarded(async (event) => {
		const ctx = await mine(event);
		return (await fn(ctx, await readForm(event.request))) ?? { saved: true };
	});

export const actions = {
	save: act(({ env, group }, f) => updateGroup(env, group, f)),
	newLink: act(({ env, group }) => newGroupLink(env, group)),
	newJoin: act(({ env, group }) => newJoinLink(env, group)),
	setPin: act(({ env, group }, f) => setGroupPin(env, group, String(f.pin ?? ''))),
	removePin: act(({ env, group }) => removeGroupPin(env, group)),
	remove: act(({ env, group }, f) => removeMember(env, group, f.id)),
	leave: act(async ({ env, user, group }) => {
		await leaveGroup(env, user, group);
		redirect(303, '/groups');
	}),
	delete: act(async ({ env, group }) => {
		await deleteGroup(env, group);
		redirect(303, '/groups');
	})
};
