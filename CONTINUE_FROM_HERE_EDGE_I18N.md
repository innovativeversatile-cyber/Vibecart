# Continue from here — edge strip i18n

## Context

Compact competitive edge strips were added to:

- `deploy-web/live-market-shops.html` (`live.edge.*`)
- `deploy-web/hot-picks.html` (`hot.edge.*`)
- `deploy-web/account-hub.html` (`account.edge.*`)

Strings live in `deploy-web/page-i18n.js` under the **`en`** locale only. `t()` falls back to English for other languages when a key is missing.

## Next step (when you resume)

Extend **`page-i18n.js`** non-English packs (`sw`, `sn`, `nd`, `xh`, `zu`, and optionally `pl`, `fr`, `pt`, `ar`, `zh`, `ko`, `hi`) with the same keys:

- `live.edge.badge`, `live.edge.title`, `live.edge.lead`, `live.edge.c1h`, `live.edge.c1p`, `live.edge.c1cta`, `live.edge.c2h`, `live.edge.c2p`, `live.edge.c2cta`, `live.edge.c3h`, `live.edge.c3p`, `live.edge.c3cta`
- `hot.edge.*` (same shape: badge, title, lead, three cards × h + p + cta)
- `account.edge.*` (same shape)

After editing, bump the `page-i18n.js?v=` query on the three HTML files (and sync copies under `vibecart/` and `vibecart-netlify/` if you mirror deploys manually).

## Related (homepage)

Full five-card edge section on home uses **`deploy-web/i18n.js`** keys `edge.*` (main site i18n, not `page-i18n`).
