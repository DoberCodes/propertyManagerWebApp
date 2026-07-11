ADR-0009: Maintley Asset Taxonomy

Status: Accepted - initial implementation

Context

Maintley Intelligence relies on understanding what assets exist on a property so it can provide documentation guidance, maintenance recommendations, lifecycle insights, and future intelligence features.

Historically, Maintley primarily modeled "equipment" and "systems." As the platform evolves, the scope expands beyond equipment to include structural components, exterior features, utilities, safety equipment, outdoor equipment, and potentially other maintainable assets.

To support long-term growth, Maintley requires a consistent taxonomy that separates user-facing concepts from intelligence implementation details.

Decision

Maintley will model Assets as the primary entity that represents anything a homeowner intentionally maintains or tracks.

Each Asset consists of:

Asset
├── Asset Type
├── Variant (optional)
├── Category
├── Knowledge Pack
└── Asset Instance
Asset

Represents the real-world object owned by the user.

Examples:

Upstairs HVAC
Kitchen Refrigerator
Main Water Heater
Roof
Deck
Asset Type

Represents the general class of asset.

Examples:

HVAC
Refrigerator
Water Heater
Roof
Generator
Safety Device

Asset Types determine which Knowledge Pack is used.

Variant

Represents a more specific implementation of an Asset Type.

Examples:

HVAC

Furnace
Heat Pump
Mini Split

Water Heater

Tank
Tankless
Heat Pump

Generator

Portable
Standby

Variants allow Maintley Intelligence to provide more specific recommendations while falling back to generic guidance when unknown.

Category

Categories exist only for organization and UI grouping.

Examples:

Kitchen
HVAC
Exterior
Plumbing
Safety

Categories should never drive intelligence rules.

Knowledge Pack

Knowledge Packs contain Maintley's baseline knowledge.

Examples include:

Recommended documentation
Common maintenance intervals
Common consumables
Typical service life
Seasonal guidance
Documentation recommendations

Knowledge Packs are independent of any specific property and may evolve over time.

Guiding Principles
1. Model the homeowner's mental model.

Users think:

"I have a refrigerator."

Not:

"I own a filtration system."

Asset Types should match how homeowners naturally identify their property.

2. Recommendations come from knowledge packs, not asset names.

Maintley Intelligence compares:

Property History

↓

Knowledge Pack

↓

Recommendations

Asset names alone should never contain recommendation logic.

3. Unknown assets remain useful.

If Maintley cannot determine an Asset Type:

Other / Unknown

Maintley should:

preserve documentation
preserve maintenance history
infer recurring patterns from recorded history

Maintley should not apply equipment-specific best practices.

4. Variants increase specificity.

Unknown Variant

↓

Generic Knowledge Pack

Known Variant

↓

Specific Knowledge Pack

Example:

Water Heater

↓

Tankless

↓

Tankless recommendations

5. Intelligence must be explainable.

Every recommendation should be traceable to:

Property observation
Knowledge Pack
Recommendation rule

Users should always be able to understand why a recommendation exists.

Consequences

This taxonomy allows Maintley Intelligence to grow without changing the core architecture.

Future capabilities include:

Property Scan
Full Property Audit
Manual parsing
Lifecycle planning
Seasonal recommendations
Predictive maintenance
Equipment-specific knowledge packs
Property transfer
Email insights

without redesigning the asset model.

Future Considerations

Potential future Asset Types include:

Vehicles
Boats
RVs
Farm Equipment
Commercial Equipment

These should be introduced only when dedicated Knowledge Packs exist.

Until then, they should remain:

Other / Unknown

and rely on history-based pattern recognition rather than equipment-specific recommendations.
