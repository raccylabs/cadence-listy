const NAMES = {
	'bestbuy.com': 'Best Buy',
	'walmart.com': 'Walmart',
	'target.com': 'Target',
	'tcgplayer.com': 'TCGplayer',
	'ebay.com': 'eBay',
	'costco.com': 'Costco',
	'homedepot.com': 'Home Depot',
	'lowes.com': "Lowe's"
};

/** A store's name from its web address. */
export function storeLabel(host) {
	const name = String(host).replace(/^www\./, '');
	return NAMES[name] ?? (/(^|\.)amazon\./.test(name) ? 'Amazon' : name);
}

const MAX_TITLE = 60;

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
