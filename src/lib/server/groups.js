// Families and groups: a page that gathers everyone's shared lists behind one link.
// Members join with the group's join link while signed in. Visitors only reach a group
// through `sharedGroup` and `publicGroup`, which hand out lists that are open right now.
import { one, all, run } from './db.js';
import { randomToken, sha256, sameText } from './auth.js';
import { ValidationError } from './errors.js';
import { hashPin, today, daysUntil } from './lists.js';
import { EDITIONS, sceneFor } from '../editions/index.js';
import { dropAdventImages } from './advent.js';

const bad = (msg) => {
	throw new ValidationError(msg);
};
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const MAX_OWNED = 20;
const MAX_MEMBERS = 30;

export const displayName = (u) => u.display_name || u.username;

/** Groups this person belongs to, with how many people are in each. */
export const myGroups = (env, user) =>
	all(
		env,
		`SELECT g.id, g.name, g.edition, g.owner_id = ?1 AS mine,
			(SELECT COUNT(*) FROM family_members m WHERE m.group_id = g.id) AS members
		 FROM family_groups g JOIN family_members me ON me.group_id = g.id AND me.user_id = ?1
		 ORDER BY g.name COLLATE NOCASE, g.id`,
		user.id
	);

export async function createGroup(env, user, input) {
	const name = str(input.name, 60);
	if (!name) bad('Name your group, like "The Smith family".');
	if ((await one(env, 'SELECT COUNT(*) AS n FROM family_groups WHERE owner_id = ?', user.id)).n >= MAX_OWNED) bad('You have made as many groups as you can.');
	const edition = EDITIONS[input.edition] ? input.edition : 'christmas';
	const made = await run(
		env,
		'INSERT INTO family_groups (owner_id, name, edition, share_token, join_token) VALUES (?, ?, ?, ?, ?)',
		user.id, name, edition, randomToken(18), randomToken(18)
	);
	const id = made.meta.last_row_id;
	await run(env, 'INSERT INTO family_members (group_id, user_id) VALUES (?, ?)', id, user.id);
	return id;
}

/** A group this person is in, with `mine` true when they made it. */
export async function memberGroup(env, user, id) {
	const g = await one(
		env,
		`SELECT g.* FROM family_groups g JOIN family_members m ON m.group_id = g.id AND m.user_id = ? WHERE g.id = ?`,
		user.id, Number(id)
	);
	return g ? { ...g, mine: g.owner_id === user.id } : null;
}

const mustOwn = (group) => {
	if (!group.mine) bad('Only the person who made this group can change that.');
};

export async function updateGroup(env, group, input) {
	mustOwn(group);
	const name = str(input.name, 60);
	if (!name) bad('Name your group.');
	const edition = EDITIONS[input.edition] ? input.edition : group.edition;
	await run(env, 'UPDATE family_groups SET name = ?, edition = ?, scene = ? WHERE id = ?', name, edition, sceneFor(edition, str(input.scene, 20)), group.id);
}

export async function newGroupLink(env, group) {
	mustOwn(group);
	await run(env, 'UPDATE family_groups SET share_token = ? WHERE id = ?', randomToken(18), group.id);
}
export async function newJoinLink(env, group) {
	mustOwn(group);
	await run(env, 'UPDATE family_groups SET join_token = ? WHERE id = ?', randomToken(18), group.id);
}
export async function setGroupPin(env, group, pin) {
	mustOwn(group);
	if (!/^\d{4,8}$/.test(pin)) bad('Use 4 to 8 digits for the PIN.');
	await run(env, 'UPDATE family_groups SET pin_hash = ? WHERE id = ?', await hashPin(pin, randomToken(12)), group.id);
}
export async function removeGroupPin(env, group) {
	mustOwn(group);
	await run(env, 'UPDATE family_groups SET pin_hash = NULL WHERE id = ?', group.id);
}
export async function deleteGroup(env, group) {
	mustOwn(group);
	await dropAdventImages(env, group.id);
	await run(env, 'DELETE FROM family_groups WHERE id = ?', group.id);
}

export const groupMembers = (env, group) =>
	all(
		env,
		`SELECT u.id, u.username, u.display_name, u.avatar, u.avatar_key IS NOT NULL AS has_photo, u.avatar_v
		 FROM family_members m JOIN users u ON u.id = m.user_id
		 WHERE m.group_id = ? ORDER BY u.id = ? DESC, m.joined_at, u.id`,
		group.id, group.owner_id
	);

export async function removeMember(env, group, userId) {
	mustOwn(group);
	if (Number(userId) === group.owner_id) bad("You can't remove yourself from your own group. Delete the group instead.");
	await dropAdventImages(env, group.id, Number(userId));
	await run(env, 'DELETE FROM family_members WHERE group_id = ? AND user_id = ?', group.id, Number(userId));
}

export async function leaveGroup(env, user, group) {
	if (group.mine) bad("You made this group, so you can't leave it. Delete it instead.");
	await dropAdventImages(env, group.id, user.id);
	await run(env, 'DELETE FROM family_members WHERE group_id = ? AND user_id = ?', group.id, user.id);
}

// ---- Joining ---------------------------------------------------------------------

export const groupByJoin = (env, token) => (token ? one(env, 'SELECT id, name, owner_id FROM family_groups WHERE join_token = ?', String(token)) : null);

export async function joinGroup(env, user, group) {
	if (await one(env, 'SELECT 1 FROM family_members WHERE group_id = ? AND user_id = ?', group.id, user.id)) return;
	if ((await one(env, 'SELECT COUNT(*) AS n FROM family_members WHERE group_id = ?', group.id)).n >= MAX_MEMBERS) bad('This group is full.');
	await run(env, 'INSERT INTO family_members (group_id, user_id) VALUES (?, ?)', group.id, user.id);
}

// ---- Visitors ----------------------------------------------------------------------

export const sharedGroup = (env, token) => one(env, 'SELECT * FROM family_groups WHERE share_token = ?', String(token));

export const isMember = async (env, group, userId) => !!(await one(env, 'SELECT 1 FROM family_members WHERE group_id = ? AND user_id = ?', group.id, Number(userId)));

const pinCookie = (group) => `listy_gpin_${group.id}`;
const pinProof = (group) => sha256(`group:${group.pin_hash}:${group.share_token}`);

/** Members never need the PIN; everyone else needs the cookie from typing it. */
export const groupPinPassed = async (group, member, cookies) => {
	if (!group.pin_hash || member) return true;
	return sameText(cookies.get(pinCookie(group)) ?? '', await pinProof(group));
};
export const checkGroupPin = async (group, pin) => !!group.pin_hash && sameText(await hashPin(pin, group.pin_hash.split('$')[0]), group.pin_hash);

export async function rememberGroupPin(group, cookies, url) {
	cookies.set(pinCookie(group), await pinProof(group), {
		path: `/group/${group.share_token}`,
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 30
	});
}

/** Exactly what a visitor sees: names, pictures and the lists that are open right now. */
export async function publicGroup(env, group) {
	const members = await groupMembers(env, group);
	const lists = await all(
		env,
		`SELECT l.user_id, l.title, l.edition, l.event_date, l.share_token, l.pin_hash IS NOT NULL AS has_pin, u.timezone,
			(SELECT COUNT(*) FROM list_items i WHERE i.list_id = l.id) AS items
		 FROM lists l JOIN family_members m ON m.user_id = l.user_id AND m.group_id = ?
		 JOIN users u ON u.id = l.user_id
		 WHERE l.share_on = 1 ORDER BY l.event_date, l.id`,
		group.id
	);
	const open = lists.filter((l) => today(l) <= l.event_date);
	return {
		name: group.name,
		edition: EDITIONS[group.edition] ? group.edition : 'christmas',
		scene: sceneFor(group.edition, group.scene),
		members: members.map((m) => ({
			id: m.id,
			name: displayName(m),
			avatar: m.avatar,
			photo: m.has_photo ? m.avatar_v : 0,
			lists: open
				.filter((l) => l.user_id === m.id)
				.map((l) => ({ title: l.title, edition: l.edition, days: daysUntil(l.event_date, today(l)), items: l.items, locked: !!l.has_pin, link: `/share/${l.share_token}` }))
		}))
	};
}
