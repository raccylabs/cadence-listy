import { error, redirect } from '@sveltejs/kit';
import { requireUser, guarded, readForm } from '$lib/server/guard.js';
import {
	ownedList, readOptions, listItems, listNotes, updateList, deleteList, newLink, setPin, removePin, setBanner, removeBanner,
	addItem, updateItem, deleteItem, deleteNote, daysUntil, keepUntil, today
} from '$lib/server/lists.js';

async function mine({ locals, url, params }) {
	const user = requireUser(locals, url);
	const list = await ownedList(locals.env, user, params.id);
	if (!list) error(404, 'No list here.');
	return { user, list, env: locals.env };
}

export async function load(event) {
	const { user, list, env } = await mine(event);
	const { pin_hash, banner_key, options, user_id, ...rest } = list;
	return {
		list: {
			...rest,
			hasPin: !!pin_hash,
			options: readOptions(list),
			bannerImage: banner_key ? `/share/${list.share_token}/banner?v=${list.banner_v}` : ''
		},
		keepUntil: keepUntil(list),
		items: await listItems(env, list),
		notes: await listNotes(env, list),
		closesIn: daysUntil(list.event_date, today(user)),
		shareUrl: `${event.url.origin}/share/${list.share_token}`
	};
}

/** A form action that works on the signed-in owner's list. */
const act = (fn) =>
	guarded(async (event) => {
		const ctx = await mine(event);
		return (await fn(ctx, event)) ?? { saved: true };
	});

export const actions = {
	save: act(async ({ env, user, list }, { request }) => {
		await updateList(env, user, list, await readForm(request));
	}),
	setBanner: act(async ({ env, list }, { request }) => {
		await setBanner(env, list, await request.formData());
	}),
	removeBanner: act(async ({ env, list }) => {
		await removeBanner(env, list);
	}),
	addItem: act(async ({ env, list }, { request }) => {
		return { added: true, ...(await addItem(env, list, await request.formData())) };
	}),
	updateItem: act(async ({ env, list }, { request }) => {
		return { saved: true, ...(await updateItem(env, list, await request.formData())) };
	}),
	deleteItem: act(async ({ env, list }, { request }) => {
		await deleteItem(env, list, (await readForm(request)).id);
	}),
	deleteNote: act(async ({ env, list }, { request }) => {
		await deleteNote(env, list, (await readForm(request)).id);
	}),
	setPin: act(async ({ env, list }, { request }) => {
		await setPin(env, list, String((await readForm(request)).pin ?? ''));
	}),
	removePin: act(async ({ env, list }) => {
		await removePin(env, list);
	}),
	newLink: act(async ({ env, list }) => {
		await newLink(env, list);
	}),
	delete: act(async ({ env, list }) => {
		await deleteList(env, list);
		redirect(303, '/');
	})
};
