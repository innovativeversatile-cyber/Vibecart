# VibeCart Security Baseline

This checklist is mandatory before production launch.

## Access Control

- Keep one `super_admin` account (you only).
- Enforce strong owner login with two credentials (passcode + security phrase) and hash storage.
- Move owner authentication to backend tables (`owner_auth_profiles`, `owner_auth_sessions`) in production.
- Enforce MFA for admin users.
- Use a hardware security key for admin login.
- Disable shared credentials.
- Restrict admin dashboard by IP allowlist if possible.
- Enable lockout after repeated failures and short admin session expiry.

## App Security

- Use HTTPS only and redirect all HTTP traffic.
- Set secure cookies (`Secure`, `HttpOnly`, `SameSite=Strict`).
- Validate and sanitize all input.
- Use server-side authorization checks on every privileged action.
- Add CSRF protection on state-changing forms.
- Add per-IP and per-account rate limits on login, reset, and checkout.
- Keep dependency updates frequent.

## Database Security (MySQL)

- Run MySQL in a private network only.
- Enforce TLS between app and database.
- Use least-privilege DB users:
  - app runtime user (no schema changes)
  - migration user (schema changes)
  - readonly reporting user
- Enable automatic encrypted backups.
- Test restore procedures every month.

## Monitoring and Response

- Record immutable audit logs for all admin actions.
- Configure alerts for:
  - repeated failed logins
  - unusual payout activity
  - large repeated checkout failures
- Prepare incident response steps and emergency account lockdown.

## Marketplace Safety

- Block prohibited products by policy and keyword/image moderation.
- Run jurisdiction checks by country/state/city before listing publication and checkout.
- Default unknown legal combinations to manual review or block (never auto-allow).
- Add report and dispute workflows.
- Require seller verification for payouts.
- Use payment providers with fraud scoring and 3D Secure support.
- Allow only PCI-DSS-compliant payment providers and tokenized card handling.
- Require transaction risk scoring and step-up authentication for high-risk payment events.
- Use only approved delivery partners with end-to-end tracking and proof-of-delivery.
- Enforce route-level reliability scoring and suspend couriers that fail trust thresholds.
- Apply step-up verification for high-risk orders and account actions.
- Keep a formal Terms of Service with indemnity and unlawful-use clauses reviewed by legal counsel.

## Storefront (static site) hardening

- **Do not persist buyer passwords or long-lived auth tokens in `localStorage`.** The public “quick buy” demo keeps only a **session-scoped** bearer token in `sessionStorage`; generated passwords are never written to storage.
- Treat all API-sourced strings as untrusted when building HTML; use strict escaping so XSS cannot ride on product, shop, insurance, or trust payloads.
- **AI is assistive, not autonomous:** ranking, safety hints, and copy suggestions may run in the product, but **payouts, policy changes, legal exposure, and privileged admin actions stay owner-controlled** on the server. Do not wire client-side or agent “full autonomy” over money or enforcement.

## Legal Compliance Controls

- Keep a maintained legal rule matrix (`jurisdiction_rules`) for target markets.
- Prevent transactions when import/export restrictions are detected.
- Require explicit user confirmation of legal responsibility before listing and checkout.
- Keep compliance audit trails (`compliance_checks`) for enforcement evidence.
- For insurance products, enforce hard country allowlist with low-risk legal profile only (`insurance_jurisdiction_controls`).
- Require legal review timestamp and notes before enabling a new insurance jurisdiction.
- Use cron secret auth (`CRON_SECRET`) for scheduled reminder jobs.
