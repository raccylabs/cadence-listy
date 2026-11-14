<script>
	import { enhance } from '$app/forms';
	import { DOOR_KINDS, FILLERS, FINALE, REACTIONS } from '$lib/advent.js';
	import { shrinkPhoto } from '$lib/photo.js';
	import Avatar from '$lib/Avatar.svelte';

	let { data, form } = $props();
	const s = $derived(data.setup);
	const ICON = { note: '✉️', coupon: '🎟️', riddle: '❓', clue: '🗺️', activity: '🎄' };
	const days = Array.from({ length: FINALE }, (_, i) => i + 1);

	let who = $state(0); // 0 is everyone
	let editing = $state(null);
	let kind = $state('note');
	let preview = $state('');
	let dialog;

	const own = (member, day) => s.doors.find((d) => d.member === member && d.day === day);
	const slot = (day) => (who ? own(who, day) : null) ?? own(0, day);
	const opened = (day) => (who ? s.opens.find((o) => o.user === who && o.day === day) : null);
	const person = $derived(s.members.find((m) => m.id === who));
	const firstOther = $derived(s.members.find((m) => m.id !== s.members[0]?.id) ?? s.members[0]);
	const previewAs = $derived(who || firstOther?.id);
	const filled = $derived(days.filter((d) => (who ? own(who, d) : own(0, d))).length);

	function edit(day) {
		editing = day;
		kind = own(who, day)?.kind ?? 'note';
		preview = '';
		dialog.showModal();
	}
	const cur = $derived(editing ? own(who, editing) : null);
	const fallback = $derived(editing && who ? own(0, editing) : null);
	const done = () =>
		async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') dialog.close();
		};
</script>

<svelte:head><title>Set up the advent calendar · {data.group.name}</title></svelte:head>

<p class="small"><a href="/groups/{data.group.id}">{data.group.name}</a></p>
<div class="Subhead"><h2>Advent calendar {s.year}</h2></div>
<p class="mb-3">
	Fill the doors with a picture, a message and a link. Make doors for everyone, then give anyone their own special ones. Days you leave empty get a built-in Christmas joke or fun fact.
	Only people signed in to this group can open the doors, and each door stays hidden until its day.
</p>
<div class="actions">
	<a class="btn btn-primary" href="/groups/{data.group.id}/advent">Open the calendar</a>
	{#if previewAs}<a class="btn" href="/groups/{data.group.id}/advent?as={previewAs}&day={Math.max(s.today, 1)}">Preview as {s.members.find((m) => m.id === previewAs)?.name}</a>{/if}
	{#if s.lastYear}
		<form method="POST" action="?/copy" use:enhance><button class="btn">Start from last year's {s.lastYear} doors</button></form>
	{/if}
</div>
{#if form?.error && !editing}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}
{#if form?.copied}<div class="flash mb-3" role="status">Copied {form.copied} doors from last year.</div>{/if}

<p class="label">Doors for</p>
<div class="who" role="radiogroup" aria-label="Doors for">
	<label class="pill"><input type="radio" bind:group={who} value={0} /><span><span class="all">🎄</span> Everyone</span></label>
	{#each s.members as m (m.id)}
		<label class="pill"><input type="radio" bind:group={who} value={m.id} /><span><Avatar avatar={m.avatar} photo={m.photo} size={26} label="" /> {m.name}</span></label>
	{/each}
</div>
<p class="note">
	{#if who}{person?.name} has {filled} door{filled === 1 ? '' : 's'} of their own. Faded doors come from Everyone, and dashed ones are built-in surprises.
	{:else}{filled} of {FINALE} doors filled for everyone.{/if}
</p>

<div class="grid">
	{#each days as d (d)}
		{@const mine = who ? own(who, d) : own(0, d)}
		{@const shared = !mine && slot(d)}
		{@const seen = opened(d)}
		<button type="button" class="day" class:mine class:shared class:empty={!mine && !shared} class:finale={d === FINALE} onclick={() => edit(d)}>
			<span class="n">{d}</span>
			{#if mine || shared}
				{@const x = mine || shared}
				{#if x.image}<img src={x.image} alt="" />{:else}<span class="ic">{ICON[x.kind]}</span>{/if}
				<span class="t">{x.title || x.message || x.link}</span>
			{:else}
				<span class="t">{FILLERS[d - 1][1]}</span>
			{/if}
			{#if seen}<span class="seen" title="Opened">✓{seen.reaction ? REACTIONS.find(([r]) => r === seen.reaction)?.[1] : ''}</span>{/if}
		</button>
	{/each}
</div>

<dialog bind:this={dialog} class="editor" onclose={() => (editing = null)}>
	{#if editing}
		<div class="ed-head">
			<h3>December {editing}{editing === FINALE ? ' (Christmas Day)' : ''} · {who ? person?.name : 'Everyone'}</h3>
			<button type="button" class="x" aria-label="Close" onclick={() => dialog.close()}>×</button>
		</div>
		{#if who && !cur}
			<p class="note">{fallback ? `${person?.name} gets the Everyone door for this day. Fill this in to give them their own.` : `${person?.name} gets a built-in surprise this day unless you fill this in.`}</p>
		{/if}
		{#if form?.error}<div class="flash flash-error mb-3" role="alert">{form.error}</div>{/if}
		{#key `${who}-${editing}`}
			<form method="POST" action="?/save" enctype="multipart/form-data" use:enhance={done}>
				<input type="hidden" name="member" value={who} />
				<input type="hidden" name="day" value={editing} />
				<div class="kinds" role="radiogroup" aria-label="Kind of door">
					{#each DOOR_KINDS as [id, name] (id)}
						<label class="pill"><input type="radio" name="kind" value={id} bind:group={kind} /><span>{ICON[id]} {name}</span></label>
					{/each}
				</div>
				<div class="form-group">
					<label for="a-title">{kind === 'coupon' ? 'Good for…' : kind === 'riddle' ? 'Question' : 'Title'}</label>
					<input id="a-title" class="form-control" name="title" maxlength="80" value={cur?.title ?? ''} placeholder={kind === 'coupon' ? 'One hot cocoa with Dad' : kind === 'riddle' ? 'What has a neck but no head?' : ''} />
				</div>
				<div class="form-group">
					<label for="a-msg">{kind === 'clue' ? 'The clue' : kind === 'activity' ? 'What to do' : 'Message'}</label>
					<textarea id="a-msg" class="form-control" name="message" maxlength="1000" rows="4">{cur?.message ?? ''}</textarea>
				</div>
				{#if kind === 'riddle'}
					<div class="form-group">
						<label for="a-ans">Answer (hidden until they tap)</label>
						<input id="a-ans" class="form-control" name="answer" maxlength="200" value={cur?.answer ?? ''} placeholder="A bottle" />
					</div>
				{/if}
				<div class="form-group">
					<label for="a-link">Link (optional)</label>
					<input id="a-link" class="form-control" name="link" maxlength="500" value={cur?.link ?? ''} placeholder="YouTube and Spotify links play right on the door" />
				</div>
				<div class="form-group">
					<label for="a-img">Picture (optional)</label>
					<div class="img-row">
						{#if preview || cur?.image}<img class="thumb" src={preview || cur.image} alt="" />{/if}
						<input
							id="a-img"
							class="form-control"
							type="file"
							name="image"
							accept="image/*"
							onchange={async (e) => {
								const input = e.currentTarget;
								await shrinkPhoto(input, 1400);
								const f = input.files?.[0];
								preview = f ? URL.createObjectURL(f) : '';
							}}
						/>
					</div>
					{#if cur?.image}<label class="check"><input type="checkbox" name="remove_image" /> Remove the picture</label>{/if}
				</div>
				<div class="buttons">
					<button class="btn btn-primary">Save door</button>
					{#if previewAs}<a class="btn" href="/groups/{data.group.id}/advent?as={who || previewAs}&day={editing}" target="_blank" rel="noopener">Preview</a>{/if}
				</div>
			</form>
			{#if cur}
				<form method="POST" action="?/clear" use:enhance={done} class="clear">
					<input type="hidden" name="member" value={who} />
					<input type="hidden" name="day" value={editing} />
					<button class="btn btn-danger">Empty this door</button>
				</form>
			{/if}
		{/key}
	{/if}
</dialog>

<style>
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 18px;
	}
	.actions form {
		margin: 0;
	}
	.label {
		margin: 0 0 6px;
		font-weight: 600;
	}
	.who,
	.kinds {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 10px;
	}
	.pill {
		position: relative;
		margin: 0;
		cursor: pointer;
	}
	.pill input {
		position: absolute;
		opacity: 0;
	}
	.pill > span {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 12px 5px 6px;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: #fffdf9;
		font-weight: 600;
	}
	.kinds .pill > span {
		padding-left: 12px;
	}
	.all {
		display: grid;
		place-items: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: #d6ead9;
	}
	.pill input:checked + span {
		border-color: #3b2a25;
		background: #3b2a25;
		color: #fff;
	}
	.pill input:focus-visible + span {
		outline: 2px solid #5b9bd5;
		outline-offset: 2px;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 10px;
		margin-top: 12px;
	}
	.day {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-height: 128px;
		padding: 10px 8px;
		border: 1px solid var(--border);
		border-radius: 14px;
		background: #fffdf9;
		color: var(--fg);
		text-align: center;
		cursor: pointer;
	}
	.day:hover {
		box-shadow: 0 8px 20px -10px rgba(59, 42, 37, 0.45);
	}
	.day.mine {
		border: 2px solid #4f9f7d;
	}
	.day.shared {
		opacity: 0.6;
	}
	.day.empty {
		border-style: dashed;
		background: transparent;
	}
	.day.finale {
		border-color: #e2574c;
	}
	.n {
		align-self: flex-start;
		font: 400 22px/1 'Anton', Impact, sans-serif;
	}
	.day img {
		width: 54px;
		height: 54px;
		object-fit: cover;
		border-radius: 10px;
	}
	.ic {
		font-size: 30px;
	}
	.t {
		display: -webkit-box;
		overflow: hidden;
		font-size: 12px;
		line-height: 1.3;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}
	.empty .t {
		color: var(--fg-muted);
	}
	.seen {
		position: absolute;
		top: 8px;
		right: 8px;
		padding: 0 6px;
		border-radius: 999px;
		background: #d6ead9;
		font-size: 12px;
		font-weight: 700;
	}
	.editor {
		width: min(560px, calc(100vw - 24px));
		max-height: calc(100vh - 32px);
		padding: 18px 20px;
		border: 0;
		border-radius: 18px;
		background: #fffdf9;
		box-shadow: 0 30px 80px -20px rgba(59, 42, 37, 0.6);
	}
	.editor::backdrop {
		background: rgba(59, 42, 37, 0.45);
	}
	.ed-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.ed-head h3 {
		margin: 0;
		font-size: 18px;
	}
	.x {
		width: 34px;
		height: 34px;
		border: 0;
		border-radius: 50%;
		background: #efe5d8;
		font-size: 22px;
		cursor: pointer;
	}
	.img-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.thumb {
		width: 56px;
		height: 56px;
		object-fit: cover;
		border-radius: 10px;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 6px;
		font-weight: 400;
	}
	.buttons {
		display: flex;
		gap: 8px;
	}
	.clear {
		margin-top: 10px;
	}
	@media (max-width: 640px) {
		.grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
