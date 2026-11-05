<script>
	import { page } from '$app/state';
</script>

<svelte:head><title>Cadence Listy</title></svelte:head>
<h1>{page.status === 404 ? 'Nothing here' : 'Something went wrong'}</h1>
<p>{page.error?.message}</p>
<p><a href="/">Go to my lists</a></p>
