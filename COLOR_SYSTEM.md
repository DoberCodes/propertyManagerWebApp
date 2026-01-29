# Property Manager App - Professional Color System

## Overview

The app now features a cohesive, professional color palette that complements the existing green accents while adding depth and visual hierarchy through carefully selected complementary colors.

## Color Palette

### Primary Colors (Green Accents)

- **Primary (`#10b981`)**: Main emerald green for primary actions and highlights
- **Primary Light (`#d1fae5`)**: Light emerald for backgrounds and hover states
- **Primary Dark (`#059669`)**: Dark emerald for active/focus states
- **Primary Hover (`#22c55e`)**: Bright emerald for interactive elements
- **Primary Darker (`#16a34a`)**: Darker shade for pressed/active states

### Secondary Colors (Blue)

- **Secondary (`#3b82f6`)**: Bright blue for secondary actions
- **Secondary Light (`#dbeafe`)**: Light blue for backgrounds
- **Secondary Dark (`#1e40af`)**: Dark blue for text
- **Secondary Hover (`#2563eb`)**: Medium blue for hover states

### Neutral Colors (Grays)

- **Gray 50 (`#f9fafb`)**: Almost white, for backgrounds
- **Gray 100 (`#f3f4f6`)**: Very light gray for hover states
- **Gray 200 (`#e5e7eb`)**: Light gray for borders
- **Gray 300 (`#d1d5db`)**: Gray for secondary borders
- **Gray 400 (`#9ca3af`)**: Medium gray for secondary text
- **Gray 500 (`#6b7280`)**: Gray for tertiary text
- **Gray 600 (`#4b5563`)**: Dark gray for labels
- **Gray 700 (`#374151`)**: Darker gray
- **Gray 800 (`#1f2937`)**: Very dark gray for main text
- **Gray 900 (`#111827`)**: Almost black

### Semantic Colors

- **Success (`#10b981`)**: Green (uses primary color)
- **Warning (`#f59e0b`)**: Amber for warnings
- **Error (`#ef4444`)**: Red for errors and destructive actions
- **Error Dark (`#dc2626`)**: Dark red for hover states
- **Info (`#3b82f6`)**: Blue for informational messages

### Text Colors

- **Text Primary (`#1f2937`)**: Dark gray for main body text
- **Text Secondary (`#6b7280`)**: Medium gray for secondary text
- **Text Muted (`#9ca3af`)**: Light gray for disabled/muted text
- **Text Inverse (`#ffffff`)**: White for inverse/light text

### Background Colors

- **Background White (`#ffffff`)**: Pure white for cards and containers
- **Background Light (`#f9fafb`)**: Off-white for page backgrounds
- **Background Dark (`#111827`)**: Very dark for dark mode (future)

### Gradients

```css
gradientPrimary: linear-gradient(135deg, #10b981 0%, #059669 100%)
gradientSecondary: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)
gradientWarm: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)
gradientCool: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
gradientLight: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)
```

### Shadows

- **Shadow (`0 1px 3px 0 rgba(0, 0, 0, 0.1)`)**: Small shadow for subtle depth
- **Shadow MD (`0 4px 6px -1px rgba(0, 0, 0, 0.1)`)**: Medium shadow
- **Shadow LG (`0 10px 15px -3px rgba(0, 0, 0, 0.1)`)**: Large shadow for cards
- **Shadow XL (`0 20px 25px -5px rgba(0, 0, 0, 0.1)`)**: Extra large for modals

### Overlays

- **Overlay (`rgba(0, 0, 0, 0.5)`)**: Standard overlay (50% opacity)
- **Overlay Light (`rgba(0, 0, 0, 0.25)`)**: Light overlay (25% opacity)

## Usage

All colors are centralized in `src/constants/colors.ts` and exported as the `COLORS` object. This ensures consistency across the application.

### Importing Colors

```typescript
import { COLORS } from '../../constants/colors';

// Use in styled components
const Button = styled.button`
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	box-shadow: ${COLORS.shadowMd};
`;
```

## Where Colors Are Applied

### Navigation

- **TopNav**: Gradient primary title, primary navigation items
- **Background**: Light gradient with subtle blue accent
- **Hover States**: Primary light background

### Forms & Inputs

- **Input Borders**: Gray 200 (default), Primary (focus)
- **Input Background**: Gray 50 (default), White (focus)
- **Labels**: Text Primary
- **Placeholders**: Text Muted

### Buttons

- **Primary Buttons**: Gradient Primary with shadows
- **Hover**: Gradient Primary Dark with larger shadow
- **Disabled**: Gray 300
- **Secondary Buttons**: Gray 100 background

### Cards & Containers

- **Background**: White
- **Borders**: Gray 200
- **Shadows**: Shadow LG for emphasis

### Messages

- **Success**: Green (`#10b981`) with light green background (`#f0fdf4`)
- **Error**: Red (`#ef4444`) with light red background (`#fef2f2`)
- **Warning**: Amber with light amber background
- **Info**: Blue with light blue background

### Loading States

- **Spinner**: Primary color for animated border
- **Overlay**: Light semi-transparent overlay

## Design Principles

1. **Hierarchy**: Primary color for most important actions, secondary for supporting actions
2. **Accessibility**: Sufficient contrast ratios (WCAG AA compliant)
3. **Consistency**: Centralized color system prevents inconsistencies
4. **Professional**: Emerald green with blue accents creates a modern, trustworthy feel
5. **Usability**: Clear visual feedback through color changes on interaction

## Future Enhancements

- [ ] Dark mode support with inverted color scheme
- [ ] Color customization for white-label deployments
- [ ] Additional semantic colors (success variants, warning variants)
- [ ] Animation timing functions alongside color system
