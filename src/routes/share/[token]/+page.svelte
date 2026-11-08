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
					{#if list.items.length}
						<div class="export">
							<button type="button" class="get primary" onclick={() => window.print()}>
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" /></svg>
								Save as PDF
							</button>
							<a class="get" href="/share/{page.params.token}/list.csv" download data-sveltekit-reload>
								<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11 M7 10l5 5 5-5 M5 20h14" /></svg>
								Download CSV
							</a>
						</div>
					{/if}
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
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
					<article
						class="product"
						class:top={item.featured && options.spotlight}
						style="--n:{Math.min(i, 8)}"
						onclick={(e) => !e.target.closest('a, button') && openBox(item, 'details')}
					>
						<div class="shot">
							{#if item.photo}
								<img src={photo(item)} alt={item.title} loading="lazy" />
							{:else}
								<div class="blank"><Spot name={edition.spots[item.id % edition.spots.length]} /></div>
							{/if}
							{#if item.featured && options.spotlight}<p class="badge">Top pick</p>{/if}
						</div>
						<div class="text">
							<h2><button type="button" class="open" onclick={() => openBox(item, 'details')}>{item.title}</button></h2>
							{#if item.price}<p class="price">{item.price}</p>{/if}
							{#if item.store}<p class="store">{item.store}</p>{/if}
							{#if item.details}<p class="fine">{item.details}</p>{/if}
							<div class="acts">
								{#if item.url}<a class="buy" href={item.url} target="_blank" rel="noopener noreferrer">View item</a>{/if}
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

			<div class="cane" aria-hidden="true"></div>

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
					{#if boxItem.details}<p class="all">{boxItem.details}</p>{/if}
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
		color: var(--ed-ink);
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
		font: 400 13px var(--ed-body);
	}
	.banner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		overflow: hidden;
		min-height: 360px;
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-card);
		box-shadow: var(--ed-shadow);
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
	}
	.msg {
		max-width: 44ch;
		font-size: 17px;
	}
	.buy {
		font-family: var(--ed-body);
		font-weight: 700;
		text-decoration: none;
	}
	.art {
		position: relative;
		overflow: hidden;
		min-height: 240px;
		border-left: 1px solid var(--ed-line);
		background: var(--ed-paper);
	}
	.art :global(.string) {
		z-index: 1;
	}
	.stripes {
		margin-top: 14px;
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
		border: 1px solid var(--ed-line);
		border-radius: 999px;
		background: #fff;
		color: var(--ed-ink);
		font: 600 14px var(--ed-body);
	}
	.pills button:hover {
		background: var(--ed-pop-3);
	}
	.pills .on,
	.pills .on:hover {
		background: var(--ed-ink);
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
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-card);
		box-shadow: var(--ed-shadow);
	}
	.product.top {
		background: var(--ed-pop-4);
	}
	.product {
		cursor: pointer;
	}
	.open {
		padding: 0;
		border: 0;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	/* Motion: boxes pop in once, lift when pointed at, and the drawings wobble when you reach them. */
	.product {
		animation: pop 0.4s cubic-bezier(0.2, 1.5, 0.4, 1) backwards;
		animation-delay: calc(var(--n) * 55ms);
		transition: transform 0.14s ease, box-shadow 0.14s ease;
	}
	.product:hover {
		box-shadow: var(--ed-shadow-up);
		transform: translateY(-4px);
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
		.product:hover .blank :global(svg) {
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
		margin: 10px 10px 0;
		border-radius: 16px;
		background: #fff;
		overflow: hidden;
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
		border-radius: 999px;
		background: var(--ed-ink);
		color: #fff;
		font: 700 12px var(--ed-body);
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
		font: 700 16px var(--ed-body);
	}
	.store {
		font: 400 13px var(--ed-body);
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
		border-radius: 999px;
		background: var(--ed-ink);
		color: #fff;
		font-size: 12px;
	}
	.buy:hover {
		background: var(--ed-pop-1);
		color: var(--ed-ink);
	}
	.note-link {
		padding: 0;
		border: 0;
		background: none;
		color: var(--ed-ink);
		font: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.note-box {
		box-sizing: border-box;
		width: min(440px, calc(100vw - 32px));
		padding: 22px;
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-pop-3);
		color: var(--ed-ink);
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
		border: 1px solid var(--ed-line);
		border-radius: 14px;
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
		border: 1px solid var(--ed-line);
		background: #fff;
		color: var(--ed-ink);
		font: 700 12px var(--ed-body);
	}
	.empty {
		padding: 24px;
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-card);
		font-size: 18px;
		box-shadow: var(--ed-shadow);
	}
	.panel {
		margin-top: 12px;
		padding: 18px;
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-card);
		box-shadow: var(--ed-shadow);
	}
	.export {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.get {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 11px 18px;
		border: 1px solid var(--ed-line);
		border-radius: 999px;
		background: #fff;
		color: var(--ed-ink);
		font: 600 15px var(--ed-body);
		text-decoration: none;
		box-shadow: var(--ed-shadow);
		transition: transform 0.12s ease, box-shadow 0.12s ease;
	}
	.get.primary {
		border-color: transparent;
		background: var(--ed-pop-1);
		color: #fff;
	}
	.get:hover {
		box-shadow: var(--ed-shadow-up);
		transform: translateY(-2px);
	}
	.get svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	/* A candy cane laid flat: rounded ends, soft shine, stripes on the slant. */
	.cane,
	.stripes {
		height: 16px;
		border-radius: 999px;
		background:
			linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0) 45%, rgba(59, 42, 37, 0.1)),
			repeating-linear-gradient(-55deg, var(--ed-pop-1) 0 12px, #fffdf9 12px 24px);
		box-shadow: 0 2px 6px -2px rgba(59, 42, 37, 0.3);
	}
	.cane {
		margin: 28px 4px 16px;
	}
	/* Birthday: a band of pink frosting covered in sprinkles. */
	[data-edition='birthday'] .cane,
	[data-edition='birthday'] .stripes {
		background-color: #f7c6d4;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0) 50%, rgba(59, 42, 37, 0.06)),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='16'%3E%3Cg stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M5 5l6 3' stroke='%235aa9a3'/%3E%3Cpath d='M17 11l5-4' stroke='%23f5c96a'/%3E%3Cpath d='M28 4l2 6' stroke='%239b7fd1'/%3E%3Cpath d='M37 9l6 2' stroke='%23fffdf9'/%3E%3Cpath d='M48 5l5 4' stroke='%23e9806a'/%3E%3Cpath d='M60 11l4-6' stroke='%235aa9a3'/%3E%3Cpath d='M68 7l3 3' stroke='%23f5c96a'/%3E%3Cpath d='M10 12l3-1' stroke='%23fffdf9'/%3E%3Cpath d='M54 13l4-1' stroke='%239b7fd1'/%3E%3C/g%3E%3C/svg%3E");
		background-size: 100% 100%, 72px 16px;
		background-repeat: no-repeat, repeat-x;
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
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-pop-1);
		box-shadow: var(--ed-shadow);
	}
	.foot h2 {
		margin: 0 0 4px;
		font-family: var(--ed-display);
		font-size: 44px;
		font-weight: 400;
		line-height: 1.1;
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
		font: 700 12px var(--ed-body);
	}
	input,
	textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 9px 11px;
		border: 1px solid var(--ed-line);
		border-radius: 14px;
		background: #fff;
		color: var(--ed-ink);
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
		border-radius: 999px;
		background: var(--ed-ink);
		color: #fff;
		font: 700 13px var(--ed-body);
	}
	.ed-root :focus-visible {
		outline: 3px solid var(--ed-pop-1);
		outline-offset: 2px;
	}
	.err {
		margin-top: 8px;
		font-weight: 700;
	}
	.sent {
		margin-top: 8px;
		font: 700 14px var(--ed-body);
	}
	.lock {
		box-sizing: border-box;
		max-width: 440px;
		margin: 16vh auto 0;
		padding: 28px;
		border: 1px solid var(--ed-line);
		border-radius: 22px;
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
			color: var(--ed-ink);
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
			border-top: 1px solid var(--ed-line);
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
