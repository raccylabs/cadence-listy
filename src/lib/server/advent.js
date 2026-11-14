// The family advent calendar. A door's contents only leave the server once its day has come
// in that person's own time zone, so nobody can peek by reading the page.
import { one, all, run } from './db.js';
import { randomToken } from './auth.js';
import { ValidationError } from './errors.js';
import { sniffImage, putImage, dropImages } from './images.js';
import { today } from './lists.js';
import { groupMembers, displayName } from './groups.js';
import { DOOR_KINDS, FILLERS, FINALE, REACTIONS } from '../advent.js';

const bad = (msg) => {
	throw new ValidationError(msg);
};
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const MAX_IMAGE = 3.5 * 1024 * 1024;
const GROUP_SPACE = 60 * 1024 * 1024;

// FAKE_TODAY is only ever set in local test runs (.dev.vars), to try December in November.
let fakeToday = '';
export const useFakeToday = (env) => {
	fakeToday = /^\d{4}-\d{2}-\d{2}$/.test(env?.FAKE_TODAY ?? '') ? env.FAKE_TODAY : '';
};
const dateFor = (user) => fakeToday || today(user);

/** The year the calendar is for: this one. */
export const calendarYear = (user) => Number(dateFor(user).slice(0, 4));

/** The last door this person can open: 0 before December, 25 once Christmas has come. */
export function unlockedDay(user, year) {
	const now = dateFor(user);
	if (now < `${year}-12-01`) return 0;
	if (now > `${year}-12-31`) return FINALE;
	return Math.min(FINALE, Number(now.slice(8, 10)));
}

const filler = (day) => {
	const [kind, message, answer] = FILLERS[day - 1];
	return { kind, title: '', message, answer, link: '', image: '', builtIn: true };
};

const doorRows = (env, group, year) => all(env, 'SELECT * FROM advent_doors WHERE group_id = ? AND year = ? ORDER BY day', group.id, year);

/** For each day, this person's own door, otherwise the everyone door, otherwise a built-in one. */
function pickDoors(rows, memberId) {
	const doors = [];
	for (let day = 1; day <= FINALE; day++) {
		doors.push(rows.find((r) => r.day === day && r.member_id === memberId) ?? rows.find((r) => r.day === day && r.member_id === null) ?? null);
	}
	return doors;
}

const imageUrl = (group, row) => (row?.image_key ? `/groups/${group.id}/advent/image/${row.id}?v=${row.image_v}` : '');

const content = (group, row, day) =>
	row ? { kind: row.kind, title: row.title, message: row.message, answer: row.answer, link: row.link, image: imageUrl(group, row), builtIn: false } : filler(day);

/**
 * One person's calendar. `preview` lets the group's maker see it as someone else on a given day;
 * nothing is recorded while previewing.
 */
export async function calendarFor(env, group, viewer, preview = null) {
	const year = calendarYear(viewer);
	const members = await groupMembers(env, group);
	const forUser = preview ? members.find((m) => m.id === preview.as) ?? viewer : viewer;
	const open = preview ? preview.day : unlockedDay(viewer, year);
	const rows = await doorRows(env, group, year);
	const picks = pickDoors(rows, forUser.id);
	const opens = await all(env, 'SELECT user_id, day, reaction, used_at FROM advent_opens WHERE group_id = ? AND year = ?', group.id, year);
	const mine = preview ? [] : opens.filter((o) => o.user_id === viewer.id);
	const people = new Map(members.map((m) => [m.id, m]));
	return {
		year,
		today: open,
		preview: !!preview,
		forName: displayName(forUser),
		doors: picks.map((row, i) => {
			const day = i + 1;
			if (day > open) return { day, locked: true };
			const me = mine.find((o) => o.day === day);
			return {
				day,
				locked: false,
				opened: !!me,
				reaction: me?.reaction ?? '',
				used: !!me?.used_at,
				...content(group, row, day),
				family: opens
					.filter((o) => o.day === day && people.has(o.user_id))
					.map((o) => {
						const p = people.get(o.user_id);
						return { id: p.id, name: displayName(p), avatar: p.avatar, photo: p.has_photo ? `/group/${group.share_token}/avatar/${p.id}?v=${p.avatar_v}` : '', reaction: o.reaction };
					})
			};
		})
	};
}

const checkDay = (user, year, day) => {
	const d = Number(day);
	if (!Number.isInteger(d) || d < 1 || d > FINALE) bad('There is no door like that.');
	if (d > unlockedDay(user, year)) bad("No peeking! That door isn't ready yet.");
	return d;
};

export async function openDoor(env, group, user, day) {
	const year = calendarYear(user);
	const d = checkDay(user, year, day);
	await run(env, 'INSERT OR IGNORE INTO advent_opens (group_id, user_id, year, day) VALUES (?, ?, ?, ?)', group.id, user.id, year, d);
}

export async function reactTo(env, group, user, day, reaction) {
	const year = calendarYear(user);
	const d = checkDay(user, year, day);
	const r = REACTIONS.some(([id]) => id === reaction) ? reaction : '';
	await run(env, 'INSERT OR IGNORE INTO advent_opens (group_id, user_id, year, day) VALUES (?, ?, ?, ?)', group.id, user.id, year, d);
	await run(env, 'UPDATE advent_opens SET reaction = ? WHERE group_id = ? AND user_id = ? AND year = ? AND day = ?', r, group.id, user.id, year, d);
}

export async function useCoupon(env, group, user, day, used) {
	const year = calendarYear(user);
	const d = checkDay(user, year, day);
	await run(env, 'INSERT OR IGNORE INTO advent_opens (group_id, user_id, year, day) VALUES (?, ?, ?, ?)', group.id, user.id, year, d);
	await run(
		env,
		`UPDATE advent_opens SET used_at = ${used ? "strftime('%Y-%m-%dT%H:%M:%SZ','now')" : 'NULL'} WHERE group_id = ? AND user_id = ? AND year = ? AND day = ?`,
		group.id, user.id, year, d
	);
}

/** Who may see a door's picture: the group's maker always, others only their own doors once open. */
export async function doorImageKey(env, group, user, doorId) {
	const row = await one(env, 'SELECT * FROM advent_doors WHERE id = ? AND group_id = ?', Number(doorId), group.id);
	if (!row?.image_key) return null;
	if (group.owner_id === user.id) return row.image_key;
	if (row.member_id !== null && row.member_id !== user.id) return null;
	if (row.year !== calendarYear(user) || row.day > unlockedDay(user, row.year)) return null;
	return row.image_key;
}

// ---- Setting it up (the group's maker) ----------------------------------------------------

const mustOwn = (group) => {
	if (!group.mine) bad('Only the person who made this group can set up the calendar.');
};

export async function setupData(env, group, owner) {
	mustOwn(group);
	const year = calendarYear(owner);
	const rows = await doorRows(env, group, year);
	const members = await groupMembers(env, group);
	const opens = await all(env, 'SELECT user_id, day, reaction FROM advent_opens WHERE group_id = ? AND year = ?', group.id, year);
	const lastYear = rows.length ? 0 : (await one(env, 'SELECT COUNT(*) AS n FROM advent_doors WHERE group_id = ? AND year = ?', group.id, year - 1)).n;
	return {
		year,
		today: unlockedDay(owner, year),
		lastYear,
		members: members.map((m) => ({ id: m.id, name: displayName(m), avatar: m.avatar, photo: m.has_photo ? `/group/${group.share_token}/avatar/${m.id}?v=${m.avatar_v}` : '' })),
		doors: rows.map((r) => ({
			id: r.id, member: r.member_id ?? 0, day: r.day, kind: r.kind, title: r.title, message: r.message, answer: r.answer, link: r.link, image: imageUrl(group, r)
		})),
		opens: opens.map((o) => ({ user: o.user_id, day: o.day, reaction: o.reaction }))
	};
}

const groupSpace = async (env, group) => (await one(env, 'SELECT COALESCE(SUM(image_size), 0) AS n FROM advent_doors WHERE group_id = ?', group.id)).n;

async function memberSlot(env, group, raw) {
	const id = Number(raw) || 0;
	if (!id) return null;
	if (!(await one(env, 'SELECT 1 FROM family_members WHERE group_id = ? AND user_id = ?', group.id, id))) bad('That person is not in this group.');
	return id;
}

const findDoor = (env, group, member, year, day) =>
	one(env, 'SELECT * FROM advent_doors WHERE group_id = ? AND IFNULL(member_id, 0) = ? AND year = ? AND day = ?', group.id, member ?? 0, year, day);

export async function saveDoor(env, group, owner, f) {
	mustOwn(group);
	const year = calendarYear(owner);
	const member = await memberSlot(env, group, f.get('member'));
	const day = Number(f.get('day'));
	if (!Number.isInteger(day) || day < 1 || day > FINALE) bad('Pick a day.');
	const kind = DOOR_KINDS.some(([k]) => k === f.get('kind')) ? String(f.get('kind')) : 'note';
	const door = {
		title: str(f.get('title'), 80),
		message: str(f.get('message'), 1000),
		answer: kind === 'riddle' ? str(f.get('answer'), 200) : '',
		link: str(f.get('link'), 500)
	};
	if (door.link && !/^https?:\/\//i.test(door.link)) door.link = `https://${door.link}`;
	if (door.link) {
		try {
			new URL(door.link);
		} catch {
			bad("That link doesn't look right.");
		}
	}

	let image = null;
	const file = f.get('image');
	if (file instanceof File && file.size > 0) {
		if (file.size > MAX_IMAGE) bad('That picture is over 3.5 MB. Try a smaller one.');
		const bytes = new Uint8Array(await file.arrayBuffer());
		const type = sniffImage(bytes);
		if (!type) bad('Use a PNG, JPEG, WebP or GIF picture.');
		if ((await groupSpace(env, group)) + bytes.length > GROUP_SPACE) bad('The calendar has used all 60 MB of its picture space. Remove some pictures first.');
		image = { key: `advent/${group.id}/${randomToken(16)}`, size: bytes.length };
		await putImage(env, image.key, bytes, type);
	}
	if (!door.title && !door.message && !door.link && !image && !(await findDoor(env, group, member, year, day))?.image_key) bad('Add a picture, a message or a link.');

	const old = await findDoor(env, group, member, year, day);
	if (old) {
		const dropOld = image || f.get('remove_image') === 'on';
		await run(
			env,
			`UPDATE advent_doors SET kind = ?, title = ?, message = ?, answer = ?, link = ?
				${dropOld ? ', image_key = ?, image_size = ?, image_v = image_v + 1' : ''} WHERE id = ?`,
			...[kind, door.title, door.message, door.answer, door.link, ...(dropOld ? [image?.key ?? null, image?.size ?? 0] : []), old.id]
		);
		if (dropOld) await dropImages(env, [old.image_key]);
	} else {
		await run(
			env,
			'INSERT INTO advent_doors (group_id, member_id, year, day, kind, title, message, answer, link, image_key, image_size, image_v) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			group.id, member, year, day, kind, door.title, door.message, door.answer, door.link, image?.key ?? null, image?.size ?? 0, image ? 1 : 0
		);
	}
}

export async function clearDoor(env, group, owner, f) {
	mustOwn(group);
	const old = await findDoor(env, group, await memberSlot(env, group, f.get('member')), calendarYear(owner), Number(f.get('day')));
	if (!old) return;
	await run(env, 'DELETE FROM advent_doors WHERE id = ?', old.id);
	await dropImages(env, [old.image_key]);
}

/** Start this year's calendar from last year's doors, pictures included. */
export async function copyLastYear(env, group, owner) {
	mustOwn(group);
	const year = calendarYear(owner);
	if ((await one(env, 'SELECT COUNT(*) AS n FROM advent_doors WHERE group_id = ? AND year = ?', group.id, year)).n) bad('This year already has doors.');
	const rows = await all(
		env,
		'SELECT d.* FROM advent_doors d WHERE d.group_id = ? AND d.year = ? AND (d.member_id IS NULL OR d.member_id IN (SELECT user_id FROM family_members WHERE group_id = ?))',
		group.id, year - 1, group.id
	);
	for (const r of rows) {
		let key = null;
		if (r.image_key) {
			const obj = await env.IMAGES.get(r.image_key);
			if (obj) {
				key = `advent/${group.id}/${randomToken(16)}`;
				await putImage(env, key, new Uint8Array(await obj.arrayBuffer()), obj.httpMetadata?.contentType ?? 'image/jpeg');
			}
		}
		await run(
			env,
			'INSERT INTO advent_doors (group_id, member_id, year, day, kind, title, message, answer, link, image_key, image_size, image_v) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			group.id, r.member_id, year, r.day, r.kind, r.title, r.message, r.answer, r.link, key, key ? r.image_size : 0, key ? 1 : 0
		);
	}
	return rows.length;
}

// ---- Clean-up ------------------------------------------------------------------------------

/** Pictures to delete along with a group, or with one person's doors in it. */
export async function dropAdventImages(env, groupId, memberId = null) {
	const rows = memberId
		? await all(env, 'SELECT image_key FROM advent_doors WHERE group_id = ? AND member_id = ? AND image_key IS NOT NULL', groupId, memberId)
		: await all(env, 'SELECT image_key FROM advent_doors WHERE group_id = ? AND image_key IS NOT NULL', groupId);
	await dropImages(env, rows.map((r) => r.image_key));
	if (memberId) await run(env, 'DELETE FROM advent_doors WHERE group_id = ? AND member_id = ?', groupId, memberId);
}
