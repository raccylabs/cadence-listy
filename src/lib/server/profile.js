// The name and picture people see on group pages.
import { run } from './db.js';
import { randomToken } from './auth.js';
import { ValidationError } from './errors.js';
import { sniffImage, putImage, dropImages } from './images.js';
import { AVATARS } from '../avatars.js';

const MAX_AVATAR = 1024 * 1024;

export async function saveProfile(env, user, f) {
	const name = String(f.get('display_name') ?? '').trim().slice(0, 40);
	const avatar = String(f.get('avatar') ?? '');
	await run(env, 'UPDATE users SET display_name = ?, avatar = ? WHERE id = ?', name, AVATARS.some(([a]) => a === avatar) ? avatar : '', user.id);

	const file = f.get('photo');
	if (file instanceof File && file.size > 0) {
		if (file.size > MAX_AVATAR) throw new ValidationError('That photo is over 1 MB. Try a smaller one.');
		const bytes = new Uint8Array(await file.arrayBuffer());
		const type = sniffImage(bytes);
		if (!type) throw new ValidationError('Use a PNG, JPEG, WebP or GIF photo.');
		const key = `avatars/${user.id}/${randomToken(16)}`;
		await putImage(env, key, bytes, type);
		await run(env, 'UPDATE users SET avatar_key = ?, avatar_size = ?, avatar_v = avatar_v + 1 WHERE id = ?', key, bytes.length, user.id);
		await dropImages(env, [user.avatar_key]);
	} else if (f.get('remove_photo') === 'on' && user.avatar_key) {
		await run(env, 'UPDATE users SET avatar_key = NULL, avatar_size = 0, avatar_v = avatar_v + 1 WHERE id = ?', user.id);
		await dropImages(env, [user.avatar_key]);
	}
}
