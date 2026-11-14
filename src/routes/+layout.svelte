<script>
	import '@fontsource-variable/inter-tight/index.css';
	import '@fontsource/anton/400.css';
	import '../app.css';
	import '$lib/editions/themes.css';
	import { page } from '$app/state';

	let { data, children } = $props();
</script>

{#if page.route.id?.startsWith('/share') || page.route.id?.startsWith('/group/')}
	{@render children()}
{:else}
	<header>
		<div class="bar">
			<a class="brand" href="/"><span class="mark" aria-hidden="true"></span>Cadence Listy</a>
			{#if data.me}
				<nav>
					<a href="/">My lists</a>
					<a href="/groups">Groups</a>
					{#if data.me.admin}<a href="/people">People</a>{/if}
					<a href="/account">Account</a>
					<form method="POST" action="/logout"><button>Sign out</button></form>
				</nav>
			{/if}
		</div>
	</header>
	<main>{@render children()}</main>
{/if}

<style>
	header {
		border-bottom: 1px solid var(--border);
		background: #fffdf9;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		max-width: 900px;
		margin: 0 auto;
		padding: 12px 20px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		color: var(--fg);
		font-family: 'Anton', Impact, sans-serif;
		font-size: 22px;
		text-decoration: none;
	}
	.mark {
		width: 28px;
		height: 28px;
		border-radius: 9px;
		background: repeating-linear-gradient(-45deg, var(--red) 0 6px, #fff 6px 12px);
	}
	nav {
		display: flex;
		align-items: center;
		gap: 16px;
		font-size: 15px;
		font-weight: 600;
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
		max-width: 900px;
		margin: 0 auto;
		padding: 20px 20px 56px;
	}
</style>
