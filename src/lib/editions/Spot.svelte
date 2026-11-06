<script>
	/** Small outlined drawings. Add a case here and list its name in an edition's `spots`. */
	let { name } = $props();
</script>

<svg viewBox="0 0 120 120" aria-hidden="true">
	<g fill="none" stroke="#000" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
		{#if name === 'gift'}
			<rect x="22" y="50" width="76" height="56" fill="var(--ed-pop-1)" />
			<rect x="14" y="36" width="92" height="18" fill="var(--ed-pop-2)" />
			<rect x="52" y="36" width="16" height="70" fill="var(--ed-pop-3)" />
			<path d="M60 36C42 34 30 14 44 12c10-2 16 12 16 24Zm0 0c18-2 30-22 16-24-10-2-16 12-16 24Z" fill="var(--ed-pop-3)" />
		{:else if name === 'stocking'}
			<path d="M38 30h42v44c0 8 2 12-6 22-8 10-26 16-40 14-12-2-16-14-6-22 10-6 10-12 10-20Z" fill="var(--ed-pop-1)" />
			<rect x="32" y="12" width="54" height="22" rx="4" fill="#fff" />
			<path d="M24 92c6 0 12 8 12 18" />
		{:else if name === 'tree'}
			<rect x="52" y="94" width="16" height="16" fill="#000" />
			<path d="M60 8 92 50H76l24 30H74l10 14H36l10-14H20l24-30H28Z" fill="var(--ed-pop-2)" />
			<path d="m60 2 4 9h9l-7 6 3 9-9-5-9 5 3-9-7-6h9Z" fill="var(--ed-pop-3)" />
			<circle cx="60" cy="48" r="5" fill="var(--ed-pop-1)" />
			<circle cx="44" cy="70" r="5" fill="var(--ed-pop-3)" />
			<circle cx="76" cy="72" r="5" fill="#fff" />
		{:else if name === 'cane'}
			<path d="M40 110V42c0-40 58-40 58 0v8" stroke-width="30" stroke-linecap="butt" />
			<path d="M40 110V42c0-40 58-40 58 0v8" stroke="#fff" stroke-width="22" stroke-linecap="butt" />
			<path d="M29 96l22-12M29 72l22-12M29 48l22-12M56 25l6-22M84 26l12-18M84 46l24-8" stroke="var(--ed-pop-1)" stroke-width="9" stroke-linecap="butt" />
		{:else if name === 'snowman'}
			<circle cx="60" cy="82" r="28" fill="#fff" />
			<circle cx="60" cy="38" r="20" fill="#fff" />
			<path d="M40 24h40M48 24V8h24v16" fill="#000" />
			<path d="m60 40 18 4-18 3Z" fill="var(--ed-pop-1)" />
			<circle cx="52" cy="33" r="1.5" fill="#000" />
			<circle cx="68" cy="33" r="1.5" fill="#000" />
			<circle cx="60" cy="74" r="2" fill="#000" />
			<circle cx="60" cy="90" r="2" fill="#000" />
		{:else if name === 'mug'}
			<path d="M24 44h60v48c0 8-6 14-14 14H38c-8 0-14-6-14-14Z" fill="var(--ed-pop-1)" />
			<path d="M84 54h8c16 0 16 32-2 32h-6" />
			<path d="M42 32c-8-8 8-12 0-22M64 32c-8-8 8-12 0-22" />
		{:else if name === 'cake'}
			<rect x="18" y="58" width="84" height="48" rx="4" fill="var(--ed-pop-4)" />
			<path d="M18 72c10 12 18 12 28 0 10 12 18 12 28 0 10 12 18 12 28 0V62c0-2-2-4-4-4H22c-2 0-4 2-4 4Z" fill="#fff" />
			<path d="M40 58V38M60 58V38M80 58V38" stroke-width="8" />
			<path d="M40 30c-6-6 0-10 0-16 0 6 6 10 0 16ZM60 30c-6-6 0-10 0-16 0 6 6 10 0 16ZM80 30c-6-6 0-10 0-16 0 6 6 10 0 16Z" fill="var(--ed-pop-3)" />
		{:else if name === 'hat'}
			<path d="M60 12 96 104H24Z" fill="var(--ed-pop-1)" />
			<path d="m46 48 30 12M36 74l48 20" stroke="#fff" stroke-width="8" />
			<circle cx="60" cy="12" r="9" fill="var(--ed-pop-3)" />
		{:else if name === 'balloon'}
			<ellipse cx="60" cy="46" rx="32" ry="38" fill="var(--ed-pop-2)" />
			<path d="m54 84 6 8 6-8Z" fill="var(--ed-pop-2)" />
			<path d="M60 92c-10 8 10 12 0 24" />
			<path d="M44 36c2-8 8-14 14-14" stroke="#fff" />
		{:else if name === 'letter'}
			<rect x="10" y="26" width="100" height="70" fill="#fff" />
			<path d="m10 26 50 42 50-42" />
			<circle cx="60" cy="66" r="11" fill="var(--ed-pop-3)" />
		{/if}
	</g>
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
