<script>
	/** A person's picture: their photo if they added one, otherwise their drawn character. */
	import { AVATARS, avatarFor } from './avatars.js';
	let { avatar = '', photo = '', size = 72, label = '' } = $props();
	const id = $derived(avatarFor(avatar));
	const bg = $derived(AVATARS.find(([a]) => a === id)[2]);
	const ink = '#3b2a25';
	const eyeY = $derived(id === 'bunny' ? 58 : 54);
</script>

<span class="avatar" style="--size:{size}px" role="img" aria-label={label}>
	{#if photo}
		<img src={photo} alt="" />
	{:else}
		<svg viewBox="0 0 100 100" aria-hidden="true">
			<circle cx="50" cy="50" r="50" fill={bg} />
			<g stroke={ink} stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">
				{#if id === 'bear'}
					<circle cx="28" cy="32" r="12" fill="#a8693f" />
					<circle cx="72" cy="32" r="12" fill="#a8693f" />
					<circle cx="28" cy="32" r="5" fill="#e8c3a0" stroke="none" />
					<circle cx="72" cy="32" r="5" fill="#e8c3a0" stroke="none" />
					<circle cx="50" cy="58" r="30" fill="#a8693f" />
					<ellipse cx="50" cy="69" rx="14" ry="11" fill="#e8c3a0" />
					<ellipse cx="50" cy="63" rx="5" ry="3.5" fill={ink} />
					<path d="M45 72q5 4 10 0" fill="none" />
				{:else if id === 'cat'}
					<path d="M24 46 27 14l20 18ZM76 46 73 14 53 32Z" fill="#f0974a" />
					<path d="M30 22l2 12 8-4ZM70 22l-2 12-8-4Z" fill="#f7c6d4" stroke="none" />
					<circle cx="50" cy="58" r="30" fill="#f0974a" />
					<path d="M50 30v9M42 32l2 8M58 32l-2 8" fill="none" stroke-width="3" />
					<path d="M46 66h8l-4 4Z" fill="#e9806a" />
					<path d="M44 74q3 3 6 0q3 3 6 0M26 64l11 1M26 71l11-2M74 64l-11 1M74 71l-11-2" fill="none" stroke-width="2.5" />
				{:else if id === 'bunny'}
					<rect x="32" y="4" width="14" height="44" rx="7" fill="#fffdf9" />
					<rect x="54" y="4" width="14" height="44" rx="7" fill="#fffdf9" />
					<rect x="36" y="10" width="6" height="30" rx="3" fill="#f7c6d4" stroke="none" />
					<rect x="58" y="10" width="6" height="30" rx="3" fill="#f7c6d4" stroke="none" />
					<circle cx="50" cy="62" r="28" fill="#fffdf9" />
					<path d="M46 66h8l-4 4Z" fill="#ef8fb0" />
					<path d="M50 70v4M45 77q5 3 10 0" fill="none" stroke-width="3" />
				{:else if id === 'fox'}
					<path d="M22 46 24 14l22 16ZM78 46 76 14 54 30Z" fill="#e9806a" />
					<path d="M18 42Q50 20 82 42Q76 76 50 86Q24 76 18 42Z" fill="#e9806a" />
					<path d="M18 42Q34 62 50 86Q24 76 18 42ZM82 42Q66 62 50 86Q76 76 82 42Z" fill="#fffdf9" />
					<ellipse cx="50" cy="82" rx="5" ry="3.5" fill={ink} />
				{:else if id === 'penguin'}
					<circle cx="50" cy="56" r="34" fill={ink} />
					<path d="M50 40C40 28 22 38 28 58c4 14 14 22 22 24 8-2 18-10 22-24 6-20-12-30-22-18Z" fill="#fffdf9" stroke="none" />
					<path d="M43 62h14l-7 8Z" fill="#f5c451" />
				{:else if id === 'reindeer'}
					<path d="M36 34 28 12M31 24l-11-3M64 34l8-22M69 24l11-3" fill="none" stroke="#a8693f" stroke-width="5" />
					<ellipse cx="24" cy="44" rx="10" ry="6" fill="#c98552" transform="rotate(-24 24 44)" />
					<ellipse cx="76" cy="44" rx="10" ry="6" fill="#c98552" transform="rotate(24 76 44)" />
					<circle cx="50" cy="58" r="28" fill="#c98552" />
					<ellipse cx="50" cy="72" rx="15" ry="11" fill="#e8c3a0" />
					<circle cx="50" cy="66" r="7" fill="#e2574c" />
					<circle cx="48" cy="64" r="2" fill="#fff" stroke="none" />
				{:else if id === 'snowman'}
					<circle cx="50" cy="60" r="30" fill="#fffdf9" />
					<rect x="32" y="8" width="36" height="28" rx="3" fill={ink} transform="rotate(-6 50 30)" />
					<rect x="24" y="32" width="52" height="8" rx="4" fill={ink} transform="rotate(-6 50 30)" />
					<rect x="32" y="26" width="36" height="6" fill="#e2574c" stroke="none" transform="rotate(-6 50 30)" />
					<path d="M50 62l18 4-18 4Z" fill="#f0974a" stroke-width="3" />
					<path d="M42 76h2M50 78h2M58 76h2" fill="none" stroke-width="4" />
				{:else}
					<circle cx="50" cy="56" r="32" fill="#c98552" />
					<path d="M30 40l5-6 5 6 5-6 5 6 5-6 5 6 5-6 5 6" fill="none" stroke="#fff" stroke-width="3.5" />
					<path d="M38 70q12 10 24 0" fill="none" stroke="#fff" stroke-width="4" />
				{/if}
			</g>
			<!-- Every face shares the same eyes and rosy cheeks. -->
			<circle cx="39" cy={eyeY} r="4" fill={ink} />
			<circle cx="61" cy={eyeY} r="4" fill={ink} />
			<circle cx="30" cy={eyeY + 12} r="5" fill="#f3a6a0" opacity="0.75" />
			<circle cx="70" cy={eyeY + 12} r="5" fill="#f3a6a0" opacity="0.75" />
		</svg>
	{/if}
</span>

<style>
	.avatar {
		display: inline-block;
		flex: none;
		width: var(--size);
		height: var(--size);
		overflow: hidden;
		border-radius: 50%;
		background: #fffdf9;
		box-shadow: 0 0 0 3px #fffdf9, 0 6px 16px -6px rgba(59, 42, 37, 0.35);
	}
	svg,
	img {
		display: block;
		width: 100%;
		height: 100%;
	}
	img {
		object-fit: cover;
	}
</style>
