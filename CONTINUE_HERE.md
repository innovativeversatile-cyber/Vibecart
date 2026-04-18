# Continue later — VibeCart links & handoff

## Website (production target)

- **Home:** [https://vibe-cart.com/](https://vibe-cart.com/)
- **Health (via Netlify `/api` proxy):** [https://vibe-cart.com/api/health](https://vibe-cart.com/api/health)
- **Owner admin (if deployed):** [https://vibe-cart.com/admin.html](https://vibe-cart.com/admin.html)
- **Reminder after every deploy:** do one **hard refresh** (or open once with `?instant=1`) if UI looks cached.

## Google Search Console (verifiable)

1. In [Google Search Console](https://search.google.com/search-console), add property **URL prefix** `https://vibe-cart.com/`.
2. Use **HTML file** or **DNS** verification (Netlify supports TXT on the domain).
3. After deploy, open **URL Inspection**, submit `https://vibe-cart.com/` and **Request indexing** when you ship meaningful changes.
4. Confirm **Sitemaps** → add `https://vibe-cart.com/sitemap.xml` (shop lane URLs are included in `deploy-web/sitemap.xml`).
5. Rich results: homepage ships **WebSite** + **Organization** JSON-LD, Open Graph + Twitter cards, `robots` + `canonical`, and dimensioned hero imagery for stable previews.
6. **`sitemap.xml`** lists every public indexable HTML URL with **`<lastmod>`** for crawlers. **`robots.txt`** blocks admin and sensitive portals from indexing.

## UX / product mitigations (web + app)

| Disadvantage | Mitigation shipped in repo |
|--------------|----------------------------|
| Web: no clear offline signal | Fixed **connectivity banner** + service worker precaches **policy / terms / privacy** for basic offline reading. |
| Web: smooth-scroll CPU cost | **Lenis** and cursor-glow run only when **not** `prefers-reduced-motion: reduce`. |
| Web: intro blocks power users | **`?instant=1`** skips the cinematic intro; reduced motion still skips it. |
| Web: horizontal folders hard to use with keyboard | **Arrow Left/Right** scroll the shop-folder row when it has focus (`tabindex="0"`). |
| App: WebView feels stale vs native | **iOS pull-to-refresh** on the WebView; **Android floating refresh**; **Retry** after errors; **hard remount** key on retry; **auto-reload** on iOS web process termination. |
| App: session / checkout cookie edge cases | **`thirdPartyCookiesEnabled`** + **hardware** Android layer for smoother compositing. |
| App: autoplay noise / data | **`mediaPlaybackRequiresUserAction={true}`**. |

## Phone app

The native shell is in `mobile-app/` (Expo). **Store links are not checked into this repo** — add them here after you publish:

- **Android (Play) — when live:** `https://play.google.com/store/apps/details?id=com.vibecart.mobile`
- **iOS (App Store) — when live:** add your App Store URL after submission.

App config: `mobile-app/app.json` → `expo.extra.vibecartBaseUrl` / `vibecartApiBaseUrl` → **`https://vibe-cart.com`** (same-origin `/api`).

**Android Play format:** EAS profile `production` uses **`buildType: "app-bundle"`** (AAB). `expo-build-properties` pins **compile/target SDK 35** (adjust in `app.json` when Expo bumps defaults).

## Infra notes (recent)

- **`api.vibe-cart.com`:** DNS was missing (NXDOMAIN). Site + app should use **`https://vibe-cart.com/api/...`** until you add a CNAME for `api`.
- **Netlify → API:** fixed. `netlify.toml` now proxies `/api/*` to **`https://vibecart-production.up.railway.app/api/:splat`**, and both direct Railway health and **`https://vibe-cart.com/api/health`** return **200**.
- **HTTPS:** Netlify serves TLS for the site; `netlify.toml` adds **`Strict-Transport-Security`** for browsers that see this host over HTTPS.
- **Demo DB seed:** `npm run db:seed` — demo emails `@vibecart.local`, password `DemoPass123!` (staging only).
- **Verify from your machine:** `npm run health:proxy` — prints status for **direct Railway** and **https://vibe-cart.com/api/health**.

## Your dashboards (sign-in required)

Automations here **cannot** log into Netlify, Railway, or GoDaddy for you. Use these links while signed in, then follow the bullets:

- **Netlify deploys (site: vibecart-marketplace):** [Netlify → vibecart-marketplace → Deploys](https://app.netlify.com/projects/vibecart-marketplace/deploys) — confirm production is **Published** for branch `main`, and **Domain management** lists `vibe-cart.com` with HTTPS valid.
- **Railway (project + services):** [Railway project](https://railway.com/project/1521e97a-cf77-4f42-9c97-a60d32cbdbf7) — open the **web/API service** (not only the **Database** view). Copy that service’s **public HTTPS URL** into `netlify.toml` → push → Netlify redeploys.
- **GoDaddy (domain):** [GoDaddy portfolio → vibe-cart.com settings](https://dcc.godaddy.com/control/portfolio/vibe-cart.com/settings?ventureId=723511eb-cd57-4f9a-8ffe-46191f95cfb7&ua_placement=shared_header) — align DNS with what Netlify shows for the apex/`www` (see `dns/vibe-cart-records.txt`).

**Common mistake:** a Railway URL whose path ends in **`/database`** is the **data** service UI, not the public HTTP URL of your API. The API hostname must come from the **Node** service card → **Networking**.

## Save your work (git)

Do **not** commit `.env`. From repo root:

```bash
git add -A
git reset HEAD .env 2>nul; git checkout -- .env 2>nul; true
git status
git commit -m "VibeCart: proxy, seed, UX handoff"
git push
```

Adjust the commit message as you like. If `.env` is untracked, `git add -A` may still try to add it — use `git add` on paths you want, or ensure `.env` is in `.gitignore`.

---

*Written for session handoff — update store URLs when you have them.*
