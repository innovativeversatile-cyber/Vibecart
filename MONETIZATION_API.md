# Monetization API Contract

All endpoints require `authToken` in the JSON body.

## `POST /api/monetization/subscription-plan/create`

Create seller subscription plan.

Request body:
- `authToken`
- `planCode`
- `planName`
- `monthlyPrice`
- `currency` (optional)
- `listingLimit` (optional)
- `boostCredits` (optional)
- `analyticsEnabled` (optional)
- `prioritySupport` (optional)

## `POST /api/monetization/subscription/assign`

Assign plan to a seller shop and record subscription revenue.

Request body:
- `authToken`
- `shopId`
- `planId`
- `startAt` (ISO datetime)
- `endAt` (ISO datetime)
- `billingCycle` (`monthly`, `quarterly`, `yearly`) optional

## `POST /api/monetization/boost-package/create`

Create paid listing boost package.

Request body:
- `authToken`
- `packageCode`
- `packageName`
- `durationDays`
- `placementZone` (`home_feed`, `search_top`, `category_featured`, `service_spotlight`)
- `priceAmount`
- `currency` (optional)

## `POST /api/monetization/boost/purchase`

Purchase a boost for a product or service listing.

Request body:
- `authToken`
- `shopId`
- `packageId`
- `targetType` (`product` or `service`)
- `targetId`
- `startsAt` (ISO datetime)

## `POST /api/monetization/order/charges/apply`

Apply optional paid protections and convenience fees to an order.

Request body:
- `authToken`
- `orderId`
- `protectionFee` (optional)
- `convenienceFee` (optional)
- `escrowPriorityFee` (optional)
- `logisticsMarginFee` (optional)
- `currency` (optional)

## `POST /api/monetization/logistics-rate/create`

Create route-level logistics margin card.

Request body:
- `authToken`
- `fromCountry`
- `toCountry`
- `shippingMethod`
- `providerCost`
- `platformPrice`
- `currency` (optional)

## `POST /api/monetization/affiliate-partner/create`

Create affiliate partner profile.

Request body:
- `authToken`
- `partnerName`
- `partnerType` (`wallet`, `telco`, `insurance`, `logistics`, `other`) optional
- `contactEmail`
- `defaultCommissionPercent` (optional)

## `POST /api/monetization/affiliate-referral/record`

Record monetized referral conversion.

Request body:
- `authToken`
- `partnerId`
- `referredUserId` (optional)
- `referenceCode`
- `conversionType` (`signup`, `purchase`, `booking`, `ad_spend`) optional
- `conversionValue` (optional)
- `commissionAmount`
- `currency` (optional)

## `POST /api/monetization/guardrails/get`

Return active affordability guardrail caps.

Request body:
- `authToken`

## `POST /api/monetization/guardrails/validate`

Validate proposed pricing against affordability caps.

Request body:
- `authToken`
- `orderTakeRatePercent` (optional)
- `bookingCommissionPercent` (optional)
- `protectionFeePercent` (optional)
- `convenienceFeeFlat` (optional)
- `starterPlanPriceEur` (optional)
- `boost3DayPriceEur` (optional)

## cURL examples

```bash
BASE_URL="http://localhost:8081"
AUTH_TOKEN="paste-owner-session-token-here"
```

Create subscription plan:

```bash
curl -X POST "$BASE_URL/api/monetization/subscription-plan/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "planCode": "REGIONAL_PRO",
    "planName": "Regional Pro",
    "monthlyPrice": 24.99,
    "currency": "EUR",
    "listingLimit": 300,
    "boostCredits": 8,
    "analyticsEnabled": true,
    "prioritySupport": true
  }'
```

Assign subscription:

```bash
curl -X POST "$BASE_URL/api/monetization/subscription/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "shopId": 1,
    "planId": 1,
    "startAt": "2026-04-20T00:00:00Z",
    "endAt": "2026-05-20T00:00:00Z",
    "billingCycle": "monthly"
  }'
```

Create and purchase boost:

```bash
curl -X POST "$BASE_URL/api/monetization/boost-package/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "packageCode": "TOP7",
    "packageName": "Top Search 7 Days",
    "durationDays": 7,
    "placementZone": "search_top",
    "priceAmount": 19.99,
    "currency": "EUR"
  }'
```

```bash
curl -X POST "$BASE_URL/api/monetization/boost/purchase" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "shopId": 1,
    "packageId": 1,
    "targetType": "product",
    "targetId": 10,
    "startsAt": "2026-04-21T08:00:00Z"
  }'
```

Apply order add-on fees:

```bash
curl -X POST "$BASE_URL/api/monetization/order/charges/apply" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "orderId": 101,
    "protectionFee": 2.50,
    "convenienceFee": 1.20,
    "escrowPriorityFee": 0.90,
    "logisticsMarginFee": 3.00,
    "currency": "EUR"
  }'
```

Create logistics rate card:

```bash
curl -X POST "$BASE_URL/api/monetization/logistics-rate/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "fromCountry": "PL",
    "toCountry": "ZA",
    "shippingMethod": "express",
    "providerCost": 18.00,
    "platformPrice": 23.00,
    "currency": "EUR"
  }'
```

Create affiliate partner and record referral:

```bash
curl -X POST "$BASE_URL/api/monetization/affiliate-partner/create" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "partnerName": "Campus Wallet ZA",
    "partnerType": "wallet",
    "contactEmail": "bizdev@campuswallet.example",
    "defaultCommissionPercent": 6.5
  }'
```

```bash
curl -X POST "$BASE_URL/api/monetization/affiliate-referral/record" \
  -H "Content-Type: application/json" \
  -d '{
    "authToken": "'"$AUTH_TOKEN"'",
    "partnerId": 1,
    "referenceCode": "CWZA-2026-APR",
    "conversionType": "purchase",
    "conversionValue": 120.00,
    "commissionAmount": 7.80,
    "currency": "EUR"
  }'
```
