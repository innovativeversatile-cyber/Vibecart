# VibeCart Go-Live Checklist

Use this checklist to move from local demo to production safely.

## 1) Domain and Hosting

- Buy and configure your production domain (example: `vibecart.com`).
- Deploy static frontend files to production hosting:
  - `index.html`, `policy.html`, `admin.html`, `admin-app.html`, `styles.css`, `script.js`
  - `manifest.json`, `service-worker.js`, `robots.txt`, `sitemap.xml`
- Enforce HTTPS on all routes.

## 2) Backend Deployment

- Deploy `owner-auth-api.js` to a secure server/container.
- Set environment variables using `.env.example` as template.
- Run backend behind HTTPS reverse proxy.
- Restrict inbound traffic with firewall/security groups.

## 3) Database

- Create production MySQL database and dedicated app user.
- Import `schema.sql`.
- Enable automated backups (daily + retention policy).
- Confirm least-privilege DB permissions (no root user in app runtime).

## 4) Replace Placeholder Domains

Update all `https://www.vibecart.example` values to your real domain:

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
