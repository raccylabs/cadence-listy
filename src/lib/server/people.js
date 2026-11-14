// Who can join, and who has. Only the site's admin reaches these, except the two invite checks.
import { one, all, run } from './db.js';
import { randomToken, getUserById } from './auth.js';
import { ValidationError } from './errors.js';
import { deleteUser, today, keepUntil } from './lists.js';

export const openInvite = (env, token) => (token ? one(env, 'SELECT token, group_id FROM invites WHERE token = ? AND used_at IS NULL', token) : null);

export const useInvite = (env, invite, userId) =>
	run(env, "UPDATE invites SET used_by = ?, used_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE token = ?", userId, invite.token);

/** A one-use sign-up link. With a group, the new person joins it when they sign up. */
export async function createInvite(env, admin, name, groupId) {
	const label = String(name ?? '').trim().slice(0, 60);
	if (!label) throw new ValidationError('Enter who this invite is for.');
	const group = Number(groupId) ? await one(env, 'SELECT group_id FROM family_members WHERE group_id = ? AND user_id = ?', Number(groupId), admin.id) : null;
	await run(env, 'INSERT INTO invites (token, name, group_id) VALUES (?, ?, ?)', randomToken(18), label, group?.group_id ?? null);
}

export const cancelInvite = (env, token) => run(env, 'DELETE FROM invites WHERE token = ? AND used_at IS NULL', String(token));
export const pendingInvites = (env) =>
	all(
		env,
		`SELECT i.token, i.name, i.created_at, g.name AS group_name FROM invites i LEFT JOIN family_groups g ON g.id = i.group_id
		 WHERE i.used_at IS NULL ORDER BY i.created_at DESC`
	);

export const allPeople = (env) =>
	all(
		env,
		`SELECT u.id, u.username, u.is_admin, u.created_at,
			(SELECT name FROM invites i WHERE i.used_by = u.id) AS invited_as,
			(SELECT COUNT(*) FROM lists l WHERE l.user_id = u.id) AS lists,
			(SELECT COALESCE(SUM(i.photo_size), 0) FROM list_items i JOIN lists l ON l.id = i.list_id WHERE l.user_id = u.id) AS image_bytes
		 FROM users u ORDER BY u.id`
	);

/**
 * Everyone's lists, as a visitor would find them. The share link is only handed out while the
 * list is open, so the owner's sharing and closing choices still apply. Notes stay private.
 */
export async function allLists(env) {
	const rows = await all(
		env,
		`SELECT l.id, l.user_id, l.title, l.edition, l.event_date, l.share_on, l.share_token, l.pin_hash IS NOT NULL AS has_pin,
			u.timezone, (SELECT COUNT(*) FROM list_items i WHERE i.list_id = l.id) AS items
		 FROM lists l JOIN users u ON u.id = l.user_id ORDER BY l.event_date, l.id`
	);
	return rows.map((l) => {
		const open = !!l.share_on && today(l) <= l.event_date;
		return {
			id: l.id,
			user_id: l.user_id,
			title: l.title,
			edition: l.edition,
			event_date: l.event_date,
			items: l.items,
			hasPin: !!l.has_pin,
			status: open ? 'open' : l.share_on ? 'closed' : 'private',
			deletes: keepUntil(l),
			link: open ? `/share/${l.share_token}` : null
		};
	});
}

/** Remove someone along with their lists and photos. The admin can't be removed. */
export async function removePerson(env, id) {
	const person = await getUserById(env, Number(id));
	if (!person) return;
	if (person.is_admin) throw new ValidationError("You can't remove the site's admin.");
	await deleteUser(env, person);
}
