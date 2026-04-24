# Homepage Stability Baseline

This file captures the frozen homepage architecture after the tap-hijack incident and staged rebuild.

## Runtime Baseline

- Homepage (`deploy-web/index.html`) loads:
  - `i18n.js`
  - `script-safe.js`
  - `homepage-min.js`
  - `mobile-app-shell.js`
- Homepage does **not** load `script.js`.
- Cinematic intro logo layer is disabled.
- Open-shop CTAs are direct links to `/api/public/shop/redirect?...`.

## Source of Truth

- Homepage interaction source of truth: `deploy-web/homepage-min.js`.
- Mirrors must stay aligned:
  - `deploy-web/*`
  - repo root `*`
  - `vibecart-netlify/*`

## Safe Feature Envelope

`homepage-min.js` currently provides local-only UI behavior:

- hash scrolling
- shop status hint
- category filter + category cards
- bridge path local state
- AI assistant local ranking
- tracking timeline local state
- booking sample slots
- sponsored cards refresh
- insurance cards + tips
- health coach local profile/check-ins
- rewards local points/streak
- communication local thread
- shop search submit

No behavior in this file should introduce implicit route redirects.

## Smoke Checks

Run these before each deploy:

1. `npm run smoke:homepage-lite`
2. `node scripts/verify-launch-flows.mjs`
3. `npm run freeze:homepage`

## Freeze Guardrails (Post-RC)

- Freeze tag: `homepage-rc-20260424-freeze`
- Guardrail automation: `scripts/homepage-freeze-gate.mjs`
- The freeze gate enforces:
  - homepage script surface (`script-safe.js` + `homepage-min.js`, not `script.js`)
  - no reintroduction of legacy `buy-journey`/internal checkout shortcuts
  - `window.location.assign` remains search-only in homepage lite code
  - mirror sync across `deploy-web/`, repo root, and `vibecart-netlify/`

## 24-Hour Stability Watch

Run this watch sequence after production changes touching homepage:

1. `npm run freeze:homepage`
2. `npm run smoke:homepage-lite`
3. `node scripts/verify-launch-flows.mjs`
4. `npm run health`

Manual spot checks (mobile-first):

- Tap `Shop Now` and category cards (must only in-page scroll/filter).
- Tap `Open shop` buttons (must route directly to `/api/public/shop/redirect?...`).
- Verify no unexpected jumps to seller sections on idle/scroll.
- Verify quick-nav highlighting updates with scroll but does not block link taps.
- Verify homepage remains responsive after tab hide/return.

## Advanced Re-enable Rules

When adding advanced features:

1. Add exactly one capability per change set.
2. Keep changes in `homepage-min.js` unless there is a strong reason not to.
3. Avoid broad document click handlers that navigate.
4. Avoid introducing fixed/full-screen layers with pointer-events enabled unless essential.
5. Verify on mobile/touch first.

