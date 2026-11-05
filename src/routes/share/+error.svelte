<script>
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>List closed</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="edition closed" data-edition="christmas">
	<div>
		<h1>This list is closed</h1>
		<p>{page.status === 404 ? page.error?.message : 'Something went wrong. Try this link again in a bit.'}</p>
	</div>
</main>

<style>
	.closed {
		display: grid;
		place-items: center;
		min-height: 100vh;
		padding: 24px;
		box-sizing: border-box;
		background: var(--ed-bg);
		color: var(--ed-text);
		font-family: var(--ed-body);
		text-align: center;
	}
	h1 {
		margin: 0 0 8px;
		font-family: var(--ed-display);
		font-size: 40px;
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}
	p {
		max-width: 34ch;
		margin: 0;
		color: var(--ed-muted);
		font-size: 18px;
	}
</style>
