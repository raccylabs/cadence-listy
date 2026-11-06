import { error } from '@sveltejs/kit';
import { sharedList, pinPassed, publicList } from '$lib/server/lists.js';
import { EDITIONS } from '$lib/editions/index.js';

// Spreadsheets run cells starting with these as formulas, so they're marked as plain text.
const safe = (v) => String(v ?? '').replace(/^[=+\-@\t\r]/, "'$&");
const cell = (v) => `"${safe(v).replace(/"/g, '""')}"`;

/** The list as a spreadsheet, under the same rules as the page: link, PIN and closing date. */
export async function GET({ params, locals, cookies }) {
	const found = await sharedList(locals.env, params.token, locals.user);
	if (!found?.open || !(await pinPassed(found.list, found.isOwner, cookies))) error(404, 'Not found');
	const list = await publicList(locals.env, found.list, found.now);
	const tiers = EDITIONS[list.edition].tiers;
	const rows = [
		['Section', 'Item', 'Price', 'Store', 'Description', 'Link'],
		...list.items.map((i) => [tiers[i.tier - 1], i.title, i.price, i.store, i.details, i.url])
	];
	const name = list.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'wish-list';
	return new Response(`﻿${rows.map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${name}.csv"`,
			'Cache-Control': 'private, no-store'
		}
	});
}
