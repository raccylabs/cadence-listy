<script>
	import { enhance } from '$app/forms';
	import { shrinkPhoto } from '$lib/photo.js';

	/** Add a new item, or edit one when `item` is given. */
	let { tiers, item = null, onsaved = () => {} } = $props();
	let busy = $state(false);
	let error = $state('');
	const key = $derived(item ? `i${item.id}` : 'new');
</script>

<form
	method="POST"
	action={item ? '?/updateItem' : '?/addItem'}
	enctype="multipart/form-data"
	class="grid"
	use:enhance={() => {
		busy = true;
		error = '';
		return async ({ result, update }) => {
			await update({ reset: !item });
			busy = false;
			if (result.type === 'failure') error = String(result.data?.error ?? 'Could not save that.');
			else onsaved();
		};
	}}
>
	{#if item}<input type="hidden" name="id" value={item.id} />{/if}
	<div class="wide">
		<label for="{key}-title">What is it?</label>
		<input id="{key}-title" class="form-control" name="title" required maxlength="120" value={item?.title ?? ''} />
	</div>
	<div class="wide">
		<label for="{key}-url">Link</label>
		<input id="{key}-url" class="form-control" name="url" inputmode="url" maxlength="1000" placeholder="https://" value={item?.url ?? ''} />
	</div>
	<div>
		<label for="{key}-store">Store</label>
		<input id="{key}-store" class="form-control" name="store" maxlength="80" value={item?.store ?? ''} />
	</div>
	<div>
		<label for="{key}-price">Price</label>
		<input id="{key}-price" class="form-control" name="price" maxlength="24" placeholder="$25" value={item?.price ?? ''} />
	</div>
	<div>
		<label for="{key}-tier">Section</label>
		<select id="{key}-tier" class="form-control" name="tier" value={item?.tier ?? 1}>
			{#each tiers as t, i}<option value={i + 1}>{t}</option>{/each}
		</select>
	</div>
	<div>
		<label for="{key}-photo">Photo</label>
		<input id="{key}-photo" class="form-control" type="file" name="photo" accept="image/*" onchange={(e) => shrinkPhoto(e.currentTarget)} />
		{#if item?.has_photo}<label class="check"><input type="checkbox" name="remove_photo" /> Remove current photo</label>{/if}
	</div>
	<div class="wide">
		<label for="{key}-details">Size, color, other details</label>
		<textarea id="{key}-details" class="form-control" name="details" rows="2" maxlength="500">{item?.details ?? ''}</textarea>
	</div>
	<label class="check wide"><input type="checkbox" name="featured" checked={!!item?.featured} /> Make this my top pick</label>
	{#if error}<div class="flash flash-error wide">{error}</div>{/if}
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
	.grid :global(.form-control) {
		box-sizing: border-box;
		width: 100%;
	}
	@media (max-width: 560px) {
		.grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
