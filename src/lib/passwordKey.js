/**
 * The slow part of password hashing, done in the browser. Cloudflare's free plan allows 10 ms of
 * work per request, far too little for this. The server stores a salted hash of the result, so a
 * stolen database still costs an attacker this full amount of work for every guess.
 */
export async function passwordKey(username, password) {
	const text = new TextEncoder();
	const material = await crypto.subtle.importKey('raw', text.encode(password), 'PBKDF2', false, ['deriveBits']);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', iterations: 600000, salt: text.encode(`cadence-listy:${username.trim().toLowerCase()}`) },
		material,
		256
	);
	return btoa(String.fromCharCode(...new Uint8Array(bits)));
}
