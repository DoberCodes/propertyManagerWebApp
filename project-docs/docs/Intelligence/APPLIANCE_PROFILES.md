# Appliance Profiles

## Purpose

Appliance Profiles define what information is useful for a specific appliance, system, or asset type.

They serve as the source of truth for:

* Property Setup Assistant
* Quick Scan
* Recommendation Engine
* Property Intelligence
* Property Insight Emails
* Future OCR and barcode extraction
* Future AI-assisted recommendations

Appliance Profiles define:

* Suggested Information
* Suggested Maintenance
* Suggested Parts & Supplies
* Suggested Documentation
* Recommendation Priorities

---

# Profile Philosophy

Maintley should never require users to provide every possible field.

Appliance Profiles exist to help users build more useful records over time.

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

Information that helps identify, maintain, or manage an appliance.

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

Consumable or replaceable items associated with an appliance.

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
* Annual Service
* Clean Condensate Drain

---

## Suggested Parts & Supplies

* HVAC Filter

---

## Suggested Documentation

* Manual
* Warranty
* Service Records

---

# Water Heater

## Suggested Information

Required For Identification

* Manufacturer
* Model Number

Recommended

* Capacity
* Install Date
* Fuel Type

Optional

* Warranty Expiration
* Contractor

---

## Suggested Maintenance

* Flush Tank
* Inspect Anode Rod

---

## Suggested Parts & Supplies

* Anode Rod

---

## Suggested Documentation

* Manual
* Warranty
* Service Records

---

# Refrigerator

## Suggested Information

Required For Identification

* Manufacturer
* Model Number

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

---

## Suggested Documentation

* Manual
* Warranty

---

# Future Expansion

Future appliance profiles may include:

* Dishwasher
* Washer
* Dryer
* Roof
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

All future appliance profiles should follow the same structure to ensure consistent recommendation generation throughout the platform.
