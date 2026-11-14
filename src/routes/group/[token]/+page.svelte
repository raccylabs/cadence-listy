<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { EDITIONS } from '$lib/editions/index.js';
	import Decor from '$lib/editions/Decor.svelte';
	import Scene from '$lib/editions/Scene.svelte';
	import Avatar from '$lib/Avatar.svelte';

	let { data, form } = $props();
	const group = $derived(data.group);
	const edition = $derived(EDITIONS[group?.edition ?? data.edition] ?? EDITIONS.christmas);
	// The group page always gets the falling snow or confetti, and the string of lights or pennants.
	const decor = { snow: true, confetti: true, lights: true, bunting: true, lightsMode: 'twinkle' };
	const token = $derived(page.params.token);
	const photo = (m) => (m.photo ? `/group/${token}/avatar/${m.id}?v=${m.photo}` : '');
	const away = (days) => (days > 1 ? `${days} days to go` : days === 1 ? 'Tomorrow' : 'Today');
</script>

<svelte:head>
	<title>{group?.name ?? data.name}</title>
	<meta name="robots" content="noindex, nofollow" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Cadence Listy" />
	<meta property="og:title" content={group?.name ?? data.name} />
	<meta property="og:description" content="See everyone's wish lists." />
	<meta property="og:image" content="{page.url.origin}/preview-{edition.id}.png" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="edition ed-root" data-edition={edition.id}>
	{#if data.locked}
		<main class="lock">
			<h1>{data.name}</h1>
			<p>Enter the PIN to open this page.</p>
			<form method="POST" action="?/unlock" use:enhance>
				<input name="pin" type="password" inputmode="numeric" autocomplete="off" pattern="\d*" maxlength="8" required aria-label="PIN" />
				<button>Open</button>
			</form>
			{#if form?.pinError}<p class="err" role="alert">{form.pinError}</p>{/if}
		</main>
	{:else}
		<Decor edition={edition.id} options={decor} part="fall" />
		<main class="wrap">
			{#if data.member}<p class="preview">This is the page people see. <a href="/groups/{data.manageId}">Group settings</a> · <a href="/groups/{data.manageId}/advent">🎄 Open your advent calendar</a></p>{/if}
			<header class="banner">
				<div class="words">
					<h1>{group.name}</h1>
					<p class="msg">Tap someone to see their wish list.</p>
				</div>
				<div class="art">
					<Scene edition={edition.id} scene={group.scene} />
					<Decor edition={edition.id} options={decor} part="string" />
				</div>
			</header>
			<div class="stripes" aria-hidden="true"></div>

			<div class="people">
				{#each group.members as m, i (m.id)}
					{@const only = m.lists.length === 1 ? m.lists[0] : null}
					<article class="person" class:has={m.lists.length} style="--n:{Math.min(i, 8)}">
						<svelte:element this={only ? 'a' : 'div'} class="face" href={only ? `${only.link}?from=${token}` : undefined}>
							<Avatar avatar={m.avatar} photo={photo(m)} size={120} label="" />
							<h2>{m.name}</h2>
						</svelte:element>
						{#each m.lists as l (l.link)}
							<a class="list" href="{l.link}?from={token}">
								<strong>{l.title}</strong>
								<span>{away(l.days)} · {l.items} {l.items === 1 ? 'wish' : 'wishes'}{l.locked ? ' · PIN' : ''}</span>
							</a>
						{:else}
							<p class="none">No list shared right now.</p>
						{/each}
					</article>
				{/each}
			</div>
		</main>
	{/if}
</div>

<style>
	:global(body:has(.edition.ed-root)) {
		margin: 0;
		background: transparent;
	}
	.ed-root {
		position: relative;
		box-sizing: border-box;
		min-height: 100vh;
		background: var(--ed-paper);
		color: var(--ed-ink);
		font-family: var(--ed-body);
		font-size: 16px;
		line-height: 1.45;
	}
	p {
		margin: 0;
	}
	a {
		color: inherit;
	}
	.wrap {
		position: relative;
		box-sizing: border-box;
		max-width: 1180px;
		margin: 0 auto;
		padding: 20px 24px 40px;
	}
	.preview {
		margin-bottom: 12px;
		font-size: 13px;
	}
	.banner {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		overflow: hidden;
		min-height: 320px;
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-card);
		box-shadow: var(--ed-shadow);
	}
	.words {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 14px;
		padding: 36px;
	}
	h1 {
		margin: 0;
		font-family: var(--ed-display);
		font-size: clamp(46px, 6vw, 84px);
		font-weight: 400;
		line-height: 1.02;
	}
	.msg {
		font-size: 18px;
	}
	.art {
		position: relative;
		overflow: hidden;
		min-height: 240px;
		border-left: 1px solid var(--ed-line);
		background: var(--ed-paper);
	}
	.art :global(.string) {
		z-index: 1;
	}
	.stripes {
		margin: 14px 4px 0;
	}
	.stripes {
		height: 16px;
		border-radius: 999px;
		background:
			linear-gradient(rgba(255, 255, 255, 0.45), rgba(255, 255, 255, 0) 45%, rgba(59, 42, 37, 0.1)),
			repeating-linear-gradient(-55deg, var(--ed-pop-1) 0 12px, #fffdf9 12px 24px);
		box-shadow: 0 2px 6px -2px rgba(59, 42, 37, 0.3);
	}
	/* Birthday: a band of pink frosting covered in sprinkles. */
	[data-edition='birthday'] .stripes {
		background-color: #f7c6d4;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0) 50%, rgba(59, 42, 37, 0.06)),
			url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='16'%3E%3Cg stroke-width='3' stroke-linecap='round'%3E%3Cpath d='M5 5l6 3' stroke='%235aa9a3'/%3E%3Cpath d='M17 11l5-4' stroke='%23f5c96a'/%3E%3Cpath d='M28 4l2 6' stroke='%239b7fd1'/%3E%3Cpath d='M37 9l6 2' stroke='%23fffdf9'/%3E%3Cpath d='M48 5l5 4' stroke='%23e9806a'/%3E%3Cpath d='M60 11l4-6' stroke='%235aa9a3'/%3E%3Cpath d='M68 7l3 3' stroke='%23f5c96a'/%3E%3Cpath d='M10 12l3-1' stroke='%23fffdf9'/%3E%3Cpath d='M54 13l4-1' stroke='%239b7fd1'/%3E%3C/g%3E%3C/svg%3E");
		background-size: 100% 100%, 72px 16px;
		background-repeat: no-repeat, repeat-x;
	}
	.people {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
		gap: 14px;
		margin-top: 18px;
	}
	.person {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 20px 16px 16px;
		border: 1px solid var(--ed-line);
		border-radius: 22px;
		background: var(--ed-card);
		box-shadow: var(--ed-shadow);
		animation: pop 0.4s cubic-bezier(0.2, 1.5, 0.4, 1) backwards;
		animation-delay: calc(var(--n) * 70ms);
		transition: transform 0.14s ease, box-shadow 0.14s ease;
	}
	.person.has:hover {
		box-shadow: var(--ed-shadow-up);
		transform: translateY(-4px);
	}
	.face {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
		text-align: center;
		text-decoration: none;
	}
	a.face:hover :global(.avatar) {
		animation: wobble 0.5s ease-in-out;
	}
	.face h2 {
		margin: 0;
		font-family: var(--ed-display);
		font-size: 28px;
		font-weight: 400;
		line-height: 1.1;
	}
	.list {
		display: flex;
		flex-direction: column;
		padding: 10px 14px;
		border-radius: 14px;
		background: var(--ed-pop-4);
		text-decoration: none;
		transition: transform 0.1s ease;
	}
	.list:hover {
		background: var(--ed-pop-3);
	}
	.list:active {
		transform: translate(2px, 2px);
	}
	.list strong {
		font-size: 15px;
		line-height: 1.25;
	}
	.list span {
		font-size: 13px;
	}
	.none {
		color: var(--ed-muted);
		font-size: 14px;
		text-align: center;
	}
	.lock {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		max-width: 380px;
		margin: 0 auto;
		padding: 80px 20px;
		text-align: center;
	}
	.lock form {
		display: flex;
		gap: 8px;
	}
	.lock input {
		width: 140px;
		padding: 10px 12px;
		border: 1px solid var(--ed-line);
		border-radius: 12px;
		font: inherit;
	}
	.lock button {
		padding: 10px 18px;
		border: 0;
		border-radius: 999px;
		background: var(--ed-pop-1);
		color: #fff;
		font: 700 15px var(--ed-body);
	}
	.err {
		color: #b42318;
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(14px) scale(0.92);
		}
	}
	@keyframes wobble {
		25% {
			transform: rotate(-4deg);
		}
		75% {
			transform: rotate(4deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.person,
		a.face:hover :global(.avatar) {
			animation: none;
		}
		.person.has:hover {
			transform: none;
		}
	}
	@media (max-width: 760px) {
		.wrap {
			padding: 10px 10px 24px;
		}
		.banner {
			display: flex;
			flex-direction: column;
			min-height: 0;
		}
		.words {
			padding: 22px 18px;
		}
		.art {
			height: 210px;
			min-height: 0;
			border-top: 1px solid var(--ed-line);
			border-left: 0;
		}
		.people {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 8px;
		}
		.face h2 {
			font-size: 22px;
		}
	}
</style>
