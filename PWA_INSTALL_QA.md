# PWA Install QA Checklist

Use this checklist after homepage updates to confirm install prompt behavior across major device classes.

## Preconditions

- Open `https://vibe-cart.com/` on HTTPS (not `file://`).
- Clear old site data if install behavior is stale.
- Visit the homepage and wait 5 seconds for prompt/fallback state.

## Android Chrome

1. Open site in Chrome on Android.
2. Confirm install CTA appears (`Install App` or `How to install app`).
3. Tap CTA:
   - If native prompt appears, accept and verify app installs.
   - If native prompt does not appear, verify manual hint text appears.
4. Relaunch installed app and confirm homepage loads in standalone mode.

Pass criteria:
- Native prompt appears on eligible sessions OR clear manual fallback appears.
- App opens from launcher successfully.

## Desktop Chrome/Edge

1. Open site in latest Chrome/Edge.
2. Confirm install CTA appears after warm-up.
3. Tap CTA and verify browser install dialog appears (or manual fallback text).
4. Install app and verify launch from app shortcut/window.

Pass criteria:
- Install path is visible and functional.
- `appinstalled` hides install CTA after successful install.

## iPhone Safari (iOS)

1. Open site in Safari (not in-app browser).
2. Confirm CTA changes to `How to install app`.
3. Tap CTA and verify Add-to-Home-Screen instructions are shown.
4. Use Share -> Add to Home Screen and open app from home screen.

Pass criteria:
- Manual install instructions always visible.
- Home-screen launch works.

## Troubleshooting

- If CTA never appears:
  - check `manifest.json` loads with HTTP 200
  - check `service-worker.js` is registered
  - ensure no browser policy blocks install banners
- If installed app still shows browser chrome:
  - remove app, clear site data, reinstall
  - verify manifest `display` remains `standalone`

