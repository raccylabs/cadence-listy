<script>
	let { data, form } = $props();
</script>

<svelte:head><title>Join {data.name} · Cadence Listy</title></svelte:head>

<div class="join">
	<h1>Join {data.name}?</h1>
	<p>{data.by ? `${data.by} invited you.` : ''} Your name, picture and the lists you share will show on this group's page.</p>
	{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}
	<form method="POST"><button class="btn btn-primary">Join the group</button> <a class="btn" href="/">Not now</a></form>
</div>

<style>
	.join {
		max-width: 460px;
		margin: 40px auto;
		padding: 24px;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: #fffdf9;
	}
	h1 {
		margin-top: 0;
		font-size: 24px;
	}
</style>
