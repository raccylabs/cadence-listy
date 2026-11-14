<script>
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { FINALE } from '$lib/advent.js';
	import Decor from '$lib/editions/Decor.svelte';
	import Spot from '$lib/editions/Spot.svelte';
	import AdventDoor from '$lib/AdventDoor.svelte';

	let { data } = $props();
	const cal = $derived(data.calendar);
	// Real advent calendars hide the numbers in a jumble.
	const ORDER = [7, 15, 2, 20, 11, 24, 4, 18, 9, 13, 1, 22, 16, 6, 23, 3, 10, 19, 12, 21, 5, 17, 8, 14, FINALE];
	const ICON = { note: '✉️', coupon: '🎟️', riddle: '❓', clue: '🗺️', activity: '🎄' };
	const TINT = ['var(--ed-pop-1)', 'var(--ed-pop-2)', '#fffdf9', 'var(--ed-pop-3)', 'var(--ed-pop-4)'];

	let swinging = $state(new Set());
	let localOpen = $state(new Set());
	let shown = $state(null);
	let busy = $state(false);
	let problem = $state('');
	let dialog;

	const door = (d) => cal.doors[d - 1];
	const isOpen = (d) => door(d).opened || localOpen.has(d);
	const openedCount = $derived(cal.doors.filter((d) => d.opened).length + localOpen.size);

	async function send(action, fields) {
		if (cal.preview) return true;
		busy = true;
		problem = '';
		const body = new FormData();
		for (const [k, v] of Object.entries(fields)) body.set(k, v);
		try {
			const res = deserialize(await (await fetch(`?/${action}`, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } })).text());
			if (res.type === 'failure') problem = res.data?.error ?? 'Something went wrong.';
			await invalidateAll();
			return res.type === 'success';
		} catch {
			problem = "Couldn't reach Listy. Try again.";
			return false;
		} finally {
			busy = false;
		}
	}

	function knock(d) {
		const x = door(d);
		if (x.locked) {
			problem = `No peeking! This door opens on December ${d}.`;
			return;
		}
		problem = '';
		if (isOpen(d)) return show(d);
		swinging = new Set([...swinging, d]);
		localOpen = new Set([...localOpen, d]);
		send('open', { day: d });
		setTimeout(() => show(d), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650);
	}
	function show(d) {
		shown = d;
		dialog?.showModal();
	}
	// Keep the open dialog in step with fresh data after a reaction.
	const current = $derived(shown ? { ...door(shown), opened: true } : null);
	let previewReactions = $state({});
	let previewUsed = $state({});
	const view = $derived(current && cal.preview ? { ...current, reaction: previewReactions[shown] ?? '', used: previewUsed[shown] ?? false } : current);
</script>

<svelte:head><title>Advent calendar · {data.group.name}</title></svelte:head>

<div class="edition ed-root" data-edition="christmas">
	<Decor edition="christmas" options={{ snow: true }} part="fall" />
	<p class="small top-links"><a href="/groups/{data.group.id}">{data.group.name}</a>{#if data.group.mine} · <a href="/groups/{data.group.id}/advent/setup">Set up the doors</a>{/if}</p>

	{#if cal.preview}
		<p class="preview" role="status">Previewing {cal.forName}'s calendar as if it were December {cal.today}. Nothing you do here is saved. <a href="/groups/{data.group.id}/advent/setup">Back to setup</a></p>
	{/if}

	<header class="head">
		<div class="art"><Spot name="tree" /></div>
		<div>
			<h1>{cal.preview ? `${cal.forName}'s` : 'Your'} advent calendar</h1>
			<p>
				{#if cal.today === 0}The first door opens December 1. No peeking!
				{:else if cal.today >= FINALE}Merry Christmas! {openedCount} of {FINALE} doors opened.
				{:else}{openedCount} of {cal.today} doors opened so far. A new one opens every day.{/if}
			</p>
		</div>
	</header>

	{#if problem}<p class="problem" role="alert">{problem}</p>{/if}

	<div class="doors">
		{#each ORDER as d, i (d)}
			{@const x = door(d)}
			{@const today = !x.locked && (d === cal.today || (cal.today >= FINALE && d === FINALE)) && !isOpen(d)}
			<button
				type="button"
				class="door"
				class:finale={d === FINALE}
				class:locked={x.locked}
				class:today
				class:open={isOpen(d)}
				class:swing={swinging.has(d)}
				style="--tint:{TINT[i % TINT.length]}"
				aria-label="December {d}{x.locked ? ', not yet' : isOpen(d) ? ', opened' : ''}"
				onclick={() => knock(d)}
			>
				<span class="behind">
					{#if !x.locked}
						{#if x.image}<img src={x.image} alt="" loading="lazy" />{:else}<span class="icon">{ICON[x.kind] ?? '🎁'}</span>{/if}
						<span class="tag">{d}</span>
						{#if x.reaction}<span class="mine">{x.reaction === 'heart' ? '❤️' : x.reaction === 'laugh' ? '😂' : '⭐'}</span>{/if}
					{/if}
				</span>
				<span class="panel">
					<span class="num">{d}</span>
					{#if d === FINALE}<span class="word">Christmas</span>{/if}
					<span class="knob"></span>
				</span>
			</button>
		{/each}
	</div>
</div>

<dialog bind:this={dialog} class="edition sheet" data-edition="christmas" onclose={() => (shown = null)} onclick={(e) => e.target === dialog && dialog.close()}>
	{#if view}
		<div class="sheet-head">
			<p class="day">December {view.day}</p>
			<button type="button" class="x" aria-label="Close" onclick={() => dialog.close()}>×</button>
		</div>
		<AdventDoor
			door={view}
			{busy}
			onreact={(r) => (cal.preview ? (previewReactions = { ...previewReactions, [view.day]: r }) : send('react', { day: view.day, reaction: r }))}
			oncoupon={(used) => (cal.preview ? (previewUsed = { ...previewUsed, [view.day]: used }) : send('coupon', { day: view.day, ...(used ? { used: 'on' } : {}) }))}
		/>
	{/if}
</dialog>

<style>
	.ed-root {
		position: relative;
		margin: 0 -16px;
		padding: 4px 16px 40px;
		border-radius: 22px;
		background: var(--ed-paper);
		color: var(--ed-ink);
		font-family: var(--ed-body);
	}
	.top-links,
	.preview {
		position: relative;
		margin: 8px 0 12px;
	}
	.preview {
		padding: 10px 14px;
		border-radius: 12px;
		background: var(--ed-pop-3);
		font-weight: 600;
	}
	.head {
		position: relative;
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 18px;
	}
	.art {
		flex: none;
		width: 84px;
		height: 84px;
	}
	h1 {
		margin: 0 0 4px;
		font-family: var(--ed-display);
		font-size: clamp(34px, 5vw, 56px);
		font-weight: 400;
		line-height: 1.02;
	}
	.head p {
		margin: 0;
		font-size: 17px;
	}
	.problem {
		position: relative;
		margin: 0 0 12px;
		font-weight: 700;
	}
	.doors {
		position: relative;
		display: grid;
		grid-template-columns: repeat(7, minmax(0, 1fr));
		grid-auto-flow: dense;
		gap: 12px;
	}
	.door {
		position: relative;
		aspect-ratio: 1;
		padding: 0;
		border: 0;
		border-radius: 16px;
		background: #3b2a25;
		cursor: pointer;
		perspective: 700px;
	}
	.finale {
		grid-column: 6 / span 2;
		grid-row: 2 / span 2;
	}
	.behind {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		overflow: hidden;
		border-radius: 16px;
		background: #fffaf2;
		box-shadow: inset 0 3px 10px rgba(59, 42, 37, 0.35);
	}
	.behind img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.tag,
	.mine {
		position: absolute;
		top: 6px;
		padding: 0 7px;
		border-radius: 999px;
		background: rgba(255, 253, 249, 0.92);
		font: 400 14px/20px var(--ed-display);
		box-shadow: 0 1px 3px rgba(59, 42, 37, 0.3);
	}
	.tag {
		left: 6px;
	}
	.mine {
		right: 6px;
		font-size: 12px;
	}
	.icon {
		font-size: clamp(24px, 4vw, 40px);
	}
	.finale .icon {
		font-size: clamp(48px, 8vw, 80px);
	}
	.panel {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 16px;
		background: var(--tint);
		box-shadow: inset 0 0 0 5px rgba(255, 255, 255, 0.35), 0 6px 14px -6px rgba(59, 42, 37, 0.45);
		transform-origin: left center;
		transition: transform 0.65s cubic-bezier(0.3, 1.3, 0.5, 1);
		backface-visibility: hidden;
	}
	.panel::before {
		position: absolute;
		inset: 8px;
		border: 2px dashed rgba(255, 255, 255, 0.7);
		border-radius: 10px;
		content: '';
	}
	.num {
		position: relative;
		color: var(--ed-ink);
		font: 400 clamp(22px, 3.4vw, 40px) / 1 var(--ed-display);
		text-shadow: 0 2px 0 rgba(255, 255, 255, 0.5);
	}
	.finale .num {
		font-size: clamp(56px, 9vw, 110px);
	}
	.word {
		position: relative;
		font: 700 clamp(12px, 1.6vw, 18px) var(--ed-body);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.knob {
		position: absolute;
		top: 50%;
		right: 12px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #f5c451;
		box-shadow: 0 1px 0 rgba(59, 42, 37, 0.5);
	}
	.open .panel {
		transform: rotateY(-108deg);
	}
	.open:not(.swing) .panel {
		transition: none;
	}
	.locked {
		cursor: not-allowed;
	}
	.locked .panel {
		filter: saturate(0.35) brightness(0.97);
	}
	.locked .num {
		opacity: 0.6;
	}
	.today {
		z-index: 1;
		animation: wiggle 1.6s ease-in-out infinite;
	}
	.today .panel {
		box-shadow: inset 0 0 0 5px rgba(255, 255, 255, 0.35), 0 0 0 4px #f5c451, 0 10px 24px -6px rgba(245, 196, 81, 0.9);
	}
	.door:not(.locked):hover .panel {
		transform: rotateY(-14deg);
	}
	.open:hover .panel {
		transform: rotateY(-108deg);
	}
	.door:focus-visible {
		outline: 3px solid #5b9bd5;
		outline-offset: 3px;
	}
	.sheet {
		margin: auto;
		background: var(--ed-paper);
		color: var(--ed-ink);
		font-family: var(--ed-body);
		width: min(560px, calc(100vw - 24px));
		max-height: calc(100vh - 32px);
		padding: 18px 20px 22px;
		border: 0;
		border-radius: 22px;
		box-shadow: 0 30px 80px -20px rgba(59, 42, 37, 0.6);
	}
	.sheet::backdrop {
		background: rgba(59, 42, 37, 0.45);
	}
	.sheet[open] {
		animation: rise 0.35s cubic-bezier(0.2, 1.3, 0.4, 1);
	}
	.sheet-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;
	}
	.day {
		margin: 0;
		font: 400 22px var(--ed-display);
	}
	.x {
		width: 36px;
		height: 36px;
		border: 0;
		border-radius: 50%;
		background: var(--ed-pop-4);
		color: var(--ed-ink);
		font-size: 24px;
		line-height: 1;
		cursor: pointer;
	}
	@keyframes wiggle {
		0%,
		60%,
		100% {
			transform: rotate(0);
		}
		70% {
			transform: rotate(-4deg) scale(1.04);
		}
		80% {
			transform: rotate(4deg) scale(1.04);
		}
		90% {
			transform: rotate(-2deg);
		}
	}
	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(30px) scale(0.95);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.today,
		.sheet[open] {
			animation: none;
		}
		.panel {
			transition: none;
		}
	}
	@media (max-width: 700px) {
		.doors {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 8px;
		}
		.finale {
			grid-column: 2 / span 2;
			grid-row: 3 / span 2;
		}
		.knob {
			right: 7px;
			width: 6px;
			height: 6px;
		}
		.panel::before {
			inset: 5px;
		}
	}
</style>
