# ADR 0040: Verified Email Registration Boundary

Status: Accepted

Date: 2026-09-04

Related ADRs:

* `0030-homeowner-plus-trial-experience.md`
* `0031-homeowner-plus-trial-lifecycle-and-communication.md`
* `0038-product-analytics-and-behavioral-telemetry.md`

## Context

Maintley previously treated successful Firebase Authentication account creation
as a completed registration. The application created the Firestore profile,
provisioned account context, opened checkout or onboarding, and allowed
automated welcome and access-lifecycle email delivery without first proving
that the registrant controlled the address.

Firebase validates the shape and uniqueness of an email address, but those
checks do not prove that the mailbox exists or belongs to the registrant. Invalid
or unattended addresses can therefore become recipients of repeated automated
delivery attempts. They also create account records that appear more complete
than the user's actual registration progress.

Maintley already relies on email for account recovery, invitations, access
notices, and useful maintenance communication. Verified mailbox ownership is
therefore part of a valid new-account lifecycle rather than an optional profile
detail.

Existing accounts predate this boundary. Automatically disabling or deleting
those accounts would create unnecessary continuity risk.

## Decision

All new self-service email-and-password registrations enter an explicit
`pending_email_verification` state.

After creating the Firebase Auth identity and Firestore profile, Maintley sends
a Firebase-managed verification message and routes the authenticated user to a
dedicated verification screen. A pending user may request another verification
message, confirm that the link has been used, sign out, or return with the same
account later.

The user may not enter checkout, onboarding, or the working application while
the profile remains pending.

Verification is finalized through a trusted callable. The callable reads the
Firebase Authentication user record and changes the Firestore registration
status to `active` only when Firebase reports `emailVerified: true`. Clients and
account managers cannot directly change registration status or verification
timestamps.

Maintley does not automatically delete unverified accounts. Users may return
later, resend verification, and finish registration. Existing users whose
profiles have no registration status remain active for compatibility and receive
an optional verification action in Profile.

## Registration State

New profiles use:

```text
registrationStatus: pending_email_verification | active
registrationMode: standard | tenant | tenant_invite | team_invite
emailVerifiedAt: trusted server timestamp
```

A missing `registrationStatus` means the profile predates this decision. It is
treated as legacy-active for application access and is not silently migrated,
blocked, or deleted.

## Trusted Transition

```text
Firebase Auth account created
        ↓
Firestore profile: pending_email_verification
        ↓
Firebase verification link used
        ↓
Trusted callable reads Firebase Auth user
        ↓
Firestore profile: active
        ↓
Checkout, onboarding, or invited-account destination
```

The transition is idempotent. Rechecking an already verified account may refresh
its trusted verification timestamp without duplicating account records,
entitlements, or email deliveries.

## Email Delivery Boundary

The signup welcome email is sent only after a new profile transitions from
pending to active and Firebase Authentication independently confirms the
address. Creating the pending profile does not call the external email provider.

Access-lifecycle delivery also checks the beneficiary's Firebase Authentication
record before calling the provider. An unverified recipient is recorded as
deferred with the explainable outcome `recipient_email_unverified`. Verification
may allow a later eligible scheduler run to deliver the message; no provider
attempt is made while the address remains unverified.

Firebase's verification email is intentionally still delivered because it is
the mechanism used to establish mailbox ownership.

## Invitations and Complimentary Access

Invited tenant and team registrations use the same verification boundary. Their
validated invitation context may be preserved while access to the working app
remains blocked.

Complimentary access is not activated before verification. If a user supplied a
code during registration, the browser session preserves it long enough to return
to the existing review-and-activate step after verification. The code continues
to use its existing server-side recipient and eligibility checks.

## Profile Experience

An authenticated legacy user whose Firebase Authentication email remains
unverified can send a verification email and confirm verification from Profile.
Verification remains optional for legacy application access. No expiration or
automatic cleanup is attached to the reminder.

## Analytics

Registration measurement distinguishes identity creation from usable account
activation:

* `signup_started` records registration intent;
* `email_verification_sent` records a registration, verification-page, or
  Profile request;
* `email_verification_completed` records successful trusted confirmation; and
* `signup_completed` records the verified registration entering its next
  destination.

This prevents unverified or mistyped addresses from inflating completed-signup
conversion.

## Security and Compatibility

Firestore Rules require new client-created profiles to use the pending status,
match the authenticated token email, and preserve server-owned registration
fields after creation. Cloud Functions remain the authority for activation.

The application gate is additive for new profiles. Existing accounts with no
status continue to behave as before. There is no bulk migration, cleanup job, or
automatic deletion in this decision.

## Consequences

### Positive

* New active users have demonstrated control of their email address.
* Welcome and lifecycle messages avoid known-unverified recipients.
* Failed-provider attempts and misleading signup conversion are reduced.
* Verification can be resumed rather than forcing a second registration.
* Existing customers retain uninterrupted access.
* The Profile provides a clear path for legacy users to verify voluntarily.

### Costs and risks

* Registration adds an inbox step before the first product experience.
* Verification delivery problems can delay legitimate users.
* Firebase authorized domains and email-action return URLs must remain correct
  in Beta and production.
* Invitation, complimentary-access, paid-checkout, and E2E flows must preserve
  their continuation across verification.
* A pending Auth and profile record may remain indefinitely when registration is
  abandoned.

## Deferred

This decision does not introduce:

* automatic deletion of pending or legacy unverified accounts;
* a disposable-email-domain blacklist;
* third-party mailbox validation;
* a public or client-controlled verification bypass;
* mandatory verification for legacy application access; or
* Identity Platform reCAPTCHA enforcement.

Bot scoring or reCAPTCHA may be evaluated separately after Beta measurement.

## Implementation Tracking

- [x] Add the pending and active registration states.
- [x] Require pending state for new client-created profiles.
- [x] Add the trusted Firebase Auth verification finalizer.
- [x] Gate new pending registrations before checkout and app access.
- [x] Add a responsive verification screen with resend and confirmation actions.
- [x] Delay welcome email delivery until trusted activation.
- [x] Defer access-lifecycle email delivery for unverified recipients.
- [x] Add optional Profile verification for legacy users.
- [x] Preserve complimentary-access continuation.
- [x] Adapt isolated activation E2E coverage.
- [ ] Validate Firebase email templates and authorized return domains in Beta.
- [ ] Manually test standard, paid, invitation, and complimentary-access flows in Beta.

## Success Criteria

This decision is complete when a new unverified registration cannot enter
checkout or the working app, cannot directly mark itself active, and does not
cause welcome or access-lifecycle provider delivery; a verified registration can
resume its intended path; legacy accounts remain available; and an unverified
legacy user can request and confirm verification from Profile.
