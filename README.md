# Cadence Listy

Themed wish lists you can share with one link. Make a Christmas or Birthday list, add items with photos and links, and send the link to anyone. They don't need an account.

- Paste a product link to fill in its name, price, description and photo, or upload your own photo
- Shared lists show nothing else about your account, with an optional PIN
- Visitors can leave notes that only you can see, and save the list as a PDF or CSV
- Countdown, advent calendar, drawn illustrations and an optional banner photo
- The link closes after the big day, and the list and its photos are deleted a week later

It runs entirely on Cloudflare: Workers for the app, D1 for the database and R2 for images.

## Set it up

Everything here is in the [Cloudflare dashboard](https://dash.cloudflare.com).

1. **Create the database.** Go to **Storage & Databases > D1**, create a database named `cadence-listy`, and copy its ID.
2. **Add the ID to this repo.** In `wrangler.toml`, set `database_id` to that ID and commit it. The ID isn't a secret.
3. **Create the image bucket.** Go to **R2** and create a bucket named `cadence-listy-images`. Leave public access off.
4. **Connect GitHub.** Go to **Workers & Pages > Create** and import this repo. Use `npm run build` as the build command and `npx wrangler deploy` as the deploy command.
5. **Set your invite code.** In the Worker, go to **Settings > Variables and Secrets** and add a secret named `INVITE_CODE`. Anyone who wants an account needs this code. Without it, sign-ups stay closed.
6. **Add your domain.** In the Worker, go to **Settings > Domains & Routes** and add your custom domain.

Open your site, go to **Create an account**, and enter your invite code. The app sets up its own database tables the first time it runs. After that, every push to `main` deploys automatically.

## Limits

- 100 MB of images per account, 3.5 MB per image, and 200 items per list
- Photos are shrunk in the browser before upload

To change the image space, edit `USER_SPACE` in `src/lib/server/lists.js`.

## Add a theme

Editions live in `src/lib/editions`. Add an entry to `index.js`, then add its colors to `themes.css`. Anything new that hangs or falls on the page goes in `Decor.svelte`.

## Run it locally

```
npm install
echo "INVITE_CODE=test" > .dev.vars
npm run dev
```

Wrangler runs the app at `http://localhost:8787` with local copies of D1 and R2. To run the daily cleanup, open `http://localhost:8787/__scheduled`.

The link preview images in `static/` (`preview-<edition>.png`, 1200 × 630) go with each edition, so a new theme needs one too.
