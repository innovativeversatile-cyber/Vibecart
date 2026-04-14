# VibeCart Mobile App (Expo)

This is a secure mobile wrapper for VibeCart with controlled navigation and HTTPS-only loading.

## Setup

1. Install Node.js LTS.
2. In this folder, run:
   - `npm install`
3. Start dev app:
   - `npx expo start`

## Configure production URL

Edit `app.json`:

- `expo.extra.vibecartBaseUrl` should point to your live HTTPS domain.

## Security defaults

- Only HTTPS pages are allowed.
- Navigation is restricted to your configured host.
- External unknown hosts are blocked.
- Push notification scaffolding is included (`expo-notifications`).
- Deep links supported with scheme `vibecart://` (mapped into your web routes).

## Build for stores

1. Install EAS CLI:
   - `npm install -g eas-cli`
2. Login:
   - `eas login`
3. Android build:
   - `eas build -p android --profile production`
4. iOS build:
   - `eas build -p ios --profile production`

## Compliance notes

- Maintain Terms, Privacy, and prohibited-items policy URLs inside your web app.
- Ensure local legal/jurisdiction controls are enabled server-side.
- Keep AI recommendations moderated and auditable.
- Follow `STORE_SUBMISSION_CHECKLIST.md` before publishing.
