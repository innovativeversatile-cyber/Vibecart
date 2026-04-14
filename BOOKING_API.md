# Service Booking API Contract

All endpoints below require `authToken` (active owner session token) in the JSON body.

## `POST /api/bookings/provider/create`

Create a service provider profile.

Request body:
- `authToken`
- `userId`
- `businessName`
- `serviceType`
- `countryCode`
- `city` (optional)
- `baseCurrency` (optional)

## `POST /api/bookings/service/create`

Create a service offering (hair, nails, makeup, barber, etc).

Request body:
- `authToken`
- `providerId`
- `serviceName`
- `durationMinutes`
- `priceAmount`
- `currency` (optional)

## `POST /api/bookings/slots/bulk-create`

Create availability slots for providers.

Request body:
- `authToken`
- `providerId`
- `slots`: array of `{ "slotStart": "2026-04-15T09:00:00Z", "slotEnd": "2026-04-15T10:00:00Z" }`

## `POST /api/bookings/create`

Book a selected slot.

Request body:
- `authToken`
- `providerId`
- `clientUserId`
- `serviceOfferingId`
- `slotId`
- `countryCode`

Required behavior:

- Lock slot atomically to avoid double-booking.
- Compute taxes with `tax_rules`.
- Record tax in `tax_ledger_entries`.
- Create payout row in `provider_payouts` with withheld tax.
- Push notification to provider and client.

## `POST /api/bookings/status/update`

Update booking status (`confirmed`, `completed`, `cancelled`, etc).

Request body:
- `authToken`
- `bookingId`
- `bookingStatus`: one of `pending`, `confirmed`, `completed`, `cancelled`, `refunded`, `no_show`

## Related ad tax endpoints

### `POST /api/ads/invoice/create`

Create a taxed advertiser invoice.

Request body:
- `authToken`
- `advertiserId`
- `campaignId`
- `countryCode`
- `subtotalAmount`
- `currency` (optional)

### `POST /api/ads/invoice/settle`

Mark invoice as paid and record platform revenue.

Request body:
- `authToken`
- `invoiceId`

## Security and legal checks

- KYC/identity for service providers.
- Prohibited service content filters.
- Jurisdiction-based legal checks before enabling services in region.

## cURL test examples

Set your base URL and owner session token first:

```bash
BASE_URL="http://localhost:8081"
AUTH_TOKEN="paste-owner-session-token-here"
```

Create provider profile:

```bash
curl -X POST "$BASE_URL/api/bookings/provider/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "userId": 1201,
    "businessName": "Glow Studio Warsaw",
    "serviceType": "beauty",
    "countryCode": "PL",
    "city": "Warsaw",
    "baseCurrency": "PLN"
  }'
```

Create service offering:

```bash
curl -X POST "$BASE_URL/api/bookings/service/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "providerId": 1,
    "serviceName": "Gel Nails",
    "durationMinutes": 90,
    "priceAmount": 180.00,
    "currency": "PLN"
  }'
```

Create availability slots:

```bash
curl -X POST "$BASE_URL/api/bookings/slots/bulk-create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "providerId": 1,
    "slots": [
      { "slotStart": "2026-04-20T09:00:00Z", "slotEnd": "2026-04-20T10:30:00Z" },
      { "slotStart": "2026-04-20T11:00:00Z", "slotEnd": "2026-04-20T12:30:00Z" }
    ]
  }'
```

Create booking (tax + payout generated):

```bash
curl -X POST "$BASE_URL/api/bookings/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "providerId": 1,
    "clientUserId": 8891,
    "serviceOfferingId": 1,
    "slotId": 1,
    "countryCode": "PL"
  }'
```

Update booking status:

```bash
curl -X POST "$BASE_URL/api/bookings/status/update" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "bookingId": 1,
    "bookingStatus": "completed"
  }'
```

Create advertiser invoice (taxed):

```bash
curl -X POST "$BASE_URL/api/ads/invoice/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "advertiserId": 1,
    "campaignId": 3,
    "countryCode": "PL",
    "subtotalAmount": 5000.00,
    "currency": "PLN"
  }'
```

Settle advertiser invoice (records platform revenue):

```bash
curl -X POST "$BASE_URL/api/ads/invoice/settle" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "invoiceId": 1
  }'
```
