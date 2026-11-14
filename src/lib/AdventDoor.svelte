<script>
	/** What's behind an opened door. */
	import { DOOR_KINDS, REACTIONS, embedFor } from './advent.js';
	import Avatar from './Avatar.svelte';
	let { door, onreact = () => {}, oncoupon = () => {}, busy = false } = $props();
	let reveal = $state(false);
	const kindName = $derived(DOOR_KINDS.find(([k]) => k === door.kind)?.[1] ?? 'Message');
	const embed = $derived(door.link ? embedFor(door.link) : null);
	const head = $derived(
		{ coupon: 'A coupon for you', riddle: 'Riddle me this', clue: `Clue for day ${door.day}`, activity: "Today's family activity" }[door.kind] ?? ''
	);
</script>

<div class="inside {door.kind}">
	{#if door.image}<img class="pic" src={door.image} alt="" />{/if}
	<p class="chip">{door.builtIn ? 'A little surprise' : kindName}</p>
	{#if door.kind === 'coupon'}
		<div class="ticket" class:used={door.used}>
			<p class="small-head">{head}</p>
			{#if door.title}<h3>{door.title}</h3>{/if}
			{#if door.message}<p class="msg">{door.message}</p>{/if}
			{#if door.used}<span class="stamp">Used</span>{/if}
		</div>
		<label class="use"><input type="checkbox" checked={door.used} disabled={busy} onchange={(e) => oncoupon(e.currentTarget.checked)} /> I've used this coupon</label>
	{:else}
		{#if head}<p class="small-head">{head}</p>{/if}
		{#if door.title}<h3>{door.title}</h3>{/if}
		{#if door.message}<p class="msg">{door.message}</p>{/if}
		{#if door.kind === 'riddle' && door.answer}
			{#if reveal}<p class="answer">{door.answer}</p>{:else}<button type="button" class="btn" onclick={() => (reveal = true)}>Show the answer</button>{/if}
		{/if}
	{/if}
	{#if embed}
		<iframe class="embed" class:tall={embed.tall} src={embed.src} title="Video or song" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
	{/if}
	{#if door.link}<a class="btn link" href={door.link} target="_blank" rel="noopener noreferrer">Open the link</a>{/if}

	<div class="react" role="group" aria-label="React">
		{#each REACTIONS as [id, emoji] (id)}
			<button type="button" class:on={door.reaction === id} aria-pressed={door.reaction === id} aria-label={id} disabled={busy} onclick={() => onreact(door.reaction === id ? '' : id)}>{emoji}</button>
		{/each}
	</div>
	{#if door.family?.length}
		<div class="family">
			<p class="small-head">Opened by</p>
			<ul>
				{#each door.family as f (f.id)}
					<li>
						<span class="who"><Avatar avatar={f.avatar} photo={f.photo} size={34} label="" />{#if f.reaction}<span class="badge">{REACTIONS.find(([r]) => r === f.reaction)?.[1]}</span>{/if}</span>
						<span>{f.name}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.inside {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.pic {
		display: block;
		width: 100%;
		max-height: 340px;
		object-fit: contain;
		border-radius: 14px;
		background: #f3ebe0;
	}
	.chip {
		align-self: flex-start;
		margin: 0;
		padding: 2px 10px;
		border-radius: 999px;
		background: var(--ed-pop-4);
		font-size: 12px;
		font-weight: 700;
	}
	.small-head {
		margin: 0;
		color: var(--ed-muted);
		font-size: 13px;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}
	h3 {
		margin: 0;
		font-family: var(--ed-display);
		font-size: 28px;
		font-weight: 400;
		line-height: 1.1;
	}
	.msg {
		margin: 0;
		font-size: 17px;
		white-space: pre-wrap;
	}
	.answer {
		margin: 0;
		padding: 10px 14px;
		border-radius: 12px;
		background: var(--ed-pop-3);
		font-size: 18px;
		font-weight: 700;
		animation: pop 0.35s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.ticket {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 18px 20px;
		border: 3px dashed var(--ed-pop-1);
		border-radius: 16px;
		background: repeating-linear-gradient(-45deg, #fffaf2 0 12px, #fff4e6 12px 24px);
	}
	.ticket.used {
		opacity: 0.75;
	}
	.stamp {
		position: absolute;
		top: 14px;
		right: 14px;
		padding: 2px 12px;
		border: 3px solid #b42318;
		border-radius: 8px;
		color: #b42318;
		font: 400 24px var(--ed-display);
		text-transform: uppercase;
		transform: rotate(-12deg);
		animation: pop 0.35s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.use {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 600;
	}
	.clue .msg {
		padding: 14px 16px;
		border-radius: 12px;
		background: #f5e6c8;
		font-family: Georgia, serif;
		font-style: italic;
	}
	.embed {
		width: 100%;
		aspect-ratio: 16 / 9;
		border: 0;
		border-radius: 14px;
	}
	.embed:not(.tall)[src*='spotify'] {
		aspect-ratio: auto;
		height: 152px;
	}
	.embed.tall {
		aspect-ratio: auto;
		height: 352px;
	}
	.btn {
		align-self: flex-start;
		padding: 8px 16px;
		border: 0;
		border-radius: 999px;
		background: var(--ed-ink);
		color: #fff;
		font: 700 15px var(--ed-body);
		text-decoration: none;
		cursor: pointer;
	}
	.react {
		display: flex;
		gap: 8px;
		padding-top: 6px;
		border-top: 1px solid var(--ed-line);
	}
	.react button {
		width: 46px;
		height: 46px;
		border: 2px solid var(--ed-line);
		border-radius: 50%;
		background: #fff;
		font-size: 22px;
		cursor: pointer;
		transition: transform 0.12s ease;
	}
	.react button:hover {
		transform: scale(1.1);
	}
	.react button.on {
		border-color: var(--ed-ink);
		background: var(--ed-pop-4);
		animation: pop 0.35s cubic-bezier(0.2, 1.5, 0.4, 1);
	}
	.family ul {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin: 6px 0 0;
		padding: 0;
		list-style: none;
	}
	.family li {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		font-weight: 600;
	}
	.who {
		position: relative;
		display: inline-flex;
	}
	.badge {
		position: absolute;
		right: -6px;
		bottom: -4px;
		font-size: 14px;
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.6);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.answer,
		.stamp,
		.react button.on {
			animation: none;
		}
	}
</style>
