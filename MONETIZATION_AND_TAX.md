# Monetization and Tax Framework

## Ways you can make money

1. Marketplace transaction fees (percentage markup on orders).
2. Service booking fees (small fee per confirmed booking).
3. Advertising revenue (self-serve brand campaigns and sponsored slots).
4. Premium seller/provider subscriptions (featured listing or priority placement).
5. Optional payment processing margin where legally permitted.
6. Buyer protection plans, convenience fees, and priority dispute review fees.
7. Route-level logistics margin (provider cost vs platform shipping price).
8. Affiliate conversion commissions from vetted partner programs.

## Tax-safe money flow (before payout)

1. Transaction/booking/ad invoice created.
2. Applicable tax rule resolved by country/state/region.
3. Tax is computed and recorded in `tax_ledger_entries`.
4. Provider/seller payout is calculated:
   - gross amount
   - minus platform fee
   - minus withheld tax
   - net payout
5. Net payout only is released to recipient.

This reduces tax-evasion risk and gives audit evidence for authorities and accountants.

## Core tables used

- `tax_rules`
- `tax_ledger_entries`
- `platform_revenue_entries`
- `provider_payouts`
- `advertiser_invoices`
- `service_bookings`
- `seller_subscription_plans`
- `seller_subscriptions`
- `listing_boost_packages`
- `listing_boost_purchases`
- `order_monetization_charges`
- `logistics_rate_cards`
- `affiliate_partners`
- `affiliate_referrals`

## API surfaces

- Booking and ad tax endpoints: `BOOKING_API.md`
- Monetization execution endpoints: `MONETIZATION_API.md`
- Commercial launch pricing and rollout plan: `REVENUE_PLAYBOOK.md`

## Compliance reminder

Tax law differs by jurisdiction. Keep a tax advisor/accountant involved and update rates and filing rules regularly.
