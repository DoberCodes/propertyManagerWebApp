# 0002: Rename User-Facing Devices to Appliances and Systems

Date: 2026-06-12

## Status

Accepted

## Context

The codebase and Firestore collection still use `devices`, but the user-facing term "Devices" is too broad and can imply phones, tablets, or electronics.

Maintley users are tracking HVAC, water heaters, appliances, roof systems, filters, electrical systems, and similar maintenance assets.

## Decision

Use "Appliances," "Systems," or "Appliances & Systems" in user-facing copy.

Keep existing code, types, and database collection names using `devices` unless a deliberate technical migration is planned.

## Consequences

- UI copy should avoid "Devices" unless referring to actual electronic devices.
- Technical docs may mention that `devices` remains the implementation name.
- Refactors should not rename the Firestore collection casually.
