# Design Token and Legacy UI Audit - 2026-06-29

## Purpose

This report inventories remaining color, gradient, and legacy UI usage after the first Maintley visual-standardization passes.

The goal is to decide:

1. What is actively used and should be updated to the Maintley visual standards.
2. What is unused or duplicated and can be retired.
3. What needs a product or architecture decision before additional styling work.

This is a point-in-time audit. It does not replace active documentation or ADRs.

## Maintley Visual Standard

| Token | Hex | Purpose |
| --- | --- | --- |
| Maintley Green | `#047857` | Brand primary and primary actions |
| Maintley Accent | `#3FCC7C` | Success, checkmarks, and highlights |
| Maintley Hover | `#009E71` | Interactive hover states |
| Maintley Pressed | `#036151` | Active and pressed states |
| Slate | `#1F2937` | Primary text |
| Canvas | `#FAFAF8` | App background |
| White | `#FFFFFF` | Surface |

Product or brand gradients should use:

```text
linear-gradient(135deg, #047857 0%, #009E71 100%)
```

## Audit Commands

The audit used static scans over `src` and `public`.

```powershell
rg -o "#[0-9A-Fa-f]{3,8}" src public
rg "COLORS\." src
rg "linear-gradient\(" src
rg "#0f766e|#16a34a|#22c55e|#166534|#10b981|#065f46|#059669|#15803d" src
```

Limitations:

- Static usage does not prove whether a route is reachable at runtime.
- Color literals inside status maps may be legitimate semantic colors.
- Some legacy unit/suite references are retained for old data even though routes are currently hidden.

## Snapshot

| Metric | Count |
| --- | ---: |
| Hex color literal references in `src` and `public` | 3,228 |
| Unique hex values | 288 |
| `COLORS.*` token references in `src` | 1,169 |
| `linear-gradient(...)` references in `src` | 86 |
| Remaining legacy green literal references | 262 |

Legacy green literals counted:

```text
#0f766e
#16a34a
#22c55e
#166534
#10b981
#065f46
#059669
#15803d
```

## Most Common Hard-Coded Colors

| Color | Count | Interpretation |
| --- | ---: | --- |
| `#FFFFFF` | 239 | Surface color. Should gradually become `COLORS.white` or `COLORS.bgWhite`. |
| `#64748B` | 201 | Secondary text. Should become `COLORS.textSecondary` or a documented neutral. |
| `#0F172A` | 125 | Near-black text. Should be reviewed against Slate `#1F2937`. |
| `#E5E7EB` | 114 | Border. Should become `COLORS.border` or `COLORS.gray200`. |
| `#E2E8F0` | 113 | Border/surface line. Needs neutral token decision. |
| `#F8FAFC` | 104 | Surface background. Should become a neutral token if retained. |
| `#475569` | 101 | Secondary/body text. Needs neutral token decision. |
| `#6B7280` | 96 | Secondary text. Already mapped as `COLORS.textSecondary`. |
| `#334155` | 63 | Dark secondary text. Needs neutral token decision. |
| `#0F766E` | 61 | Old teal brand/action color. Should be replaced or retired with containing code. |

## Active Token Usage

The token system is being used. The most-used aliases are:

| Token | Count | Recommendation |
| --- | ---: | --- |
| `COLORS.primary` | 202 | Keep. This is the main action token. |
| `COLORS.primaryDark` | 97 | Keep, but use specifically for active/pressed emphasis. |
| `COLORS.textSecondary` | 85 | Keep. |
| `COLORS.gradientPrimary` | 80 | Keep as the only product gradient. |
| `COLORS.primaryLight` | 75 | Keep, but consider renaming later to `accentLight` or `highlightLight` if semantics become confusing. |
| `COLORS.textPrimary` | 72 | Keep. |
| `COLORS.bgWhite` | 62 | Keep or eventually consolidate with `COLORS.white`. |
| `COLORS.white` | 58 | Keep. |
| `COLORS.gray200` | 55 | Keep. |

## Unused or Duplicative Tokens

| Token | Current usage | Recommendation |
| --- | ---: | --- |
| `gradientSecondary` | 0 | Retire. It duplicates `gradientPrimary`. |
| `gradientWarm` | 0 | Retire. It duplicates `gradientPrimary`. |
| `gradientCool` | 0 | Retire. It duplicates `gradientPrimary`. |
| `gradientLight` | 0 | Retire unless a neutral-surface gradient is intentionally standardized. |
| `bgDark` | 0 | Retire or keep only if dark mode is planned. |
| `alertInfo` | 0 | Retire or replace with `infoDark` if needed. |
| `alertInfoBg` | 0 | Retire or replace with `infoLight` if needed. |
| `maintleyAccent` | 0 direct | Keep as raw palette token. Use semantic aliases like `success` in components. |
| `maintleyHover` | 0 direct | Keep as raw palette token. Use `primaryHover` in components. |
| `maintleyPressed` | 0 direct | Keep as raw palette token. Use `primaryDark` or a future `pressed` alias in components. |
| `primaryDarker` | 4 | Consider retiring. It duplicates `primaryDark`. |

Recommendation: keep raw palette tokens as the foundation, but discourage component usage of raw palette names. Components should use semantic tokens like `primary`, `primaryHover`, `primaryDark`, `success`, `textPrimary`, and `bgLight`.

## Remaining Legacy Green Hotspots

These files contain the highest concentration of remaining old green literals.

| Area | File | Count | Recommendation |
| --- | --- | ---: | --- |
| Property creation/editing | `src/Components/PropertiesTab/PropertyDialog.styles.tsx` | 23 | Update. Active high-value flow. |
| Property list | `src/Components/PropertiesTab/PropertiesTab.styles.tsx` | 18 | Update. Active high-value flow. |
| Registration | `src/Components/RegistrationCard/RegistrationCard.styles.tsx` | 17 | Update. Public/auth flow should match brand. |
| Property setup | `src/Components/PropertySetupAssistant/PropertySetupAssistant.tsx` | 16 | Update. Important onboarding flow. |
| Settings | `src/pages/SettingsPage/SettingPage.styles.tsx` | 14 | Update. Active account/admin flow. |
| Device detail | `src/pages/DeviceDetailPage/DeviceDetailPage.styles.tsx` | 13 | Update. Active system detail flow. |
| Devices hub | `src/pages/DevicesHubPage/DeviceHubPage.styles.tsx` | 12 | Update. Active system hub flow. |
| Knowledge review | `src/pages/PropertyDetailPage/TabSystem/PropertyKnowledgeReviewPanel.tsx` | 11 | Update next. It is current strategic product surface. |
| Team | `src/pages/TeamPage/TeamPage.styles.tsx` | 12 | Update after property/system flows. |
| Report builder | `src/Components/ReportBuilder/ReportBuilder.styles.tsx` | 8 | Keep and update if reports remain part of supported app. |
| Unit detail | `src/pages/UnitDetailPage/UnitDetailPage.tsx` | 8 | Do not polish until unit direction is decided. |
| Documents tab | `src/pages/PropertyDetailPage/TabSystem/DocumentsTab.tsx` | 7 | Update. Active and related to Property Memory. |

## Gradients

There are 86 gradient references across `src`.

Highest concentrations:

| File | Gradient count | Recommendation |
| --- | ---: | --- |
| `src/Components/SeasonalMaintenance.styles.ts` | 10 | Keep semantic seasonal gradients, but tokenized colors should be used. |
| `src/pages/LandingPage/LandingPage.styles.tsx` | 10 | Review. Brand/product gradients should use Green + Hover. Neutral section gradients can stay if tokenized. |
| `src/pages/PropertyDetailPage/PropertyDetailPage.styles.tsx` | 7 | Review. Most appear to be neutral surfaces or overlays. |
| `src/pages/DevicesHubPage/DeviceHubPage.styles.tsx` | 5 | Update with device hub pass. |
| `src/Components/Library/Modal/ModalStyles.tsx` | 4 | Update as shared primitive pass. |
| `src/pages/LoginPage/LoginPage.styles.tsx` | 4 | Review. Login background still uses older teal rgba values in places. |

Recommended gradient policy:

- Product/brand gradients: must use `COLORS.gradientPrimary`.
- Neutral surface gradients: allowed, but use `COLORS.white`, `COLORS.canvas`, or documented neutral tokens.
- Error/warning/info gradients: allowed only where semantic and should use semantic tokens.
- Image overlays: allowed when needed for readability.

## Code to Update

These areas are active and should be brought forward.

### 1. Property and Property Setup

Update:

- `PropertyDialog.styles.tsx`
- `PropertiesTab.styles.tsx`
- `PropertySetupAssistant.tsx`

Reason:

These are core onboarding and property creation flows. They should use the new brand system before less central screens.

### 2. Property Knowledge Review

Update:

- `PropertyKnowledgeReviewPanel.tsx`
- `DocumentsTab.tsx`

Reason:

This is directly tied to Property Memory and Maintley Intelligence. It should visually match the new direction.

### 3. Systems and Equipment

Update:

- `DevicesHubPage.styles.tsx`
- `DeviceDetailPage.styles.tsx`
- inline colors in `DeviceDetailPage.tsx`
- device/system status maps in active tabs

Reason:

Systems are one of the main anchors for Property Memory. This should be consistent.

### 4. Account, Team, and Settings

Update:

- `SettingPage.styles.tsx`
- `TeamPage.styles.tsx`
- `RegistrationCard.styles.tsx`
- remaining auth/profile styles

Reason:

These are active user/account surfaces. They can be updated after core property workflows.

### 5. Shared Modal/Form Primitives

Update:

- `ModalStyles.tsx`
- `DeviceModal.tsx`
- `TaskModal.tsx`
- `FormStyles.tsx`
- remaining accent-color usage in modal controls

Reason:

This reduces future drift. It should be done after the highest-value visible surfaces to avoid overfitting old modal patterns before the active workflows are clean.

## Code to Retire or Defer

### Unit and Suite Surfaces

Observed:

- `router.tsx` comments out unit and suite detail routes.
- `TabController.tsx` comments out adding the `units` tab.
- `TabSystem.tsx` still contains `case 'units'` and `case 'suites'`.
- `UnitsTab.tsx`, `SuitesTab.tsx`, `UnitDetailPage`, and `SuiteDetailPage` still exist.
- Other active surfaces still reference unit/suite data for legacy locations, reports, and labels.

Recommendation:

Do not spend visual-standardization effort on unit/suite pages yet.

Make a product decision first:

1. Relaunch unit/suite management intentionally.
2. Or retire the unit/suite UI and keep only legacy read-only data support.

If the decision is retirement:

1. Stop generating links to hidden unit/suite routes.
2. Remove `UnitsTab` and `SuitesTab` exports and `TabSystem` cases.
3. Remove `UnitDetailPage` and `SuiteDetailPage` routes/pages.
4. Keep legacy `unitId` and `suiteId` fields only where needed to display old records.
5. Remove unit/suite API and Firestore assumptions only after a separate data-model review.

### Debug/Test Components

Observed:

- `DebugConsole` has no active reference in the scan.
- `FirebaseConnectionTest` has no active reference in the scan.

Recommendation:

Confirm whether these are intentionally kept for local development. If not, retire them. If yes, move them behind a clearly named development-only route or folder.

### Report Builder Unit/Suite Reports

Observed:

- `ReportBuilder` is active through `/report`.
- It still contains `suites` and `units` report logic.

Implementation update, 2026-06-30:

- Unit and suite report templates are no longer exposed through active report availability.
- Legacy unit/suite report adapters remain in place for existing data compatibility.

Recommendation:

Keep `ReportBuilder`, but decide whether unit/suite report types should remain visible. If unit/suite UI remains hidden, unit/suite reports should probably be hidden or marked legacy.

## Do Not Retire Yet

These are active or strategically important:

- Landing page
- Property detail page
- Property Intelligence panels
- Property Knowledge Review
- Documents tab
- Devices hub and device detail
- Tasks and maintenance history
- Team, Settings, Registration, Paywall, Support
- Report page, unless the product decides to remove reporting

## Recommended Staged Plan

### Stage 1 - Current Product Core

Update:

- `PropertyKnowledgeReviewPanel.tsx`
- `DocumentsTab.tsx`
- `DevicesHubPage.styles.tsx`
- `DeviceDetailPage.styles.tsx`
- `PropertySetupAssistant.tsx`

Goal:

Bring the Property Memory and system/equipment flows onto the design standard.

### Stage 2 - Property Creation and Account Surfaces

Update:

- `PropertyDialog.styles.tsx`
- `PropertiesTab.styles.tsx`
- `RegistrationCard.styles.tsx`
- `SettingPage.styles.tsx`
- `TeamPage.styles.tsx`

Goal:

Clean up high-traffic setup, account, and team workflows.

### Stage 3 - Shared Form and Modal Cleanup

Update:

- `ModalStyles.tsx`
- `FormStyles.tsx`
- `DeviceModal.tsx`
- `TaskModal.tsx`
- repeated inline status badge patterns

Goal:

Reduce recurring hard-coded values and prevent future visual drift.

### Stage 4 - Unit/Suite Decision

Do not polish unit/suite screens before deciding their future.

Create a focused decision record:

- Keep and relaunch unit/suite management.
- Or retire unit/suite UI and preserve only legacy data display.

### Stage 5 - Token Pruning

After active screens stop using legacy colors:

1. Remove unused duplicate gradient aliases.
2. Remove unused alert aliases.
3. Decide whether `primaryDarker` remains necessary.
4. Add a lightweight lint/report script that flags old Maintley-green literals.

## Recommended Next Implementation Pass

The highest-value next pass is:

1. `PropertyKnowledgeReviewPanel.tsx`
2. `DocumentsTab.tsx`
3. `DevicesHubPage.styles.tsx`
4. `DeviceDetailPage.styles.tsx`

Reason:

These are active, product-defining surfaces tied to Property Memory, documents, systems, and Maintley Intelligence. They should be updated before account/admin screens or dormant unit/suite UI.
