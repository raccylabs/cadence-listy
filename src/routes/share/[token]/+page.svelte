<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { EDITIONS } from '$lib/editions/index.js';
	import Decor from '$lib/editions/Decor.svelte';
	import Countdown from '$lib/editions/Countdown.svelte';
	import Advent from '$lib/editions/Advent.svelte';
	import Scene from '$lib/editions/Scene.svelte';
	import Spot from '$lib/editions/Spot.svelte';

	let { data, form } = $props();

	const edition = $derived(EDITIONS[data.edition ?? data.list.edition]);
	const list = $derived(data.list);
	const options = $derived(list?.options ?? {});
	const shelves = $derived(list ? edition.tiers.map((name, i) => ({ name, tier: i + 1 })).filter((s) => list.items.some((x) => x.tier === s.tier)) : []);

	let shown = $state(0);
	const board = $derived.by(() => {
		if (!list) return [];
		const items = list.items.filter((x) => !shown || x.tier === shown);
		// The top pick leads the board.
		return options.spotlight ? [...items].sort((a, b) => Number(b.featured) - Number(a.featured)) : items;
	});
	// One pop-up shows an item's details or takes a note about it.
	let box = $state();
	let boxItem = $state(null);
	let boxMode = $state('details');
	const openBox = (item, mode) => {
		boxItem = item;
		boxMode = mode;
		form = null;
		if (!box.open) box.showModal();
	};
	const photo = (item) => `/share/${page.params.token}/photo/${item.id}?v=${item.photo}`;
</script>

<svelte:head>
	<title>{list?.title ?? `${edition.name} list`}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Cadence Listy" />
	<meta property="og:title" content={list?.title ?? `A ${edition.name} wish list`} />
	<meta property="og:description" content="See the wish list." />
	<meta property="og:image" content="{page.url.origin}/preview-{edition.id}.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{#snippet noteForm(item)}
	{@const where = item ? `item-${item.id}` : 'list'}
	{#if form?.noted === where}
		<p class="sent" role="status">Note sent.</p>
	{:else}
		<form method="POST" action="?/note" use:enhance class="note-form">
			{#if item}<input type="hidden" name="item_id" value={item.id} />{/if}
			<input class="trap" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
			<label>Your name <input name="name" maxlength="60" autocomplete="name" /></label>
			<label>Note <textarea name="body" rows="3" maxlength="500" required></textarea></label>
			{#if form?.error}<p class="err" role="alert">{form.error}</p>{/if}
			<button>Send note</button>
		</form>
	{/if}
{/snippet}

<div class="edition ed-root" data-edition={edition.id}>
	{#if data.locked}
		<main class="lock">
			<h1>{edition.name} list</h1>
			<p>Enter the PIN to open this list.</p>
			<form method="POST" action="?/unlock" use:enhance>
				<input name="pin" type="password" inputmode="numeric" autocomplete="off" pattern="\d*" maxlength="8" required aria-label="PIN" />
				<button>Open list</button>
			</form>
			{#if form?.pinError}<p class="err" role="alert">{form.pinError}</p>{/if}
		</main>
	{:else}
		<Decor edition={edition.id} {options} part="fall" />
		<main class="wrap">
			{#if data.isOwner}
				<p class="preview">This is how your list looks to visitors. <a href="/lists/{data.ownerListId}">Back to editing</a></p>
			{/if}
			<header class="banner">
				<div class="words">
					<h1>{list.title}</h1>
					{#if list.message}<p class="msg">{list.message}</p>{/if}
					{#if options.countdown}<Countdown days={list.days} {edition} />{/if}
				</div>
				<div class="art">
					<Scene edition={edition.id} />
					<Decor edition={edition.id} {options} part="string" />
				</div>
			</header>
			{#if options.stripes}<div class="stripes" aria-hidden="true"></div>{/if}

			{#if shelves.length > 1}
				<div class="pills" role="group" aria-label="Filter the list">
					<button type="button" class:on={!shown} aria-pressed={!shown} onclick={() => (shown = 0)}>All wishes</button>
					{#each shelves as s (s.tier)}
						<button type="button" class:on={shown === s.tier} aria-pressed={shown === s.tier} onclick={() => (shown = s.tier)}>{s.name}</button>
					{/each}
				</div>
			{/if}

			<div class="catalog">
				{#each board as item, i (item.id)}
					<article class="product" class:top={item.featured && options.spotlight} style="--n:{Math.min(i, 8)}">
						<div class="shot">
							{#if item.photo}
								<img src={photo(item)} alt={item.title} loading="lazy" />
							{:else}
								<div class="blank"><Spot name={edition.spots[item.id % edition.spots.length]} /></div>
							{/if}
							{#if item.featured && options.spotlight}<p class="badge">Top pick</p>{/if}
						</div>
						<div class="text">
							<h2>{item.title}</h2>
							{#if item.price}<p class="price">{item.price}</p>{/if}
							{#if item.store}<p class="store">{item.store}</p>{/if}
							{#if item.details}<p class="fine">{item.details}</p>{/if}
							<div class="acts">
								{#if item.url}<a class="buy" href={item.url} target="_blank" rel="noopener noreferrer">View item</a>{/if}
								{#if item.details}<button type="button" class="note-link" onclick={() => openBox(item, 'details')}>Details</button>{/if}
								<button type="button" class="note-link" onclick={() => openBox(item, 'note')}>Leave a note</button>
							</div>
						</div>
					</article>
				{:else}
					<p class="empty">Nothing on this list yet. Check back soon.</p>
				{/each}
			</div>

			{#if options.advent}
				<div class="panel"><Advent items={list.items} now={list.now} year={list.event_date.slice(0, 4)} /></div>
			{/if}

			{#if list.items.length}
				<div class="export">
					<button type="button" onclick={() => window.print()}>Save as PDF</button>
					<a href="/share/{page.params.token}/list.csv" download data-sveltekit-reload>Download CSV</a>
				</div>
			{/if}

			<ul class="vignettes" aria-hidden="true">
				{#each edition.vignettes as spot}
					<li><div class="disc"><Spot name={spot} /></div></li>
				{/each}
			</ul>

			<section class="foot">
				<div>
					<h2>Leave a note</h2>
					<p>Only the owner of this list will see it.</p>
					<div class="letter"><Spot name="letter" /></div>
				</div>
				{@render noteForm(null)}
			</section>
			<dialog bind:this={box} class="note-box" class:wide={boxMode === 'details'} aria-label={boxMode === 'note' ? 'Leave a note' : 'Item details'}>
				{#if boxItem && boxMode === 'note'}
					<h2>Leave a note</h2>
					<p class="about">About {boxItem.title}</p>
					{@render noteForm(boxItem)}
				{:else if boxItem}
					<div class="full">
						{#if boxItem.photo}<img src={photo(boxItem)} alt={boxItem.title} />{/if}
						<div>
							<h2>{boxItem.title}</h2>
							{#if boxItem.price}<p class="price">{boxItem.price}</p>{/if}
							{#if boxItem.store}<p class="store">{boxItem.store}</p>{/if}
						</div>
					</div>
					<p class="all">{boxItem.details}</p>
					<div class="acts">
						{#if boxItem.url}<a class="buy" href={boxItem.url} target="_blank" rel="noopener noreferrer">View item</a>{/if}
						<button type="button" class="note-link" onclick={() => openBox(boxItem, 'note')}>Leave a note</button>
					</div>
				{/if}
				<button type="button" class="close" onclick={() => box.close()}>Close</button>
			</dialog>
		</main>
	{/if}
</div>

<style>
	:global(body:has(.edition.ed-root)) {
		margin: 0;
		background: transparent;
	}
	.ed-root {
		position: relative;
		box-sizing: border-box;
		min-height: 100vh;
		background: var(--ed-paper);
		color: #000;
		font-family: var(--ed-body);
		font-size: 16px;
		line-height: 1.45;
	}
	p {
		margin: 0;
	}
	a {
		color: inherit;
		text-underline-offset: 3px;
	}
	.wrap {
		position: relative;
		box-sizing: border-box;
		max-width: 1180px;
		margin: 0 auto;
		padding: 20px 24px 40px;
	}
	.preview {
		margin-bottom: 12px;
		font: 400 13px var(--ed-mono);
	}
	.banner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		overflow: hidden;
		min-height: 360px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-card);
	}
	.words {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: center;
		gap: 16px;
		padding: 36px;
	}
	h1 {
		margin: 0;
		font-family: var(--ed-display);
		font-size: clamp(50px, 6.6vw, 88px);
		font-weight: 400;
		line-height: 1.02;
		text-transform: uppercase;
	}
	.msg {
		max-width: 44ch;
		font-size: 17px;
	}
	.buy {
		font-family: var(--ed-mono);
		font-weight: 700;
		text-decoration: none;
		text-transform: uppercase;
	}
	.art {
		position: relative;
		overflow: hidden;
		min-height: 240px;
		border-left: 2px solid #000;
		background: var(--ed-paper);
	}
	.art :global(.string) {
		z-index: 1;
	}
	.stripes {
		height: 18px;
		margin-top: 12px;
		border: 2px solid #000;
		border-radius: 8px;
		background: repeating-linear-gradient(-45deg, var(--ed-pop-1) 0 14px, #fff 14px 28px);
	}
	.pills {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		margin-top: 12px;
		padding-bottom: 2px;
	}
	.pills button {
		flex: none;
		padding: 8px 14px;
		border: 2px solid #000;
		border-radius: 6px;
		background: #fff;
		color: #000;
		font: 700 13px var(--ed-mono);
		text-transform: uppercase;
	}
	.pills button:hover {
		background: var(--ed-pop-3);
	}
	.pills .on,
	.pills .on:hover {
		background: #000;
		color: #fff;
	}
	/* Products on a page: every box is the same size, photo on top and words below. */
	.catalog {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		grid-auto-rows: 1fr;
		gap: 12px;
		margin-top: 12px;
	}
	.product {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-sizing: border-box;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-card);
	}
	.product.top {
		background: var(--ed-pop-4);
	}
	/* Motion: boxes pop in once, lift when pointed at, and the drawings wobble when you reach them. */
	.product {
		animation: pop 0.4s cubic-bezier(0.2, 1.5, 0.4, 1) backwards;
		animation-delay: calc(var(--n) * 55ms);
		transition: transform 0.14s ease, box-shadow 0.14s ease;
	}
	.product:hover {
		box-shadow: 6px 6px 0 #000;
		transform: translate(-3px, -3px);
	}
	.product:hover .shot img,
	.product:hover .blank :global(svg) {
		animation: wobble 0.5s ease-in-out;
	}
	.buy,
	.pills button,
	.note-form button,
	.note-link {
		transition: transform 0.1s ease, background-color 0.1s ease;
	}
	.buy:active,
	.pills button:active,
	.note-form button:active {
		transform: translate(2px, 2px);
	}
	.vignettes li:hover .disc {
		animation: wobble 0.6s ease-in-out;
	}
	.vignettes li:hover .disc :global(svg) {
		animation: hop 0.6s ease-in-out;
	}
	.note-box[open] {
		animation: pop 0.25s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.note-box[open]::backdrop {
		animation: fade 0.2s ease;
	}
	.sent {
		animation: pop 0.3s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.92);
		}
	}
	@keyframes wobble {
		25% {
			transform: rotate(-3deg);
		}
		75% {
			transform: rotate(3deg);
		}
	}
	@keyframes hop {
		50% {
			transform: translateY(-10px);
		}
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.product,
		.note-box[open],
		.note-box[open]::backdrop,
		.sent,
		.product:hover .shot img,
		.product:hover .blank :global(svg),
		.vignettes li:hover .disc,
		.vignettes li:hover .disc :global(svg) {
			animation: none;
		}
		.product:hover {
			transform: none;
		}
	}
	.shot {
		position: relative;
		flex: none;
		height: 220px;
		border-bottom: 2px solid #000;
		background: #fff;
	}
	.shot img {
		display: block;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		padding: 10px;
		object-fit: contain;
	}
	.blank {
		display: grid;
		place-items: center;
		box-sizing: border-box;
		height: 100%;
		padding: 34px;
		background: var(--ed-paper);
	}
	.text {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
		padding: 14px;
	}
	.badge {
		position: absolute;
		top: 8px;
		left: 8px;
		padding: 2px 8px;
		background: #000;
		color: #fff;
		font: 700 12px var(--ed-mono);
		text-transform: uppercase;
	}
	.product h2 {
		display: -webkit-box;
		overflow: hidden;
		margin: 0;
		font-size: 17px;
		font-weight: 700;
		line-height: 1.25;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.price {
		margin-top: 6px;
		font: 700 16px var(--ed-mono);
	}
	.store {
		font: 400 13px var(--ed-mono);
		text-transform: uppercase;
	}
	.fine {
		display: -webkit-box;
		overflow: hidden;
		margin-top: 6px;
		color: var(--ed-muted);
		font-size: 14px;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.acts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 14px;
		margin-top: auto;
		padding-top: 12px;
		font-size: 14px;
	}
	.buy {
		padding: 6px 10px;
		background: #000;
		color: #fff;
		font-size: 12px;
	}
	.buy:hover {
		background: var(--ed-pop-1);
		color: #000;
	}
	.note-link {
		padding: 0;
		border: 0;
		background: none;
		color: #000;
		font: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.note-box {
		box-sizing: border-box;
		width: min(440px, calc(100vw - 32px));
		padding: 22px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-pop-3);
		color: #000;
		font-family: var(--ed-body);
	}
	.note-box::backdrop {
		background: rgba(0, 0, 0, 0.55);
	}
	.note-box h2 {
		margin: 0;
		font-family: var(--ed-display);
		font-size: 34px;
		font-weight: 400;
		line-height: 1.1;
		text-transform: uppercase;
	}
	.note-box.wide {
		width: min(560px, calc(100vw - 32px));
		max-height: calc(100vh - 48px);
		background: #fff;
	}
	.full {
		display: flex;
		gap: 16px;
		padding-right: 60px;
	}
	.full img {
		flex: none;
		width: 130px;
		height: 130px;
		border: 2px solid #000;
		border-radius: 6px;
		object-fit: contain;
	}
	.full h2 {
		font-size: 26px;
	}
	.all {
		margin-top: 14px;
		white-space: pre-line;
		font-size: 16px;
	}
	.about {
		margin-bottom: 4px;
		font-size: 15px;
	}
	.close {
		position: absolute;
		top: 16px;
		right: 16px;
		padding: 4px 8px;
		border: 2px solid #000;
		background: #fff;
		color: #000;
		font: 700 12px var(--ed-mono);
		text-transform: uppercase;
	}
	.empty {
		padding: 24px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-card);
		font-size: 18px;
	}
	.panel {
		margin-top: 12px;
		padding: 18px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-card);
	}
	.export {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}
	.export button,
	.export a {
		padding: 8px 14px;
		border: 2px solid #000;
		border-radius: 6px;
		background: #fff;
		color: #000;
		font: 700 13px var(--ed-mono);
		text-decoration: none;
		text-transform: uppercase;
	}
	.export button:hover,
	.export a:hover {
		background: var(--ed-pop-3);
	}
	.vignettes {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
		margin: 12px 0 0;
		padding: 20px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-card);
		list-style: none;
	}
	.vignettes li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.disc {
		box-sizing: border-box;
		width: 150px;
		height: 150px;
		padding: 22px;
		border: 2px solid #000;
		border-radius: 50%;
		background: var(--ed-pop-3);
	}
	.vignettes li:nth-child(2) .disc {
		background: var(--ed-pop-4);
	}
	.vignettes li:nth-child(3) .disc {
		background: var(--ed-pop-2);
	}
	.vignettes li:nth-child(4) .disc {
		background: var(--ed-pop-1);
	}
	.letter {
		width: 120px;
		height: 120px;
		margin-top: 8px;
	}
	.foot {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 24px;
		margin-top: 12px;
		padding: 24px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-pop-1);
	}
	.foot h2 {
		margin: 0 0 4px;
		font-family: var(--ed-display);
		font-size: 44px;
		font-weight: 400;
		line-height: 1.1;
		text-transform: uppercase;
	}
	.note-form {
		position: relative;
		display: grid;
		gap: 10px;
		margin-top: 10px;
	}
	.foot .note-form {
		margin-top: 0;
	}
	.note-form label {
		display: grid;
		gap: 4px;
		font: 700 12px var(--ed-mono);
		text-transform: uppercase;
	}
	input,
	textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 9px 11px;
		border: 2px solid #000;
		border-radius: 6px;
		background: #fff;
		color: #000;
		font: 400 16px var(--ed-body);
	}
	.trap {
		position: absolute;
		left: -9999px;
		width: 1px;
	}
	button {
		cursor: pointer;
	}
	.note-form button,
	.lock button {
		justify-self: start;
		padding: 10px 16px;
		border: 0;
		border-radius: 0;
		background: #000;
		color: #fff;
		font: 700 13px var(--ed-mono);
		text-transform: uppercase;
	}
	.ed-root :focus-visible {
		outline: 3px solid #000;
		outline-offset: 2px;
	}
	.err {
		margin-top: 8px;
		font-weight: 700;
	}
	.sent {
		margin-top: 8px;
		font: 700 14px var(--ed-mono);
	}
	.lock {
		box-sizing: border-box;
		max-width: 440px;
		margin: 16vh auto 0;
		padding: 28px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-pop-3);
	}
	.lock h1 {
		margin-bottom: 8px;
		font-size: 46px;
	}
	.lock form {
		display: flex;
		gap: 8px;
		margin-top: 16px;
	}
	.lock input {
		flex: 1;
		min-width: 0;
	}
	.lock button {
		flex: none;
	}
	/* Save as PDF: a clean printed list, with the extras left out. */
	@media print {
		.ed-root {
			background: #fff;
		}
		.wrap {
			max-width: none;
			padding: 0;
		}
		.banner {
			display: block;
			min-height: 0;
			border: 0;
		}
		.words {
			padding: 0 0 12px;
		}
		h1 {
			font-size: 40px;
		}
		.art,
		.stripes,
		.pills,
		.preview,
		.panel,
		.export,
		.vignettes,
		.foot,
		.note-link,
		.note-box,
		.ed-root :global(.fall),
		.words :global(.count) {
			display: none;
		}
		.catalog {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			grid-auto-rows: auto;
			gap: 8px;
		}
		.product {
			break-inside: avoid;
			animation: none;
		}
		.shot {
			height: 150px;
		}
		.fine {
			display: block;
			overflow: visible;
		}
		.product.top {
			background: #fff;
		}
		.buy {
			padding: 0;
			background: none;
			color: #000;
			font-size: 10px;
			text-transform: none;
			word-break: break-all;
		}
		.buy::after {
			content: ': ' attr(href);
		}
	}
	@media (max-width: 760px) {
		.wrap {
			padding: 10px 10px 24px;
		}
		.banner {
			display: flex;
			flex-direction: column;
			min-height: 0;
		}
		.words {
			padding: 22px 18px;
		}
		.art {
			height: 210px;
			min-height: 0;
			border-top: 2px solid #000;
			border-left: 0;
		}
		.catalog {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 8px;
		}
		.shot {
			height: 150px;
		}
		.blank {
			padding: 26px;
		}
		.text {
			padding: 10px;
		}
		.product h2 {
			font-size: 15px;
		}
		.fine {
			font-size: 13px;
		}
		.vignettes {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			padding: 14px;
		}
		.disc {
			width: 112px;
			height: 112px;
			padding: 16px;
		}
		.letter {
			display: none;
		}
		.foot {
			grid-template-columns: minmax(0, 1fr);
			gap: 12px;
			padding: 18px;
		}
	}
</style>
