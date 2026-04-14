# Trust and Rewards API Contract

## Public endpoints

### `GET /api/public/trust/profiles`

Returns trust score cards for marketplace entities.

Optional query:
- `entityType` (`seller`, `provider`, `courier`, `insurer`)

### `GET /api/public/rewards/profile?userId=123`

Returns reward profile by user id.

### `POST /api/public/rewards/earn`

Add reward points with anti-abuse guardrails.

Request body:
- `userId`
- `eventType` (`safe_purchase`, `booking_completed`, `on_time_subscription`, `referral`)
- `referenceType` (optional)
- `referenceId` (optional)

Errors:
- `REWARD_DAILY_LIMIT_REACHED`
- `REWARD_TOO_FAST`

### `POST /api/public/rewards/redeem`

Redeem a reward perk.

Request body:
- `userId`
- `referenceType` (optional)
- `referenceId` (optional)

Errors:
- `INSUFFICIENT_REWARD_POINTS`

## Owner endpoint

### `POST /api/trust/profile/upsert`

Upsert trust profile metrics (owner-auth required).

Request body:
- `authToken`
- `entityType`
- `entityId`
- `trustScore`
- `deliverySuccessRate` (optional)
- `disputeRate` (optional)
- `verificationScore` (optional)
- `responseSpeedScore` (optional)
