# ADR 0002: Rename User-Facing Devices to Equipment

Status: Superseded by ADR 0025
Date: 2026-06-12
Accepted: 2026-06-12
Decision Source: Manual

## Context

The codebase and Firestore collection still use `devices`, but the user-facing term "Devices" is too broad and can imply phones, tablets, or electronics.

Maintley users are tracking HVAC, water heaters, equipment, roof systems, filters, electrical systems, and similar maintenance assets.

This ADR originally selected "Appliances," "Systems," and "Appliances & Systems" as user-facing replacements for "Devices." ADR 0025 supersedes that wording with "Equipment" as the standard user-facing term.

## Decision

Use "Equipment" in user-facing copy.

Keep existing code, types, and database collection names using `devices` unless a deliberate technical migration is planned.

## Consequences

- UI copy should avoid "Devices" unless referring to actual electronic devices.
- Technical docs may mention that `devices` remains the implementation name.
- Refactors should not rename the Firestore collection casually.
