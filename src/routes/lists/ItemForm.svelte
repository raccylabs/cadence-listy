<script>
	import { enhance } from '$app/forms';
	import { shrinkPhoto } from '$lib/photo.js';
	import { PICK_COLORS, PICK_PATTERNS, PICK_TEXT } from '$lib/editions/index.js';
	import Ribbon from '$lib/editions/Ribbon.svelte';

	/** Add a new item, or edit one when `item` is given. */
	let { tiers, listId, edition = 'christmas', item = null, prefill = null, onsaved = () => {} } = $props();
	const startPick = () => ({ on: !!item?.featured, text: item?.pick_text || PICK_TEXT, color: item?.pick_color ?? '', pattern: item?.pick_pattern ?? '' });
	let pick = $state(startPick());
	const blank = () => ({
		title: item?.title ?? '',
		url: item?.url ?? '',
		store: item?.store ?? '',
		price: item?.price ?? '',
		details: item?.details ?? '',
		image: ''
	});
	// `prefill` comes from the Add to Listy button; a long store title gets the same trim as a lookup.
	const start = () => (prefill ? { ...blank(), ...prefill, title: prefill.title.slice(0, 120), store: prefill.store.slice(0, 80), price: prefill.price.slice(0, 24) } : blank());
	let f = $state(start());
	let photoInput = $state();
	let pasted = $state('');
	let busy = $state(false);
	let looking = $state(false);
	let lookupNote = $state('');
	let error = $state('');
	let warning = $state('');
	const key = $derived(item ? `i${item.id}` : 'new');

	/** A copied image can be pasted anywhere on the form. */
	async function pasteImage(e) {
		const file = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith('image/'));
		if (!file) return;
		e.preventDefault();
		const moved = new DataTransfer();
		moved.items.add(file);
		photoInput.files = moved.files;
		await shrinkPhoto(photoInput);
		f.image = '';
		if (pasted) URL.revokeObjectURL(pasted);
		pasted = URL.createObjectURL(photoInput.files[0]);
	}
	function clearPasted() {
		URL.revokeObjectURL(pasted);
		pasted = '';
		photoInput.value = '';
	}

	async function lookup() {
		if (!f.url.trim() || looking) return;
		looking = true;
		lookupNote = '';
		try {
			const res = await fetch(`/lists/${listId}/lookup`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: f.url.trim() }) });
			const data = await res.json();
			f.image = data.found?.image ?? '';
			if (data.found) {
				for (const field of ['title', 'store', 'price', 'details']) if (data.found[field]) f[field] = data.found[field];
				const missing = ['title', 'price', 'image'].filter((x) => !data.found[x]).map((x) => (x === 'image' ? 'photo' : x === 'title' ? 'name' : x));
				lookupNote = data.found.partial
					? "This store blocks automatic lookups, so we used the name in the link. Add the price and a photo yourself."
					: missing.length ? `Filled in what the store shared. Missing: ${missing.join(', ')}.` : 'Filled in from the store. Check it before saving.';
			} else {
				lookupNote = data.error ?? "This store blocks automatic lookups. Fill in the details below.";
			}
		} catch {
			lookupNote = "Couldn't reach that page. Fill in the details below.";
		}
		looking = false;
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<form
	method="POST"
	action={item ? '?/updateItem' : `/lists/${listId}?/addItem`}
	onpaste={pasteImage}
	enctype="multipart/form-data"
	class="grid"
	use:enhance={({ formElement }) => {
		busy = true;
		error = '';
		warning = '';
		return async ({ result, update }) => {
			await update({ reset: false });
			busy = false;
			if (result.type === 'failure') {
				error = String(result.data?.error ?? 'Could not save that.');
				return;
			}
			if (result.data?.photoFailed) warning = "Saved, but the store's photo couldn't be downloaded. You can upload one instead.";
			lookupNote = '';
			if (!item) {
				f = blank();
				formElement.reset();
				pick = startPick();
				pasted = '';
			}
			onsaved();
		};
	}}
>
	{#if item}<input type="hidden" name="id" value={item.id} />{/if}
	<input type="hidden" name="image_url" value={f.image} />
	<div class="wide">
		<label for="{key}-url">Product link</label>
		<div class="linkline">
			<input
				id="{key}-url"
				class="form-control"
				name="url"
				inputmode="url"
				maxlength="1000"
				placeholder="Paste a link to fill this in"
				bind:value={f.url}
				onpaste={() => setTimeout(lookup)}
			/>
			<button type="button" class="btn" disabled={looking || !f.url.trim()} onclick={lookup}>{looking ? 'Looking…' : 'Get details'}</button>
		</div>
		{#if lookupNote}<p class="note" role="status">{lookupNote}</p>{/if}
	</div>
	{#if pasted}
		<div class="wide found">
			<img src={pasted} alt="" />
			<button type="button" class="btn btn-sm" onclick={clearPasted}>Remove pasted image</button>
		</div>
	{:else if f.image}
		<div class="wide found">
			<img src={f.image} alt="" referrerpolicy="no-referrer" />
			<button type="button" class="btn btn-sm" onclick={() => (f.image = '')}>Don't use this photo</button>
		</div>
	{/if}
	<div class="wide">
		<label for="{key}-title">What is it?</label>
		<input id="{key}-title" class="form-control" name="title" required maxlength="120" bind:value={f.title} />
	</div>
	<div>
		<label for="{key}-store">Store</label>
		<input id="{key}-store" class="form-control" name="store" maxlength="80" bind:value={f.store} />
	</div>
	<div>
		<label for="{key}-price">Price</label>
		<input id="{key}-price" class="form-control" name="price" maxlength="24" placeholder="$25" bind:value={f.price} />
	</div>
	<div>
		<label for="{key}-tier">Section</label>
		<select id="{key}-tier" class="form-control" name="tier" value={item?.tier ?? 1}>
			{#each tiers as t, i}<option value={i + 1}>{t}</option>{/each}
		</select>
	</div>
	<div>
		<label for="{key}-photo">Upload a photo</label>
		<input id="{key}-photo" class="form-control" type="file" name="photo" accept="image/*" bind:this={photoInput} onchange={(e) => shrinkPhoto(e.currentTarget)} />
		<p class="note">Or copy an image and paste it here with Ctrl+V.</p>
		{#if item?.has_photo}<label class="check"><input type="checkbox" name="remove_photo" /> Remove current photo</label>{/if}
	</div>
	<div class="wide">
		<label for="{key}-details">Description, size, color</label>
		<textarea id="{key}-details" class="form-control" name="details" rows="3" maxlength="1500" bind:value={f.details}></textarea>
	</div>
	<label class="check wide"><input type="checkbox" name="featured" bind:checked={pick.on} /> Top pick</label>
	{#if pick.on}
		<fieldset class="wide banner-set">
			<legend>Top pick banner</legend>
			<div class="banner-row">
				<div class="preview edition ed-root" data-edition={edition}>
					<Ribbon pick={pick} {edition} />
				</div>
				<div class="banner-fields">
					<label for="{key}-pick-text">Words</label>
					<input id="{key}-pick-text" class="form-control" name="pick_text" maxlength="18" bind:value={pick.text} placeholder={PICK_TEXT} />
					<p class="small-label">Color</p>
					<div class="swatches">
						<label class="swatch" title="Theme color"><input type="radio" name="pick_color" value="" bind:group={pick.color} /><span class="theme">Auto</span></label>
						{#each PICK_COLORS as [id, name, hex]}
							<label class="swatch" title={name}><input type="radio" name="pick_color" value={id} bind:group={pick.color} /><span style="background:{hex}"><span class="sr">{name}</span></span></label>
						{/each}
					</div>
					<p class="small-label">Pattern</p>
					<div class="patterns">
						<label class="pat"><input type="radio" name="pick_pattern" value="" bind:group={pick.pattern} /><span>Auto</span></label>
						{#each PICK_PATTERNS as [id, name]}
							<label class="pat"><input type="radio" name="pick_pattern" value={id} bind:group={pick.pattern} /><span>{name}</span></label>
						{/each}
					</div>
				</div>
			</div>
		</fieldset>
	{/if}
	{#if error}<div class="flash flash-error wide">{error}</div>{/if}
	{#if warning}<div class="flash flash-error wide">{warning}</div>{/if}
	<div class="wide"><button class="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : item ? 'Save item' : 'Add to list'}</button></div>
</form>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px 12px;
	}
	.wide {
		grid-column: 1 / -1;
	}
	label {
		display: block;
		margin-bottom: 4px;
		font-size: 13px;
		font-weight: 600;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 6px 0 0;
		font-weight: 400;
	}
	.banner-set {
		margin: 0;
		padding: 12px;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: #fffaf2;
	}
	.banner-set legend {
		padding: 0 4px;
		font-size: 13px;
		font-weight: 600;
	}
	.banner-row {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}
	.preview {
		position: relative;
		flex: none;
		width: 150px;
		height: 150px;
		border-radius: 18px;
		background: #fffdf9;
		box-shadow: inset 0 0 0 10px #f3ebe0;
		--rib-at: 2px;
	}
	.banner-fields {
		flex: 1;
		min-width: 0;
	}
	.small-label {
		margin: 10px 0 4px;
		font-size: 13px;
		font-weight: 600;
	}
	.swatches,
	.patterns {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.swatch,
	.pat {
		position: relative;
		margin: 0;
		cursor: pointer;
	}
	.swatch input,
	.pat input {
		position: absolute;
		opacity: 0;
	}
	.swatch > span {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border: 2px solid #fff;
		border-radius: 50%;
		box-shadow: 0 0 0 1px var(--border);
	}
	.swatch .theme {
		width: auto;
		padding: 0 8px;
		border-radius: 999px;
		background: #fff;
		font-size: 12px;
		font-weight: 600;
	}
	.pat span {
		display: block;
		padding: 4px 10px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: #fff;
		font-size: 13px;
		font-weight: 500;
	}
	.swatch input:checked + span {
		box-shadow: 0 0 0 3px #3b2a25;
	}
	.pat input:checked + span {
		border-color: #3b2a25;
		background: #3b2a25;
		color: #fff;
	}
	.swatch input:focus-visible + span,
	.pat input:focus-visible + span {
		outline: 2px solid #5b9bd5;
		outline-offset: 2px;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
	.linkline {
		display: flex;
		gap: 8px;
	}
	.linkline .btn {
		flex: none;
	}
	.found {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.found img {
		width: 84px;
		height: 84px;
		border: 1px solid var(--border);
		border-radius: 10px;
		object-fit: cover;
	}
	.grid :global(.form-control) {
		box-sizing: border-box;
		width: 100%;
	}
	@media (max-width: 560px) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
		.banner-row {
			flex-direction: column;
		}
	}
</style>
