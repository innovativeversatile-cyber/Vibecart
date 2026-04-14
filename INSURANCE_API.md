# Insurance and Well-Being API Contract

All endpoints require `authToken` in the JSON body.

## `GET /api/public/insurance/plans?countryCode=PL`

Public, read-only endpoint for live verified insurance offers.

Behavior:
- returns active plans from legally verified providers
- intended for website/app insurance listing section
- no owner auth required (read-only)
- blocked when `countryCode` is not in low-risk approved `insurance_jurisdiction_controls`

## `POST /api/insurance/provider/create`

Create a verified insurance provider profile.

Request body:
- `authToken`
- `providerName`
- `providerType` (`life`, `health`, `funeral`, `student_cover`, `mixed`) optional
- `contactEmail`
- `websiteUrl` (optional)
- `legalVerified` (optional boolean)

## `POST /api/insurance/jurisdiction/list`

Owner-only endpoint to list insurance jurisdiction controls.

Request body:
- `authToken`

## `POST /api/insurance/jurisdiction/upsert`

Owner-only endpoint to enable/disable and risk-grade a country.

Request body:
- `authToken`
- `countryCode`
- `distributionEnabled` (boolean)
- `riskLevel` (`low`, `medium`, `high`)
- `legalNotes` (optional)

## `POST /api/insurance/jurisdiction/disable`

Emergency kill-switch per country (forces blocked/high risk).

Request body:
- `authToken`
- `countryCode`
- `legalNotes` (optional)

## `POST /api/insurance/plan/create`

Create an insurance plan offer.

Request body:
- `authToken`
- `providerId`
- `planName`
- `planType` (`life`, `health`, `funeral`, `student_cover`) optional
- `monthlyPremium`
- `currency` (optional)
- `waitingPeriodDays` (optional)
- `renewalCycle` (`monthly`, `quarterly`, `yearly`) optional
- `summaryText` (optional)

## `POST /api/insurance/subscription/create`

Subscribe a user to an insurance plan and queue welcome notification.

Request body:
- `authToken`
- `userId`
- `planId`
- `startsAt` (ISO datetime)
- `autoRenew` (optional)

Behavior:
- creates insurance subscription record
- creates due payment event
- records low platform commission (default 4%, capped at 6%)
- records platform revenue entry from commission

## `POST /api/insurance/subscription/queue-due-reminders`

Queue premium due-date notifications for upcoming policies.

Request body:
- `authToken`
- `daysAhead` (optional, default `5`)

## `POST /api/insurance/cron/daily-reminders`

Cron endpoint to queue daily reminders for in-app subscriptions and linked external policies.

Headers:
- `x-cron-token`: must match server `CRON_SECRET`

Request body:
- `daysAhead` (optional, default `5`)

## `POST /api/insurance/subscription/record-payment`

Record paid premium event (new subscription or monthly renewal) and apply commission.

Request body:
- `authToken`
- `subscriptionId`
- `amount`
- `currency` (optional)
- `paidAt` (optional)
- `isRenewal` (optional boolean)

## `POST /api/insurance/policy/link-existing`

Allow users with existing insurance policies to manage/maintain policy info in-app.

Request body:
- `authToken`
- `userId`
- `providerId`
- `externalPolicyNumber`
- `policyHolderName` (optional)
- `policyType` (optional)
- `nextDueAt` (optional)

Behavior:
- applies strict jurisdiction gating (low-risk approved countries only)
- enables maintain/upgrade journeys for already insured users

## Jurisdiction safety model

Insurance distribution is gated by `insurance_jurisdiction_controls`:
- only countries with `distribution_enabled = 1`
- and `risk_level = 'low'`

Important:
- this is a strict risk-reduction gate, not a legal guarantee of zero risk
- legal counsel review is still required per jurisdiction

## `POST /api/insurance/policy/update-linked`

Update linked policy lifecycle data (maintain/upgrade workflow support).

Request body:
- `authToken`
- `policyLinkId`
- `status` (optional)
- `nextDueAt` (optional)

## `POST /api/wellbeing/alert/publish`

Publish health/safety awareness alert.

Request body:
- `authToken`
- `countryCode` (optional)
- `audience` (`student`, `all_users`) optional
- `title`
- `message`
- `infoUrl` (optional)
- `severity` (`info`, `important`, `urgent`) optional
- `startsAt` (optional)
- `endsAt` (optional)

## `POST /api/wellbeing/alert/queue-notifications`

Queue active well-being alerts for a user.

Request body:
- `authToken`
- `userId`
- `countryCode` (optional)
