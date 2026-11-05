// Runs after `vite build`. The SvelteKit adapter writes the Worker to wrangler's `main` file and
// replaces it on every build, so the daily cleanup is added around it here.
import { appendFileSync, renameSync, writeFileSync } from 'node:fs';

const dir = '.svelte-kit/cloudflare';
renameSync(`${dir}/_worker.js`, `${dir}/_app.js`);
writeFileSync(
	`${dir}/_worker.js`,
	`import app from './_app.js';
import { dailyCleanup } from '../../src/lib/server/lists.js';

export default {
	fetch: app.fetch,
	scheduled(_event, env, ctx) {
		ctx.waitUntil(dailyCleanup(env).catch((e) => console.error('Daily cleanup failed:', e)));
	}
};
`
);
appendFileSync(`${dir}/.assetsignore`, '\n_app.js\n');
