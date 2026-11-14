<script>
	import { EDITION_LIST } from '$lib/editions/index.js';
	let { data, form } = $props();
</script>

<svelte:head><title>Families and groups · Cadence Listy</title></svelte:head>

<div class="Subhead"><h2>Families and groups</h2></div>
<p class="mb-3">A group gathers everyone's lists on one page. Share one link and people can see each person, then tap in to their list.</p>
{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}

{#if data.groups.length}
	<div class="rows">
		{#each data.groups as g (g.id)}
			<a class="row" href="/groups/{g.id}">
				<span class="name"><strong>{g.name}</strong><span class="small muted">{g.members} {g.members === 1 ? 'person' : 'people'}{g.mine ? ', made by you' : ''}</span></span>
				<span class="small">Open</span>
			</a>
		{/each}
	</div>
{:else}
	<p class="muted mb-3">You're not in any groups yet. Make one, or ask someone for their group's join link.</p>
{/if}

<div class="Subhead Subhead--spaced"><h2>Make a group</h2></div>
<form method="POST" action="?/create" class="make">
	<input class="form-control" name="name" maxlength="60" placeholder="The Smith family" aria-label="Group name" required />
	<select class="form-control" name="edition" aria-label="Theme">
		{#each EDITION_LIST as ed (ed.id)}<option value={ed.id}>{ed.name} theme</option>{/each}
	</select>
	<button class="btn btn-primary">Make group</button>
</form>

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
		background: #fffdf9;
		box-shadow: 0 1px 2px rgba(59, 42, 37, 0.06), 0 8px 24px -10px rgba(59, 42, 37, 0.2);
		color: var(--fg);
		text-decoration: none;
	}
	.row:hover {
		background: var(--bg-subtle);
		text-decoration: none;
	}
	.name {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}
	.make {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	.make input {
		flex: 1 1 220px;
	}
	.make select {
		width: auto;
	}
</style>
