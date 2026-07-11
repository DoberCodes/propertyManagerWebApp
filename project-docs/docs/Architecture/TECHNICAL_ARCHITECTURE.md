# Technical Architecture

Last reviewed: 2026-06

# Purpose

This document describes how Maintley is implemented today.

It is intentionally descriptive rather than aspirational.

It answers:

> How does Maintley currently work?

This document focuses on:

* System architecture
* Application structure
* Data access patterns
* Service integration
* Runtime behavior
* Technical implementation

For product goals and direction see:

* PRODUCT_DIRECTION.md

For Firebase implementation details see:

* FIREBASE_STRUCTURE.md

For data structures see:

* DATA_MODEL.md

For permissions see:

* PERMISSIONS.md

---

# System Architecture

Maintley is organized into several conceptual layers.

```text
Product Layer
    ↓
User Workflows

Maintley Intelligence Layer
    ↓
Recommendations & Guidance

Application Layer
    ↓
React + Redux

Data Layer
    ↓
Firestore + Storage

Infrastructure Layer
    ↓
Firebase Services
```

Each layer has a distinct responsibility.

The application should avoid duplicating responsibilities across layers.

---

# Core Platform Model

Maintley is organized around three primary concepts.

```text
Properties
    ↓
Organizational Layer

Maintenance Events
    ↓
Historical Layer

Maintley Intelligence
    ↓
Recommendation Layer
```

Properties provide context.

Maintenance Events preserve history.

Maintley Intelligence provides guidance.

Most platform functionality ultimately builds upon these concepts.

---

# Application Shape

Maintley is a React 18 single-page application with Firebase as the backend platform.

The application is also packaged for Android using Capacitor.

Frontend:

* React
* TypeScript
* React Router
* Redux Toolkit
* RTK Query
* styled-components

Backend:

* Firebase Authentication
* Cloud Firestore
* Firebase Storage
* Cloud Functions

Payments:

* Stripe Checkout
* Stripe Webhooks

Mobile:

* Capacitor Android
* Capacitor Push Notifications

Scanning & OCR:

* tesseract.js
* Barcode parsing utilities
* Label parsing utilities
* Browser/PWA scanning through getUserMedia, BarcodeDetector, and ZXing fallback
* Android native scanner bridge through Capacitor, CameraX, and ML Kit barcode scanning

---

# Entry Points

Application startup:

```text
src/index.tsx
```

Application shell:

```text
src/App.tsx
```

Responsibilities include:

* Authentication initialization
* App update checks
* Push notification registration
* Mobile state initialization
* Feedback provider initialization

Routing:

```text
src/router.tsx
```

Authenticated layout:

```text
src/pages/Layout/Layout.tsx
```

Cloud Functions:

```text
functions/index.ts
```

---

# Routing Architecture

Maintley uses:

```text
HashRouter
```

This supports:

* Static hosting
* Android packaging
* Client-side routing

---

## Public Routes

Examples:

* /
* /login
* /forgot-password
* /registration
* /register
* /paywall
* /docs
* /features
* /help
* /legal
* /legal/:documentName

---

## Authenticated Routes

Examples:

* /dashboard
* /tasks
* /devices
* /properties
* /property/:slug
* /property/:slug/device/:deviceSlug
* /property/:slug/maintenance-history/:groupId
* /team
* /report
* /settings
* /profile
* /tenant-profile

Units and suites remain intentionally hidden from active navigation.

---

# State Management

Redux is configured through:

```text
src/Redux/store/store.tsx
```

---

## Redux Slices

Examples:

* user
* app
* navigation
* propertyData
* team
* maintenanceRequests

Several slices remain for compatibility with older application structures.

---

## RTK Query

Shared API configuration:

```text
src/Redux/API/apiSlice.ts
```

Responsibilities:

* Shared API setup
* Cache tags
* Firestore timestamp handling
* App version retrieval
* Feedback submission

Feature APIs provide access to:

* Properties
* Tasks
* Equipment
* Contractors
* Team Members
* Tenants
* Notifications
* Maintenance Events
* Favorites
* Units

Most endpoints interact directly with Firebase SDKs.

Privileged workflows typically use Cloud Functions.

---

# Maintley Intelligence Architecture

Maintley Intelligence is a derived system.

Maintley Intelligence consumes:

* Properties
* Equipment
* Tasks
* Maintenance Events
* Documentation

Maintley Intelligence generates:

* Structured findings
* Recommendations derived from findings
* Property Insights
* Quick Scan results
* Dashboard guidance

Maintley Intelligence does not own source data.

Source data remains in the underlying collections.

The shared engine lives in:

```text
src/intelligence/
```

Quick Scan, future Property Audit, Dashboard Insights, and Email Insights should consume this shared engine rather than implementing separate recommendation logic.

See:

* PROPERTY_INTELLIGENCE.md
* RECOMMENDATION_ENGINE.md

---

# Firebase Client Layer

Firebase initialization:

```text
src/config/firebase.ts
```

Services initialized:

* Firebase App
* Firestore
* Authentication
* Storage
* Functions

Firestore uses:

```text
experimentalAutoDetectLongPolling
```

for compatibility across environments.

---

# Authentication Services

Primary service:

```text
src/services/authService.ts
```

Responsibilities:

* Sign up
* Sign in
* Sign out
* Account bootstrap
* Account membership creation
* Invitation redemption
* User hydration

This service acts as the primary authentication orchestration layer.

---

# Billing Services

Primary service:

```text
src/services/stripeService.ts
```

Responsibilities:

* Checkout creation
* Subscription retrieval
* Billing integrations

Billing behavior is documented separately.

See:

* BILLING.md
* MAINTLEY_PLAN_FEATURE_MATRIX.md

---

# Push Notification Services

Primary service:

```text
src/services/pushNotifications.ts
```

Responsibilities:

* Native token registration
* Foreground notification handling
* Device token synchronization

Push preferences are stored with user records.

---

# Cloud Functions

Cloud Functions are written in TypeScript.

Source:

```text
functions/
```

Compiled output:

```text
functions/lib/
```

Primary export:

```text
functions/index.ts
```

---

## Function Categories

### Billing

Examples:

* createCheckoutSession
* validatePromotionCode
* verifyCheckoutSession
* cancelSubscription
* getSubscriptionDetails
* syncSubscriptionFromStripe

---

### Feedback

Examples:

* submitFeedback

---

### Account Management

Examples:

* ensureFamilyAccount
* createFamilyInvite
* acceptFamilyInvite
* getFamilyMembers
* updateFamilyMember

---

### Team Management

Examples:

* createTeamMemberInvitationCode
* validateTeamMemberInvitationCode
* redeemTeamMemberInvitationCode

---

### Tenant Management

Examples:

* createTenantInvitationCode
* validateTenantInvitationCode
* redeemTenantInvitationCode

---

### Maintenance

Examples:

* createMaintenanceEvent
* createMaintenanceEventsBatch
* notifyTaskCompletion

---

### Notifications

Examples:

* sendPushOnNotificationCreate

---

# Data Access Pattern

Maintley uses a mixed access model.

---

## Client Access

Used for:

* Property data
* Tasks
* Equipment
* Contractors
* Maintenance records

Most account-scoped resources are accessed directly through Firebase SDKs.

---

## Cloud Functions

Used for:

* Billing
* Invitations
* Account setup
* Privileged workflows
* Maintenance event creation

Cloud Functions provide controlled access to sensitive operations.

---

## Firestore Triggers

Used for:

* Notifications
* Push delivery
* Maintenance side effects

Triggers handle cross-cutting system behavior.

---

# Authorization Model

Authorization is enforced through multiple layers.

```text
UI
    ↓
Firestore Rules
    ↓
Cloud Functions
```

UI restrictions improve usability.

Firestore Rules and Cloud Functions provide authoritative security controls.

See:

* PERMISSIONS.md

---

# Account Architecture

Maintley uses an account-centric authorization model.

Hierarchy:

```text
User
    ↓
Account Membership
    ↓
Account
    ↓
Properties
```

Important records:

* users
* familyAccounts
* accountMemberships
* teamMembers

Account membership is the preferred access model.

Legacy ownership fields remain in portions of the application for compatibility.

---

# Maintenance Architecture

Maintenance Events are the canonical maintenance timeline.

Primary collection:

```text
maintenanceEvents
```

Legacy compatibility:

```text
maintenanceHistory
```

Task completion typically results in:

```text
Task
    ↓
Maintenance Event
    ↓
Notification
```

Maintenance history views currently support both collections.

See:

* MAINTENANCE_EVENT_SCHEMA.md

---

# Notification Architecture

Maintley workflow lifecycle events are stored in:

```text
maintleyEvents/{eventId}
```

In-app notification delivery records are stored in:

```text
notifications/{notificationId}
```

Maintley Event producers include:

* Property Knowledge Acquisition
* Maintley Intelligence Quick Scan
* Support Tickets

Event consumers include:

* In-app notification upserts
* Android push delivery for actionable milestones

Future event consumers include:

* Web push
* Email
* Intelligence History
* Activity feeds

Legacy notification-create push delivery remains handled through:

```text
sendPushOnNotificationCreate
```

Event-generated in-app notifications suppress the legacy create trigger and let
the event consumer decide whether Android push should be sent. This prevents
non-actionable milestones, such as document review started, from sending noisy
push notifications while still allowing later milestones to update the same
in-app notification record.

Notification delivery architecture is documented separately.

See:

* EMAIL_NOTIFICATIONS.md

---

# File Storage Architecture

Firebase Storage is used for:

* Property photos
* Equipment photos
* Maintenance attachments
* Warranty documents
* User images

File uploads are managed through upload helper utilities.

Storage behavior is documented separately.

See:

* FILES_AND_STORAGE.md

---

# Build & Test Commands

Root application:

```bash
npm run start
npm run build
npm run test:ci
npm run e2e
npm run test:rules
npm run test:storage
npm run test:rules:all
```

Functions:

```bash
npm --prefix functions run build
npm --prefix functions run deploy
npm --prefix functions run test:sandbox
npm --prefix functions run test:cards:sandbox
npm --prefix functions run test:webhook:sandbox
```

These commands support validation, deployment, and testing workflows.

---

# Current Technical Priorities

Current technical priorities include:

* Continued account-model consolidation
* Legacy ownership cleanup
* Maintley Intelligence expansion
* Mobile UX improvements
* Documentation alignment
* Incremental technical debt reduction

These priorities reflect active implementation efforts rather than long-term product direction.

---

# Design Principles

Maintley architecture should remain:

* Property-centric
* Account-centric
* Event-driven
* Mobile-friendly
* Incrementally maintainable

Source data should remain authoritative.

Derived systems should consume source data rather than create parallel sources of truth.

Properties provide organization.

Maintenance Events provide history.

Maintley Intelligence provides guidance.

The architecture should continue reinforcing those responsibilities as the platform evolves.
