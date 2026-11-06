<script>
	/** Everything that hangs or falls on a shared list. It never takes clicks and hides from screen readers. */
	let { edition, options, part } = $props();
	const COUNT = 18;
	const fall = Array.from({ length: COUNT }, (_, i) => ({
		left: (i * 53) % 100,
		delay: -((i * 13) % 23),
		time: 18 + ((i * 7) % 14),
		size: 7 + ((i * 5) % 7)
	}));
</script>

{#if part === 'string'}
{#if edition === 'christmas' && options.lights}
	<div class="string {options.lightsMode}" aria-hidden="true">
		{#each Array(24) as _, i}
			<svg viewBox="0 0 220 64" width="220" height="64">
				<path d="M0 8 Q110 44 220 8" />
				<circle class="bulb b{i % 4}" style="--i:{i}; --t:{(i * 7) % 11}" cx="110" cy="33" r="7" />
				<circle class="bulb b{(i + 2) % 4}" style="--i:{i}; --t:{(i * 5 + 3) % 11}" cx="44" cy="23" r="7" />
				<circle class="bulb b{(i + 1) % 4}" style="--i:{i}; --t:{(i * 3 + 6) % 11}" cx="176" cy="23" r="7" />
			</svg>
		{/each}
	</div>
{/if}

{#if edition === 'birthday' && options.bunting}
	<div class="string" aria-hidden="true">
		{#each Array(24) as _, i}
			<svg viewBox="0 0 220 64" width="220" height="64">
				<path d="M0 8 Q110 40 220 8" />
				<path class="flag f{i % 3}" d="M34 18 L60 25 L42 44Z" />
				<path class="flag f{(i + 1) % 3}" d="M98 28 L126 28 L112 50Z" />
				<path class="flag f{(i + 2) % 3}" d="M160 25 L186 18 L178 44Z" />
			</svg>
		{/each}
	</div>
{/if}
{:else}
{#if (edition === 'christmas' && options.snow) || (edition === 'birthday' && options.confetti)}
	<div class="fall" aria-hidden="true">
		{#each fall as f, i}
			<span
				class={edition === 'christmas' ? 'flake' : `bit f${i % 3}`}
				style="left:{f.left}%; width:{f.size}px; height:{f.size}px; animation-delay:{f.delay}s; animation-duration:{f.time}s"
			></span>
		{/each}
	</div>
{/if}
{/if}

<style>
	.string {
		position: absolute;
		inset: 0 0 auto;
		display: flex;
		justify-content: center;
		overflow: hidden;
		height: 64px;
		pointer-events: none;
	}
	.string svg {
		flex: none;
		color: var(--ed-ink, #3b2a25);
	}
	.string path:first-child {
		fill: none;
		stroke: currentColor;
		stroke-width: 3;
	}
	.bulb {
		fill: var(--c);
		stroke: currentColor;
		stroke-width: 2;
	}
	.b0 { --c: #f0484b; }
	.b1 { --c: #ffc900; }
	.b2 { --c: #2fae84; }
	.b3 { --c: #ffffff; }
	.twinkle .bulb {
		animation: glow 3.4s ease-in-out infinite;
		animation-delay: calc(var(--t) * -0.3s);
	}
	.chase .bulb {
		animation: glow 2s ease-in-out infinite;
		animation-delay: calc(var(--i) * 0.2s);
	}
	@keyframes glow {
		50% {
			opacity: 0.35;
		}
	}
	.flag.f0 { fill: #ffd23f;
		stroke: currentColor;
		stroke-width: 2; }
	.flag.f1 { fill: #ff7a59;
		stroke: currentColor;
		stroke-width: 2; }
	.flag.f2 { fill: #ffffff; stroke: currentColor; stroke-width: 2; }

	.fall {
		position: fixed;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.fall span {
		position: absolute;
		top: -8px;
		animation: fall linear infinite;
	}
	.flake {
		border-radius: 50%;
		background: #fff;
		border: 1px solid rgba(59, 42, 37, 0.3);
	}
	.bit {
		opacity: 0.6;
	}
	.bit {
		border: 1px solid rgba(59, 42, 37, 0.3);
	}
	.bit.f0 { background: #ff7a59; }
	.bit.f1 { background: #ffd23f; }
	.bit.f2 { background: #27b5b0; }
	@keyframes fall {
		to {
			transform: translate3d(30px, 104vh, 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bulb {
			animation: none !important;
		}
		.fall {
			display: none;
		}
	}
</style>
