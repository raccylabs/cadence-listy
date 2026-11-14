<script>
	/** The hero drawing on a shared list. Every drawing uses the same thick outline, offset shadow and gentle motion. */
	import { sceneFor } from './index.js';
	let { edition, scene = '' } = $props();
	const pick = $derived(sceneFor(edition, scene));
	const ink = 'currentColor';
	const flake = 'M0 -20V20M-17 -10L17 10M-17 10L17 -10';
	const star = 'M0 -16L4 -6L15 -5L7 2L9 13L0 7L-9 13L-7 2L-15 -5L-4 -6Z';
</script>

{#snippet balloons()}
	<g class="bob">
		<circle cx="482" cy="86" r="42" fill="var(--ed-pop-3)" stroke="currentColor" stroke-width="5" />
		<path d="M482 128l-8 12h16Z" fill="currentColor" />
	</g>
	<g class="bob late">
		<circle cx="112" cy="110" r="32" fill="var(--ed-pop-2)" stroke="currentColor" stroke-width="5" />
		<path d="M112 142l-7 10h14Z" fill="currentColor" />
	</g>
{/snippet}

<svg class="scene" viewBox="0 0 560 400" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
	<defs>
		<clipPath id="big-round"><circle cx="300" cy="196" r="128" /></clipPath>
	</defs>
	<path d="M120 0h440v400H40v-70h50v-60h60v-70h-60v-90h30V0Z" fill="var(--ed-pop-4)" />
	<ellipse class="shadow" cx="290" cy="362" rx="150" ry="20" fill="currentColor" />
	{#if pick === 'snowman'}
		<g class="float">
			<path d="M226 252 160 206M180 220l-8-24M180 220l-24 2M374 252l68-48M422 218l4-24M422 218l24 2" fill="none" stroke={ink} stroke-width="8" stroke-linecap="round" />
			<circle cx="312" cy="278" r="82" fill={ink} />
			<circle cx="300" cy="278" r="82" fill="#fffdf9" stroke={ink} stroke-width="5" />
			<circle cx="312" cy="160" r="58" fill={ink} />
			<circle cx="300" cy="160" r="58" fill="#fffdf9" stroke={ink} stroke-width="5" />
			<rect x="320" y="206" width="28" height="72" rx="10" fill="var(--ed-pop-1)" stroke={ink} stroke-width="5" />
			<path d="M322 240h24M322 258h24" stroke="#fff" stroke-width="5" />
			<rect x="236" y="196" width="128" height="26" rx="13" fill="var(--ed-pop-1)" stroke={ink} stroke-width="5" />
			<g transform="rotate(-8 300 100)">
				<rect x="260" y="38" width="80" height="70" rx="6" fill={ink} />
				<rect x="260" y="84" width="80" height="14" fill="var(--ed-pop-1)" />
				<rect x="236" y="100" width="128" height="16" rx="8" fill={ink} />
			</g>
			<circle cx="280" cy="150" r="6" fill={ink} />
			<circle cx="322" cy="150" r="6" fill={ink} />
			<circle cx="266" cy="174" r="8" fill="#f3a6a0" opacity="0.8" />
			<circle cx="336" cy="174" r="8" fill="#f3a6a0" opacity="0.8" />
			<path d="M302 160l46 10-46 9Z" fill="#f0974a" stroke={ink} stroke-width="4" stroke-linejoin="round" />
			<path d="M284 186q17 10 34 0" fill="none" stroke={ink} stroke-width="4" stroke-linecap="round" />
						<circle cx="300" cy="256" r="8" fill={ink} />
			<circle cx="300" cy="292" r="8" fill={ink} />
		</g>
		{#each [[484, 92, ''], [108, 122, 'late']] as [x, y, late]}
			<g transform="translate({x} {y})"><g class="spin {late}">
				<path d={flake} fill="none" stroke={ink} stroke-width="11" stroke-linecap="round" />
				<path d={flake} fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" />
			</g></g>
		{/each}
	{:else if pick === 'gingerbread'}
		<defs>
			<g id="scene-gingerbread">
				<circle cx="300" cy="104" r="56" />
				<rect x="248" y="146" width="104" height="128" rx="44" />
				<rect x="168" y="166" width="264" height="48" rx="24" />
				<rect x="250" y="236" width="50" height="118" rx="25" transform="rotate(16 274 256)" />
				<rect x="300" y="236" width="50" height="118" rx="25" transform="rotate(-16 326 256)" />
			</g>
		</defs>
		<g class="wiggle">
			<use href="#scene-gingerbread" x="12" fill={ink} />
			<use href="#scene-gingerbread" fill={ink} stroke={ink} stroke-width="10" />
			<use href="#scene-gingerbread" fill="#c98552" />
			<g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M190 176l10 8-10 8 10 8-10 8M410 176l-10 8 10 8-10 8 10 8M280 122q20 14 40 0" />
				<path d="M258 326l8-7 8 7 8-7 8 7 8-7" transform="rotate(16 274 256)" />
				<path d="M308 326l8-7 8 7 8-7 8 7 8-7" transform="rotate(-16 326 256)" />
			</g>
			<circle cx="282" cy="96" r="7" fill={ink} />
			<circle cx="318" cy="96" r="7" fill={ink} />
			<circle cx="266" cy="116" r="7" fill="#f3a6a0" />
			<circle cx="334" cy="116" r="7" fill="#f3a6a0" />
			<circle cx="300" cy="182" r="10" fill="var(--ed-pop-1)" stroke={ink} stroke-width="4" />
			<circle cx="300" cy="214" r="10" fill="var(--ed-pop-2)" stroke={ink} stroke-width="4" />
			<circle cx="300" cy="246" r="10" fill="var(--ed-pop-3)" stroke={ink} stroke-width="4" />
		</g>
		{#each [[484, 92, ''], [104, 122, 'late']] as [x, y, late]}
			<g transform="translate({x} {y})"><g class="bob {late}">
				<path d="M-16 0-36-14v28ZM16 0l20-14v28Z" fill="var(--ed-pop-1)" stroke={ink} stroke-width="5" stroke-linejoin="round" />
				<circle r="20" fill="var(--ed-pop-1)" stroke={ink} stroke-width="5" />
				<path d="M-10-12c14-6 22 6 10 12S-6 16 10 12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" />
			</g></g>
		{/each}
	{:else if pick === 'tree'}
		<g class="sway">
			<g transform="translate(12 0)" fill={ink}>
				<rect x="274" y="312" width="52" height="46" rx="6" />
				<path d="M300 178 436 324Q300 344 164 324ZM300 112 404 232Q300 250 196 232ZM300 56 370 150Q300 164 230 150Z" />
			</g>
			<g stroke={ink} stroke-width="5" stroke-linejoin="round">
				<rect x="274" y="312" width="52" height="46" rx="6" fill="#a8693f" />
				<path d="M300 178 436 324Q300 344 164 324Z" fill="var(--ed-pop-2)" />
				<path d="M300 112 404 232Q300 250 196 232Z" fill="var(--ed-pop-2)" />
				<path d="M300 56 370 150Q300 164 230 150Z" fill="var(--ed-pop-2)" />
			</g>
			<path d="M234 204q66 22 136-8M202 292q98 30 196-10M262 132q40 12 78-4" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 12" />
			<g stroke={ink} stroke-width="4">
				{#each [[270, 140, 1], [326, 120, 3], [250, 214, 3], [348, 220, 1], [300, 196, 0], [228, 300, 1], [300, 306, 3], [372, 298, 0], [300, 256, 1]] as [x, y, c]}
					<circle cx={x} cy={y} r="11" fill={c ? `var(--ed-pop-${c})` : '#fff'} />
				{/each}
			</g>
			<g transform="translate(300 60)"><g class="twinkle">
				<path d="M0 -36L9 -13L34 -11L15 5L21 29L0 16L-21 29L-15 5L-34 -11L-9 -13Z" fill="var(--ed-pop-3)" stroke={ink} stroke-width="5" stroke-linejoin="round" />
			</g></g>
		</g>
		{#each [[484, 92, ''], [108, 122, 'late']] as [x, y, late]}
			<g transform="translate({x} {y}) scale(1.5)"><g class="twinkle {late}">
				<path d={star} fill="var(--ed-pop-3)" stroke={ink} stroke-width="3.4" stroke-linejoin="round" />
			</g></g>
		{/each}
	{:else if pick === 'cake'}
		<ellipse cx="300" cy="346" rx="160" ry="18" fill="#fffdf9" stroke={ink} stroke-width="5" />
		<rect x="202" y="236" width="220" height="110" rx="18" fill={ink} />
		<rect x="190" y="236" width="220" height="110" rx="18" fill="var(--ed-pop-1)" stroke={ink} stroke-width="5" />
		<path d="M210 312l10-6M236 326l4 10M262 304l10 4M290 330l8-6M318 308l4 10M346 324l10-4M374 304l6 8M388 330l-8-4" stroke="#fff" stroke-width="5" stroke-linecap="round" />
		<path d="M190 270V254a18 18 0 0 1 18-18H392a18 18 0 0 1 18 18V270c-10 14-24 14-30 0c-6 22-30 22-34 0c-8 14-24 14-32 0c-6 22-30 22-34 0c-8 14-24 14-32 0c-6 22-30 22-36 0c-6 14-20 14-22 0Z" fill="#fffdf9" stroke={ink} stroke-width="5" stroke-linejoin="round" />
		<rect x="238" y="168" width="148" height="76" rx="16" fill={ink} />
		<rect x="226" y="168" width="148" height="76" rx="16" fill="var(--ed-pop-2)" stroke={ink} stroke-width="5" />
		<path d="M226 196V184a16 16 0 0 1 16-16H358a16 16 0 0 1 16 16V196c-8 12-20 12-26 0c-6 18-26 18-30 0c-6 12-20 12-28 0c-6 18-26 18-30 0c-6 12-18 12-22 0c-4 10-10 10-12 0Z" fill="#f7c6d4" stroke={ink} stroke-width="5" stroke-linejoin="round" />
		{#each [264, 300, 336] as x, i}
			<rect x={x - 7} y="112" width="14" height="58" rx="5" fill="#fffdf9" stroke={ink} stroke-width="4" />
			<path d="M{x - 6} 132l12-6M{x - 6} 150l12-6" stroke="var(--ed-pop-1)" stroke-width="4" />
			<g class="flicker" style="animation-delay:{i * -0.37}s">
				<path d="M{x} 74c12 16 12 30 0 32c-12-2-12-16 0-32Z" fill="var(--ed-pop-3)" stroke={ink} stroke-width="4" stroke-linejoin="round" />
			</g>
		{/each}
		{@render balloons()}
	{:else if pick === 'present'}
		<rect x="212" y="200" width="200" height="150" rx="10" fill={ink} />
		<rect x="200" y="200" width="200" height="150" rx="10" fill="var(--ed-pop-2)" stroke={ink} stroke-width="5" />
		<g fill="#fff" opacity="0.85">
			<circle cx="234" cy="240" r="9" /><circle cx="252" cy="300" r="9" /><circle cx="360" cy="236" r="9" /><circle cx="346" cy="306" r="9" /><circle cx="374" cy="276" r="7" /><circle cx="224" cy="328" r="6" />
		</g>
		<rect x="284" y="200" width="32" height="150" fill="var(--ed-pop-3)" stroke={ink} stroke-width="5" />
		<g class="hop">
			<rect x="196" y="162" width="232" height="48" rx="10" fill={ink} />
			<rect x="184" y="162" width="232" height="48" rx="10" fill="var(--ed-pop-2)" stroke={ink} stroke-width="5" />
			<rect x="284" y="162" width="32" height="48" fill="var(--ed-pop-3)" stroke={ink} stroke-width="5" />
			<path d="M300 160C262 116 222 136 244 162c12 14 38 6 56-2ZM300 160c38-44 78-24 56 2c-12 14-38 6-56-2Z" fill="var(--ed-pop-3)" stroke={ink} stroke-width="5" stroke-linejoin="round" />
			<circle cx="300" cy="158" r="13" fill="var(--ed-pop-3)" stroke={ink} stroke-width="5" />
		</g>
		{@render balloons()}
	{:else if pick === 'balloons'}
		<g class="float">
		<path d="M300 322c-16 24 22 30 2 62" fill="none" stroke="currentColor" stroke-width="5" />
		<circle cx="312" cy="190" r="128" fill="currentColor" />
		<circle cx="300" cy="186" r="128" fill="var(--ed-pop-1)" stroke="currentColor" stroke-width="5" />
		<path d="M282 314h36l-18-22Z" fill="var(--ed-pop-1)" stroke="currentColor" stroke-width="5" />
		<path d="M238 118c14-28 40-42 66-44" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" />
		</g>
		{@render balloons()}
	{:else}
		<g transform="rotate(14 300 196)"><g class="swing">
			<circle cx="312" cy="196" r="128" fill="currentColor" />
			<circle cx="300" cy="196" r="128" fill="var(--ed-pop-1)" stroke="currentColor" stroke-width="5" />
			<g clip-path="url(#big-round)" fill="#fff" stroke="currentColor" stroke-width="5">
				<path d="M120 150 440 60l0 40L120 190ZM120 246l320-90 0 40-320 90ZM120 342l320-90 0 40-320 90Z" />
			</g>
			<circle cx="300" cy="196" r="128" fill="none" stroke="currentColor" stroke-width="5" />
			<rect x="276" y="50" width="48" height="24" rx="3" fill="var(--ed-pop-3)" stroke="currentColor" stroke-width="5" />
			<path d="M286 50c0-26 28-26 28 0" fill="none" stroke="currentColor" stroke-width="5" />
		</g></g>
		<g transform="rotate(-16 486 96)"><g class="swing small">
			<circle cx="491" cy="96" r="44" fill="currentColor" />
			<circle cx="486" cy="96" r="44" fill="var(--ed-pop-2)" stroke="currentColor" stroke-width="5" />
			<rect x="472" y="42" width="28" height="14" rx="2" fill="var(--ed-pop-3)" stroke="currentColor" stroke-width="5" />
		</g></g>
		<g transform="rotate(20 96 120)"><g class="swing small late">
			<circle cx="100" cy="120" r="34" fill="currentColor" />
			<circle cx="96" cy="120" r="34" fill="var(--ed-pop-3)" stroke="currentColor" stroke-width="5" />
			<rect x="85" y="78" width="22" height="12" rx="2" fill="var(--ed-pop-1)" stroke="currentColor" stroke-width="5" />
		</g></g>
	{/if}
	<path class="ticks" d="M160 74l-16-10M178 54l-8-16M430 214l20 4M424 248l18 12" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
</svg>

<style>
	svg {
		color: var(--ed-ink, #3b2a25);
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
	.spin {
		transform-box: fill-box;
		transform-origin: center;
		animation: spin 14s linear infinite;
	}
	.wiggle,
	.sway {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: swing 2.6s ease-in-out infinite alternate;
	}
	.sway {
		animation-duration: 4s;
	}
	.twinkle {
		transform-box: fill-box;
		transform-origin: center;
		animation: twinkle 2.2s ease-in-out infinite alternate;
	}
	.flicker {
		transform-box: fill-box;
		transform-origin: 50% 100%;
		animation: flicker 0.9s ease-in-out infinite alternate;
	}
	.hop {
		animation: hop 2.4s ease-in-out infinite;
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
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@keyframes twinkle {
		from {
			transform: scale(0.86) rotate(-6deg);
		}
		to {
			transform: scale(1.08) rotate(6deg);
		}
	}
	@keyframes flicker {
		from {
			transform: scale(0.88, 0.82) skewX(-4deg);
		}
		to {
			transform: scale(1.06, 1.1) skewX(4deg);
		}
	}
	@keyframes hop {
		0%,
		55%,
		100% {
			transform: translateY(0);
		}
		70% {
			transform: translateY(-22px) rotate(-2deg);
		}
		85% {
			transform: translateY(0);
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
		.ticks,
		.spin,
		.wiggle,
		.sway,
		.twinkle,
		.flicker,
		.hop {
			animation: none;
		}
	}
</style>
