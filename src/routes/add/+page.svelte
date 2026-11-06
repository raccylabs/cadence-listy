<script>
	import { onMount } from 'svelte';
	import { storeLabel, shortTitle } from '$lib/stores.js';
	import { EDITIONS } from '$lib/editions/index.js';
	import ItemForm from '../lists/ItemForm.svelte';

	let { data } = $props();
	let details = $state(null);
	let listId = $state(0);
	let saved = $state(false);
	let empty = $state(false);
	const KEY = 'listy-add';

	onMount(() => {
		let raw = '';
		try {
			raw = decodeURIComponent(location.hash.slice(1)) || sessionStorage.getItem(KEY) || '';
			history.replaceState(null, '', location.pathname);
			if (!data.signedIn) {
				if (raw) sessionStorage.setItem(KEY, raw);
				location.href = '/login?next=/add';
				return;
			}
			sessionStorage.removeItem(KEY);
			const d = JSON.parse(raw);
			details = { ...d, store: storeLabel(d.store), title: shortTitle(d.title) };
		} catch {
			empty = true;
		}
		listId = data.lists[0]?.id ?? 0;
	});
</script>

<svelte:head><title>Add an item · Cadence Listy</title></svelte:head>

<div class="Subhead"><h2>Add to a list</h2></div>
{#if saved}
	<p>Added to your list. You can close this tab and keep shopping.</p>
	<a class="btn btn-primary" href="/lists/{listId}">View list</a>
{:else if empty}
	<p>Nothing to add yet. Open a product in a store, then click your Add to Listy button.</p>
{:else if details && !data.lists.length}
	<p>You need a list first. <a href="/">Create one</a>, then click the button again.</p>
{:else if details}
	<div class="form-group">
		<label for="pick">Which list?</label>
		<select id="pick" class="form-control" bind:value={listId}>
			{#each data.lists as l (l.id)}<option value={l.id}>{l.title}</option>{/each}
		</select>
	</div>
	{#key listId}
		<ItemForm tiers={EDITIONS[data.lists.find((l) => l.id === listId)?.edition]?.tiers ?? []} {listId} prefill={details} onsaved={() => (saved = true)} />
	{/key}
{/if}
