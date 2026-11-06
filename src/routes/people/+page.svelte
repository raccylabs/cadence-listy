<script>
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let copied = $state('');
	let confirming = $state(0);
	const link = (token) => `${data.origin}/register?invite=${token}`;
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
	<button class="btn btn-primary">Create invite link</button>
</form>

{#if data.invites.length}
	<div class="Subhead Subhead--spaced"><h2>Waiting to join</h2></div>
	{#each data.invites as i (i.token)}
		<div class="row">
			<strong class="name">{i.name}</strong>
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
	<div class="row">
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
	</div>
{/each}

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
		border: 2px solid var(--border);
		border-radius: var(--radius);
		background: #fff;
	}
	.name {
		display: flex;
		flex: 1 1 200px;
		flex-direction: column;
		min-width: 0;
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
