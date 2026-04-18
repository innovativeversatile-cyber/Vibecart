# Temporary / shared credentials (rotate after first deploy)

Use this checklist so nothing “secret” stays stuck in chat logs or sample files longer than needed.

## Railway (production)

- **MySQL** `MYSQL_ROOT_PASSWORD` / `MYSQLPASSWORD` — rotate in Railway → MySQL → Variables, then update **Vibecart** `DB_PASSWORD` to match, redeploy both services.
- **Vibecart** `CRON_SECRET`, `PAYMENT_INTENT_API_SECRET`, Stripe keys — set in Railway → Vibecart → Variables; never commit real values to git.
- **Local `.env`** — keep only on your machine; align `DB_PASSWORD` with the live MySQL password after every reset.

## Commands used in this repo

- `npm run db:apply-schema` — loads `schema.sql` into the DB configured in `.env` (uses `SET FOREIGN_KEY_CHECKS=0` for import safety).
- `npm run db:drop-all-tables` — destructive: drops **all** tables in the current database (use before a clean re-import).
- `npm run db:ensure-mobile-feedback` — ensures `mobile_app_feedback` exists.

## Play Store / Google (high level)

- **Play**: complete Play Console forms, privacy policy URL, data safety, signing; ship an **AAB** from `mobile-app/` (EAS or Android Studio). This repo cannot submit the listing for you.
- **Google Search**: deploy HTTPS site, `robots.txt` + `sitemap.xml`, meaningful titles/descriptions; avoid `noindex` on pages you want indexed (lane pages are optional).

After you rotate secrets, delete or trim this file if you do not want it in the repo.
