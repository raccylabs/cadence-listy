<script>
	let { days, edition } = $props();
</script>

<div class="count">
	{#if days <= 0}
		<p class="today">{edition.eventDay}</p>
	{:else}
		<p class="num">{days}</p>
		<p class="label">{days === 1 ? 'sleep' : 'sleeps'} until {edition.eventName}</p>
	{/if}
</div>

<style>
	p {
		margin: 0;
	}
	.count {
		box-sizing: border-box;
		width: 176px;
		padding: 16px;
		border-radius: 18px;
		background: #fff;
		color: var(--ed-text);
		text-align: center;
		box-shadow: 0 10px 24px -12px rgba(0, 0, 0, 0.4);
	}
	.num {
		color: var(--ed-feature);
		font-family: var(--ed-display);
		font-size: 68px;
		font-weight: 800;
		line-height: 1;
		letter-spacing: -0.04em;
		font-variant-numeric: tabular-nums;
	}
	.label {
		margin-top: 4px;
		font-size: 15px;
		font-weight: 600;
		line-height: 1.2;
	}
	.today {
		color: var(--ed-feature);
		font-family: var(--ed-display);
		font-size: 26px;
		font-weight: 800;
		line-height: 1.1;
	}
</style>
