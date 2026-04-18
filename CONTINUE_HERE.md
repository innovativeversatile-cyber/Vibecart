# Continue later — VibeCart links & handoff

## Website (production target)

- **Home:** [https://vibe-cart.com/](https://vibe-cart.com/)
- **Health (via Netlify `/api` proxy):** [https://vibe-cart.com/api/health](https://vibe-cart.com/api/health)
- **Owner admin (if deployed):** [https://vibe-cart.com/admin.html](https://vibe-cart.com/admin.html)

## Google Search Console (verifiable)

1. In [Google Search Console](https://search.google.com/search-console), add property **URL prefix** `https://vibe-cart.com/`.
2. Use **HTML file** or **DNS** verification (Netlify supports TXT on the domain).
3. After deploy, open **URL Inspection**, submit `https://vibe-cart.com/` and **Request indexing** when you ship meaningful changes.
4. Confirm **Sitemaps** → add `https://vibe-cart.com/sitemap.xml` (shop lane URLs are included in `deploy-web/sitemap.xml`).
5. Rich results: homepage ships **WebSite** + **Organization** JSON-LD, Open Graph + Twitter cards, `robots` + `canonical`, and dimensioned hero imagery for stable previews.

## Phone app

The native shell is in `mobile-app/` (Expo). **Store links are not checked into this repo** — add them here after you publish:

- **Android (Play) — when live:** `https://play.google.com/store/apps/details?id=com.vibecart.mobile`
- **iOS (App Store) — when live:** add your App Store URL after submission.

App config: `mobile-app/app.json` → `expo.extra.vibecartBaseUrl` / `vibecartApiBaseUrl` → **`https://vibe-cart.com`** (same-origin `/api`).

**Android Play format:** EAS profile `production` uses **`buildType: "app-bundle"`** (AAB). `expo-build-properties` pins **compile/target SDK 35** (adjust in `app.json` when Expo bumps defaults).

## Infra notes (recent)

- **`api.vibe-cart.com`:** DNS was missing (NXDOMAIN). Site + app should use **`https://vibe-cart.com/api/...`** until you add a CNAME for `api`.
- **Netlify → API:** `netlify.toml` proxies `/api/*` to Railway. **Confirm** the `…up.railway.app` host matches a **live** Railway service. If `GET /api/health` returns **404 Application not found**, the proxy target is wrong or the Railway app is deleted — fix the URL in `netlify.toml` and redeploy Railway.
- **HTTPS:** Netlify serves TLS for the site; `netlify.toml` adds **`Strict-Transport-Security`** for browsers that see this host over HTTPS.
- **Demo DB seed:** `npm run db:seed` — demo emails `@vibecart.local`, password `DemoPass123!` (staging only).

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
