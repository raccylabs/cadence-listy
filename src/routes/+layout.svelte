<script>
	import '@fontsource-variable/inter-tight/index.css';
	import '../app.css';
	import { page } from '$app/state';

	let { data, children } = $props();
</script>

{#if page.route.id?.startsWith('/share')}
	{@render children()}
{:else}
	<header>
		<a class="brand" href="/"><span class="mark" aria-hidden="true"></span>Cadence Listy</a>
		{#if data.me}
			<nav>
				<a href="/">My lists</a>
				<a href="/account">Account</a>
				<form method="POST" action="/logout"><button>Sign out</button></form>
			</nav>
		{/if}
	</header>
	<main>{@render children()}</main>
{/if}

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		max-width: 860px;
		margin: 0 auto;
		padding: 16px 20px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--fg);
		font-size: 18px;
		font-weight: 800;
		letter-spacing: -0.02em;
		text-decoration: none;
	}
	.mark {
		width: 26px;
		height: 26px;
		border-radius: 8px;
		background: repeating-linear-gradient(-45deg, var(--red) 0 6px, #ffd9de 6px 12px);
	}
	nav {
		display: flex;
		align-items: center;
		gap: 16px;
		font-size: 15px;
	}
	nav a,
	nav button {
		padding: 0;
		border: 0;
		background: none;
		color: var(--fg);
		font: inherit;
		text-decoration: none;
		cursor: pointer;
	}
	nav a:hover,
	nav button:hover {
		text-decoration: underline;
	}
	main {
		max-width: 860px;
		margin: 0 auto;
		padding: 12px 20px 56px;
	}
</style>
