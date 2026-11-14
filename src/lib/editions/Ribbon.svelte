<script>
	/** The banner that hangs across the corner of a top pick's photo. Blank settings use the edition's defaults. */
	import { PICK_COLORS, PICK_TEXT } from './index.js';
	let { pick = {}, edition = 'christmas' } = $props();
	const color = $derived(pick?.color || (edition === 'birthday' ? 'pink' : 'red'));
	const pattern = $derived(pick?.pattern || (edition === 'birthday' ? 'sprinkles' : 'stripes'));
	const hex = $derived(PICK_COLORS.find(([id]) => id === color)?.[2] ?? '#e2574c');
	const darkText = $derived(color === 'gold' || color === 'pink');
</script>

<div class="ribbon" style="--rib:{hex}">
	<span class="band {pattern}" class:dark={darkText}>{pick?.text || PICK_TEXT}</span>
</div>

<style>
	/* A box in the corner hides everything but the diagonal band; the two tabs look like the ends folded behind. */
	.ribbon {
		position: absolute;
		z-index: 2;
		top: var(--rib-at, 2px);
		left: var(--rib-at, 2px);
		width: 132px;
		height: 132px;
		overflow: hidden;
		pointer-events: none;
		animation: drop 0.5s cubic-bezier(0.2, 1.5, 0.4, 1) 0.25s backwards;
	}
	.ribbon::before,
	.ribbon::after {
		position: absolute;
		content: '';
		border: 5px solid color-mix(in srgb, var(--rib) 62%, #3b2a25);
		border-top-color: transparent;
		border-left-color: transparent;
	}
	.ribbon::before {
		top: 0;
		right: 0;
	}
	.ribbon::after {
		bottom: 0;
		left: 0;
	}
	.band {
		position: absolute;
		z-index: 1;
		top: 30px;
		right: -20px;
		box-sizing: border-box;
		width: 190px;
		padding: 8px 4px 7px;
		overflow: hidden;
		background-color: var(--rib);
		box-shadow: 0 4px 10px -3px rgba(59, 42, 37, 0.45);
		color: #fff;
		font: 400 17px/1.1 var(--ed-display, 'Anton', Impact, sans-serif);
		letter-spacing: 0.06em;
		text-align: center;
		text-overflow: ellipsis;
		text-transform: uppercase;
		text-shadow: 0 1px 0 rgba(59, 42, 37, 0.35);
		white-space: nowrap;
		transform: rotate(-45deg);
	}
	.band.dark {
		color: #3b2a25;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
	}
	.stripes {
		background-image: repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.38) 0 7px, transparent 7px 14px);
	}
	.dots {
		background-image: radial-gradient(circle, rgba(255, 255, 255, 0.55) 2px, transparent 2.6px);
		background-size: 10px 10px;
	}
	.sprinkles {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='22'%3E%3Cg stroke-width='2.6' stroke-linecap='round'%3E%3Cpath d='M4 5l5 2' stroke='%23fffdf9'/%3E%3Cpath d='M15 15l4-4' stroke='%23f5c96a'/%3E%3Cpath d='M24 4l2 5' stroke='%235aa9a3'/%3E%3Cpath d='M31 14l5 2' stroke='%23fffdf9'/%3E%3Cpath d='M8 18l3-3' stroke='%239b7fd1'/%3E%3Cpath d='M36 4l-2 4' stroke='%23fffdf9'/%3E%3C/g%3E%3C/svg%3E");
		background-size: 40px 22px;
	}
	.stars {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='26' height='22'%3E%3Cpath fill='rgba%28255%2C255%2C255%2C.6%29' d='M6 2l1.2 2.6 2.8.3-2.1 1.9.6 2.8L6 8.2 3.5 9.6l.6-2.8L2 4.9l2.8-.3zM19 12l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z'/%3E%3C/svg%3E");
		background-size: 26px 22px;
	}
	/* Dashed stitching along both edges. */
	.band::before,
	.band::after {
		position: absolute;
		left: 0;
		right: 0;
		content: '';
		border-top: 1.5px dashed rgba(255, 255, 255, 0.75);
	}
	.band::before {
		top: 2px;
	}
	.band::after {
		bottom: 2px;
	}
	@keyframes drop {
		from {
			opacity: 0;
			transform: translate(-14px, -14px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ribbon {
			animation: none;
		}
	}
	@media print {
		.ribbon {
			animation: none;
		}
	}
</style>
