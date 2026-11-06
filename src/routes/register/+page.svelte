<script>
	import { enhance } from '$app/forms';
	import { passwordKey } from '$lib/passwordKey.js';

	let { data, form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Create an account · Cadence Listy</title></svelte:head>

<div class="auth">
	<h1>Create an account</h1>
	{#if !data.open}
		<p>Sign-ups are closed. Ask for an invite link, or check that yours hasn't already been used.</p>
	{:else}
		{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}
		<form
			method="POST"
			use:enhance={async ({ formData }) => {
				busy = true;
				formData.set('key', await passwordKey(String(formData.get('username')), String(formData.get('password'))));
				formData.delete('password');
				formData.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<div class="form-group">
				<label for="invite">Invite code</label>
				<input id="invite" name="invite" class="form-control" autocomplete="off" required value={data.invite} />
			</div>
			<div class="form-group">
				<label for="username">Username</label>
				<input id="username" name="username" class="form-control" autocomplete="username" autocapitalize="none" maxlength="30" required value={form?.username ?? ''} />
			</div>
			<div class="form-group">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" class="form-control" autocomplete="new-password" minlength="8" required />
			</div>
			<button class="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
		</form>
	{/if}
	<p class="note">Already have an account? <a href="/login">Sign in</a>.</p>
</div>

<style>
	.auth {
		max-width: 360px;
		margin: 32px auto;
	}
	h1 {
		margin: 0 0 16px;
		font-family: 'Anton', Impact, sans-serif;
		font-size: 44px;
		font-weight: 400;
		text-transform: uppercase;
	}
</style>
