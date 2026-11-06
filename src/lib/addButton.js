// The "Add to Listy" bookmark. It runs on the store's page in the person's own browser, which has
// already got past any bot checks, reads the product and opens Listy with the details in the
// address. It has to fit in a single bookmark, so all of it lives in this one function.
export function collect(origin) {
	const text = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
	const first = (...selectors) => {
		for (const s of selectors) {
			const el = document.querySelector(s);
			if (text(el)) return text(el);
		}
		return '';
	};
	const meta = (...names) => {
		for (const n of names) {
			const v = document.querySelector(`meta[property="${n}"],meta[name="${n}"]`)?.content;
			if (v) return v;
		}
		return '';
	};
	const money = (v, code) => {
		const n = Number(String(v ?? '').replace(/[^\d.]/g, ''));
		if (!n) return '';
		return `${code && code !== 'USD' ? `${code} ` : '$'}${n.toFixed(2)}`;
	};

	// Search-engine product data, however deeply the page nests it.
	const findProduct = (node, depth) => {
		if (!node || typeof node !== 'object' || depth > 6) return null;
		if ([node['@type']].flat().some((t) => String(t).toLowerCase() === 'product')) return node;
		for (const value of Object.values(node)) {
			const hit = findProduct(value, depth + 1);
			if (hit) return hit;
		}
		return null;
	};
	let product = null;
	for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
		try {
			product = findProduct(JSON.parse(script.textContent), 0);
		} catch {
			// Skip broken blocks.
		}
		if (product) break;
	}
	const offer = [product?.offers].flat()[0] ?? {};
	const inner = offer.offers ? [offer.offers].flat()[0] : offer;
	const ldImage = [product?.image].flat()[0];

	// Walmart keeps the whole product in a block of page data.
	let nextData = null;
	try {
		nextData = JSON.parse(document.getElementById('__NEXT_DATA__')?.textContent ?? 'null')?.props?.pageProps?.initialData?.data?.product;
	} catch {
		// Not every site has this.
	}

	const isPhoto = (src) => src && !src.startsWith('data:') && !/\/images\/G\/|logo|sprite|icon/i.test(src);
	const pageImage = () => {
		const known = document.querySelector(
			'#landingImage,#main-image,img.primary-image,[data-testid="image-gallery-image"],[data-seo-id="hero-image"],.product-details__product img,.lazy-image__wrapper img'
		);
		const candidates = known ? [known] : [];
		const largest = [...document.images]
			.filter((img) => isPhoto(img.currentSrc || img.src) && img.width >= 150 && img.height >= 150)
			.sort((a, b) => b.width * b.height - a.width * a.height)[0];
		if (largest) candidates.push(largest);
		for (const img of candidates) {
			const src = img.dataset?.oldHires || img.currentSrc || img.src;
			if (isPhoto(src)) return src;
		}
		return '';
	};
	// Last resort: the first dollar amount shown near the product's name.
	const pagePrice = () => {
		const start = document.querySelector('h1');
		let area = start;
		for (let i = 0; area && i < 4; i++) {
			const found = (area.innerText ?? '').match(/\$\s?\d[\d,]*\.\d{2}/);
			if (found) return found[0].replace(/\s/g, '');
			area = area.parentElement;
		}
		return '';
	};

	const details = {
		title: product?.name || nextData?.name || first('#productTitle', 'h1') || meta('og:title') || document.title,
		price:
			money(inner.price ?? inner.lowPrice, inner.priceCurrency) ||
			nextData?.priceInfo?.currentPrice?.priceString ||
			first('.priceToPay .a-offscreen', '#corePrice_feature_div .a-offscreen', '[data-testid="customer-price"] span', '.priceView-customer-price span', '.spotlight__price', '.price-points__upper__price', '[itemprop="price"]') ||
			money(meta('product:price:amount', 'og:price:amount')) ||
			pagePrice(),
		details:
			product?.description ||
			nextData?.shortDescription ||
			first('#feature-bullets ul', '.product-details__description', '[data-testid="product-description"]') ||
			meta('og:description', 'description'),
		image: (typeof ldImage === 'string' ? ldImage : ldImage?.url) || nextData?.imageInfo?.thumbnailUrl || pageImage() || meta('og:image'),
		url: location.href
	};
	details.details = String(details.details).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);
	details.image = details.image ? new URL(details.image, location.href).href : '';
	details.store = location.hostname;
	const to = `${origin}/add#${encodeURIComponent(JSON.stringify(details))}`;
	if (!window.open(to, '_blank')) location.href = to;
}

export const bookmarkHref = (origin) => `javascript:${encodeURIComponent(`(${collect.toString()})(${JSON.stringify(origin)});void 0`)}`;
