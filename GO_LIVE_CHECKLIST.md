# VibeCart Go-Live Checklist

Use this checklist to move from local demo to production safely.

## 1) Domain and Hosting

- Buy and configure your production domain (example: `vibecart.com`).
- Netlify uses **`deploy-web/`** as the publish folder (`netlify.toml`). After local edits, commit and push so Netlify rebuilds.
- Update `netlify.toml` `[[redirects]]` target if your Railway API URL is not `vibecart-production.up.railway.app`.
- Deploy static frontend files to production hosting:
  - `index.html`, `policy.html`, `admin.html`, `admin-app.html`, `styles.css`, `script.js`
  - `manifest.json`, `service-worker.js`, `robots.txt`, `sitemap.xml`
- Enforce HTTPS on all routes.


## 2) Backend Deployment

- Deploy `owner-auth-api.js` to a secure server/container.
- Set environment variables using `.env.example` as template.
- Run backend behind HTTPS reverse proxy.
- Restrict inbound traffic with firewall/security groups.
- If the database was created before `payment_webhook_events` existed, run `railway-migrations/20260213_payment_webhook_events.sql` in Railway MySQL (safe `IF NOT EXISTS`).

## 2b) Payments (Stripe)

- Set `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Set **`PAYMENT_INTENT_API_SECRET`** to a long random string. Payment intent creation requires header `X-Payment-Intent-Secret` (never expose this in the static site; use a small server-side checkout or Netlify Function).
- Stripe webhook URL: `https://<your-railway-host>/api/public/payments/webhook/stripe` with events `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.
- Confirm `approved_payment_providers` and `approved_payment_provider_routes` include every country/currency pair you will sell (see `schema.sql` seed inserts).

## 3) Database

- Create production MySQL database and dedicated app user.
- Import `schema.sql`.
- Enable automated backups (daily + retention policy).
- Confirm least-privilege DB permissions (no root user in app runtime).

## 4) Replace Placeholder Domains

Production defaults in the repo now use **`https://vibecart-marketplace.netlify.app`**. When you move to a custom domain (for example `https://vibe-cart.com`), update the same values again:

- `index.html`:
  - `canonical`, `og:url`, `alternate hreflang`, JSON-LD `url`
- `robots.txt`:
  - `Sitemap` URL
- `sitemap.xml`:
  - all `<loc>` entries
- `mobile-app/app.json`:
  - `expo.extra.vibecartBaseUrl`

## 5) Admin API Connection

- Open `admin.html`.
- Set **Backend API Base URL** to your production API URL (example: `https://api.vibecart.com`).
- Login and verify:
  - owner auth works
  - trust profiles load
  - insurance jurisdictions load
  - chat safety events load
  - AI coach metrics load

## 6) Cron Jobs

Configure secure scheduled jobs with header `x-cron-token: CRON_SECRET`:

- `POST /api/insurance/cron/daily-reminders`
- `POST /api/health/cron/daily-reminders`

Use a cloud scheduler (recommended) or Windows Task Scheduler.

## 7) Security Hardening

- Rotate all demo credentials.
- Store secrets in secure secret manager (not in source code).
- Enable monitoring and alerting (API errors, auth failures, suspicious events).
- Review legal docs and compliance settings before enabling new jurisdictions.

## 8) Final Launch Tests

- Buyer flow: browse -> checkout -> tracking -> return window.
- Seller flow: list -> promote -> message buyer.
- Insurance flow: browse plans -> subscribe -> reminders.
- Health coach flow: profile -> medication -> check-ins.
- Admin app mode: `admin-app.html` install + secure access.

## 9) Post-Launch Operations

- Daily: check fraud/chat alerts + failed cron jobs.
- Weekly: review trust scores, pricing guardrails, and dispute rates.
- Monthly: security patch cycle and backup restore test.
