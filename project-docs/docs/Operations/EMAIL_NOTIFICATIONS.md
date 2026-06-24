# Email Notifications

Last reviewed: 2026-06

## Purpose

Maintley supports multiple email notification types.

Each email serves a different purpose, follows different delivery rules, and may have different subscription requirements.

This document defines:

* Email types
* Recipients
* Frequency
* Preference flags
* Delivery responsibilities

This document does not define recommendation logic or Maintley Intelligence behavior.

---

# Email System Responsibilities

The email system is responsible for:

* Recipient selection
* Scheduling
* Frequency enforcement
* Preference enforcement
* Email formatting
* Delivery

The email system is not responsible for:

* Recommendation generation
* Observation prioritization
* Property completeness evaluation
* Appliance profile definitions

Those responsibilities belong to:

* PROPERTY_INTELLIGENCE.md
* RECOMMENDATION_ENGINE.md
* APPLIANCE_PROFILES.md

---

# Monthly Property Summary

Purpose:

Answer:

"What is currently recorded in Maintley?"

Availability:

* All authenticated user plans
* Free
* Homeowner+
* Property
* Portfolio
* Promotional users
* Former subscribers

Default:

Enabled unless:

```text
emailPreferences.monthlyDigest === false
```

Behavior:

* Runs monthly
* Summarizes existing recorded data
* Uses factual language
* Does not generate recommendations
* Does not perform record analysis

Appropriate content:

* Upcoming tasks
* Overdue tasks
* Completed maintenance
* Property counts
* Appliance counts
* Links back to Maintley

---

# Team Member Task Reports

Purpose:

Answer:

"What work is coming up, overdue, or completed for my team?"

Availability:

* Portfolio and team-enabled accounts

Preference Flags:

```text
emailPreferences.teamMemberReports.enabled
emailPreferences.teamMemberReports.frequency
emailPreferences.teamMemberReports.teamMemberIds
```

Supported Frequencies:

* Weekly
* Biweekly
* Monthly

Behavior:

* Runs daily
* Sends only when frequency conditions are met
* Uses delivery tracking to prevent duplicates

Appropriate content:

* Upcoming tasks
* Overdue tasks
* Completed maintenance
* Property names
* Due dates
* Completion dates

Do not include Maintley Intelligence recommendations.

---

# Property Insights

Purpose:

Answer:

"What opportunities has Maintley identified within my records?"

Availability:

* Homeowner+
* Property
* Portfolio

Preference Flag:

```text
emailPreferences.propertyInsights
```

Default:

Disabled

Behavior:

* Runs on an insight schedule
* Delivers Maintley Intelligence observations
* Displays a limited number of recommendations
* Links back to Maintley for additional recommendations

Property Insights consume Maintley Intelligence outputs.

Recommendation generation, prioritization, and observation creation are defined in:

PROPERTY_INTELLIGENCE.md

---

# Preference Flags

Monthly Summary

```text
emailPreferences.monthlyDigest
emailPreferences.monthlyDigestFamilyRecipients
```

Property Insights

```text
emailPreferences.propertyInsights
```

Team Reports

```text
emailPreferences.teamMemberReports.enabled
emailPreferences.teamMemberReports.frequency
emailPreferences.teamMemberReports.teamMemberIds
```

These preferences should remain independent.

---

# Email Design Principles

## Keep Email Actionable

Emails should encourage users to return to Maintley.

Avoid overwhelming users with large reports.

---

## Keep Email Short

Email should summarize.

Maintley should contain the full details.

---

## Respect Preferences

Users should control:

* Which email types they receive
* Which recipients receive reports
* Which frequencies are used

---

## Separate Summary From Intelligence

Monthly Property Summary:

Reports existing information.

Property Insights:

Reports Maintley Intelligence observations.

These email types should remain separate even if delivered on similar schedules.

They answer different product questions and provide different types of value.
