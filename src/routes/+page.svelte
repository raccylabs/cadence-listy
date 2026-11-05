<script>
	import { EDITION_LIST, EDITIONS } from '$lib/editions/index.js';
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

<style>
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
	}
	.pick p {
		margin: 0;
	}
</style>
