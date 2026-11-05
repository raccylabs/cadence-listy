// Images live in a private R2 bucket. Visitors only reach them through routes that check the
// list's link, PIN and closing date first.

/** Recognise PNG, JPEG, WebP and GIF by their first bytes, never by the browser-supplied type. */
export function sniffImage(b) {
	const text = (from, to) => String.fromCharCode(...b.subarray(from, to));
	if (b.length > 8 && b[0] === 0x89 && text(1, 4) === 'PNG') return 'image/png';
	if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	if (b.length > 12 && text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
	if (b.length > 6 && text(0, 4) === 'GIF8') return 'image/gif';
	return null;
}

export const putImage = (env, key, bytes, type) => env.IMAGES.put(key, bytes, { httpMetadata: { contentType: type } });

export async function dropImages(env, keys) {
	const found = keys.filter(Boolean);
	if (found.length) await env.IMAGES.delete(found);
}

/** An image response, or null if the file isn't there. */
export async function imageResponse(env, key) {
	const image = await env.IMAGES.get(key);
	if (!image) return null;
	return new Response(image.body, {
		headers: {
			'Content-Type': image.httpMetadata?.contentType ?? 'application/octet-stream',
			'Cache-Control': 'private, max-age=300',
			'Content-Security-Policy': "default-src 'none'; sandbox",
			'X-Content-Type-Options': 'nosniff'
		}
	});
}
