// Pulls a product's details from its web page, using the structured data stores publish for
// search engines (JSON-LD) and link previews (Open Graph). Workers' fetch can't reach private
// networks, so the checks here only need to keep it to ordinary public web addresses.
import { sniffImage } from './images.js';

// Amazon's pages run to a few MB, with the product details part way down.
const MAX_PAGE = 3 * 1024 * 1024;
const MAX_DETAILS = 1500;
const MAX_TITLE = 60;
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

/** Store titles are often a whole sales pitch, so keep the part before the pitch starts. */
export function shortTitle(raw) {
	const title = raw.replace(/^amazon(\.[a-z.]+)?\s*:\s*/i, '').replace(/\s:\s[^:]+$/, '').trim();
	if (title.length <= MAX_TITLE) return title;
	const breaks = [' - ', ' – ', ' — ', ' | ', ', ', ' (', ' with ', ': ']
		.map((mark) => title.indexOf(mark, 15))
		.filter((at) => at > 0 && at <= MAX_TITLE + 15);
	if (breaks.length) return title.slice(0, Math.min(...breaks)).trim();
	const cut = title.slice(0, MAX_TITLE);
	return cut.slice(0, cut.lastIndexOf(' ')).trim() || cut;
}

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

const STORE_NAMES = {
	'bestbuy.com': 'Best Buy',
	'walmart.com': 'Walmart',
	'target.com': 'Target',
	'tcgplayer.com': 'TCGplayer',
	'ebay.com': 'eBay',
	'costco.com': 'Costco',
	'homedepot.com': 'Home Depot',
	'lowes.com': "Lowe's"
};
const storeName = (host) => {
	const name = host.replace(/^www\./, '');
	return STORE_NAMES[name] ?? (/(^|\.)amazon\./.test(name) ? 'Amazon' : name);
};

// Bot walls come back as ordinary pages, so spot them by their wording.
const BOT_WALL = /robot or human|are you a (human|robot)|access denied|just a moment|attention required|verify you are|pardon our interruption|captcha|security check/i;

/** Words worth comparing: lower case, and long enough to mean something. */
const wordsIn = (text) => new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));

/** The product name most stores spell out in their links, like /elite-trainer-box/. */
function nameFromLink(url) {
	const slug = url.pathname.split('/').filter((part) => /^[a-z0-9]+(-[a-z0-9]+){2,}$/i.test(part)).sort((a, b) => b.length - a.length)[0];
	if (!slug) return '';
	const acronym = /^(tcg|usb|hdmi|ssd|led|\d*[a-z]+\d+[a-z0-9]*)$/i;
	const word = (w) => (acronym.test(w) ? w.toUpperCase() : /^\d/.test(w) ? w : w[0].toUpperCase() + w.slice(1));
	return shortTitle(slug.split('-').map(word).join(' '));
}

/** What a link alone can tell us, for stores that won't show their page to a server. */
export function detailsFromLink(url) {
	const title = nameFromLink(url);
	return title ? { title, details: '', price: '', store: storeName(url.hostname), image: '', partial: true } : null;
}

/** TCGplayer builds its pages in the browser, but its photos follow a pattern based on the product number. */
async function storeImageGuess(url) {
	const id = /(^|\.)tcgplayer\.com$/.test(url.hostname) && url.pathname.match(/^\/product\/(\d+)/)?.[1];
	if (!id) return '';
	const image = `https://tcgplayer-cdn.tcgplayer.com/product/${id}_in_1000x1000.jpg`;
	try {
		const res = await fetch(image, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
		return res.ok && /^image\//.test(res.headers.get('content-type') ?? '') ? image : '';
	} catch {
		return '';
	}
}

/** Stop reading after `max` bytes, or as soon as `enough` says there's no need to go on. */
function capped(body, max, enough) {
	let seen = 0;
	return body.pipeThrough(
		new TransformStream({
			transform(chunk, controller) {
				seen += chunk.byteLength;
				controller.enqueue(chunk);
				if (seen >= max || enough()) controller.terminate();
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
	// For stores like Amazon that keep these in the page itself, not in product data.
	const page = { title: '', salePrice: '', mainPrice: '', price: '', landing: '', image: '', bullets: [] };
	const link = new URL(pageUrl);
	const host = link.hostname.replace(/^www\./, '');
	const amazon = /(^|\.)amazon\./.test(host);
	// Amazon keeps product photos in /images/I/ and site graphics, like Prime logos, in /images/G/.
	const isProductImage = (src) => {
		if (!src || src.startsWith('data:')) return false;
		if (src.includes('media-amazon.com') || src.includes('ssl-images-amazon.com')) return src.includes('/images/I/');
		return !amazon && !/(logo|sprite|favicon)/i.test(src);
	};
	const firstText = (key) => {
		let text = '';
		return {
			text(t) {
				if (page[key]) return;
				text += t.text;
				if (t.lastInTextNode) {
					page[key] = clean(text);
					text = '';
				}
			}
		};
	};
	const imageFrom = (slot, ...names) => ({
		element(e) {
			if (page[slot]) return;
			for (const name of names) {
				let values = [e.getAttribute(name)];
				if (name === 'data-a-dynamic-image' && values[0]) {
					try {
						values = Object.keys(JSON.parse(decode(values[0])));
					} catch {
						values = [];
					}
				}
				const hit = values.find(isProductImage);
				if (hit) {
					page[slot] = hit;
					return;
				}
			}
		}
	});
	let bullet = '';
	const rewriter = new HTMLRewriter()
		.on('#productTitle', firstText('title'))
		.on('.priceToPay .a-offscreen', firstText('salePrice'))
		.on('#corePrice_feature_div .a-offscreen', firstText('mainPrice'))
		.on('.a-price:not(.a-text-price) .a-offscreen', firstText('price'))
		.on('[itemprop="price"]', {
			element(e) {
				if (!page.price && e.getAttribute('content')) page.price = formatPrice(e.getAttribute('content'), meta['product:price:currency']);
			}
		})
		.on('img#landingImage', imageFrom('landing', 'data-old-hires', 'data-a-dynamic-image', 'src'))
		.on('img#main-image', imageFrom('landing', 'data-a-hires', 'src'))
		.on('#imgTagWrapperId img', imageFrom('landing', 'data-old-hires', 'data-a-dynamic-image', 'src'))
		.on('#imageBlock img', imageFrom('image', 'data-old-hires', 'data-a-dynamic-image', 'src'))
		.on('[itemprop="image"]', imageFrom('image', 'content', 'src', 'href'))
		.on('link[rel="image_src"]', imageFrom('image', 'href'))
		.on('#feature-bullets li span.a-list-item', {
			text(t) {
				bullet += t.text;
				if (t.lastInTextNode) {
					if (clean(bullet) && page.bullets.length < 2) page.bullets.push(clean(bullet));
					bullet = '';
				}
			}
		})
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
	const enough = () => !!(page.title && page.landing && page.salePrice && page.bullets.length);
	await rewriter.transform(new Response(capped(response.body, MAX_PAGE, enough), { headers: response.headers })).arrayBuffer();

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
	const image = [firstImage(product?.image), page.landing, meta['og:image'], meta['og:image:secure_url'], meta['twitter:image'], page.image].map((src) => decode(src ?? '')).find(isProductImage) ?? '';
	let absolute = '';
	try {
		absolute = image ? new URL(image, pageUrl).href : '';
	} catch {
		// No usable image.
	}
	if (BOT_WALL.test(clean(title)) || BOT_WALL.test(clean(meta['og:title']))) return null;
	// Without real product data, a page whose title has nothing to do with its link is only showing
	// the store's site-wide tagline, so none of its text is about this product.
	const linkName = nameFromLink(link);
	const generic =
		!product &&
		!page.title &&
		linkName &&
		![...wordsIn(clean(meta['og:title']) || clean(title))].some((word) => wordsIn(linkName).has(word));
	if (generic) return { title: linkName, details: '', price: '', store: storeName(host), image: '', partial: true };

	const fullTitle = clean(product?.name) || page.title || clean(meta['og:title']) || clean(meta['twitter:title']) || clean(title);
	const name = shortTitle(fullTitle);
	return {
		title: name,
		// The words a long title lost are often the best description a store gives.
		details: shorten(clean(product?.description) || clean(meta['og:description']) || page.bullets.join(' ') || clean(meta.description) || (name === fullTitle ? '' : fullTitle)),
		price:
			formatPrice(amount ?? meta['product:price:amount'] ?? meta['og:price:amount'], currency ?? meta['product:price:currency'] ?? meta['og:price:currency']) || page.salePrice || page.mainPrice || page.price,
		store: clean(meta['og:site_name']) || storeName(host),
		image: absolute
	};
}

/** Look up a product page. Returns what it can, or null if the link tells us nothing. */
export async function lookupProduct(env, raw) {
	const url = publicUrl(raw, env);
	if (!url) return null;
	let found = null;
	try {
		const res = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(6000) });
		if (res.ok && res.body && /html/i.test(res.headers.get('content-type') ?? '')) found = await readProduct(res, res.url || url.href);
	} catch {
		// Blocked or too slow: fall through to what the link itself says.
	}
	if (!found?.title && !found?.image) found = detailsFromLink(url);
	if (found && !found.image) found.image = await storeImageGuess(url);
	return found;
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
