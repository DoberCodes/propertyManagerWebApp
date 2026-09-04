# Android Release Acceptance

Last reviewed: 2026-08-19

## Automated Contract

Build Check validates that Android backup is disabled, cleartext traffic is
restricted to local emulator/development hosts, and only the launcher Activity
is exported. Release version metadata remains covered by the existing release
validation.

The release build is not currently minified. Enabling R8/minification is a
separate change because the signed artifact must be exercised through every
Capacitor and native scanner bridge before it is safe to publish.

## Signed Artifact Checks

Before uploading an AAB or APK to Google Play:

1. Build from the exact release commit with production Firebase configuration.
2. Confirm package `com.maintleyapp`, versionName, and versionCode.
3. Confirm the artifact is signed with the release certificate.
4. Record APK/AAB size and compare it with the previous release. Investigate a
   growth above 10 percent before publishing.
5. Run Play Console pre-launch reporting and resolve new security, compatibility,
   or startup failures.

## Physical Android Smoke Test

Use at least one currently supported physical Android device and the Play-bound
artifact:

* Register or sign in and complete the first-home flow.
* Add Equipment and connect it to a Space.
* Upload a document and confirm review status.
* Complete a Task and confirm Maintenance History.
* Open a notification and confirm it reaches the intended record.
* Scan a Supply barcode and cancel once before saving to confirm camera recovery.
* Background and resume the app during one workflow.
* Confirm Back navigation, keyboard dismissal, safe areas, and all primary touch
  targets.
* Delete the temporary account and confirm the landing-page redirect.

Record device model, Android version, artifact version, tester, date, and any
failure reference in the release evidence. A web responsive check does not
replace this gate.
