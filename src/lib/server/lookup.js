// Pulls a product's details from its web page, using the structured data stores publish for
// search engines (JSON-LD) and link previews (Open Graph). Workers' fetch can't reach private
// networks, so the checks here only need to keep it to ordinary public web addresses.
import { sniffImage } from './images.js';

const MAX_PAGE = 2 * 1024 * 1024;
const MAX_DETAILS = 240;
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; CadenceListy/1.0)', Accept: 'text/html,application/xhtml+xml' };

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const decode = (s) =>
	s.replace(/&(?:#(\d+)|#x([\da-f]+)|(\w+));/gi, (all, dec, hex, name) => {
		if (dec) return String.fromCodePoint(Number(dec));
		if (hex) return String.fromCodePoint(parseInt(hex, 16));
		return ENTITIES[name.toLowerCase()] ?? all;
	});
const clean = (v) => (typeof v === 'string' ? decode(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');

const shorten = (s) => {
	if (s.length <= MAX_DETAILS) return s;
	const cut = s.slice(0, MAX_DETAILS);
	return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), MAX_DETAILS - 40)).trimEnd()}…`;
};

/** Only public http(s) addresses, never a bare IP or an internal-looking name. */
export function publicUrl(raw, env) {
	let u;
	try {
		u = new URL(raw);
	} catch {
		return null;
	}
	if (u.hostname === env.LOOKUP_ALLOW_HOST) return u;
	const ipLike = /^[\d.]+$/.test(u.hostname) || u.hostname.includes(':') || u.hostname.startsWith('[');
	if (!/^https?:$/.test(u.protocol) || ipLike || !u.hostname.includes('.') || u.hostname.endsWith('.local') || u.hostname.endsWith('.internal')) return null;
	return u;
}

/** Stop reading after `max` bytes. */
function capped(body, max) {
	let seen = 0;
	return body.pipeThrough(
		new TransformStream({
			transform(chunk, controller) {
				seen += chunk.byteLength;
				controller.enqueue(chunk);
				if (seen >= max) controller.terminate();
			}
		})
	);
}

const hasType = (node, type) => [node?.['@type']].flat().some((t) => String(t).toLowerCase() === type);

/** Find the Product in JSON-LD, however deeply the page nests it. */
function findProduct(node, depth = 0) {
	if (!node || typeof node !== 'object' || depth > 6) return null;
	if (Array.isArray(node)) {
		for (const entry of node) {
			const hit = findProduct(entry, depth + 1);
			if (hit) return hit;
		}
		return null;
	}
	if (hasType(node, 'product')) return node;
	return findProduct(node['@graph'] ?? node.mainEntity ?? node.mainEntityOfPage ?? node.itemListElement ?? node.hasVariant, depth + 1);
}

const firstImage = (v) => {
	if (typeof v === 'string') return v;
	if (Array.isArray(v)) return firstImage(v[0]);
	return v?.url ?? v?.contentUrl ?? '';
};

function offerPrice(offers) {
	const offer = [offers].flat()[0];
	if (!offer) return {};
	const nested = [offer.priceSpecification].flat()[0];
	return {
		amount: offer.price ?? offer.lowPrice ?? nested?.price,
		currency: offer.priceCurrency ?? nested?.priceCurrency
	};
}

function formatPrice(amount, currency) {
	const n = Number(String(amount ?? '').replace(/,/g, ''));
	if (!amount || !Number.isFinite(n) || n <= 0) return '';
	const code = String(currency || 'USD').toUpperCase();
	const text = n.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 });
	const symbol = { USD: '$', CAD: 'CA$', GBP: '£', EUR: '€' }[code];
	return symbol ? `${symbol}${text}` : `${text} ${code}`;
}

/** Read a product out of a page's HTML, using Cloudflare's streaming parser to stay within the CPU limit. */
export async function readProduct(response, pageUrl) {
	const meta = {};
	const scripts = [];
	let script = '';
	let title = '';
	const rewriter = new HTMLRewriter()
		.on('meta', {
			element(e) {
				const key = (e.getAttribute('property') || e.getAttribute('name') || '').toLowerCase();
				const value = e.getAttribute('content');
				if (key && value && !(key in meta)) meta[key] = value;
			}
		})
		.on('head > title', {
			text(t) {
				title += t.text;
			}
		})
		.on('script[type="application/ld+json"]', {
			text(t) {
				script += t.text;
				if (t.lastInTextNode) {
					scripts.push(script);
					script = '';
				}
			}
		});
	await rewriter.transform(new Response(capped(response.body, MAX_PAGE), { headers: response.headers })).arrayBuffer();

	let product = null;
	for (const text of scripts) {
		try {
			product = findProduct(JSON.parse(text));
		} catch {
			// One broken block shouldn't stop the rest.
		}
		if (product) break;
	}

	const { amount, currency } = offerPrice(product?.offers);
	const image = firstImage(product?.image) || meta['og:image'] || meta['og:image:secure_url'] || meta['twitter:image'] || '';
	let absolute = '';
	try {
		absolute = image ? new URL(decode(image), pageUrl).href : '';
	} catch {
		// No usable image.
	}
	return {
		title: clean(product?.name) || clean(meta['og:title']) || clean(meta['twitter:title']) || clean(title),
		details: shorten(clean(product?.description) || clean(meta['og:description']) || clean(meta.description)),
		price: formatPrice(amount ?? meta['product:price:amount'] ?? meta['og:price:amount'], currency ?? meta['product:price:currency'] ?? meta['og:price:currency']),
		store: clean(meta['og:site_name']) || new URL(pageUrl).hostname.replace(/^www\./, ''),
		image: absolute
	};
}

/** Look up a product page. Returns its details, or null if the page can't be read. */
export async function lookupProduct(env, raw) {
	const url = publicUrl(raw, env);
	if (!url) return null;
	let res;
	try {
		res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(8000) });
	} catch {
		return null;
	}
	if (!res.ok || !res.body || !/html/i.test(res.headers.get('content-type') ?? '')) return null;
	const found = await readProduct(res, res.url || url.href);
	return found.title || found.image ? found : null;
}

/** Download a product image. Returns its bytes and type, or null if that isn't possible. */
export async function downloadImage(env, raw, maxBytes) {
	const url = publicUrl(raw, env);
	if (!url) return null;
	try {
		const res = await fetch(url, { headers: { 'User-Agent': HEADERS['User-Agent'], Accept: 'image/*' }, redirect: 'follow', signal: AbortSignal.timeout(10000) });
		if (!res.ok || Number(res.headers.get('content-length') ?? 0) > maxBytes) return null;
		const bytes = new Uint8Array(await res.arrayBuffer());
		const type = sniffImage(bytes);
		return bytes.length <= maxBytes && type ? { bytes, type } : null;
	} catch {
		return null;
	}
}
