<script>
	import { EDITION_LIST, EDITIONS } from '$lib/editions/index.js';
	import Spot from '$lib/editions/Spot.svelte';
	import { page } from '$app/state';
	import { bookmarkHref } from '$lib/addButton.js';
	let { data, form } = $props();
	const status = (l) => (!l.share_on ? 'Link off' : l.event_date < data.today ? 'Closed' : 'Link on');
</script>

<svelte:head><title>My lists · Cadence Listy</title></svelte:head>

<div class="Subhead"><h2>My lists</h2></div>
<p class="mb-3">Make a wish list, then share it with one link. Each list and its photos delete themselves a week after the big day.</p>
{#if form?.error}<div class="flash flash-error mb-3">{form.error}</div>{/if}

{#if data.lists.length}
	<div class="rows">
		{#each data.lists as l (l.id)}
			<a class="row" href="/lists/{l.id}">
				<span class="name"><strong>{l.title}</strong><span class="small muted">{EDITIONS[l.edition]?.name}, {l.days > 0 ? `${l.days} ${l.days === 1 ? 'day' : 'days'} to go` : l.days === 0 ? 'today' : 'finished'}. Deletes after {l.keepUntil}</span></span>
				<span class="small muted">{l.items} {l.items === 1 ? 'item' : 'items'}{l.notes ? `, ${l.notes} ${l.notes === 1 ? 'note' : 'notes'}` : ''}</span>
				<span class="small">{status(l)}</span>
			</a>
		{/each}
	</div>
{/if}

<div class="Subhead Subhead--spaced"><h2>Start a new list</h2></div>
<div class="new">
	{#each EDITION_LIST as ed (ed.id)}
		<form method="POST" action="?/create" class="pick">
			<input type="hidden" name="edition" value={ed.id} />
			<div class="pic"><Spot name={ed.countdownSpot} /></div>
			<strong>{ed.name}</strong>
			<p class="small muted">{ed.blurb}</p>
			{#if !ed.date}
				<label class="small" for="date-{ed.id}">When is it?</label>
				<input id="date-{ed.id}" class="form-control" type="date" name="event_date" required min={data.today} />
			{/if}
			<button class="btn btn-sm">New {ed.name} list</button>
		</form>
	{/each}
</div>

<div class="Subhead Subhead--spaced"><h2>Add to Listy button</h2></div>
<p>Some stores block Listy from reading their pages. This button reads the page from your own browser, so it can pick up the photo, price and description. It works best on a computer.</p>
<ol class="steps">
	<li>Show your bookmarks bar. In Chrome, press Ctrl+Shift+B.</li>
	<li>Drag this button onto the bookmarks bar: <!-- svelte-ignore a11y_invalid_attribute --><a class="btn btn-primary bookmark" href={bookmarkHref(page.url.origin)} onclick={(e) => e.preventDefault()}>Add to Listy</a></li>
	<li>On a product page, click the bookmark to add the item.</li>
</ol>

<style>
	.steps {
		padding-left: 20px;
	}
	.steps li {
		margin-bottom: 10px;
	}
	.rows {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #fffdf9;
		box-shadow: 0 1px 2px rgba(59, 42, 37, 0.06), 0 8px 24px -10px rgba(59, 42, 37, 0.2);
		color: var(--fg);
		text-decoration: none;
	}
	.row:hover {
		text-decoration: none;
		background: var(--bg-subtle);
	}
	.name {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}
	.new {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
	}
	.pick {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		padding: 14px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #fffdf9;
		box-shadow: 0 1px 2px rgba(59, 42, 37, 0.06), 0 8px 24px -10px rgba(59, 42, 37, 0.2);
	}
	.pick {
		position: relative;
		background: #fff;
		--ed-pop-1: #f0484b;
		--ed-pop-2: #2fae84;
		--ed-pop-3: #ffc900;
		--ed-pop-4: #b8dcf0;
	}
	.pic {
		width: 72px;
		height: 72px;
	}
	.pick p {
		margin: 0;
	}
</style>
