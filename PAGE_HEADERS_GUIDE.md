# Page Headers - Standardized Components

## Overview

All page headers have been standardized with consistent styling, spacing, and components. This ensures a cohesive user experience across all pages in the application.

## Components

### PageHeaderSection

**Primary page header** - Used for main page titles and top-level controls

- Consistent padding and spacing (24px on desktop, responsive on mobile)
- White background with subtle shadow and bottom border
- Flexbox layout for aligning title and action buttons
- Used on: TeamPage, UserProfile, and all main page views

```tsx
import {
	PageHeaderSection,
	PageTitle,
} from '../../Components/Library/PageHeaders';

<PageHeaderSection>
	<PageTitle>Team Management</PageTitle>
	<AddButton>+ Add Item</AddButton>
</PageHeaderSection>;
```

### PageTitle

**Main page title** - h1 level heading (32px on desktop)

- Professional font weight (800)
- Primary text color for consistency
- Responsive sizing (28px tablet, 24px mobile)
- Letter spacing for visual appeal

### HeroHeader & HeroTitle

**Hero header with background** - For detail pages requiring visual impact

- Full-width header with background image support
- Gradient overlay for text readability
- Used on: PropertyDetailPage
- HeroTitle: Large white text (36px on desktop) with text shadow

```tsx
import {
	HeroHeader,
	HeroContent,
	HeroTitle,
} from '../../Components/Library/PageHeaders';

<HeroHeader style={{ backgroundImage: `url(${propertyImage})` }}>
	<HeroContent>
		<HeroTitle>{propertyName}</HeroTitle>
		<ActionButton>Save</ActionButton>
	</HeroContent>
</HeroHeader>;
```

### SectionHeader & SubsectionHeader

**Hierarchical section titles** - For organizing content within pages

- SectionHeader: h2 level (20px), for major sections
- SubsectionHeader: h3 level (16px), for nested content
- Consistent color and spacing

```tsx
import { SectionHeader, SubsectionHeader } from '../../Components/Library/PageHeaders';

<SectionHeader>Properties</SectionHeader>
<SubsectionHeader>Basic Information</SubsectionHeader>
```

### GroupHeader & GroupTitle

**Group/Card headers** - For sections like team groups, property groups

- Light background for visual separation
- Flexible layout for title and action buttons
- Used on: Team groups, property groups, member cards

```tsx
import { GroupHeader, GroupTitle } from '../../Components/Library/PageHeaders';

<GroupHeader>
	<GroupTitle>Property Group Name</GroupTitle>
	<ActionButtons />
</GroupHeader>;
```

## Styling Standards

### Colors

- **Text**: Primary text color for consistency with color system
- **Borders**: Subtle gray borders for visual separation
- **Shadows**: Shadow utility from COLORS constant for depth

### Spacing

- **Desktop**: 24px padding, 24px gaps
- **Tablet**: 20px padding, 16px gaps
- **Mobile**: 16px padding, 12px gaps

### Typography

- **PageTitle**: 32px / 800 weight (desktop), responsive
- **SectionHeader**: 20px / 700 weight
- **SubsectionHeader**: 16px / 600 weight
- **GroupTitle**: 18px / 600 weight

### Layout

- Flexbox for responsive alignment
- Flex-wrap for mobile adaptation
- Consistent gap/margin spacing

## Responsive Behavior

All headers are fully responsive:

- **Mobile**: Stack horizontally, reduce padding and font sizes
- **Tablet**: Medium sizing and spacing
- **Desktop**: Full-size with generous spacing

## Integration Checklist

When adding a new page, follow these guidelines:

- [ ] Use `PageHeaderSection` + `PageTitle` for main pages
- [ ] Use `HeroHeader` + `HeroTitle` for detail pages with backgrounds
- [ ] Use `SectionHeader` for major content sections
- [ ] Use `SubsectionHeader` for nested content
- [ ] Use `GroupHeader` + `GroupTitle` for grouped content
- [ ] Import from `../../Components/Library/PageHeaders`
- [ ] Follow the responsive mobile-first approach
- [ ] Use COLORS constant for styling consistency

## Currently Updated Pages

✅ **TeamPage** - Uses PageHeaderSection + PageTitle
✅ **UserProfile** - Uses PageHeaderSection + PageTitle  
⏳ **PropertyDetailPage** - Should use HeroHeader + HeroTitle (pending update)
⏳ **DashboardTab** - Should use PageHeaderSection (pending update)
⏳ **ReportPage** - Should use PageHeaderSection (pending update)
⏳ **PropertiesTab** - Should use PageHeaderSection (pending update)

## Benefits

✅ **Consistency** - All headers follow the same visual pattern
✅ **Accessibility** - Proper heading hierarchy (h1 → h3)
✅ **Maintainability** - Centralized components for easy updates
✅ **Responsiveness** - Mobile-first design applied uniformly
✅ **Professional Look** - Cohesive visual design across app
