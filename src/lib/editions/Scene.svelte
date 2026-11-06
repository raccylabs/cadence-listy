<script>
	/** The hero drawing on a shared list. */
	let { edition } = $props();
</script>

<svg class="scene" viewBox="0 0 560 400" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
	<defs>
		<clipPath id="big-round"><circle cx="300" cy="196" r="128" /></clipPath>
	</defs>
	<path d="M120 0h440v400H40v-70h50v-60h60v-70h-60v-90h30V0Z" fill="var(--ed-pop-4)" />
	<ellipse class="shadow" cx="290" cy="362" rx="150" ry="20" fill="#000" />
	{#if edition === 'birthday'}
		<g class="float">
		<path d="M300 322c-16 24 22 30 2 62" fill="none" stroke="#000" stroke-width="5" />
		<circle cx="312" cy="190" r="128" fill="#000" />
		<circle cx="300" cy="186" r="128" fill="var(--ed-pop-1)" stroke="#000" stroke-width="6" />
		<path d="M282 314h36l-18-22Z" fill="var(--ed-pop-1)" stroke="#000" stroke-width="6" />
		<path d="M238 118c14-28 40-42 66-44" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" />
		</g>
		<g class="bob">
			<circle cx="482" cy="86" r="42" fill="var(--ed-pop-3)" stroke="#000" stroke-width="5" />
			<path d="M482 128l-8 12h16Z" fill="#000" />
		</g>
		<g class="bob late">
			<circle cx="112" cy="110" r="32" fill="var(--ed-pop-2)" stroke="#000" stroke-width="5" />
			<path d="M112 142l-7 10h14Z" fill="#000" />
		</g>
	{:else}
		<g transform="rotate(14 300 196)"><g class="swing">
			<circle cx="312" cy="196" r="128" fill="#000" />
			<circle cx="300" cy="196" r="128" fill="var(--ed-pop-1)" stroke="#000" stroke-width="6" />
			<g clip-path="url(#big-round)" fill="#fff" stroke="#000" stroke-width="5">
				<path d="M120 150 440 60l0 40L120 190ZM120 246l320-90 0 40-320 90ZM120 342l320-90 0 40-320 90Z" />
			</g>
			<circle cx="300" cy="196" r="128" fill="none" stroke="#000" stroke-width="6" />
			<rect x="276" y="50" width="48" height="24" rx="3" fill="var(--ed-pop-3)" stroke="#000" stroke-width="6" />
			<path d="M286 50c0-26 28-26 28 0" fill="none" stroke="#000" stroke-width="6" />
		</g></g>
		<g transform="rotate(-16 486 96)"><g class="swing small">
			<circle cx="491" cy="96" r="44" fill="#000" />
			<circle cx="486" cy="96" r="44" fill="var(--ed-pop-2)" stroke="#000" stroke-width="5" />
			<rect x="472" y="42" width="28" height="14" rx="2" fill="var(--ed-pop-3)" stroke="#000" stroke-width="5" />
		</g></g>
		<g transform="rotate(20 96 120)"><g class="swing small late">
			<circle cx="100" cy="120" r="34" fill="#000" />
			<circle cx="96" cy="120" r="34" fill="var(--ed-pop-3)" stroke="#000" stroke-width="5" />
			<rect x="85" y="78" width="22" height="12" rx="2" fill="var(--ed-pop-1)" stroke="#000" stroke-width="5" />
		</g></g>
	{/if}
	<path class="ticks" d="M160 74l-16-10M178 54l-8-16M430 214l20 4M424 248l18 12" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round" />
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	.swing {
		transform-box: fill-box;
		transform-origin: 50% 0;
		animation: swing 4.5s ease-in-out infinite alternate;
	}
	.swing.small {
		animation-duration: 3.2s;
	}
	.float {
		animation: float 3.6s ease-in-out infinite alternate;
	}
	.bob {
		animation: float 2.8s ease-in-out infinite alternate;
	}
	.late {
		animation-delay: -1.4s;
	}
	.shadow {
		transform-box: fill-box;
		transform-origin: center;
		animation: breathe 3.6s ease-in-out infinite alternate;
	}
	.ticks {
		animation: blink 1.8s steps(2, jump-none) infinite;
	}
	@keyframes swing {
		from {
			transform: rotate(-5deg);
		}
		to {
			transform: rotate(5deg);
		}
	}
	@keyframes float {
		from {
			transform: translateY(-8px);
		}
		to {
			transform: translateY(8px);
		}
	}
	@keyframes breathe {
		from {
			transform: scaleX(0.9);
		}
		to {
			transform: scaleX(1.04);
		}
	}
	@keyframes blink {
		50% {
			opacity: 0.2;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.swing,
		.float,
		.bob,
		.shadow,
		.ticks {
			animation: none;
		}
	}
</style>
