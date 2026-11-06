<script>
	import Spot from './Spot.svelte';
	let { days, edition } = $props();
</script>

<aside class="count">
	{#if days <= 0}
		<p class="today">{edition.eventDay}</p>
	{:else}
		<p class="num">{days}</p>
		<p class="label">{days === 1 ? 'day' : 'days'} until {edition.eventName}</p>
	{/if}
	<div class="spot"><Spot name={edition.countdownSpot} /></div>
</aside>

<style>
	p {
		margin: 0;
	}
	.count {
		display: flex;
		align-items: center;
		gap: 12px;
		box-sizing: border-box;
		padding: 8px 14px;
		border: 2px solid #000;
		border-radius: 8px;
		background: var(--ed-pop-3);
		color: #000;
	}
	.num {
		font-family: var(--ed-display);
		font-size: 52px;
		line-height: 1.05;
	}
	.label {
		max-width: 11ch;
		font: 700 12px/1.25 var(--ed-mono);
		text-transform: uppercase;
	}
	.today {
		font-family: var(--ed-display);
		font-size: 28px;
		line-height: 1.1;
		text-transform: uppercase;
	}
	.spot {
		flex: none;
		width: 52px;
		height: 52px;
		transform-origin: 50% 100%;
		animation: sway 3s ease-in-out infinite alternate;
	}
	@keyframes sway {
		from {
			transform: rotate(-4deg);
		}
		to {
			transform: rotate(4deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spot {
			animation: none;
		}
	}
</style>
