# ADR: Part Knowledge Catalog for Property Knowledge Acquisition

## Status

Accepted for extraction taxonomy; storage ownership superseded by ADR 0036

ADR 0036 makes accepted parts and supplies independent Property-owned Supply
records connected to Equipment through relationships. References below to
adding an accepted item "under" Equipment describe the historical review
experience, not the current storage boundary.

## Context

Property Knowledge Acquisition turns uploaded documents into reviewed structured property knowledge before Maintley Intelligence reasons over that knowledge.

Invoices, manuals, warranties, and receipts often mention components, accessories, consumables, and replacement parts. For example, an HVAC invoice may mention a thermostat, capacitor, air filter, drain pan, disconnect box, refrigerant, contactor, blower motor, or condensate pump.

These items should not remain trapped inside document text when they can safely become part of the property's structured memory. They also should not be automatically trusted or converted into records without user review.

## Decision

Maintley will introduce a Part Knowledge Catalog used by Property Knowledge Acquisition.

Property Knowledge Acquisition is responsible for:

* Finding possible parts, supplies, accessories, and consumables in documents.
* Matching extracted text against the Part Knowledge Catalog.
* Creating reviewable suggestions.
* Preserving source document provenance.

Property Knowledge Acquisition is not responsible for:

* Making maintenance recommendations.
* Predicting failures.
* Performing lifecycle analysis.

The Part Knowledge Catalog is responsible for:

* Defining known part categories.
* Mapping common terms and aliases to part types.
* Identifying likely related asset types.
* Suggesting target record type and useful fields.

The Part Knowledge Catalog is not responsible for:

* Updating property records directly.
* Deciding whether a suggestion is true.
* Generating user-facing maintenance recommendations.

Maintley Intelligence is responsible for:

* Reasoning over accepted Property Memory later.
* Creating recommendations based on accepted parts, assets, history, and knowledge packs.

Maintley Intelligence should not parse raw documents directly.

## Flow

```text
Uploaded document
    ->
Knowledge Acquisition
    ->
Part Knowledge Catalog
    ->
Suggested part / supply
    ->
User review
    ->
Property Memory
    ->
Maintley Intelligence
```

## Model Concept

A part knowledge definition may include:

```ts
interface PartKnowledgeDefinition {
  id: string;
  label: string;
  category:
    | 'part'
    | 'supply'
    | 'consumable'
    | 'accessory'
    | 'material';

  relatedAssetTypes: string[];
  matchTerms: string[];

  commonFields?: string[];
  defaultTarget: 'part';
}
```

Example:

```ts
{
  id: 'thermostat',
  label: 'Thermostat',
  category: 'accessory',
  relatedAssetTypes: ['hvac', 'heat_pump', 'furnace', 'central_ac'],
  matchTerms: [
    'thermostat',
    'smart thermostat',
    'Honeywell T6',
    'Ecobee',
    'Nest'
  ],
  commonFields: ['brand', 'model', 'installDate', 'warranty'],
  defaultTarget: 'part'
}
```

## User Review

When a document contains a possible part, Maintley should present it as a suggestion.

Example:

```text
Maintley found a possible HVAC part:

Honeywell T6 Pro Smart Thermostat

Add this under HVAC Parts & Supplies?
```

Users may:

* Accept the suggestion.
* Edit the suggestion.
* Reject the suggestion.

Accepted suggestions become Property Memory and retain provenance to the source document.

Rejected suggestions should be retained as rejected knowledge suggestions where practical, not silently deleted.

## Provenance

Accepted parts should retain traceability to the source document.

At minimum, preserve:

* sourceDocumentId
* sourceDocumentType
* extractionMethod
* confidence, if available
* acceptedByUser
* acceptedAt

This allows Maintley to explain where a part record came from later.

## Initial Scope

Start with common HVAC-related extracted parts and supplies:

* Thermostat
* Capacitor
* Air filter
* Refrigerant
* Drain pan
* Safety switch
* Disconnect box
* Contactor
* Blower motor
* Condensate pump

Additional HVAC items such as coils and condensers may be cataloged when they are conservatively identifiable from invoice text.

Future catalogs may include:

* Water heater parts
* Refrigerator filters
* Washer/dryer parts
* Pool supplies
* Generator parts
* Lawn equipment supplies

## Consequences

Benefits:

* Documents become a source of structured Property Memory.
* Parts and supplies can be created from invoices and manuals without duplicate manual entry.
* Maintley Intelligence can later reason over accepted part records.
* Source traceability remains clear.

Tradeoffs:

* Adds another taxonomy to maintain.
* Requires careful review UX to avoid incorrect automatic records.
* Matching must be conservative to protect trust.

## Non-Goals

This ADR does not introduce:

* Automatic part creation without review.
* Maintenance recommendations from raw documents.
* AI chat over manuals.
* Failure prediction.
* Lifecycle analysis.
* Full document parsing implementation.
