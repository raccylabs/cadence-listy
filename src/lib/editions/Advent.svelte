<script>
	/** 24 doors. A door opens once its December day arrives, and shows something from the list. */
	let { items, now, year } = $props();
	const inDecember = $derived(now.startsWith(`${year}-12`));
	const day = $derived(inDecember ? Number(now.slice(8, 10)) : 0);
	let opened = $state(0);
	const behind = $derived(opened && items.length ? items[(opened - 1) % items.length].title : '');
</script>

<section>
	<h2>Advent calendar</h2>
	<div class="doors">
		{#each Array(24) as _, i}
			{@const d = i + 1}
			<button type="button" class:open={opened === d} class:today={d === day} disabled={d > day} aria-label="December {d}" onclick={() => (opened = d)}>{d}</button>
		{/each}
	</div>
	<p aria-live="polite">
		{#if behind}Door {opened}: {behind}
		{:else if inDecember}Open today's door.
		{:else}Doors start opening December 1.{/if}
	</p>
</section>

<style>
	h2 {
		margin: 0 0 14px;
		font-family: var(--ed-display);
		font-size: 30px;
		font-weight: 400;
		line-height: 1.1;
	}
	.doors {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 6px;
	}
	button {
		aspect-ratio: 1;
		padding: 0;
		border: 0;
		border-radius: 12px;
		background: var(--ed-pop-4);
		color: var(--ed-ink);
		font: 600 14px var(--ed-body);
		cursor: pointer;
	}
	button:disabled {
		background: var(--ed-paper);
		color: var(--ed-muted);
		cursor: default;
	}
	.today {
		background: var(--ed-pop-3);
		color: var(--ed-ink);
	}
	.open {
		background: var(--ed-ink);
		color: #fff;
	}
	p {
		margin: 12px 0 0;
		font: 400 14px var(--ed-body);
		color: var(--ed-muted);
	}
	@media (max-width: 640px) {
		.doors {
			grid-template-columns: repeat(6, minmax(0, 1fr));
		}
	}
</style>
