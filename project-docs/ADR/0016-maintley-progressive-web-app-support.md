# ADR 0016: Maintley Progressive Web App Support

Status: Implemented

## Context
Maintley currently runs as a web app and has an Android app path. A Progressive Web App would allow users to install Maintley from the browser on supported desktop and mobile devices.

A PWA is not a fully native app, but it provides app-like access through:
- installable home-screen icon
- standalone display mode
- cached app shell
- offline/fallback behavior
- optional web push notifications

## Decision
Maintley will support PWA installation as a universal access layer.

The PWA will complement, not replace:
- the hosted web app
- Android app distribution
- future iOS/native options

## Goals
- Let users install Maintley from supported browsers.
- Provide a branded app icon and splash experience.
- Improve mobile access without requiring app store installation.
- Keep the PWA lightweight and consistent with the main web app.

## Non-Goals
- Do not treat PWA as a fully native app replacement.
- Do not add complex offline-first data editing in the first pass.
- Do not cache sensitive property data aggressively.
- Do not duplicate Android-native notification logic unless explicitly supported.

## Initial Scope
- Add `manifest.json`
- Add required icons and maskable icons
- Add service worker
- Cache app shell/static assets
- Add offline fallback page
- Add install metadata
- Add theme/background colors
- Validate Lighthouse PWA checks
- Ensure GitHub Pages serves required files correctly from the built app root
- Add a calm authenticated-app install banner that uses the browser install
  prompt when available, gives iOS home-screen guidance, and respects local
  dismissal
- Add opt-in browser push notification registration through Firebase Cloud
  Messaging, using the existing Maintley notification records and preferences
  as the source of truth

## Caching Policy
Cache:
- app shell
- static JS/CSS/assets
- icons
- offline fallback

Do not cache by default:
- user property data
- documents
- images
- invoices
- private API responses

## Future Considerations
- Better offline read-only mode
- Background sync
- App shortcuts
- Share target
- iOS-specific install guidance

## Web Push Notes
Browser push is implemented as a delivery channel for existing notification
documents. It should not create a parallel notification model.

Browser FCM tokens are stored on the user record as `pushTokens[]`. The legacy
single `pushToken` field remains supported for native/mobile compatibility.

The service worker may display push notifications, but it must not cache
private user, property, document, invoice, or Firestore data.
