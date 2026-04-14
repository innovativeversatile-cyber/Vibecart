# Push Notification API (Backend Contract)

These endpoints support mobile push registration and order update notifications.

## `POST /api/push/register-device-token`

Registers or updates a device token for a signed-in user.

Request body:

```json
{
  "authToken": "<owner-session-token>",
  "userId": 123,
  "platform": "android",
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "appVersion": "1.0.0",
  "locale": "en-ZA"
}
```

Behavior:

- Upsert into `device_push_tokens`.
- If token exists for another user, deactivate previous mapping and remap securely.
- Reject malformed tokens and unsupported platforms.

Response:

```json
{
  "ok": true
}
```

## `POST /api/push/send-order-update`

Queues and sends order progress notifications to buyer and seller.

Request body:

```json
{
  "authToken": "<owner-session-token>",
  "orderId": 777,
  "statusCode": "in_transit",
  "statusMessage": "Package is in transit to destination country."
}
```

Behavior:

- Resolve buyer and seller user IDs from order.
- Build deep link:
  - `vibecart://orders/777`
- Insert `notification_events` rows for each target user.
- Send via push provider (Expo/FCM/APNs abstraction).
- Update delivery status to `sent` or `failed`.

Response:

```json
{
  "ok": true,
  "queued": 2
}
```

## Security Requirements

- Require server auth for send endpoints.
- Rate limit registration and send endpoints.
- Validate that notification content has no unsafe links.
- Log all failures for retry and monitoring.
