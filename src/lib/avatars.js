// Drawn profile pictures, in the same style as the list drawings. [id, name, background]
export const AVATARS = [
	['reindeer', 'Reindeer', '#cfe3ec'],
	['penguin', 'Penguin', '#ddd2f3'],
	['bear', 'Bear', '#f5e2b8'],
	['fox', 'Fox', '#d6ead9'],
	['bunny', 'Bunny', '#f7d6df'],
	['cat', 'Cat', '#cfe3ec'],
	['snowman', 'Snowman', '#f7d6df'],
	['gingerbread', 'Gingerbread', '#ddd2f3']
];
export const avatarFor = (id) => (AVATARS.some(([a]) => a === id) ? id : AVATARS[0][0]);
