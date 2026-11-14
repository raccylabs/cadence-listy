<script>
	import { enhance } from '$app/forms';
	import { passwordKey } from '$lib/passwordKey.js';
	import { shrinkPhoto } from '$lib/photo.js';
	import { AVATARS, avatarFor } from '$lib/avatars.js';
	import Avatar from '$lib/Avatar.svelte';

	let { data, form } = $props();
	let picked = $state(avatarFor(data.profile.avatar));
	let preview = $state('');
	const photoUrl = $derived(data.profile.photo ? `/account/avatar?v=${data.profile.photo}` : '');
	const hashed = (fields) => async ({ formData }) => {
		for (const name of fields) formData.set(name, await passwordKey(data.username, String(formData.get(name))));
	};
</script>

<svelte:head><title>Account · Cadence Listy</title></svelte:head>

<div class="Subhead"><h2>Your picture and name</h2></div>
<p class="mb-3">People see these on family and group pages.</p>
<form
	method="POST"
	action="?/profile"
	enctype="multipart/form-data"
	class="profile"
	use:enhance={() =>
		async ({ update }) => {
			await update({ reset: false });
			preview = '';
		}}
>
	{#if form?.profileError}<div class="flash flash-error mb-3" role="alert">{form.profileError}</div>{/if}
	<div class="me">
		<Avatar avatar={picked} photo={preview || photoUrl} size={96} label="Your picture" />
		<div class="form-group grow">
			<label for="display_name">Name to show</label>
			<input id="display_name" name="display_name" class="form-control" maxlength="40" placeholder={data.username} value={data.profile.display_name} />
		</div>
	</div>
	<p class="label">Pick a character</p>
	<div class="faces">
		{#each AVATARS as [id, name] (id)}
			<label class="face" title={name}>
				<input type="radio" name="avatar" value={id} bind:group={picked} />
				<Avatar avatar={id} size={56} label={name} />
			</label>
		{/each}
	</div>
	<div class="form-group">
		<label for="photo">Or use a photo</label>
		<input
			id="photo"
			name="photo"
			type="file"
			accept="image/*"
			class="form-control"
			onchange={async (e) => {
				const input = e.currentTarget;
				await shrinkPhoto(input, 400);
				const file = input.files?.[0];
				preview = file ? URL.createObjectURL(file) : '';
			}}
		/>
		{#if data.profile.photo}<label class="check"><input type="checkbox" name="remove_photo" /> Remove my photo and use the character</label>{/if}
	</div>
	<button class="btn btn-primary">Save</button>
	{#if form?.profileSaved}<span class="small muted" role="status">Saved</span>{/if}
</form>

<div class="Subhead Subhead--spaced"><h2>Change password</h2></div>
<form method="POST" action="?/password" use:enhance={hashed(['current', 'next'])} class="narrow">
	{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}
	<div class="form-group">
		<label for="current">Current password</label>
		<input id="current" name="current" type="password" class="form-control" autocomplete="current-password" required />
	</div>
	<div class="form-group">
		<label for="next">New password</label>
		<input id="next" name="next" type="password" class="form-control" autocomplete="new-password" minlength="8" required />
	</div>
	<button class="btn btn-primary">Change password</button>
	{#if form?.saved}<span class="small muted" role="status">Password changed</span>{/if}
</form>

<div class="Subhead Subhead--spaced Subhead--danger"><h2>Delete account</h2></div>
<p>This deletes your account and all your lists, photos and notes for good.</p>
<form method="POST" action="?/delete" use:enhance={hashed(['current'])} class="narrow">
	{#if form?.deleteError}<div class="flash flash-error mb-3" role="alert">{form.deleteError}</div>{/if}
	<div class="form-group">
		<label for="confirm">Your password</label>
		<input id="confirm" name="current" type="password" class="form-control" autocomplete="current-password" required />
	</div>
	<button class="btn btn-danger">Delete my account</button>
</form>

<style>
	.profile {
		max-width: 520px;
	}
	.me {
		display: flex;
		align-items: center;
		gap: 18px;
		margin-bottom: 12px;
	}
	.grow {
		flex: 1;
		margin: 0;
	}
	.label {
		margin: 0 0 6px;
		font-weight: 600;
	}
	.faces {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-bottom: 14px;
	}
	.face {
		position: relative;
		margin: 0;
		padding: 3px;
		border: 2px solid transparent;
		border-radius: 50%;
		cursor: pointer;
	}
	.face input {
		position: absolute;
		opacity: 0;
	}
	.face:has(input:checked) {
		border-color: #3b2a25;
	}
	.face:has(input:focus-visible) {
		outline: 2px solid #5b9bd5;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 6px;
		font-weight: 400;
	}
	.narrow {
		max-width: 360px;
	}
</style>
