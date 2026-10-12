# Private CTM Studio Worker

Uses Cloudflare Workers to enforce the login on **all requests** (HTML, JavaScript, CSS, images).

Requirements: Cloudflare free account, Node.js, internet access, and authentication to your Cloudflare account.

Quick start: `cd worker` → `npm install` → `npx wrangler login` → set the three secrets (see root `README.md`) → `npm run deploy`.

Static private assets are in `private/` and will not be published via GitHub Pages. The `assets.run_worker_first: true` setting must remain enabled; removing it would bypass the login on files.

For local development, `npm run dev` requires local dev secrets in `.dev.vars` (gitignored). **Do not push `.dev.vars`.**
