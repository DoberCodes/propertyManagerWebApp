# Mobile UX Guide

Last reviewed: 2026-06

## Purpose

Maintley should be fully usable from a phone.

Mobile is not a secondary experience.

All major workflows should be designed mobile-first and desktop-enhanced.

This document serves as the source of truth for mobile UX decisions across the platform.

It answers:

> How should Maintley behave on mobile devices?

---

# Mobile Philosophy

Maintley users are often:

* Walking properties
* Performing maintenance
* Taking photos
* Reviewing records
* Updating tasks
* Looking up information in the field

Mobile users are typically trying to complete a task rather than explore the application.

Design for:

* Speed
* Clarity
* Action

Avoid:

* Excessive navigation
* Large forms
* Information overload
* Desktop-style layouts

---

# Core Principles

## Prioritize Action

Every screen should clearly answer:

> What should I do next?

Users should never need to scan large amounts of information to find the primary action.

Preferred:

* Complete Task
* Add Property
* Add Appliance
* Add Maintenance Record

Avoid burying important actions beneath informational content.

---

## Minimize Vertical Scrolling

Avoid stacking large sections of optional information.

If content is optional:

* Collapse it
* Hide it behind an action
* Load it on demand
* Move it to a later step

Prefer progressive disclosure.

---

## One Decision Per Screen

Users should generally make one primary decision at a time.

Good:

* Select Property
* Select Appliance
* Complete Task
* Review Recommendations

Poor:

* Configure property
* Upload photos
* Assign tenants
* Create groups
* Configure notifications

on a single screen.

---

## Hide Advanced Options

Advanced functionality should remain available but should not dominate the interface.

Examples:

* Create New Group
* Advanced Filters
* Bulk Actions
* Export Options
* Advanced Reporting

Use:

* Expandable sections
* Overflow menus
* Secondary actions

Avoid showing advanced controls by default.

---

## Compact Viewport Search and Filters

On tablet and mobile viewports (1024px wide and below), list-page search,
filter, and sort controls may be moved into a floating search button to
preserve vertical space.

The expanded panel should:

* Open from the right near the top of the screen
* Keep draft changes separate from the active results
* Apply changes only when the user selects **Apply filters**
* Collapse after filters are applied
* Allow dismissal by chevron, backdrop, or Escape without applying changes
* Show an active-filter count on the collapsed button

Desktop layouts should keep the established inline controls.

On the global Properties page, a secondary folder trigger may sit below the
floating search button. It should appear only in the Properties route and
provide compact access to property-group actions such as managing, creating,
collapsing, or expanding groups.

---

## Prioritize Core Actions

Important actions should remain visible without excessive scrolling.

Examples:

* Save
* Next
* Complete Task
* Add Property
* Add Appliance
* Add Task

The most common action should be visually obvious.

When the mobile bottom navigation already provides an action through Quick
Create, avoid repeating that create button within the page. This applies to
adding tasks, appliances or systems, contractors, and property documents.
Desktop pages should retain their contextual create actions.

Property tabs and property Quick Create actions should use shareable URL
parameters:

```text
/property/:slug?tab=tasks
/property/:slug?tab=tasks&action=create-task
/property/:slug?tab=devices&action=create-system
/property/:slug?tab=documents&action=upload-document
/property/:slug?tab=contractors&action=add-contractor
/property/:slug/device/:deviceSlug?action=edit-appliance
/property/:slug/device/:deviceSlug?action=add-task
/property/:slug/device/:deviceSlug?action=upload-document
/property/:slug/device/:deviceSlug?action=add-log
```

When Quick Create is used from a nested property page, such as an appliance
profile, property-level actions should return to the property root before
selecting the relevant tab. Appliance-level actions should remain on the
appliance profile and open the appliance-specific edit, task, upload, or log
workflow. After an action is handled, remove the `action` parameter while
retaining any remaining navigation parameters. Treat action parameters as
one-time triggers and replace the current history entry so Back navigation
does not reopen a previously handled dialog.

---

# Navigation Philosophy

Mobile navigation should minimize hierarchy depth.

Users should reach common workflows within one or two interactions whenever possible.

Preferred:

```text
Dashboard
  ↓
Task
  ↓
Complete
```

Avoid:

```text
Property
  ↓
Appliances
  ↓
Appliance
  ↓
Tasks
  ↓
Task Detail
  ↓
Complete
```

Deep navigation increases friction and reduces discoverability.

---

# Bottom Navigation

Mobile should prioritize a small set of globally available destinations.

Recommended primary destinations:

* Dashboard
* Properties
* Tasks
* Appliances
* More

The exact implementation may evolve, but core maintenance workflows should remain accessible without opening multiple menus.

Bottom navigation should emphasize:

* Frequent actions
* Global visibility
* Fast switching

Lower-frequency destinations such as the Support Center should remain
available from the mobile navigation drawer rather than displacing a core
maintenance destination in the bottom navigation.

---

# Global vs Property Context

Maintley supports two modes of navigation:

## Global Context

Focused on:

* Tasks
* Appliances
* Reports
* Recommendations
* Portfolio activity

Questions answered:

> What needs my attention?

---

## Property Context

Focused on:

* Property details
* Property history
* Property documentation
* Property-specific records

Questions answered:

> What is the story of this property?

---

## Property Selection

Users should be able to switch between:

* All Properties
* Individual Properties

using a simple property selector.

Property context changes should require a single interaction whenever possible.

Global Dashboard, Tasks, and Appliances views should offer this same property
scope control. On tablet and mobile, Property is the first option in the
floating search and filter panel. A mobile selection remains a draft until the
user applies the filters; dismissing the panel preserves the current view.

Examples:

```text
All Properties
```

```text
123 Main Street
```

```text
Lake House
```

Property selection should not require navigating into a property page.

---

# Dashboard Guidelines

The dashboard should answer:

> What needs my attention right now?

The dashboard is not intended to be a reporting screen.

Avoid:

* Large analytics sections
* Long task lists
* Detailed maintenance history
* Deep documentation views

Prefer:

* Action Center
* High-priority recommendations
* Overdue work
* Upcoming work
* Property switching
* Quick actions

The dashboard should focus on immediate action.

---

# Property Intelligence UX

Property Intelligence should provide guidance without overwhelming users.

Prefer:

* Top opportunities
* Prioritized recommendations
* Quick actions

Avoid:

* Long recommendation lists
* Exhaustive reports
* Large documentation audits

Recommended behavior:

```text
Top 3 Opportunities
```

instead of:

```text
27 Recommendations Found
```

The goal is progress, not completeness.

---

# Documentation Philosophy

Documentation should be encouraged but never required.

Users should not feel blocked because information is missing.

Avoid:

* Large empty documentation sections
* Warning-heavy interfaces
* Missing-information dashboards

Prefer:

* Recommendations
* Quick actions
* Progressive enhancement

Examples:

Good:

```text
Add Filter Size
```

```text
Add Install Date
```

Bad:

```text
Documentation Incomplete
```

Documentation should improve records rather than become a requirement.

---

# Wizard Guidelines

## Step Size

Wizard steps should remain focused.

Target:

* 3–6 primary inputs per step

Avoid:

* Long forms
* Excessive scrolling
* Large review pages

---

## Progressive Disclosure

Show:

* Common options first

Hide:

* Rare options until requested

Example:

```text
Group

[ Existing Group ▼ ]

+ Create New Group
```

Only reveal additional inputs when requested.

---

## Review Steps

Review screens should focus on confirmation and refinement.

Good review actions:

* Add missing appliance
* Add missing task
* Upload documentation
* Run Quick Scan

Avoid turning review screens into full configuration screens.

---

# Images and File Uploads

File uploads consume significant vertical space.

Preferred:

```text
Property Photo (Optional)

[ Upload Photo ]
```

Expand upload controls only after interaction.

Avoid displaying:

* Upload area
* URL fields
* Image controls
* Advanced options

simultaneously.

Documentation should remain available but unobtrusive.

---

# Lists

Mobile should favor lists over tables.

Preferred:

* Cards
* Compact rows
* Key-value layouts
* Expandable sections

Avoid:

* Wide desktop tables
* Multi-column layouts
* Dense grids

Users should be able to scan information quickly.

---

# Tables

Desktop-style tables should generally be avoided on mobile.

If tabular information is required:

Convert to:

* Cards
* Stacked records
* Expandable rows

Focus on readability over density.

---

# Forms

Forms should be optimized for field entry speed.

Guidelines:

* Use sensible defaults
* Reduce required fields
* Group related inputs
* Defer optional inputs

Users should be able to complete common workflows without extensive typing.

---

# Refactoring Checklist

When reviewing a mobile screen, ask:

1. Can optional content be hidden initially?
2. Can this section be collapsed?
3. Is this action commonly used?
4. Is this the primary task for the screen?
5. Can scrolling be reduced?
6. Can navigation depth be reduced?
7. Can property switching be simplified?
8. Can recommendations be prioritized?

If the answer is yes, simplify the experience.

---

# Mobile Success Criteria

A successful mobile experience should allow users to:

* Add a property
* Add an appliance
* Create a task
* Complete a task
* Upload documentation
* Review maintenance history
* Review recommendations

with minimal navigation and minimal scrolling.

When mobile and desktop priorities conflict, favor the workflow that helps users complete maintenance-related tasks quickly while preserving access to the information they need.
