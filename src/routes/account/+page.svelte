<script>
	import { enhance } from '$app/forms';
	import { passwordKey } from '$lib/passwordKey.js';

	let { data, form } = $props();
	const hashed = (fields) => async ({ formData }) => {
		for (const name of fields) formData.set(name, await passwordKey(data.username, String(formData.get(name))));
	};
</script>

<svelte:head><title>Account · Cadence Listy</title></svelte:head>

<div class="Subhead"><h2>Change password</h2></div>
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
	.narrow {
		max-width: 360px;
	}
</style>
