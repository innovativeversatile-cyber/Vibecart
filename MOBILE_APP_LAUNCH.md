# Mobile App Launch Path (Secure + Compliant)

## What is built now

- Installable PWA app layer (works from mobile browser with home screen install).
- Offline-ready core pages via service worker cache.
- User-selectable interaction modes (Guided, Simple, Pro).

## Security controls for mobile launch

- Enforce HTTPS in production (mandatory for PWA and service workers).
- Keep owner auth on backend API only.
- Use JWT/session rotation and revoke compromised sessions.
- Add abuse/risk controls for chat, listings, and payments.

## Compliance reality

No app can be guaranteed automatically compliant in every city/state/country forever. You must maintain jurisdiction updates and app-store policy compliance continuously.

## Launch channels

1. **PWA launch first**: immediate install from browser (Android, modern iOS browsers).
2. **Store apps next**:
   - Android: package PWA/web app in trusted shell and publish to Play Store.
   - iOS: build native wrapper or React Native app and publish to App Store.

## Required legal docs before store submission

- Terms of Service
- Privacy Policy
- Acceptable Use / Prohibited Items Policy
- Refund/Return Policy
- Data Processing and regional compliance notices

## AI safety requirements

- Add moderation layer for AI outputs.
- Prevent generation of prohibited content or illegal advice.
- Keep audit logs for AI decisions and user-impacting recommendations.
