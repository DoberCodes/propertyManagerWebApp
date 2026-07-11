# Equipment Profiles

## Purpose

Equipment Profiles define what information is useful for a specific equipment or asset type.

They serve as the source of truth for:

* Property Setup Assistant
* Quick Scan
* Recommendation Engine
* Maintley Intelligence
* Property Insight Emails
* Equipment label capture and barcode extraction
* Future AI-assisted recommendations

Equipment Profiles define:

* Suggested Information
* Suggested Maintenance
* Suggested Parts & Supplies
* Suggested Documentation
* Recommendation Priorities

---

# Asset Classification

Equipment Profiles should distinguish asset type from variant.

Asset type identifies the general category Maintley should reason over.

Variant identifies the specific equipment pattern when known.

Examples:

* Water Heater -> Tank Gas, Tankless Gas, Heat Pump
* HVAC -> Furnace, Heat Pump, Central AC, Mini Split
* Dryer -> Gas, Electric
* Range / Oven -> Gas, Electric
* Safety Device -> Smoke Detector, Carbon Monoxide Detector, Combo Detector

Maintley Intelligence should prefer `assetType` and `assetVariant` when available.

Older records may only have a legacy `type` field. Those records should remain supported as generic or unknown until the user updates them or Maintley can safely infer asset classification.

---

# Profile Philosophy

Maintley should never require users to provide every possible field.

Equipment Profiles exist to help users build more useful records over time.

Missing information should generate recommendations, not errors.

Example:

A user can successfully create an HVAC system without:

* Filter Size
* Install Date
* Warranty Information

Maintley may recommend adding these later because they improve future maintenance workflows.

---

# Recommendation Categories

## Suggested Information

Information that helps identify, maintain, or manage an equipment.

Examples:

* Manufacturer
* Model Number
* Serial Number
* Install Date
* Capacity
* Fuel Type
* Filter Size

---

## Suggested Maintenance

Recommended recurring maintenance activities.

Examples:

* Replace Filter
* Flush Tank
* Inspect Roof
* Test Safety Devices

---

## Suggested Parts & Supplies

Consumable or replaceable items associated with an equipment.

Examples:

* HVAC Filter
* Refrigerator Water Filter
* Humidifier Pad
* Anode Rod

---

## Suggested Documentation

Optional supporting records.

Examples:

* Manuals
* Warranty Information
* Receipts
* Photos

Documentation should improve records but should not be required.

---

# Equipment Label Capture

Equipment label capture is a Property Memory intake surface, not an automatic
autofill system.

The primary equipment capture path should be:

```text
Capture or upload label
    ->
Confirm image or retake
    ->
Read text from image
    ->
User validates recognized text
    ->
Recognize possible fields
    ->
User reviews, edits, and selects fields
    ->
Apply accepted fields to the equipment profile
```

Barcode and QR scanning may remain available as a helper path, but equipment
labels often contain the more useful make, model, serial, and service details.

Scanner output should follow these rules:

* Show recognized details before applying them.
* Let users confirm or retake the label image before OCR runs.
* Let users validate and correct OCR text before fields are proposed.
* Apply only fields the user reviewed and accepted.
* Normalize model, serial, and part identifiers conservatively.
* Keep original OCR or barcode text behind a disclosure for evidence.
* Do not save raw OCR text into equipment notes or service notes.
* Do not silently overwrite existing equipment identity fields without review.

Dedicated scan-session records, source evidence records, server-side OCR, and
confidence-backed extraction provenance are future architecture work. They
should be introduced deliberately instead of being added as duplicate equipment
state.

---

# Recommendation Priorities

## High Value

Information that directly improves maintenance outcomes.

Examples:

* Filter Size
* Install Date
* Maintenance Schedule
* Capacity

These recommendations should be surfaced first.

---

## Medium Value

Information that improves future decision making.

Examples:

* Warranty Expiration
* Contractor Information
* Service Provider Information

---

## Low Value

Convenience information and supporting records.

Examples:

* Manuals
* Photos
* Receipts

These recommendations should only appear after higher-value opportunities have been addressed.

---

# HVAC

## Suggested Information

Required For Identification

* Manufacturer
* Model Number
* Serial Number

Recommended

* Install Date
* Filter Size
* Location

Optional

* Warranty Expiration
* Contractor

---

## Suggested Maintenance

* Replace Filter
* Professional Service
* Clean Condensate Drain

---

## Suggested Parts & Supplies

* Capacitor
* Contactor
* Filter

---

## Suggested Documentation

* Manual
* Warranty
* Service Records

---

## Lifecycle

* Typical planning range: 15-20 years for many HVAC systems.
* Use install date for planning context, not condition diagnosis.

---

## Seasonal Guidance

* Spring: Record cooling-season service or filter checks.
* Fall: Record heating-season service or filter checks.

---

# Water Heater

## Suggested Information

Required For Identification

* Manufacturer
* Model Number
* Serial Number

Recommended

* Capacity
* Install Date
* Fuel Type

Optional

* Warranty Expiration
* Contractor

---

## Suggested Maintenance

Tank water heaters:

* Flush Tank
* Inspect Anode Rod

Tankless water heaters:

* Review Tankless Descaling

---

## Suggested Parts & Supplies

* Anode Rod
* Temperature and Pressure Relief Valve

---

## Suggested Documentation

* Manual
* Warranty
* Service Records

---

## Lifecycle

* Typical planning range: 8-12 years for many tank water heaters.
* Use manufacturer and plumber guidance when it differs from Maintley baseline guidance.

---

## Seasonal Guidance

* Fall: Record tank maintenance or tankless service review before heavier winter use.

---

# Refrigerator

## Suggested Information

Required For Identification

* Manufacturer
* Model Number
* Serial Number

Recommended

* Install Date
* Water Filter Model

Optional

* Warranty Expiration

---

## Suggested Maintenance

* Replace Water Filter
* Clean Coils

---

## Suggested Parts & Supplies

* Water Filter
* Air Filter

---

## Suggested Documentation

* Manual
* Warranty

---

## Lifecycle

* Typical planning range: 10-15 years for many refrigerators.
* Track water filter model for easier replacements.

---

## Seasonal Guidance

* Spring: Record coil cleaning if it is part of routine care.
* Fall: Review filter history before holiday or heavy kitchen use.

---

# Washer

## Suggested Information

Required For Identification

* Manufacturer
* Model Number
* Serial Number

Recommended

* Install Date

Optional

* Warranty Expiration

---

## Suggested Maintenance

* Run Cleaning Cycle
* Inspect Hoses

---

## Suggested Parts & Supplies

* Hoses
* Inlet Screens

---

## Suggested Documentation

* Manual
* Warranty

---

## Lifecycle

* Typical planning range: 10-13 years for many washers.
* Track install date for replacement planning and warranty review.

---

## Seasonal Guidance

* Spring: Record a hose check if laundry connections are accessible.
* Fall: Review cleaning-cycle history before heavier seasonal use.

---

# Dryer

## Suggested Information

Required For Identification

* Manufacturer
* Model Number
* Serial Number

Recommended

* Install Date

Optional

* Warranty Expiration

---

## Suggested Maintenance

* Clean Dryer Vent
* Record Lint Filter Care

---

## Suggested Parts & Supplies

* Vent Duct
* Lint Screen
* Belt

---

## Suggested Documentation

* Manual
* Warranty

---

## Lifecycle

* Typical planning range: 10-13 years for many dryers.
* Track install date for replacement planning and warranty review.

---

## Seasonal Guidance

* Spring: Record dryer vent cleaning if it is part of spring maintenance.
* Fall: Review vent cleaning history before heavier winter laundry use.

---

# Roof

## Suggested Information

Recommended

* Install Date
* Material
* Warranty Information

Optional

* Contractor

---

## Suggested Maintenance

* Roof Inspection
* Gutter or Debris Review

---

## Suggested Parts & Supplies

* Shingles
* Flashing
* Roof Sealant

---

## Suggested Documentation

* Warranty
* Inspection Report
* Photos

---

## Lifecycle

* Typical planning range: 20-30 years for many asphalt shingle roofs.
* Roof lifecycle varies significantly by material, climate, installation, and maintenance history.

---

## Seasonal Guidance

* Spring: Record a roof and gutter review after winter weather.
* Fall: Record a roof and gutter review before winter weather.

---

# Smoke/CO Detector

## Suggested Information

Required For Identification

* Model Number
* Serial Number
* Location

Recommended

* Install Date
* Replacement Date

---

## Suggested Maintenance

* Test Detector
* Replace Battery

---

## Suggested Parts & Supplies

* Battery
* Replacement Detector

---

## Suggested Documentation

* Manual

---

## Lifecycle

* Typical replacement window: 7-10 years for many detectors.
* Follow the device label and manufacturer instructions for replacement timing.

---

## Seasonal Guidance

* Spring: Record a test or battery check.
* Fall: Record a test or battery check.

---

# Future Expansion

Future equipment profiles may include:

* Dishwasher
* Generator
* Irrigation System
* Sump Pump
* Water Softener
* Septic System
* Well System
* Pool Equipment
* Lawn Equipment
* Vehicles
* Trailers

All future equipment profiles should follow the same structure to ensure consistent recommendation generation throughout the platform.
