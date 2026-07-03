ADR: Property Memory Change Review
Status

Accepted - initial implementation

Context

Property Knowledge Acquisition identifies possible information from documents such as manuals, invoices, warranties, receipts, and inspection reports.

The initial implementation reviewed extracted fields individually.

While technically accurate, field-by-field review exposes implementation details and forces users to think in database fields rather than understanding how their property's records will change.

Maintley should present proposed changes using the same mental model users already understand throughout the application.

Decision

Knowledge Acquisition will present changes to Property Memory, not extracted fields.

Users review how existing property records will change before those changes are applied.

Property Memory remains the only source of truth.

Guiding Principles
Review changes, not fields.

The review experience should answer:

What will change if I accept this?

Not:

What fields were extracted?

Organize by entity.

Suggested changes should be grouped by the Maintley records they affect.

Examples:

Asset
Maintenance Event
Contractor
Warranty
Part
Cost
Property

Each entity may contain multiple suggested changes.

Show current state and proposed state.

Where appropriate, display:

Current Property Memory

↓

Proposed Property Memory

This allows users to understand additions, replacements, and newly created records naturally.

Property Memory remains authoritative.

Knowledge Acquisition never updates records directly.

Users explicitly approve proposed changes before Property Memory is modified.

Preserve provenance.

Every accepted change remains linked to its originating document.

Future users should always be able to understand:

what changed
why it changed
which document supplied the information
Example

Instead of:

Brand

Trane

Install Date

June 14

The review becomes:

HVAC System

Brand
—
→ Trane

Install Date
—
→ June 14, 2025

Model
—
→ 4TTR4036L1000A

Maintenance Events become:

Create Maintenance Event

Installation

June 14, 2025

Contractor

ABC Heating

Invoice Total

$7,325
Consequences

Benefits

Matches the rest of the Maintley experience.
Reduces cognitive load.
Makes Knowledge Acquisition understandable without exposing implementation details.
Supports additions, updates, and replacements naturally.
Scales to future document types.

Tradeoffs

Requires loading existing Property Memory during review.
More complex UI than a simple extracted field list.
Future Considerations

Future implementations may include:

Before / After highlighting
Batch approval
Accept all high-confidence changes
Side-by-side comparisons
Entity-level approval
Merge conflict resolution
Change history
