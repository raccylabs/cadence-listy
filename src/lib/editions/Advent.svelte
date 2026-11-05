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
		margin: 0 0 12px;
		font-family: var(--ed-display);
		font-size: 22px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.doors {
		display: grid;
		grid-template-columns: repeat(8, minmax(0, 1fr));
		gap: 6px;
	}
	button {
		aspect-ratio: 1;
		padding: 0;
		border: 1px solid var(--ed-line);
		border-radius: 10px;
		background: transparent;
		color: var(--ed-text);
		font: 500 13px var(--ed-body);
		font-variant-numeric: tabular-nums;
		cursor: pointer;
	}
	button:disabled {
		color: var(--ed-muted);
		opacity: 0.6;
		cursor: default;
	}
	.today {
		border-color: var(--ed-feature);
		color: var(--ed-feature);
		font-weight: 700;
	}
	.open {
		border-color: var(--ed-feature);
		background: var(--ed-feature);
		color: var(--ed-on-feature);
	}
	p {
		margin: 12px 0 0;
		color: var(--ed-muted);
		font-size: 14px;
	}
</style>
