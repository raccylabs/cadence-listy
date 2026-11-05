export function load({ locals, route }) {
	// Shared lists stand alone: no account data goes to the browser there.
	if (route.id?.startsWith('/share')) return { me: null };
	return { me: locals.user ? { username: locals.user.username } : null };
}
