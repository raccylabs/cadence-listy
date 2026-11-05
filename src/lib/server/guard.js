import { fail, redirect } from '@sveltejs/kit';
import { ValidationError } from './errors.js';

export function requireUser(locals, url) {
	if (!locals.user) redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	return locals.user;
}

/** Wrap a form action so validation errors become `fail(400, { error })`. */
export function guarded(fn) {
	return async (event) => {
		try {
			return await fn(event);
		} catch (e) {
			if (e instanceof ValidationError) return fail(400, { error: e.message });
			throw e;
		}
	};
}

/** Read a form's text fields into a plain object. */
export async function readForm(request) {
	const out = {};
	for (const [k, v] of (await request.formData()).entries()) if (typeof v === 'string') out[k] = v;
	return out;
}
