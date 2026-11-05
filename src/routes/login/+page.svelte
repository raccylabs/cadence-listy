<script>
	import { enhance } from '$app/forms';
	import { passwordKey } from '$lib/passwordKey.js';

	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Sign in · Cadence Listy</title></svelte:head>

<div class="auth">
	<h1>Sign in</h1>
	{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}
	<form
		method="POST"
		use:enhance={async ({ formData }) => {
			busy = true;
			formData.set('key', await passwordKey(String(formData.get('username')), String(formData.get('password'))));
			formData.delete('password');
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		<div class="form-group">
			<label for="username">Username</label>
			<input id="username" name="username" class="form-control" autocomplete="username" autocapitalize="none" required value={form?.username ?? ''} />
		</div>
		<div class="form-group">
			<label for="password">Password</label>
			<input id="password" name="password" type="password" class="form-control" autocomplete="current-password" required />
		</div>
		<button class="btn btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
	</form>
	<p class="note">Have an invite code? <a href="/register">Create an account</a>.</p>
</div>

<style>
	.auth {
		max-width: 360px;
		margin: 32px auto;
	}
	h1 {
		margin: 0 0 16px;
		font-size: 34px;
		font-weight: 800;
		letter-spacing: -0.03em;
	}
</style>
