# VibeCart Project Snapshot (2026-04-14)

This snapshot confirms all work completed up to this date is saved in the workspace files.

## Completed areas

- cross-border marketplace UI and adaptive regional copy
- secure owner auth backend (login/logout/rotate, sessions, MFA-ready)
- push notification token and order update APIs
- booking flows with tax withholding and provider payout logic
- ad monetization invoices and settlement
- student-friendly monetization controls and guardrails
- insurance module (providers, plans, subscriptions, reminders, wellbeing alerts)
- insurance commissions on new subscriptions and renewals (low capped rates)
- linked-policy support for users with existing external insurance policies
- strict insurance jurisdiction gating (low-risk allowlist only)
- cron-secured daily reminder endpoint for insurance and linked policies
- owner panel controls for insurance jurisdiction management

## Security controls currently implemented

- owner-session checks on privileged routes
- route-level rate limiting
- strict response security headers
- low-risk-only jurisdiction gate for insurance distribution
- affordability guardrails to avoid abusive pricing
- explicit legal separation between platform distribution and insurer underwriting

## Operational reminder

Before production:
- configure `CRON_SECRET`
- run schema migration on MySQL
- verify allowed insurance countries in `insurance_jurisdiction_controls`
- ensure legal review notes are updated for every enabled country
