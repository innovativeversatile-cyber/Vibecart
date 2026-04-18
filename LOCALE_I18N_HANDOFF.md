# Locale / i18n — handoff (continue here)

Last focus: **more languages** (Shona, Ndebele, Xhosa, Chinese, Korean, Hindi, Other) and a **browser-based language offer** (no GPS): `navigator.languages` + time zone heuristics, sticky banner with Switch / dismiss.

## Done (primary ship tree: `deploy-web/`)

| Area | Files |
|------|--------|
| String packs + inference | `deploy-web/i18n.js` (also copied to repo root `i18n.js` for parity) |
| Banner markup + language `<select>` options | `deploy-web/index.html` |
| Banner logic + init hook | `deploy-web/script.js` (`maybeShowLocaleInferenceOffer`, called after `i18n.apply` in `initLocaleAndPersonaDeck`) |
| Banner styles | `deploy-web/styles.css` |
| Cache bust / SW | `deploy-web/index.html` and `deploy-web/admin.html` query `?v=20260421lang1`; `deploy-web/service-worker.js` `CACHE_NAME` `vibecart-pwa-v20260421lang1` |

**Dismiss key:** `localStorage` `vibecart-locale-offer-dismiss` stores the inferred code when the user taps dismiss (so the same suggestion is not repeated for that inference).

## Not done / optional next session

- **Mirroring:** `deploy-web/`, repo root, and **`vibecart-netlify/`** are kept in sync for locale banner + shop lanes + scripts (copy from `deploy-web/` when editing).
- **Copy depth:** only strings wired through `data-i18n` / i18n tables are translated; long prose may still be English until keys are added.

## Git

A commit was made containing **only** the locale-related paths above (plus root `i18n.js`). Other modified files in the repo (e.g. `package.json`, `schema.sql`, APIs) were **left unstaged** on purpose.

When you continue, open this file and search the codebase for `inferLocaleFromEnvironment`, `localeSuggestBanner`, and `vibecart-locale-offer-dismiss`.
