<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { EDITIONS } from '$lib/editions/index.js';
	import Decor from '$lib/editions/Decor.svelte';
	import Countdown from '$lib/editions/Countdown.svelte';
	import Advent from '$lib/editions/Advent.svelte';

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
	// If a linked image is gone, fall back to the standard banner.
	let bannerFailed = $state(false);
	const bannerImage = $derived(
		!list || bannerFailed ? '' : list.bannerUrl || (list.banner ? `/share/${page.params.token}/banner?v=${list.banner}` : '')
	);
	/** The image can fail before the page's code starts, so check once on mount too. */
	const watchBanner = (img) => {
		if (img.complete && img.naturalWidth === 0) bannerFailed = true;
	};
	const photo = (item) => `/share/${page.params.token}/photo/${item.id}?v=${item.photo}`;
</script>

<svelte:head>
	<title>{list?.title ?? `${edition.name} list`}</title>
	<meta name="robots" content="noindex, nofollow" />
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
			<div class="banner">
				<div class="words">
					<h1>{edition.name} list</h1>
					<p>Enter the PIN to open this list.</p>
					<form method="POST" action="?/unlock" use:enhance>
						<input name="pin" type="password" inputmode="numeric" autocomplete="off" pattern="\d*" maxlength="8" required aria-label="PIN" />
						<button>Open list</button>
					</form>
					{#if form?.pinError}<p class="err" role="alert">{form.pinError}</p>{/if}
				</div>
			</div>
		</main>
	{:else}
		<Decor edition={edition.id} {options} part="fall" />
		<main class="wrap">
			{#if data.isOwner}
				<p class="preview">This is how your list looks to visitors. <a href="/lists/{data.ownerListId}">Back to editing</a></p>
			{/if}
			<header class="banner" class:pic={bannerImage}>
				{#if bannerImage}
					<img class="bg" src={bannerImage} alt="" referrerpolicy="no-referrer" use:watchBanner onerror={() => (bannerFailed = true)} />
				{:else if options.stripes}
					<div class="stripes" aria-hidden="true"></div>
				{/if}
				<Decor edition={edition.id} {options} part="string" />
				<div class="words">
					<h1>{list.title}</h1>
					{#if list.message}<p class="msg">{list.message}</p>{/if}
				</div>
				{#if options.countdown}<div class="tag"><Countdown days={list.days} {edition} /></div>{/if}
			</header>

			{#if shelves.length > 1}
				<div class="pills" role="group" aria-label="Filter the list">
					<button type="button" class:on={!shown} aria-pressed={!shown} onclick={() => (shown = 0)}>All wishes</button>
					{#each shelves as s (s.tier)}
						<button type="button" class:on={shown === s.tier} aria-pressed={shown === s.tier} onclick={() => (shown = s.tier)}>{s.name}</button>
					{/each}
				</div>
			{/if}

			{#if board.length}
				<div class="catalog">
					{#each board as item (item.id)}
						<article class="product">
							<div class="shot">
								{#if item.photo}
									<img src={photo(item)} alt={item.title} loading="lazy" />
								{:else}
									<div class="blank" aria-hidden="true"></div>
								{/if}
								{#if item.featured && options.spotlight}<span class="badge">Top pick</span>{/if}
							</div>
							<div class="text">
								{#if item.price}<p class="price">{item.price}</p>{/if}
								<h2>{item.title}</h2>
								{#if item.store}<p class="fine">at {item.store}</p>{/if}
								{#if item.details}<p class="fine">{item.details}</p>{/if}
								<div class="acts">
									{#if item.url}<a class="buy" href={item.url} target="_blank" rel="noopener noreferrer">View item</a>{/if}
									<details open={form?.noted === `item-${item.id}`}>
										<summary>Leave a note</summary>
										{@render noteForm(item)}
									</details>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<p class="empty">Nothing on this list yet. Check back soon.</p>
			{/if}

			<div class="lower" class:solo={!options.advent}>
				<section class="panel foot">
					<h2>Leave a note</h2>
					<p class="fine">Only the owner of this list will see it.</p>
					{@render noteForm(null)}
				</section>
				{#if options.advent}
					<div class="panel"><Advent items={list.items} now={list.now} year={list.event_date.slice(0, 4)} /></div>
				{/if}
			</div>
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
		background: var(--ed-bg);
		color: var(--ed-text);
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
		max-width: 1240px;
		margin: 0 auto;
		padding: 20px 24px 56px;
	}
	.preview {
		margin-bottom: 12px;
		color: var(--ed-muted);
		font-size: 14px;
	}
	.preview a {
		text-decoration: underline;
	}
	.banner {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 32px;
		overflow: hidden;
		min-height: 260px;
		box-sizing: border-box;
		border: 2px solid var(--ed-feature);
		border-radius: 24px;
		background: var(--ed-feature);
		color: var(--ed-on-feature);
	}
	.stripes {
		position: absolute;
		inset: 0;
		background: repeating-linear-gradient(-45deg, var(--ed-stripe) 0 30px, var(--ed-feature) 30px 60px);
		/* A straight cut that runs the same way as the stripes. */
		-webkit-mask-image: linear-gradient(135deg, transparent 62%, #000 62%);
		mask-image: linear-gradient(135deg, transparent 62%, #000 62%);
	}
	/* White bulbs vanish on white stripes, so the string stops before them. */
	.banner:has(.stripes) :global(.string) {
		right: 40%;
	}
	/* An uploaded image fills the banner, with a soft shade so the title stays readable. */
	.bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.pic {
		border-color: var(--ed-line);
		background: #2a1a1c;
	}
	.pic::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, rgba(20, 10, 12, 0.72), rgba(20, 10, 12, 0.3) 55%, rgba(20, 10, 12, 0));
	}
	.pic .words,
	.pic .tag,
	.pic :global(.string) {
		z-index: 1;
	}
	.pic h1,
	.pic .msg {
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.35);
	}
	.words {
		position: relative;
		max-width: 620px;
		padding: 76px 40px 40px;
	}
	h1 {
		margin: 0;
		font-family: var(--ed-display);
		font-size: clamp(34px, 5.2vw, 60px);
		font-weight: 800;
		line-height: 1.02;
		letter-spacing: -0.03em;
		text-wrap: balance;
	}
	.msg {
		max-width: 46ch;
		margin-top: 12px;
		font-size: 18px;
		font-weight: 500;
	}
	.tag {
		position: relative;
		flex: none;
		margin: 76px 56px 36px 0;
	}
	.pills {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		margin: 24px 0 20px;
		padding-bottom: 2px;
	}
	.pills button {
		flex: none;
		padding: 9px 16px;
		border: 1.5px solid var(--ed-line);
		border-radius: 99px;
		background: #fff;
		color: var(--ed-text);
		font: 600 15px var(--ed-body);
	}
	.pills button:hover {
		border-color: var(--ed-feature);
	}
	.pills .on {
		border-color: var(--ed-feature);
		background: var(--ed-feature);
		color: var(--ed-on-feature);
	}
	.catalog {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 16px;
	}
	.banner + .catalog {
		margin-top: 24px;
	}
	.product {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border: 1px solid var(--ed-line);
		border-radius: 18px;
		background: var(--ed-card);
	}
	.shot {
		position: relative;
		aspect-ratio: 1;
		background: var(--ed-tint);
	}
	.shot img,
	.blank {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.blank {
		background: repeating-linear-gradient(-45deg, var(--ed-tint) 0 22px, var(--ed-tint-2) 22px 44px);
	}
	.badge {
		position: absolute;
		top: 12px;
		left: 12px;
		padding: 4px 10px;
		border-radius: 99px;
		background: var(--ed-feature);
		color: var(--ed-on-feature);
		font-size: 13px;
		font-weight: 700;
	}
	.text {
		display: flex;
		flex: 1;
		flex-direction: column;
		padding: 14px;
	}
	.price {
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.02em;
		font-variant-numeric: tabular-nums;
	}
	.text h2 {
		margin: 2px 0 0;
		font-size: 16px;
		font-weight: 500;
		line-height: 1.3;
	}
	.fine {
		margin-top: 2px;
		color: var(--ed-muted);
		font-size: 14px;
	}
	.fine {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-clamp: 3;
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
		padding: 7px 14px;
		border-radius: 99px;
		background: var(--ed-feature);
		color: var(--ed-on-feature);
		font-weight: 700;
		text-decoration: none;
	}
	.acts details[open] {
		flex-basis: 100%;
	}
	summary {
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
		list-style: none;
	}
	summary::-webkit-details-marker {
		display: none;
	}
	.empty {
		margin-top: 24px;
		color: var(--ed-muted);
		font-size: 18px;
	}
	.lower {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
		align-items: start;
		margin-top: 32px;
	}
	.lower.solo {
		grid-template-columns: minmax(0, 560px);
	}
	.panel {
		padding: 20px;
		border-radius: 18px;
		background: var(--ed-tint);
	}
	.foot h2 {
		margin: 0;
		font-family: var(--ed-display);
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.note-form {
		position: relative;
		display: grid;
		gap: 10px;
		margin-top: 12px;
	}
	.note-form label {
		display: grid;
		gap: 4px;
		font-size: 14px;
		font-weight: 600;
	}
	input,
	textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--ed-line);
		border-radius: 12px;
		background: #fff;
		color: var(--ed-text);
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
		padding: 9px 18px;
		border: 0;
		border-radius: 99px;
		background: var(--ed-feature);
		color: var(--ed-on-feature);
		font: 700 15px var(--ed-body);
	}
	.ed-root :focus-visible {
		outline: 2px solid var(--ed-text);
		outline-offset: 2px;
	}
	.err {
		margin-top: 8px;
		font-weight: 700;
	}
	.sent {
		margin-top: 8px;
		color: var(--ed-feature);
		font-weight: 700;
	}
	.lock {
		max-width: 440px;
		margin: 0 auto;
		padding: 16vh 16px 0;
	}
	.lock .banner {
		min-height: 0;
	}
	.lock .words {
		width: 100%;
		box-sizing: border-box;
		padding: 32px;
	}
	.lock h1 {
		margin-bottom: 8px;
		font-size: 34px;
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
		background: #fff;
		color: var(--ed-feature);
	}
	@media (max-width: 760px) {
		.wrap {
			padding: 12px 12px 40px;
		}
		.banner {
			display: block;
			min-height: 0;
			border-radius: 20px;
		}
		.pic::after {
			background: linear-gradient(180deg, rgba(20, 10, 12, 0.72), rgba(20, 10, 12, 0.35));
		}
		.stripes {
			-webkit-mask-image: linear-gradient(135deg, transparent 72%, #000 72%);
			mask-image: linear-gradient(135deg, transparent 72%, #000 72%);
		}
		.banner:has(.stripes) :global(.string) {
			right: 0;
		}
		.words {
			padding: 70px 20px 18px;
		}
		.msg {
			font-size: 16px;
		}
		.tag {
			margin: 0 0 18px 20px;
		}
		.catalog {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px;
		}
		.text {
			padding: 10px;
		}
		.price {
			font-size: 19px;
		}
		.lower,
		.lower.solo {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
