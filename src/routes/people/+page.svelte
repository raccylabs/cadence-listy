<script>
	import { enhance } from '$app/forms';
	import { EDITIONS } from '$lib/editions/index.js';

	let { data, form } = $props();
	let copied = $state('');
	let confirming = $state(0);
	const link = (token) => `${data.origin}/register?invite=${token}`;
	const listsOf = (id) => data.lists.filter((l) => l.user_id === id);
	const STATUS = { open: 'Shared', closed: 'Closed', private: 'Sharing off' };
	const mb = (bytes) => (bytes / 1048576).toFixed(1);

	async function copy(token) {
		await navigator.clipboard.writeText(link(token));
		copied = token;
		setTimeout(() => (copied = ''), 2000);
	}
</script>

<svelte:head><title>People · Cadence Listy</title></svelte:head>

<div class="Subhead"><h2>Invite someone</h2></div>
<p class="mb-3">Each link works once, for one person.</p>
{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}
<form method="POST" action="?/invite" use:enhance class="line">
	<input class="form-control" name="name" maxlength="60" placeholder="Who is it for?" aria-label="Who is this invite for?" required />
	{#if data.groups.length}
		<select class="form-control group" name="group" aria-label="Add them to a group">
			<option value="">No group</option>
			{#each data.groups as g (g.id)}<option value={g.id}>Also join {g.name}</option>{/each}
		</select>
	{/if}
	<button class="btn btn-primary">Create invite link</button>
</form>

{#if data.invites.length}
	<div class="Subhead Subhead--spaced"><h2>Waiting to join</h2></div>
	{#each data.invites as i (i.token)}
		<div class="row">
			<strong class="name">{i.name}{#if i.group_name}<span class="small muted"> joins {i.group_name}</span>{/if}</strong>
			<input class="form-control url" readonly value={link(i.token)} aria-label="Invite link for {i.name}" onfocus={(e) => e.currentTarget.select()} />
			<button type="button" class="btn btn-sm" onclick={() => copy(i.token)}>{copied === i.token ? 'Copied' : 'Copy link'}</button>
			<form method="POST" action="?/cancel" use:enhance>
				<input type="hidden" name="token" value={i.token} />
				<button class="btn btn-sm">Cancel</button>
			</form>
		</div>
	{/each}
{/if}

<div class="Subhead Subhead--spaced"><h2>People</h2></div>
{#each data.people as p (p.id)}
	<div class="row person">
		<div class="name">
			<strong>{p.username}</strong>
			<span class="small muted">
				{p.is_admin ? 'You' : p.invited_as ? `Invited as ${p.invited_as}` : 'Joined with the invite code'}, {p.lists}
				{p.lists === 1 ? 'list' : 'lists'}, {mb(p.image_bytes)} of 100 MB
			</span>
		</div>
		{#if !p.is_admin}
			{#if confirming === p.id}
				<span class="small">This deletes their lists and photos.</span>
				<form method="POST" action="?/remove" use:enhance>
					<input type="hidden" name="id" value={p.id} />
					<button class="btn btn-sm btn-danger">Yes, remove</button>
				</form>
				<button type="button" class="btn btn-sm" onclick={() => (confirming = 0)}>Keep</button>
			{:else}
				<button type="button" class="btn btn-sm" onclick={() => (confirming = p.id)}>Remove</button>
			{/if}
		{/if}
		{#if listsOf(p.id).length}
			<ul class="lists">
				{#each listsOf(p.id) as l (l.id)}
					<li>
						<span class="ltitle">
							{l.title}
							<span class="small muted">
								{EDITIONS[l.edition]?.name}, {l.event_date}, {l.items} {l.items === 1 ? 'item' : 'items'}{l.hasPin ? ', PIN' : ''}
							</span>
						</span>
						<span class="tag {l.status}">{STATUS[l.status]}</span>
						{#if l.link}
							<a class="btn btn-sm" href={l.link} target="_blank" rel="noopener">View list</a>
						{:else}
							<span class="small muted gone">Can't be viewed</span>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="small muted none">No lists yet.</p>
		{/if}
	</div>
{/each}
<p class="note">You see each list the way visitors do. Lists with sharing off or past their date can't be opened, a PIN still applies, and notes stay with the owner.</p>

<style>
	.line {
		display: flex;
		gap: 8px;
	}
	.line .btn {
		flex: none;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		margin-bottom: 8px;
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #fffdf9;
		box-shadow: 0 1px 2px rgba(59, 42, 37, 0.06), 0 8px 24px -10px rgba(59, 42, 37, 0.2);
		background: #fff;
	}
	.name {
		display: flex;
		flex: 1 1 200px;
		flex-direction: column;
		min-width: 0;
	}
	.lists,
	.none {
		flex-basis: 100%;
		margin: 4px 0 0;
		padding: 0;
		list-style: none;
	}
	.lists li {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px;
		padding: 10px 0 0;
		border-top: 1px solid var(--border);
		margin-top: 10px;
	}
	.ltitle {
		display: flex;
		flex: 1 1 220px;
		flex-direction: column;
		min-width: 0;
		font-weight: 600;
	}
	.ltitle .small {
		font-weight: 400;
	}
	.tag {
		padding: 3px 10px;
		border-radius: 999px;
		background: #f1e8de;
		font-size: 13px;
		font-weight: 600;
	}
	.tag.open {
		background: #dcefe4;
		color: #2f6e50;
	}
	.url {
		flex: 2 1 240px;
		width: auto;
		font-size: 13px;
	}
	@media (max-width: 560px) {
		.line {
			flex-wrap: wrap;
		}
	}
</style>
