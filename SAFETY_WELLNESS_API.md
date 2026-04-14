# Safety + Wellness API

This module adds scam-risk detection for chat and a health/fitness AI coach workflow.

## Public Endpoints

- `POST /api/public/chat/safety-check`
  - body: `{ "senderUserId": 12345, "messageText": "..." }`
  - returns risk score, risk level, and matched scam indicators.

- `POST /api/public/coach/profile/upsert`
  - body: `{ "userId": 12345, "coachFocus": "weight_loss", "goalNotes": "...", "baselineWeightKg": 80, "targetWeightKg": 74, "dailyActivityGoal": "..." }`
  - creates/updates user coach profile.

- `POST /api/public/coach/medication/add`
  - body: `{ "userId": 12345, "medicationName": "...", "dosageText": "...", "scheduleType": "daily", "scheduleTime": "08:00" }`
  - stores medication schedule for reminders/check-ins.

- `POST /api/public/coach/checkin/add`
  - body: `{ "userId": 12345, "checkinType": "activity", "metricValue": "7000 steps", "notes": "..." }`
  - logs health, activity, symptom, or medication check-ins.

- `GET /api/public/coach/dashboard?userId=12345`
  - returns coach profile + active medication schedules + recent check-ins.

- `POST /api/health/cron/daily-reminders`
  - headers: `x-cron-token: <CRON_SECRET>`
  - body (optional): `{ "limit": 500 }`
  - queues daily reminder notifications for users with active medication schedules who did not check in today.

- `POST /api/chat/safety/events/list` (owner-authenticated)
  - body: `{ "authToken": "...", "riskLevel": "high", "limit": 50 }`
  - lists recent scam-risk events for admin review.

- `POST /api/coach/metrics/summary` (owner-authenticated)
  - body: `{ "authToken": "..." }`
  - returns aggregate adoption and activity metrics for AI health coach.

## Safety Notes

- Scam detection is a first defense layer and should be combined with moderation review and policy enforcement.
- Coach features are informational; they do not replace licensed medical advice.
