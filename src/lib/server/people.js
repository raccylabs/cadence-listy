// Who can join, and who has. Only the site's admin reaches these, except the two invite checks.
import { one, all, run } from './db.js';
import { randomToken, getUserById } from './auth.js';
import { ValidationError } from './errors.js';
import { deleteUser } from './lists.js';

export const openInvite = (env, token) => (token ? one(env, 'SELECT token FROM invites WHERE token = ? AND used_at IS NULL', token) : null);

export const useInvite = (env, invite, userId) =>
	run(env, "UPDATE invites SET used_by = ?, used_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE token = ?", userId, invite.token);

export async function createInvite(env, name) {
	const label = String(name ?? '').trim().slice(0, 60);
	if (!label) throw new ValidationError('Enter who this invite is for.');
	await run(env, 'INSERT INTO invites (token, name) VALUES (?, ?)', randomToken(18), label);
}

export const cancelInvite = (env, token) => run(env, 'DELETE FROM invites WHERE token = ? AND used_at IS NULL', String(token));
export const pendingInvites = (env) => all(env, 'SELECT token, name, created_at FROM invites WHERE used_at IS NULL ORDER BY created_at DESC');

export const allPeople = (env) =>
	all(
		env,
		`SELECT u.id, u.username, u.is_admin, u.created_at,
			(SELECT name FROM invites i WHERE i.used_by = u.id) AS invited_as,
			(SELECT COUNT(*) FROM lists l WHERE l.user_id = u.id) AS lists,
			(SELECT COALESCE(SUM(i.photo_size), 0) FROM list_items i JOIN lists l ON l.id = i.list_id WHERE l.user_id = u.id) AS image_bytes
		 FROM users u ORDER BY u.id`
	);

/** Remove someone along with their lists and photos. The admin can't be removed. */
export async function removePerson(env, id) {
	const person = await getUserById(env, Number(id));
	if (!person) return;
	if (person.is_admin) throw new ValidationError("You can't remove the site's admin.");
	await deleteUser(env, person);
}
