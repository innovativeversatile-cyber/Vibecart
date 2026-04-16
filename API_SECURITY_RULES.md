# API Security Enforcement Rules

Use these rules in backend endpoints so only approved payment and delivery systems are accepted.

## 1) Payment Intent Endpoint

- Endpoint: `POST /api/public/payments/intent/create`
- **Server-only:** requires Railway env `PAYMENT_INTENT_API_SECRET` and HTTP header `X-Payment-Intent-Secret` matching that value. Never call from public browser JavaScript.
- Required JSON body:
  - `orderId`
  - optional `paymentMethod` (default `card`)
  - optional `providerCode` (default `STRIPE`)
- Enforcement:
  - Resolve `buyer_country` and seller origin from `orders` + `order_items` / `products`.
  - Validate provider exists in `approved_payment_providers`.
  - Validate route exists in `approved_payment_provider_routes`.
  - On success, save `approved_provider_id` in `payments`.
- Block response example:
  - `401 INVALID_PAYMENT_INTENT_SECRET`
  - `400 NO_APPROVED_PAYMENT_ROUTE`

## 2) Shipment Creation Endpoint

- Endpoint: `POST /api/shipments/create`
- Required inputs:
  - `orderId`
  - `partnerCode`
  - `fromCountry`
  - `toCountry`
  - `shippingMethod`
- Enforcement:
  - Validate partner exists in `approved_delivery_partners`.
  - Require tracking + proof-of-delivery + security screening.
  - Require `reliability_score >= 90`.
  - Validate route exists in `approved_delivery_partner_routes`.
  - On success, save `approved_partner_id` in `shipments`.
- Block response example:
  - `403 DELIVERY_PARTNER_NOT_APPROVED`

## 3) Audit Logging

For blocked attempts, write an `audit_logs` record:

- `action`: `blocked_payment_provider` or `blocked_delivery_partner`
- `target_type`: `payment_provider` or `delivery_partner`
- `target_id`: nullable when unknown
- `ip_address`: requester IP

## 4) Operational Policy

- Super-admin can activate/deactivate providers and routes.
- Never allow fallback to unapproved systems.
- If no approved route is available, checkout must stop with a clear error.
