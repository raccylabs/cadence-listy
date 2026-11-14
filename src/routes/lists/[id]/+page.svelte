<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { EDITIONS } from '$lib/editions/index.js';
	import ItemForm from '../ItemForm.svelte';
	import Scene from '$lib/editions/Scene.svelte';

	let { data, form } = $props();
	const list = $derived(data.list);
	const edition = $derived(EDITIONS[list.edition]);
	let copied = $state(false);
	let editing = $state(0);
	let confirmDelete = $state(false);

	// Reordering works on a local copy until it's saved. The drag uses pointer events so it works
	// with a finger as well as a mouse, and the handle also takes the arrow keys.
	let moving = $state(null);
	let dragId = $state(0);
	const shown = $derived(moving ?? data.items);

	function shift(id, overId) {
		const from = moving.findIndex((i) => i.id === id);
		const to = moving.findIndex((i) => i.id === overId);
		if (from < 0 || to < 0 || from === to || moving[from].tier !== moving[to].tier) return;
		const next = [...moving];
		next.splice(to, 0, next.splice(from, 1)[0]);
		moving = next;
	}
	function startDrag(e, id) {
		e.preventDefault();
		e.currentTarget.setPointerCapture(e.pointerId);
		dragId = id;
		moving = [...data.items];
	}
	function overDrag(e) {
		if (!dragId) return;
		const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-item]');
		if (over) shift(dragId, Number(over.dataset.item));
	}
	async function saveOrder() {
		const ids = moving.map((i) => i.id);
		await fetch(`/lists/${list.id}/order`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ids }) });
		await invalidateAll();
		moving = null;
	}
	function endDrag() {
		if (!dragId) return;
		dragId = 0;
		saveOrder();
	}
	function keyMove(e, item, items) {
		const step = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
		const neighbor = step && items[items.findIndex((i) => i.id === item.id) + step];
		if (!step) return;
		e.preventDefault();
		if (!neighbor) return;
		moving = [...data.items];
		shift(item.id, neighbor.id);
		saveOrder();
	}

	async function copy() {
		await navigator.clipboard.writeText(data.shareUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
	const state = $derived(!list.share_on ? 'Sharing is off. The link shows nothing.' : data.closesIn < 0 ? `Closed after ${list.event_date}. Set a later date to reopen it.` : data.closesIn === 0 ? 'The link closes after today.' : `The link closes after ${list.event_date}.`);
	const stay = () => ({ update }) => update({ reset: false });
</script>

<svelte:head><title>{list.title} · Cadence Listy</title></svelte:head>

<p class="small"><a href="/">My lists</a></p>
<div class="Subhead"><h2>{list.title}</h2></div>
{#if form?.error && !form?.added}<div class="flash flash-error mb-3">{form.error}</div>{/if}

<div class="Subhead Subhead--spaced"><h2>Share</h2></div>
<div class="link">
	<input class="form-control" readonly value={data.shareUrl} aria-label="Share link" onfocus={(e) => e.currentTarget.select()} />
	<button class="btn" type="button" onclick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
	<a class="btn" href="/share/{list.share_token}" target="_blank" rel="noopener">View list</a>
</div>
<p class="note">{state} The list and its photos delete themselves after {data.keepUntil}.</p>
<div class="row">
	<form method="POST" action="?/setPin" use:enhance={stay} class="row">
		<input class="form-control pin" name="pin" inputmode="numeric" pattern="\d{'{'}4,8{'}'}" maxlength="8" placeholder={list.hasPin ? 'New PIN' : '4 to 8 digits'} aria-label="PIN" required />
		<button class="btn">{list.hasPin ? 'Change PIN' : 'Add PIN'}</button>
	</form>
	{#if list.hasPin}<form method="POST" action="?/removePin" use:enhance={stay}><button class="btn">Remove PIN</button></form>{/if}
	<form method="POST" action="?/newLink" use:enhance={stay}><button class="btn" title="The old link stops working">Replace link</button></form>
</div>

<div class="Subhead Subhead--spaced"><h2>Items</h2></div>
<ItemForm tiers={edition.tiers} listId={list.id} edition={edition.id} />
{#each edition.tiers as tier, t}
	{@const items = shown.filter((i) => i.tier === t + 1)}
	{#if items.length}
		<h3 class="tier">{tier}</h3>
		{#each items as item (item.id)}
			<div class="item" class:dragging={dragId === item.id} data-item={item.id}>
				<div class="line">
					<button
						type="button"
						class="grip"
						aria-label="Move {item.title}. Drag, or use the up and down arrow keys."
						title="Drag to reorder"
						onpointerdown={(e) => startDrag(e, item.id)}
						onpointermove={overDrag}
						onpointerup={endDrag}
						onpointercancel={endDrag}
						onkeydown={(e) => keyMove(e, item, items)}
					>⠿</button>
					{#if item.has_photo}<img src="/share/{list.share_token}/photo/{item.id}?v={item.photo_v}" alt="" />{/if}
					<span class="name"><strong>{item.title}</strong>{#if item.featured} <span class="tag">{item.pick_text || 'Top pick'}</span>{/if}<span class="small muted">{[item.price, item.store].filter(Boolean).join(', ')}</span></span>
					<button type="button" class="btn btn-sm" onclick={() => (editing = editing === item.id ? 0 : item.id)}>{editing === item.id ? 'Close' : 'Edit'}</button>
					<form method="POST" action="?/deleteItem" use:enhance={stay}><input type="hidden" name="id" value={item.id} /><button class="btn btn-sm btn-danger">Delete</button></form>
				</div>
				{#if editing === item.id}
					<div class="edit"><ItemForm tiers={edition.tiers} listId={list.id} edition={edition.id} {item} onsaved={() => (editing = 0)} /></div>
				{/if}
			</div>
		{/each}
	{/if}
{/each}

<div class="Subhead Subhead--spaced"><h2>Notes from visitors</h2></div>
{#each data.notes as n (n.id)}
	<div class="item line">
		<span class="name">
			<strong>{n.name || 'Someone'}{n.item ? ` about ${n.item}` : ''}</strong>
			<span class="body">{n.body}</span>
		</span>
		<form method="POST" action="?/deleteNote" use:enhance={stay}><input type="hidden" name="id" value={n.id} /><button class="btn btn-sm">Delete</button></form>
	</div>
{:else}
	<p class="note">Notes people leave on your list show up here. Only you can see them.</p>
{/each}

<div class="Subhead Subhead--spaced"><h2>Page settings</h2></div>
{#key list.options}
	<form method="POST" action="?/save" use:enhance={stay} class="settings">
		<div class="form-group">
			<label for="title">Title</label>
			<input id="title" class="form-control" name="title" required maxlength="80" value={list.title} />
		</div>
		<div class="form-group">
			<label for="message">Message at the top</label>
			<textarea id="message" class="form-control" name="message" rows="2" maxlength="500">{list.message}</textarea>
		</div>
		<div class="form-group">
			<label for="date">{edition.name} date</label>
			<input id="date" class="form-control" type="date" name="event_date" required value={list.event_date} />
			<p class="note">The link closes after this day. This list and its photos are deleted for good after {data.keepUntil}.</p>
		</div>
		<fieldset>
			<legend>Picture at the top</legend>
			<div class="scenes">
				{#each edition.scenes as [id, name] (id)}
					<label class="scene-pick">
						<input type="radio" name="scene" value={id} checked={list.options.scene === id} />
						<span class="thumb edition ed-root" data-edition={edition.id}><Scene edition={edition.id} scene={id} /></span>
						<span class="small">{name}</span>
					</label>
				{/each}
			</div>
		</fieldset>
		<fieldset>
			<legend>Decorations</legend>
			{#each edition.decor as d (d.id)}
				<label class="check"><input type="checkbox" name={d.id} checked={list.options[d.id]} /> {d.label}</label>
				{#if d.modes}
					<select class="form-control mode" name="lightsMode" value={list.options.lightsMode} aria-label="{d.label} pattern">
						{#each d.modes as [id, label]}<option value={id}>{label}</option>{/each}
					</select>
				{/if}
			{/each}
		</fieldset>
		<fieldset>
			<legend>Widgets</legend>
			{#each edition.widgets as w (w.id)}
				<label class="check"><input type="checkbox" name={w.id} checked={list.options[w.id]} /> {w.label}</label>
			{/each}
		</fieldset>
		<label class="check"><input type="checkbox" name="share_on" checked={!!list.share_on} /> Share this list</label>
		<button class="btn btn-primary">Save settings</button>
		{#if form?.saved}<span class="small muted" role="status">Saved</span>{/if}
	</form>
{/key}

<div class="Subhead Subhead--spaced Subhead--danger"><h2>Delete list</h2></div>
<p class="mb-3">This removes the list, its photos, its notes and its link for good.</p>
{#if confirmDelete}
	<form method="POST" action="?/delete"><button class="btn btn-danger">Yes, delete this list</button></form>
{:else}
	<button type="button" class="btn btn-danger" onclick={() => (confirmDelete = true)}>Delete this list</button>
{/if}

<style>
	.link {
		display: flex;
		gap: 8px;
	}
	.link input {
		flex: 1;
		min-width: 0;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 8px;
	}
	.row form.row {
		margin: 0;
	}
	.pin {
		width: 130px;
	}
	.grip {
		flex: none;
		width: 30px;
		height: 38px;
		padding: 0;
		border: 0;
		background: none;
		color: var(--fg);
		font-size: 20px;
		line-height: 1;
		cursor: grab;
		touch-action: none;
	}
	.dragging {
		background: #fdf0d4;
		box-shadow: 0 14px 30px -12px rgba(59, 42, 37, 0.35);
	}
	.dragging .grip {
		cursor: grabbing;
	}
	.tier {
		margin: 20px 0 8px;
		font-size: 15px;
	}
	.item {
		margin-bottom: 8px;
		padding: 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #fffdf9;
		box-shadow: 0 1px 2px rgba(59, 42, 37, 0.06), 0 8px 24px -10px rgba(59, 42, 37, 0.2);
	}
	.line {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.line img {
		width: 44px;
		height: 44px;
		border-radius: 6px;
		object-fit: cover;
	}
	.name {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}
	.body {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.edit {
		margin-top: 12px;
	}
	.settings {
		max-width: 520px;
	}
	fieldset {
		margin: 0 0 14px;
		padding: 0;
		border: 0;
	}
	legend {
		margin-bottom: 4px;
		font-weight: 600;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
		font-weight: 400;
	}
	.tag {
		align-self: flex-start;
		margin: 2px 0;
		padding: 1px 8px;
		border-radius: 999px;
		background: #e2574c;
		color: #fff;
		font-size: 12px;
		font-weight: 700;
	}
	.scenes {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
		gap: 8px;
	}
	.scene-pick {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin: 0;
		font-weight: 500;
		cursor: pointer;
	}
	.scene-pick input {
		position: absolute;
		opacity: 0;
	}
	.thumb {
		display: block;
		height: 80px;
		overflow: hidden;
		border: 2px solid transparent;
		border-radius: 12px;
		background: #fffdf9;
		box-shadow: 0 0 0 1px var(--border);
	}
	.scene-pick input:checked + .thumb {
		border-color: #3b2a25;
	}
	.scene-pick input:focus-visible + .thumb {
		outline: 2px solid #5b9bd5;
		outline-offset: 2px;
	}
	.mode {
		width: 140px;
		margin: 0 0 8px 22px;
	}
	@media (max-width: 560px) {
		.link {
			flex-wrap: wrap;
		}
		.link input {
			flex-basis: 100%;
		}
	}
</style>
