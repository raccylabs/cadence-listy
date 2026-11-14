<script>
	import { enhance } from '$app/forms';
	import { EDITIONS, EDITION_LIST, sceneFor } from '$lib/editions/index.js';
	import Avatar from '$lib/Avatar.svelte';
	import Scene from '$lib/editions/Scene.svelte';

	let { data, form } = $props();
	const g = $derived(data.group);
	let edition = $state(data.group.edition);
	let copied = $state('');
	let confirming = $state('');
	const stay = () => ({ update }) => update({ reset: false });

	async function copy(which, text) {
		await navigator.clipboard.writeText(text);
		copied = which;
		setTimeout(() => (copied = ''), 2000);
	}
</script>

<svelte:head><title>{g.name} · Cadence Listy</title></svelte:head>

<p class="small"><a href="/groups">Families and groups</a></p>
<div class="Subhead"><h2>{g.name}</h2></div>
{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}

<a class="advent" href="/groups/{g.id}/advent">
	<span class="doors" aria-hidden="true"><span>3</span><span>17</span><span>8</span><span>24</span></span>
	<span><strong>Advent calendar</strong><span class="small">{g.mine ? 'Fill the doors with pictures, messages and surprises for each person.' : 'A new door opens every day in December.'}</span></span>
</a>
{#if g.mine}<p class="small"><a href="/groups/{g.id}/advent/setup">Set up the doors</a></p>{/if}

<div class="Subhead Subhead--spaced"><h2>Share the group page</h2></div>
<p class="note">Anyone with this link sees everyone's name and picture, and the lists they're sharing right now. Each list's own PIN still applies.</p>
<div class="link">
	<input class="form-control" readonly value={g.shareUrl} aria-label="Group page link" onfocus={(e) => e.currentTarget.select()} />
	<button class="btn" type="button" onclick={() => copy('share', g.shareUrl)}>{copied === 'share' ? 'Copied' : 'Copy link'}</button>
	<a class="btn" href={g.shareUrl} target="_blank" rel="noopener">View page</a>
</div>
{#if g.mine}
	<div class="row">
		<form method="POST" action="?/setPin" use:enhance={stay} class="row">
			<input class="form-control pin" name="pin" inputmode="numeric" pattern="\d{'{'}4,8{'}'}" maxlength="8" placeholder={g.hasPin ? 'New PIN' : '4 to 8 digits'} aria-label="PIN" required />
			<button class="btn">{g.hasPin ? 'Change PIN' : 'Add PIN'}</button>
		</form>
		{#if g.hasPin}<form method="POST" action="?/removePin" use:enhance={stay}><button class="btn">Remove PIN</button></form>{/if}
		<form method="POST" action="?/newLink" use:enhance={stay}><button class="btn" title="The old link stops working">Replace link</button></form>
	</div>
	<p class="note">Members who are signed in never need the PIN.</p>

	<div class="Subhead Subhead--spaced"><h2>Invite people to join</h2></div>
	<p class="note">Send this to someone with a Listy account. When they open it, they can join and their shared lists show up on the group page. New to Listy? Make them an account invite on the People page and pick this group, and they'll join when they sign up.</p>
	<div class="link">
		<input class="form-control" readonly value={g.joinUrl} aria-label="Join link" onfocus={(e) => e.currentTarget.select()} />
		<button class="btn" type="button" onclick={() => copy('join', g.joinUrl)}>{copied === 'join' ? 'Copied' : 'Copy link'}</button>
		<form method="POST" action="?/newJoin" use:enhance={stay}><button class="btn" title="The old join link stops working">Replace</button></form>
	</div>
{/if}

<div class="Subhead Subhead--spaced"><h2>Members</h2></div>
<div class="people">
	{#each data.members as m (m.id)}
		<div class="person">
			<Avatar avatar={m.avatar} photo={m.photo} size={48} label="" />
			<span class="name"><strong>{m.name}</strong><span class="small muted">{m.owner ? 'Made this group' : `@${m.username}`}</span></span>
			{#if g.mine && !m.owner}
				{#if confirming === `m${m.id}`}
					<form method="POST" action="?/remove" use:enhance={stay}><input type="hidden" name="id" value={m.id} /><button class="btn btn-sm btn-danger">Yes, remove</button></form>
				{:else}
					<button type="button" class="btn btn-sm" onclick={() => (confirming = `m${m.id}`)}>Remove</button>
				{/if}
			{/if}
		</div>
	{/each}
</div>
<p class="note">Your picture and name come from your <a href="/account">Account</a> page.</p>

{#if g.mine}
	<div class="Subhead Subhead--spaced"><h2>Page settings</h2></div>
	{#key `${g.name}${g.edition}${g.scene}`}
		<form method="POST" action="?/save" use:enhance={stay} class="settings">
			<div class="form-group">
				<label for="gname">Group name</label>
				<input id="gname" class="form-control" name="name" maxlength="60" required value={g.name} />
			</div>
			<div class="form-group">
				<label for="gtheme">Theme</label>
				<select id="gtheme" class="form-control" name="edition" bind:value={edition}>
					{#each EDITION_LIST as ed (ed.id)}<option value={ed.id}>{ed.name}</option>{/each}
				</select>
			</div>
			<fieldset>
				<legend>Picture at the top</legend>
				<div class="scenes">
					{#each EDITIONS[edition].scenes as [id, name] (id)}
						<label class="scene-pick">
							<input type="radio" name="scene" value={id} checked={sceneFor(edition, g.scene) === id} />
							<span class="thumb edition ed-root" data-edition={edition}><Scene {edition} scene={id} /></span>
							<span class="small">{name}</span>
						</label>
					{/each}
				</div>
			</fieldset>
			<button class="btn btn-primary">Save settings</button>
			{#if form?.saved}<span class="small muted" role="status">Saved</span>{/if}
		</form>
	{/key}

	<div class="Subhead Subhead--spaced Subhead--danger"><h2>Delete group</h2></div>
	<p class="mb-3">This removes the group page and its links. Everyone's lists stay as they are.</p>
	{#if confirming === 'delete'}
		<form method="POST" action="?/delete"><button class="btn btn-danger">Yes, delete this group</button></form>
	{:else}
		<button type="button" class="btn btn-danger" onclick={() => (confirming = 'delete')}>Delete this group</button>
	{/if}
{:else}
	<div class="Subhead Subhead--spaced Subhead--danger"><h2>Leave group</h2></div>
	<p class="mb-3">Your lists stop showing on this group's page.</p>
	{#if confirming === 'leave'}
		<form method="POST" action="?/leave"><button class="btn btn-danger">Yes, leave</button></form>
	{:else}
		<button type="button" class="btn btn-danger" onclick={() => (confirming = 'leave')}>Leave this group</button>
	{/if}
{/if}

<style>
	.advent {
		display: flex;
		align-items: center;
		gap: 14px;
		margin: 6px 0 6px;
		padding: 14px;
		border-radius: 16px;
		background: #e2574c;
		color: #fff;
		text-decoration: none;
		box-shadow: 0 10px 24px -12px rgba(59, 42, 37, 0.6);
	}
	.advent:hover {
		text-decoration: none;
		filter: brightness(1.05);
	}
	.advent strong {
		display: block;
		font: 400 24px/1.1 'Anton', Impact, sans-serif;
	}
	.doors {
		display: grid;
		flex: none;
		grid-template-columns: repeat(2, 24px);
		gap: 4px;
	}
	.doors span {
		display: grid;
		place-items: center;
		height: 24px;
		border-radius: 6px;
		background: #fffdf9;
		color: #3b2a25;
		font: 400 12px 'Anton', Impact, sans-serif;
	}
	.doors span:nth-child(2) {
		background: #f5c451;
	}
	.doors span:nth-child(3) {
		background: #d6ead9;
	}
	.link {
		display: flex;
		gap: 8px;
	}
	.link input {
		flex: 1;
		min-width: 0;
	}
	.link form {
		margin: 0;
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
	.people {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.person {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #fffdf9;
	}
	.name {
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
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
	@media (max-width: 560px) {
		.link {
			flex-wrap: wrap;
		}
		.link input {
			flex-basis: 100%;
		}
	}
</style>
