# API Security Enforcement Rules

Use these rules in backend endpoints so only approved payment and delivery systems are accepted.

## 1) Payment Intent Endpoint

- Endpoint: `POST /api/payments/intent`
- Required inputs:
  - `orderId`
  - `providerCode`
  - `buyerCountry`
  - `sellerCountry`
  - `currency`
- Enforcement:
  - Validate provider exists in `approved_payment_providers`.
  - Reject if any required security flags are disabled.
  - Validate route exists in `approved_payment_provider_routes`.
  - On success, save `approved_provider_id` in `payments`.
- Block response example:
  - `403 PAYMENT_PROVIDER_NOT_APPROVED`

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
