<script>
	/** Everything that hangs or falls on a shared list. It never takes clicks and hides from screen readers. */
	let { edition, options, part } = $props();
	const COUNT = 18;
	const fall = Array.from({ length: COUNT }, (_, i) => ({
		left: (i * 53) % 100,
		delay: -((i * 13) % 23),
		time: 18 + ((i * 7) % 14),
		size: 2 + ((i * 5) % 3)
	}));
</script>

{#if part === 'string'}
{#if edition === 'christmas' && options.lights}
	<div class="string {options.lightsMode}" aria-hidden="true">
		{#each Array(24) as _, i}
			<svg viewBox="0 0 220 64" width="220" height="64">
				<path d="M0 8 Q110 44 220 8" />
				<circle class="bulb b{i % 4}" style="--i:{i}; --t:{(i * 7) % 11}" cx="110" cy="33" r="4" />
				<circle class="bulb b{(i + 2) % 4}" style="--i:{i}; --t:{(i * 5 + 3) % 11}" cx="44" cy="23" r="4" />
				<circle class="bulb b{(i + 1) % 4}" style="--i:{i}; --t:{(i * 3 + 6) % 11}" cx="176" cy="23" r="4" />
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
	}
	.string path:first-child {
		fill: none;
		stroke: color-mix(in srgb, var(--ed-on-feature) 35%, transparent);
		stroke-width: 1;
	}
	.bulb {
		fill: var(--c);
		filter: drop-shadow(0 0 3px var(--c)) drop-shadow(0 0 10px var(--c));
	}
	.b0, .b2 { --c: #fff3cf; }
	.b1 { --c: #ffd27a; }
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
			opacity: 0.45;
		}
	}
	.flag.f0 { fill: #ffd27a; }
	.flag.f1 { fill: #ffb3d0; }
	.flag.f2 { fill: #ffffff; }

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
		background: #c9d6e2;
		opacity: 0.8;
	}
	.bit {
		opacity: 0.6;
	}
	.bit.f0 { background: #c98a9b; }
	.bit.f1 { background: #e0b36a; }
	.bit.f2 { background: #8f6a9a; }
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
