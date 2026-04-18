# Continue later — VibeCart links & handoff

## Website (production target)

- **Home:** [https://vibe-cart.com/](https://vibe-cart.com/)
- **Health (via Netlify `/api` proxy):** [https://vibe-cart.com/api/health](https://vibe-cart.com/api/health)
- **Owner admin (if deployed):** [https://vibe-cart.com/admin.html](https://vibe-cart.com/admin.html)

## Phone app

The native shell is in `mobile-app/` (Expo). **Store links are not checked into this repo** — add them here after you publish:

- **Android (Play) — when live:** `https://play.google.com/store/apps/details?id=com.vibecart.mobile`
- **iOS (App Store) — when live:** add your App Store URL after submission.

App config: `mobile-app/app.json` → `expo.extra.vibecartBaseUrl` / `vibecartApiBaseUrl` → **`https://vibe-cart.com`** (same-origin `/api`).

## Infra notes (recent)

- **`api.vibe-cart.com`:** DNS was missing (NXDOMAIN). Site + app should use **`https://vibe-cart.com/api/...`** until you add a CNAME for `api`.
- **Netlify → API:** `netlify.toml` proxies `/api/*` to Railway. **Confirm** the `…up.railway.app` host in that file matches your Railway API service.
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
