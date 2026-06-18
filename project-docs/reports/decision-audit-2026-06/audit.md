# Decision ADR Gap Audit - 2026-06

Generated: 2026-06-18T00:56:17.977Z
Mode: report-only (no ADR creation or file changes)

Audit prompt:
Review project-docs/docs and project-docs/ADR.
Identify significant architectural, product, deployment, data model, or UX decisions that are documented but do not appear to have corresponding ADRs.
Generate a report only. Do not modify files.

## Summary

- Docs files scanned (excluding Archive): 23
- ADR files scanned: 5
- Curated decisions evaluated: 8
- High priority likely missing ADR: 3
- Medium priority likely missing ADR: 2
- Decisions with ADR candidate found: 3
- ADR candidate drafts generated: 3
- Previously rejected decisions suppressed: 0
- Decision audit artifacts path: project-docs/reports/decision-audit-2026-06

## High Priority

- Property Intelligence Architecture
- Maintenance Events As Historical Source Of Truth
- Production-Only Deployment Strategy

## Previously Rejected (Suppressed)

- None.

## Pending Candidates Under Review

- None. All candidates have been reviewed and promoted or rejected.


- Homeowner Plus Plan Structure
- Documentation System Reorganization

## Decisions With ADR Candidate Found

- Remove Units From Core Experience
  - project-docs/ADR/0001-remove-units-from-core-experience.md
- Property Setup Assistant
  - project-docs/ADR/0005-property-setup-assistant.md
- Property-First Navigation
  - project-docs/ADR/0003-property-first-navigation.md

## Decision Evidence Table

| Decision | Priority | Status | ADR Matches |
|---|---|---|---|
| Remove Units From Core Experience | High | ADR Candidate Found | project-docs/ADR/0001-remove-units-from-core-experience.md |
| Property Intelligence Architecture | High | Likely Missing ADR | None |
| Maintenance Events As Historical Source Of Truth | High | Likely Missing ADR | None |
| Property Setup Assistant | High | ADR Candidate Found | project-docs/ADR/0005-property-setup-assistant.md |
| Production-Only Deployment Strategy | High | Likely Missing ADR | None |
| Property-First Navigation | Medium | ADR Candidate Found | project-docs/ADR/0003-property-first-navigation.md |
| Homeowner Plus Plan Structure | Medium | Likely Missing ADR | None |
| Documentation System Reorganization | Medium | Likely Missing ADR | None |

## Evidence Snippets

### Remove Units From Core Experience
- project-docs/docs/Architecture/FIREBASE_STRUCTURE.md:308 - Temporarily hidden but still supported:

### Property Intelligence Architecture
- project-docs/docs/Architecture/DATA_MODEL.md:116 - * Property Intelligence
- project-docs/docs/Architecture/DATA_MODEL.md:119 - * Property Intelligence summaries
- project-docs/docs/Architecture/DATA_MODEL.md:872 - * Property Intelligence observations
- project-docs/docs/Architecture/DATA_MODEL.md:910 - * Property Intelligence
- project-docs/docs/Architecture/DATA_MODEL.md:1060 - # Property Intelligence Model
- project-docs/docs/Architecture/DATA_MODEL.md:1062 - Property Intelligence is a derived system.

### Maintenance Events As Historical Source Of Truth
- project-docs/docs/Architecture/DATA_MODEL.md:68 - ├── Maintenance Events
- project-docs/docs/Architecture/DATA_MODEL.md:82 - Maintenance Events may reference:
- project-docs/docs/Architecture/DATA_MODEL.md:130 - * Maintenance Events
- project-docs/docs/Architecture/DATA_MODEL.md:264 - * Maintenance Events
- project-docs/docs/Architecture/DATA_MODEL.md:305 - Operational history belongs in Maintenance Events.
- project-docs/docs/Architecture/DATA_MODEL.md:387 - * Maintenance Events

### Property Setup Assistant
- project-docs/docs/Architecture/DATA_MODEL.md:1129 - * Setup Assistant Responses
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:75 - * Property Setup Assistant introduction
- project-docs/docs/Intelligence/APPLIANCE_PROFILES.md:9 - * Property Setup Assistant
- project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md:75 - * Setup Assistant recommendations
- project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md:263 - ## Setup Assistant
- project-docs/docs/Intelligence/PROPERTY_INTELLIGENCE.md:374 - * After Setup Assistant completion

### Production-Only Deployment Strategy
- project-docs/docs/Operations/DEPLOYMENT.md:524 - Maintley currently deploys directly to the production Firebase project.
- project-docs/docs/Operations/DEPLOYMENT.md:526 - A separate beta environment was previously evaluated but is not currently active.
- project-docs/docs/Operations/DEPLOYMENT.md:535 - Until then, deployment remains production-only.

### Property-First Navigation
- project-docs/docs/Architecture/DATA_MODEL.md:258 - Properties are the primary organizational record in Maintley.
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:74 - * Property-first navigation
- project-docs/docs/Product/FEATURES.md:42 - Properties are the primary organizational object within Maintley.
- project-docs/docs/Product/PRODUCT_DIRECTION.md:232 - Properties are the primary organizing object within Maintley.

### Homeowner Plus Plan Structure
- project-docs/docs/Architecture/DATA_MODEL.md:39 - * Subscription plan capabilities
- project-docs/docs/Architecture/FILES_AND_STORAGE.md:232 - | Homeowner+ | 250        | 5 GB          |
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:489 - * Subscription plans change
- project-docs/docs/Operations/DEPLOYMENT.md:438 - * Homeowner+ access.
- project-docs/docs/Operations/EMAIL_NOTIFICATIONS.md:61 - * Homeowner+
- project-docs/docs/Operations/EMAIL_NOTIFICATIONS.md:149 - * Homeowner+

### Documentation System Reorganization
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:32 - project-docs/
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:33 - ├── ADR/
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:35 - └── reports/
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:108 - ADR candidates generated by audit tooling should be created in project-docs/reports/.
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:110 - Only accepted ADRs belong in project-docs/ADR/.
- project-docs/docs/Development/DOCUMENTATION_MAINTENANCE.md:231 - project-docs/docs/

## Additional Potential Decision Headings Without ADR Text Match

- project-docs/docs/Architecture/DATA_MODEL.md:1 - Data Model
- project-docs/docs/Architecture/DATA_MODEL.md:21 - Data Model Philosophy
- project-docs/docs/Architecture/DATA_MODEL.md:637 - Historical Source of Truth
- project-docs/docs/Architecture/DATA_MODEL.md:1060 - Property Intelligence Model
- project-docs/docs/Architecture/DATA_MODEL.md:1088 - Property Intelligence Relationships
- project-docs/docs/Architecture/DATA_MODEL.md:1270 - Source of Truth Model
- project-docs/docs/Architecture/FILES_AND_STORAGE.md:140 - Storage Architecture
- project-docs/docs/Architecture/FILES_AND_STORAGE.md:388 - Property Intelligence Integration
- project-docs/docs/Architecture/FIREBASE_STRUCTURE.md:38 - Firebase Architecture
- project-docs/docs/Architecture/FIREBASE_STRUCTURE.md:201 - Account Architecture
- project-docs/docs/Architecture/MAINTENANCE_EVENT_SCHEMA.md:26 - Source of Truth
- project-docs/docs/Architecture/MAINTENANCE_EVENT_SCHEMA.md:299 - Property Intelligence Integration
- project-docs/docs/Architecture/MAINTENANCE_EVENT_SCHEMA.md:318 - Reading Strategy
- project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md:1 - Technical Architecture
- project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md:42 - System Architecture
- project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md:184 - Routing Architecture
- project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md:299 - Property Intelligence Architecture
- project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md:583 - Account Architecture
- project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md:612 - Maintenance Architecture
- project-docs/docs/Architecture/TECHNICAL_ARCHITECTURE.md:646 - Notification Architecture

## Notes

- This audit is heuristic and intentionally conservative.
- "ADR Candidate Found" indicates a likely ADR match, not formal traceability validation.
- High-priority missing ADRs were drafted as report artifacts in project-docs/reports/decision-audit-2026-06/candidates.
- Candidate drafts were enhanced into review drafts in undefined.
- Draft artifacts are not official ADRs until manually reviewed and promoted.
- This script does not modify project-docs/ADR.
- Use this report to decide whether to add new ADRs or tighten decision-to-ADR mapping.
