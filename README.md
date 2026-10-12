# CTM Media Network — GitHub Pages + Private Creator Studio (v3)

A low-cost deployment model using **GitHub Pages for the public site**, a **Cloudflare Worker for server-side Creator Studio login**, and your **custom domain**. This preserves the approved CTM homepage and official `ctm-logo.png`.

## Project layout

```
ctm-github-pages-secure-studio-v3/
├── docs/                      <-- ONLY these files are served by GitHub Pages
│   ├── index.html             <-- Public CTM homepage
│   ├── styles.css
│   ├── app.js
│   ├── studio-config.js       <-- Link to the private Worker, not a secret
│   ├── .nojekyll
│   └── assets/ctm-logo.png (+ other artwork)
├── worker/
│   ├── src/index.js           <-- Secure server-side login, signed sessions
│   ├── private/               <-- Private Studio HTML/CSS/JS/images
│   ├── wrangler.jsonc
│   └── package.json
└── README.md
```

## 1. Preview the public site in VS Code

Open this folder in VS Code and open `docs/index.html` using Live Server. The existing public homepage functionality works without backend services. The Studio link will show a setup reminder until you configure it.

## 2. Publish public site for FREE with GitHub Pages

1. Create a **public** GitHub repository (for example `ctm-media-network`).
2. Push **the entire extracted folder** to the root of the repository. Do **not** push passwords, `.dev.vars`, or other secret files.
3. GitHub repository > **Settings > Pages** > Build and deployment: **Deploy from a branch**.
4. Select `main` and folder **`/docs`**, then **Save**. The public homepage loads from `docs/index.html`. (The rest of the repo is code, not served as the public site.)
5. Your default URL will typically resemble `https://YOUR-USERNAME.github.io/ctm-media-network/`.
6. To use your domain: go to **Settings > Pages > Custom domain**, enter your domain, save; update DNS records with your DNS provider following GitHub’s on-screen directions and enable **Enforce HTTPS** once available.

Official guide: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site

### Public vs private

- Public: `docs/index.html`, CSS, JavaScript, logos, thumbnails and ordinary media website content.
- Password-protected: `worker/private/studio.html`, `studio.js`, `styles.css`, protected assets served ONLY through the Worker.
- All code in a **public GitHub repository** can be read by visitors to GitHub. The Studio code and example topics are not a secret; the login protects access to the **running Studio**. **Never put sensitive data or API keys in the GitHub repository or Worker private assets folder.**

## 3. Deploy secure Creator Studio with Cloudflare Workers

1. Sign up for a free Cloudflare account: https://dash.cloudflare.com/ . You do not need to move the public site away from GitHub Pages.
2. In a terminal in the `worker` folder:

   ```bash
   npm install
   npx wrangler login
   npx wrangler secret put STUDIO_USERNAME
   npx wrangler secret put STUDIO_PASSWORD
   npx wrangler secret put SESSION_SECRET
   npm run deploy
   ```

3. Enter your previously chosen username when prompted for `STUDIO_USERNAME`, and **enter your chosen password interactively** when prompted for `STUDIO_PASSWORD`. Do not type secrets in source code or copy credentials into GitHub.
4. For `SESSION_SECRET`, create a **different, long, random** value (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Keep it private. Replacing it will invalidate active Studio sessions.
5. Wrangler prints a URL similar to `https://ctm-creator-studio.YOUR-SUBDOMAIN.workers.dev` after deploying. Open it over HTTPS. It will display the login form. Log in and verify the example dashboard appears.
6. Set `docs/studio-config.js` to that exact Worker URL and commit the change to GitHub:

   ```js
   window.CTM_STUDIO_URL = 'https://ctm-creator-studio.YOUR-SUBDOMAIN.workers.dev/';
   ```

7. Optional: Set `PUBLIC_SITE_URL` inside `worker/wrangler.jsonc` to the URL of your public CTM domain, then redeploy. The back-to-site link in Studio will use it. Do not place passwords in `vars`.

To use a branded URL like `studio.yourdomain.com`, first manage that DNS zone on Cloudflare; then Workers > your Worker > Settings > Domains & Routes > Add > Custom Domain. Change `studio-config.js` to your new URL. The `workers.dev` URL works without a custom subdomain for an initial deployment.

**Important:** Do not publish `worker/private/` as part of GitHub Pages. Leave Pages configured to publish `/docs` only. Do not change `assets.run_worker_first: true` in `worker/wrangler.jsonc` — it guarantees authentication is checked before *every* private file request.

## 4. Test login protection before telling anyone it's live

- Signed out: open the Worker homepage; it should redirect to `/login`.
- Signed out: open `.../studio.html` and `.../studio.js` directly; both must redirect to `/login`.
- Signed in: Studio loads, image displays, sample ranking/rewriter/agenda work.
- Use **SIGN OUT** and repeat; all Studio routes must require login again.
- Check that `https://YOUR-GITHUB-PAGES-DOMAIN/studio.html` returns `404`. The public site should not contain the Studio file.

## 5. Security notes & limitations

- The login is **server side**. It compares a password from a Cloudflare Worker secret and creates an HttpOnly, Secure, SameSite=Lax, HMAC-signed session cookie valid for 8 hours.
- HTTPS is required for production, and login submissions must be same-origin. The Worker applies no-store caching and restricts content to authenticated sessions.
- This first version is for a **single CTM admin user**. For wider use, add Cloudflare Access, MFA and managed users before granting access to other people.
- **Rate limiting** failed sign-in requests is strongly recommended before wide release (e.g. configure Cloudflare WAF/rate limits or Cloudflare Access). Password-only logins without brute-force protection are not ideal for highly sensitive information.
- If the chosen password was shared publicly or you have used it elsewhere, set a **new, unique password** with the `wrangler secret put STUDIO_PASSWORD` command.
- Never store YouTube/OpenAI API keys in `docs/` or any frontend JavaScript. Future data integrations must call the Worker or another authenticated backend using secrets.
- The dashboard still uses **fictional/sample data**, not a connected YouTube or OpenAI service. Episode rundown is saved in the signed-in browser's localStorage; logout does not delete it.

## 6. Hosting costs

- GitHub Pages: free for a public repository (subject to GitHub usage conditions).
- Cloudflare Workers: free tier available, subject to quotas.
- Domain: whatever you pay the registrar; if you already own one, no additional domain purchase.
- Any future AI/API costs or higher-tier usage are separate.

You can keep updating your CTM website by pushing changes to GitHub. Public changes in `docs/` deploy through GitHub Pages. Worker changes require `cd worker && npm run deploy`.

- first initial post 10/11/2026

 https://ctm-creator-studio.ctmlr.workers.dev
Current Version ID: beebb815-83cc-4690-83f3-db9af6cb2334
