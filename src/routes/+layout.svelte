<script>
	import '@fontsource-variable/inter-tight/index.css';
	import '@fontsource/anton/400.css';
	import '@fontsource/space-mono/400.css';
	import '@fontsource/space-mono/700.css';
	import '../app.css';
	import { page } from '$app/state';

	let { data, children } = $props();
</script>

{#if page.route.id?.startsWith('/share')}
	{@render children()}
{:else}
	<header>
		<div class="bar">
			<a class="brand" href="/"><span class="mark" aria-hidden="true"></span>Cadence Listy</a>
			{#if data.me}
				<nav>
					<a href="/">My lists</a>
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
		border-bottom: 2px solid #000;
		background: #fff;
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
		color: #000;
		font-family: 'Anton', Impact, sans-serif;
		font-size: 22px;
		text-decoration: none;
		text-transform: uppercase;
	}
	.mark {
		width: 28px;
		height: 28px;
		border: 2px solid #000;
		border-radius: 6px;
		background: repeating-linear-gradient(-45deg, var(--red) 0 6px, #fff 6px 12px);
	}
	nav {
		display: flex;
		align-items: center;
		gap: 16px;
		font: 700 13px 'Space Mono', monospace;
		text-transform: uppercase;
	}
	nav a,
	nav button {
		padding: 0;
		border: 0;
		background: none;
		color: #000;
		font: inherit;
		text-decoration: none;
		text-transform: inherit;
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
