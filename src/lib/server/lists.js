// Themed wish lists shared by a secret link. Everything a visitor can reach goes through
// `sharedList` and `publicList`. Uses relative imports so the daily cleanup can load it too.
import { one, all, run } from './db.js';
import { getUserById, sha256, sameText, randomToken, oldSignIns } from './auth.js';
import { ValidationError } from './errors.js';
import { sniffImage, putImage, dropImages } from './images.js';
import { downloadImage } from './lookup.js';
import { EDITIONS } from '../editions/index.js';

const bad = (msg) => {
	throw new ValidationError(msg);
};
const str = (v, max) => String(v ?? '').trim().slice(0, max);
const newToken = () => randomToken(18);
const isDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)) && new Date(`${d}T00:00:00Z`).toISOString().startsWith(d);

export const MAX_PHOTO = 3.5 * 1024 * 1024;
const USER_SPACE = 100 * 1024 * 1024;
const KEEP_DAYS = 7;
const MAX_ITEMS = 200;
const MAX_NOTES = 300;

/** Today's date where this person is. */
export const today = (user) => new Intl.DateTimeFormat('en-CA', { timeZone: user.timezone || 'UTC' }).format(new Date());

const dayNumber = (d) => Date.parse(`${d}T00:00:00Z`) / 86400000;
export const daysUntil = (date, from) => dayNumber(date) - dayNumber(from);

const addDays = (date, n) => new Date(Date.parse(`${date}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
/** The last day a list exists: lists and their images are deleted a week after the big day. */
export const keepUntil = (list) => addDays(list.event_date, KEEP_DAYS);

/** The next time a fixed yearly day comes around, counting today. */
function nextDate({ month, day }, from) {
	const year = Number(from.slice(0, 4));
	const stamp = (y) => `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
	return stamp(year) >= from ? stamp(year) : stamp(year + 1);
}

/** Which decorations and widgets are on, starting from the edition's defaults. */
export function readOptions(list) {
	const ed = EDITIONS[list.edition];
	let saved = {};
	try {
		saved = JSON.parse(list.options);
	} catch {
		// Fall back to the defaults.
	}
	const pick = (o) => [o.id, typeof saved[o.id] === 'boolean' ? saved[o.id] : o.on];
	return {
		...Object.fromEntries([...ed.decor, ...ed.widgets].map(pick)),
		lightsMode: ['twinkle', 'chase', 'steady'].includes(saved.lightsMode) ? saved.lightsMode : 'twinkle'
	};
}

// ---- Owner -------------------------------------------------------------------

export const userLists = (env, user) =>
	all(
		env,
		`SELECT l.id, l.edition, l.title, l.event_date, l.share_on,
			(SELECT COUNT(*) FROM list_items i WHERE i.list_id = l.id) AS items,
			(SELECT COUNT(*) FROM list_notes n WHERE n.list_id = l.id) AS notes
		 FROM lists l WHERE l.user_id = ? ORDER BY l.event_date, l.id`,
		user.id
	);

export const ownedList = (env, user, id) => one(env, 'SELECT * FROM lists WHERE id = ? AND user_id = ?', Number(id), user.id);

const validDate = (v) => {
	const d = str(v, 10);
	if (!isDate(d)) bad('Pick a date.');
	return d;
};

export async function createList(env, user, input) {
	const ed = EDITIONS[input.edition];
	if (!ed) bad('Pick a list type.');
	const event_date = ed.date ? nextDate(ed.date, today(user)) : validDate(input.event_date);
	const made = await run(
		env,
		'INSERT INTO lists (user_id, edition, title, event_date, share_token) VALUES (?, ?, ?, ?, ?)',
		user.id, ed.id, `${user.username}'s ${ed.listName}`.slice(0, 80), event_date, newToken()
	);
	return made.meta.last_row_id;
}

export async function updateList(env, user, list, input) {
	const title = str(input.title, 80);
	if (!title) bad('Give your list a title.');
	const ed = EDITIONS[list.edition];
	const event_date = validDate(input.event_date);
	// A past date would close the list and could delete it, so it can't be typed in by accident.
	if (event_date !== list.event_date && event_date < today(user)) bad('Pick today or a later date.');
	const options = Object.fromEntries([...ed.decor, ...ed.widgets].map((o) => [o.id, input[o.id] === 'on']));
	options.lightsMode = str(input.lightsMode, 10) || 'twinkle';
	await run(
		env,
		'UPDATE lists SET title = ?, message = ?, event_date = ?, options = ?, share_on = ? WHERE id = ?',
		title, str(input.message, 500), event_date, JSON.stringify(options), input.share_on === 'on' ? 1 : 0, list.id
	);
}

const listImages = async (env, list) => [
	list.banner_key,
	...(await all(env, 'SELECT photo_key FROM list_items WHERE list_id = ? AND photo_key IS NOT NULL', list.id)).map((i) => i.photo_key)
];

export async function deleteList(env, list) {
	const keys = await listImages(env, list);
	await run(env, 'DELETE FROM lists WHERE id = ?', list.id);
	await dropImages(env, keys);
}

export async function deleteUser(env, user) {
	for (const list of await all(env, 'SELECT id, banner_key FROM lists WHERE user_id = ?', user.id)) await deleteList(env, list);
	await run(env, 'DELETE FROM users WHERE id = ?', user.id);
}

/** Delete every list whose week after the big day is over, in its owner's time zone. */
export async function purgeOldLists(env) {
	// Time zones are at most a day apart, so a day's slack finds every candidate in one query.
	const lists = await all(
		env,
		`SELECT l.id, l.event_date, l.banner_key, u.timezone FROM lists l JOIN users u ON u.id = l.user_id WHERE l.event_date < ?`,
		addDays(new Date().toISOString().slice(0, 10), 1 - KEEP_DAYS)
	);
	for (const list of lists) if (today(list) > keepUntil(list)) await deleteList(env, list);
}

export async function dailyCleanup(env) {
	await purgeOldLists(env);
	await oldSignIns(env);
}

export const newLink = (env, list) => run(env, 'UPDATE lists SET share_token = ? WHERE id = ?', newToken(), list.id);

// A short PIN can't be made slow enough to matter here. It's protected by the secret link and
// the attempt limit; the salt just keeps equal PINs from looking equal.
const hashPin = async (pin, salt) => `${salt}$${await sha256(`${salt}:${pin}`)}`;

export async function setPin(env, list, pin) {
	if (!/^\d{4,8}$/.test(pin)) bad('Use 4 to 8 digits for the PIN.');
	await run(env, 'UPDATE lists SET pin_hash = ? WHERE id = ?', await hashPin(pin, randomToken(12)), list.id);
}
export const removePin = (env, list) => run(env, 'UPDATE lists SET pin_hash = NULL WHERE id = ?', list.id);
export const checkPin = async (list, pin) => !!list.pin_hash && sameText(await hashPin(pin, list.pin_hash.split('$')[0]), list.pin_hash);

// Stored links end up in an href on a public page, so only web addresses get through.
function cleanUrl(v) {
	const raw = str(v, 1000);
	if (!raw) return '';
	try {
		const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
		if (u.protocol === 'http:' || u.protocol === 'https:') return u.href;
	} catch {
		// Falls through to the error below.
	}
	bad('That link does not look like a web address.');
}

/** How much image space this account is using. */
const usedSpace = async (env, list) =>
	(
		await one(
			env,
			`SELECT COALESCE((SELECT SUM(banner_size) FROM lists WHERE user_id = ?1), 0)
				+ COALESCE((SELECT SUM(i.photo_size) FROM list_items i JOIN lists l ON l.id = i.list_id WHERE l.user_id = ?1), 0) AS n`,
			list.user_id
		)
	).n;

async function saveImage(env, list, bytes, type) {
	if ((await usedSpace(env, list)) + bytes.length > USER_SPACE) bad('You have used all 100 MB of your image space. Delete some photos first.');
	const key = `lists/${list.id}/${randomToken(16)}`;
	await putImage(env, key, bytes, type);
	return { key, size: bytes.length };
}

/** Check an uploaded image and save it. Returns null when no file was chosen. */
async function storeImage(env, list, file) {
	if (!(file instanceof File) || file.size === 0) return null;
	if (file.size > MAX_PHOTO) bad('That photo is over 3.5 MB. Try a smaller one.');
	const bytes = new Uint8Array(await file.arrayBuffer());
	const type = sniffImage(bytes);
	if (!type) bad('Use a PNG, JPEG, WebP or GIF photo.');
	return saveImage(env, list, bytes, type);
}

/** An item's photo: the uploaded file if there is one, otherwise the product image from its link. */
async function itemPhoto(env, list, f) {
	const uploaded = await storeImage(env, list, f.get('photo'));
	if (uploaded) return { photo: uploaded };
	const link = str(f.get('image_url'), 2000);
	if (!link) return { photo: null };
	const image = await downloadImage(env, link, MAX_PHOTO);
	return image ? { photo: await saveImage(env, list, image.bytes, image.type) } : { photo: null, photoFailed: true };
}

// Unsplash serves these to visitors directly, so nothing is stored. Only its own image hosts
// are allowed, so a list can't be made to load something from just anywhere.
const IMAGE_HOSTS = new Set(['images.unsplash.com', 'plus.unsplash.com']);

function bannerLink(raw) {
	let u;
	try {
		u = new URL(raw);
	} catch {
		bad('That does not look like an image link.');
	}
	if (u.hostname === 'unsplash.com' || u.hostname === 'www.unsplash.com')
		bad('That is the Unsplash page, not the image. Right-click the photo and copy the image address.');
	if (u.protocol !== 'https:' || !IMAGE_HOSTS.has(u.hostname)) bad('Links work for Unsplash images only.');
	u.searchParams.set('w', '2000');
	u.searchParams.set('q', '80');
	u.searchParams.set('auto', 'format');
	return u.href;
}

export async function setBanner(env, list, f) {
	const link = str(f.get('banner_url'), 2000);
	const image = await storeImage(env, list, f.get('banner'));
	const url = !image && link ? bannerLink(link) : '';
	if (!image && !url) bad('Choose an image or paste an Unsplash image link.');
	await run(
		env,
		'UPDATE lists SET banner_key = ?, banner_size = ?, banner_url = ?, banner_v = banner_v + 1 WHERE id = ?',
		image?.key ?? null, image?.size ?? 0, url, list.id
	);
	await dropImages(env, [list.banner_key]);
}

export async function removeBanner(env, list) {
	await run(env, "UPDATE lists SET banner_key = NULL, banner_size = 0, banner_url = '', banner_v = banner_v + 1 WHERE id = ?", list.id);
	await dropImages(env, [list.banner_key]);
}

function itemFields(list, f) {
	const title = str(f.get('title'), 120);
	if (!title) bad('Name the thing you want.');
	const tier = Number(f.get('tier'));
	return {
		title,
		tier: Number.isInteger(tier) && tier >= 1 && tier <= EDITIONS[list.edition].tiers.length ? tier : 1,
		url: cleanUrl(f.get('url')),
		price: str(f.get('price'), 24),
		store: str(f.get('store'), 80),
		details: str(f.get('details'), 500),
		featured: f.get('featured') === 'on' ? 1 : 0
	};
}

const clearFeatured = (env, list) => run(env, 'UPDATE list_items SET featured = 0 WHERE list_id = ?', list.id);

export async function addItem(env, list, f) {
	if ((await one(env, 'SELECT COUNT(*) AS n FROM list_items WHERE list_id = ?', list.id)).n >= MAX_ITEMS) bad('This list is full.');
	const x = itemFields(list, f);
	const { photo, photoFailed } = await itemPhoto(env, list, f);
	if (x.featured) await clearFeatured(env, list);
	await run(
		env,
		'INSERT INTO list_items (list_id, tier, title, url, price, store, details, featured, photo_key, photo_size, photo_v) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		list.id, x.tier, x.title, x.url, x.price, x.store, x.details, x.featured, photo?.key ?? null, photo?.size ?? 0, photo ? 1 : 0
	);
	return { photoFailed };
}

export async function updateItem(env, list, f) {
	const id = Number(f.get('id'));
	const item = await one(env, 'SELECT id, photo_key FROM list_items WHERE id = ? AND list_id = ?', id, list.id);
	if (!item) bad('That item is gone.');
	const x = itemFields(list, f);
	const { photo, photoFailed } = await itemPhoto(env, list, f);
	if (x.featured) await clearFeatured(env, list);
	await run(
		env,
		'UPDATE list_items SET tier = ?, title = ?, url = ?, price = ?, store = ?, details = ?, featured = ? WHERE id = ?',
		x.tier, x.title, x.url, x.price, x.store, x.details, x.featured, id
	);
	if (photo || f.get('remove_photo') === 'on') {
		await run(env, 'UPDATE list_items SET photo_key = ?, photo_size = ?, photo_v = photo_v + 1 WHERE id = ?', photo?.key ?? null, photo?.size ?? 0, id);
		await dropImages(env, [item.photo_key]);
	}
	return { photoFailed };
}

export async function deleteItem(env, list, id) {
	const item = await one(env, 'SELECT photo_key FROM list_items WHERE id = ? AND list_id = ?', Number(id), list.id);
	await run(env, 'DELETE FROM list_items WHERE id = ? AND list_id = ?', Number(id), list.id);
	await dropImages(env, [item?.photo_key]);
}

export const deleteNote = (env, list, id) => run(env, 'DELETE FROM list_notes WHERE id = ? AND list_id = ?', Number(id), list.id);

export const listNotes = (env, list) =>
	all(
		env,
		`SELECT n.id, n.name, n.body, n.created_at, i.title AS item
		 FROM list_notes n LEFT JOIN list_items i ON i.id = n.item_id
		 WHERE n.list_id = ? ORDER BY n.id DESC`,
		list.id
	);

export const listItems = (env, list) =>
	all(
		env,
		'SELECT id, tier, title, url, price, store, details, featured, photo_v, photo_key IS NOT NULL AS has_photo FROM list_items WHERE list_id = ? ORDER BY tier, id',
		list.id
	);

// ---- Visitors ----------------------------------------------------------------

/**
 * The list behind a share link, with `open` saying whether visitors can see it. A list closes
 * when sharing is off, or once its day has passed in the owner's time zone. The owner always can.
 */
export async function sharedList(env, token, viewer) {
	const list = await one(env, 'SELECT * FROM lists WHERE share_token = ?', String(token));
	if (!list || !EDITIONS[list.edition]) return null;
	const isOwner = viewer?.id === list.user_id;
	const now = today(await getUserById(env, list.user_id));
	const open = isOwner || (!!list.share_on && now <= list.event_date);
	return { list, isOwner, open, now };
}

const pinCookie = (list) => `listy_pin_${list.id}`;
/** Changes with the PIN or the link, so either change locks everyone out again. */
const pinProof = (list) => sha256(`${list.pin_hash}:${list.share_token}`);

export const pinPassed = async (list, isOwner, cookies) => {
	if (!list.pin_hash || isOwner) return true;
	return sameText(cookies.get(pinCookie(list)) ?? '', await pinProof(list));
};

export async function rememberPin(list, cookies, url) {
	cookies.set(pinCookie(list), await pinProof(list), {
		path: `/share/${list.share_token}`,
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 30
	});
}

/** Exactly what a visitor gets. Nothing about the owner's account, and only these fields. */
export async function publicList(env, list, now) {
	return {
		edition: list.edition,
		title: list.title,
		message: list.message,
		event_date: list.event_date,
		days: daysUntil(list.event_date, now),
		now,
		banner: list.banner_key ? list.banner_v : 0,
		bannerUrl: list.banner_url,
		options: readOptions(list),
		items: (await listItems(env, list)).map(({ id, tier, title, url, price, store, details, featured, photo_v, has_photo }) => ({
			id, tier, title, url, price, store, details, featured: !!featured, photo: has_photo ? photo_v : 0
		}))
	};
}

export async function addNote(env, list, input) {
	const body = str(input.body, 500);
	if (!body) bad('Write your note first.');
	if ((await one(env, 'SELECT COUNT(*) AS n FROM list_notes WHERE list_id = ?', list.id)).n >= MAX_NOTES) bad('This list is not taking more notes.');
	const item = await one(env, 'SELECT id FROM list_items WHERE id = ? AND list_id = ?', Number(input.item_id) || 0, list.id);
	await run(env, 'INSERT INTO list_notes (list_id, item_id, name, body) VALUES (?, ?, ?, ?)', list.id, item?.id ?? null, str(input.name, 60), body);
}
