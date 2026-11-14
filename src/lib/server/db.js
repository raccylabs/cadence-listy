// A thin layer over Cloudflare D1. Every call takes `env`, the Worker's bindings.

const bindAll = (env, sql, args) => env.DB.prepare(sql).bind(...args);
export const one = (env, sql, ...args) => bindAll(env, sql, args).first();
export const all = async (env, sql, ...args) => (await bindAll(env, sql, args).all()).results;
export const run = (env, sql, ...args) => bindAll(env, sql, args).run();

// Each entry runs once, in order. Never edit one that has shipped; add a new one.
const MIGRATIONS = [
	[
		`CREATE TABLE users (
			id            INTEGER PRIMARY KEY,
			username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
			password_salt TEXT NOT NULL,
			password_hash TEXT NOT NULL,
			timezone      TEXT NOT NULL DEFAULT 'UTC',
			created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
		)`,
		`CREATE TABLE sessions (
			id         TEXT PRIMARY KEY,
			user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			expires_at INTEGER NOT NULL
		)`,
		`CREATE TABLE rate_limits (
			key      TEXT PRIMARY KEY,
			count    INTEGER NOT NULL,
			reset_at INTEGER NOT NULL
		)`,
		`CREATE TABLE lists (
			id          INTEGER PRIMARY KEY,
			user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			edition     TEXT NOT NULL,
			title       TEXT NOT NULL,
			message     TEXT NOT NULL DEFAULT '',
			event_date  TEXT NOT NULL,
			options     TEXT NOT NULL DEFAULT '{}',
			share_token TEXT NOT NULL UNIQUE,
			share_on    INTEGER NOT NULL DEFAULT 1,
			pin_hash    TEXT,
			banner_key  TEXT,
			banner_size INTEGER NOT NULL DEFAULT 0,
			banner_url  TEXT NOT NULL DEFAULT '',
			banner_v    INTEGER NOT NULL DEFAULT 0,
			created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
		)`,
		`CREATE INDEX lists_user ON lists(user_id, event_date)`,
		`CREATE TABLE list_items (
			id         INTEGER PRIMARY KEY,
			list_id    INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
			tier       INTEGER NOT NULL DEFAULT 1,
			title      TEXT NOT NULL,
			url        TEXT NOT NULL DEFAULT '',
			price      TEXT NOT NULL DEFAULT '',
			store      TEXT NOT NULL DEFAULT '',
			details    TEXT NOT NULL DEFAULT '',
			featured   INTEGER NOT NULL DEFAULT 0,
			photo_key  TEXT,
			photo_size INTEGER NOT NULL DEFAULT 0,
			photo_v    INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE INDEX list_items_list ON list_items(list_id, tier, id)`,
		`CREATE TABLE list_notes (
			id         INTEGER PRIMARY KEY,
			list_id    INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
			item_id    INTEGER REFERENCES list_items(id) ON DELETE SET NULL,
			name       TEXT NOT NULL DEFAULT '',
			body       TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
		)`,
		`CREATE INDEX list_notes_list ON list_notes(list_id, id)`
	],
	[`ALTER TABLE lists DROP COLUMN banner_url`],
	[`ALTER TABLE list_items ADD COLUMN position INTEGER NOT NULL DEFAULT 0`, `UPDATE list_items SET position = id`],
	[
		`ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0`,
		`UPDATE users SET is_admin = 1 WHERE id = (SELECT MIN(id) FROM users)`,
		`CREATE TABLE invites (
			token      TEXT PRIMARY KEY,
			name       TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
			used_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
			used_at    TEXT
		)`
	],
	// Snow and confetti are on by default now, including on lists made before.
	[
		`UPDATE lists SET options = json_set(CASE WHEN json_valid(options) THEN options ELSE '{}' END, '$.snow', json('true')) WHERE edition = 'christmas'`,
		`UPDATE lists SET options = json_set(CASE WHEN json_valid(options) THEN options ELSE '{}' END, '$.confetti', json('true')) WHERE edition = 'birthday'`
	],
	// Families and groups, profile pictures, and top-pick banners.
	[
		`ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN avatar TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN avatar_key TEXT`,
		`ALTER TABLE users ADD COLUMN avatar_size INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE users ADD COLUMN avatar_v INTEGER NOT NULL DEFAULT 0`,
		`ALTER TABLE list_items ADD COLUMN pick_text TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE list_items ADD COLUMN pick_color TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE list_items ADD COLUMN pick_pattern TEXT NOT NULL DEFAULT ''`,
		`CREATE TABLE family_groups (
			id          INTEGER PRIMARY KEY,
			owner_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			name        TEXT NOT NULL,
			edition     TEXT NOT NULL DEFAULT 'christmas',
			scene       TEXT NOT NULL DEFAULT '',
			share_token TEXT NOT NULL UNIQUE,
			join_token  TEXT NOT NULL UNIQUE,
			pin_hash    TEXT,
			created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
		)`,
		`CREATE TABLE family_members (
			group_id  INTEGER NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
			user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
			PRIMARY KEY (group_id, user_id)
		)`,
		`CREATE INDEX family_members_user ON family_members(user_id)`,
		`ALTER TABLE invites ADD COLUMN group_id INTEGER REFERENCES family_groups(id) ON DELETE SET NULL`
	],
	// The family advent calendar. member_id NULL is the door everyone gets unless they have their own.
	[
		`CREATE TABLE advent_doors (
			id         INTEGER PRIMARY KEY,
			group_id   INTEGER NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
			member_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
			year       INTEGER NOT NULL,
			day        INTEGER NOT NULL,
			kind       TEXT NOT NULL DEFAULT 'note',
			title      TEXT NOT NULL DEFAULT '',
			message    TEXT NOT NULL DEFAULT '',
			answer     TEXT NOT NULL DEFAULT '',
			link       TEXT NOT NULL DEFAULT '',
			image_key  TEXT,
			image_size INTEGER NOT NULL DEFAULT 0,
			image_v    INTEGER NOT NULL DEFAULT 0
		)`,
		`CREATE UNIQUE INDEX advent_doors_slot ON advent_doors(group_id, IFNULL(member_id, 0), year, day)`,
		`CREATE TABLE advent_opens (
			group_id  INTEGER NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
			user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			year      INTEGER NOT NULL,
			day       INTEGER NOT NULL,
			opened_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
			reaction  TEXT NOT NULL DEFAULT '',
			used_at   TEXT,
			PRIMARY KEY (group_id, user_id, year, day)
		)`
	]
];

let ready = false;

/** Set up the database the first time this Worker runs, so there's no migration step to deploy. */
export async function ensureSchema(env) {
	if (ready) return;
	await env.DB.prepare('CREATE TABLE IF NOT EXISTS schema_version (id INTEGER PRIMARY KEY CHECK (id = 1), version INTEGER NOT NULL)').run();
	const row = await env.DB.prepare('SELECT version FROM schema_version WHERE id = 1').first();
	for (let v = row?.version ?? 0; v < MIGRATIONS.length; v++) {
		await env.DB.batch([
			...MIGRATIONS[v].map((sql) => env.DB.prepare(sql)),
			env.DB.prepare('INSERT INTO schema_version (id, version) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET version = excluded.version').bind(v + 1)
		]);
	}
	ready = true;
}
