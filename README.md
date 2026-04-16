# VibeCart

VibeCart is a secure marketplace concept for legal products from Poland and Europe, designed for South Africa, Namibia, Kenya, Ethiopia, Zimbabwe, and other African markets.

## Included

- `index.html`: Responsive marketplace landing page with category filtering
- `styles.css`: Modern UI styling
- `script.js`: Category filtering interactions
- `schema.sql`: MySQL schema for marketplace data
- `SECURITY.md`: Security hardening checklist
- `policy.html`: Anti-fraud, lawful-use, and liability framework page
- `robots.txt` + `sitemap.xml`: Search engine indexing essentials
- `backend-enforcement.js`: backend guard functions to block unapproved payment/delivery channels
- `API_SECURITY_RULES.md`: endpoint-level security enforcement contract
- built-in communication hub in `index.html` for buyer-seller contact flow
- `admin.html` + `admin.js`: no-code owner panel for managing homepage text/theme
- revenue control tools in owner panel (affordable presets, plans/boost setup, quick monetization actions)
- hardened owner authentication in `admin.js` (hashed credentials, lockout, session timeout)
- seller marketing data model for promotions and new product launches
- AI shopping assistant section for guided product suggestions
- order tracking timeline and return/refuse window model for buyer-seller updates
- jurisdiction-based compliance model (`jurisdiction_rules`, `compliance_checks`)
- backend owner auth hardening (`owner_auth_profiles`, sessions, MFA factors, auth events)
- `owner-auth-service.js` + `AUTH_BACKEND_API.md` for server-side owner login
- `owner-auth-api.js` runnable HTTP auth server (login/logout/rotate)
- PWA app layer (`manifest.json`, `service-worker.js`, install prompt, app icons)
- `MOBILE_APP_LAUNCH.md` launch and compliance guidance for mobile distribution
- `mobile-app/` Expo React Native wrapper for Play Store/App Store path
- `mobile-app/STORE_SUBMISSION_CHECKLIST.md` detailed Android/iOS release checklist
- `admin-app.html` + `admin-app-manifest.json` + `admin-app-sw.js` admin-only installable app mode
- push notification backend scaffolding (`device_push_tokens`, `notification_events`, `push-notification-service.js`)
- `PUSH_NOTIFICATION_API.md` device token and order update notification endpoint contract
- admin AI helper panel in `admin.html` for opening AI link + generating/copying update prompts
- ad monetization model (`advertisers`, `ad_campaigns`, `ad_creatives`, `ad_events`)
- `AD_MONETIZATION.md` self-serve legal ad revenue framework
- `MONETIZATION_AND_TAX.md` revenue streams and tax-withholding flow
- `MONETIZATION_API.md` monetization endpoint contract and cURL tests
- `REVENUE_PLAYBOOK.md` launch pricing ranges and growth KPIs by clientele
- `INSURANCE_API.md` insurance offers, subscriptions, due reminders, and well-being alerts API
- insurance commission tracking on each new subscription and renewals (low capped rates for affordability)
- owner panel insurance jurisdiction controls (low-risk country allowlist management)
- Revolution Pack UX scaffold: smart onboarding, trust lab cards, and campus rewards/streak interactions
- `TRUST_REWARDS_API.md` trust profile and anti-abuse rewards endpoint contract
- disclaimer acknowledgement gate for marketplace and insurance actions with backend audit logging
- `safety-wellness-service.js` scam-risk chat checks + AI coach/medication/check-in backend service
- `SAFETY_WELLNESS_API.md` public endpoint contract for safety checks and health/fitness coach
- `.env.example` production environment template for backend deployment
- `GO_LIVE_CHECKLIST.md` production launch checklist and domain replacement guide
- `BOOKING_API.md` service booking contract for hair/nails/makeup providers
- tax and payout tables for transaction-level withholding before payouts

## Run Locally

No build tools are required.

1. Open `index.html` in a browser.
2. For a local server (recommended), run:
   - PowerShell: `python -m http.server 8080`
3. Visit `http://localhost:8080/vibecart/`

## MySQL Setup

1. Create a MySQL 8 database server.
2. Run:

```sql
SOURCE /path/to/vibecart/schema.sql;
```

3. Create least-privilege DB users for app runtime and migrations.
4. Replace placeholder values in `owner_auth_profiles` with real hashed credentials before production.
5. Install Node dependencies for backend API:
   - `npm install mysql2 nodemailer stripe`
6. Start owner auth API:
   - `node owner-auth-api.js`
   - set `CRON_SECRET` env var for `/api/insurance/cron/daily-reminders`
   - same `CRON_SECRET` secures `/api/health/cron/daily-reminders`
   - set `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` for payment intent + webhook flow
   - set `PAYMENT_PROVIDER=stripe` for approved Stripe route enforcement
   - optional AI autopilot: `AI_AUTOPILOT_ENABLED=true`
7. Owner panel `admin.html` now authenticates against backend API (`http://localhost:8081`).
8. If MFA is enabled in `owner_auth_profiles`, configure at least one active factor in `owner_mfa_factors`.

## Windows Daily Health Cron (Task Scheduler)

Use Task Scheduler to run health reminders every day automatically.

1. Ensure API is running on `http://localhost:8081` and `CRON_SECRET` is set.
2. Install daily scheduler with helper script:

```powershell
cd C:\Users\innov\Documents\cursor\vibecart
.\run-health-reminder-cron.cmd install http://localhost:8081 your-strong-cron-secret 500
```

3. Manual test run:

```powershell
schtasks /Run /TN "VibeCart-Health-Reminder-Cron"
```

4. Manual API trigger without scheduler:

```powershell
cd C:\Users\innov\Documents\cursor\vibecart
.\run-health-reminder-cron.cmd http://localhost:8081 your-strong-cron-secret 500
```

## Security Reminder

This project includes frontend and data schema foundations. Production security requires backend implementation of:

- authentication and authorization
- secure payment handling
- shipping provider integrations
- audit logging
- active monitoring
- secure chat moderation and abuse detection for buyer-seller messaging

## SEO and Discovery

- Canonical and sitemap URLs default to `https://vibecart-marketplace.netlify.app/`. When you use a custom domain, replace that base URL in:
  - `deploy-web/index.html` (Netlify publish) and root `index.html` canonical and Open Graph tags
  - `deploy-web/privacy.html` canonical (and root `privacy.html` if used)
  - `deploy-web/robots.txt` and `robots.txt`
  - `deploy-web/sitemap.xml` and `sitemap.xml`
- Submit the sitemap in Google Search Console and Bing Webmaster Tools.
