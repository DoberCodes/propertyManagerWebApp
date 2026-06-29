/**
 * Maintley design tokens.
 *
 * Keep these aliases stable. A large portion of the app imports semantic names
 * such as `primary`, `bgLight`, and `textPrimary`, while the brand palette below
 * defines the visual system those aliases map to.
 */

export const COLORS = {
	// Maintley Brand Palette
	maintleyGreen: '#047857',
	maintleyAccent: '#3FCC7C',
	maintleyPressed: '#036151',
	maintleyHover: '#009E71',
	slate: '#1F2937',
	canvas: '#FAFAF8',
	white: '#FFFFFF',

	// Primary Green Actions
	primary: '#047857',
	primaryLight: 'rgba(63, 204, 124, 0.16)',
	primaryDark: '#036151',
	primaryHover: '#009E71',
	primaryDarker: '#036151',

	// Secondary Blue - for secondary actions and highlights
	secondary: '#3b82f6', // Bright blue
	secondaryLight: '#dbeafe', // Light blue
	secondaryDark: '#1e40af', // Dark blue
	secondaryHover: '#2563eb', // Medium blue

	// Neutral Grays - for text, borders, backgrounds
	gray50: '#FAFAF8', // Canvas
	gray100: '#f3f4f2', // Warm light gray
	gray200: '#e5e7eb', // Light gray
	gray300: '#d1d5db', // Gray
	gray400: '#9ca3af', // Medium gray
	gray500: '#6b7280', // Gray
	gray600: '#4b5563', // Dark gray
	gray700: '#374151', // Darker gray
	gray800: '#1F2937', // Slate
	gray900: '#111827', // Almost black

	// Semantic Colors
	success: '#3FCC7C', // Maintley Accent for success, checkmarks, and highlights
	successLight: 'rgba(63, 204, 124, 0.16)',
	successDark: '#036151',
	warning: '#f59e0b', // Amber
	warningLight: '#fef3c7', // Light amber background
	warningDark: '#d97706', // Dark amber
	error: '#ef4444', // Red
	errorLight: '#fee2e2', // Light red background
	errorDark: '#dc2626', // Dark red
	info: '#3b82f6', // Blue
	infoLight: '#dbeafe', // Light blue background
	infoDark: '#1e40af', // Dark blue

	// Alert Colors (for status messages)
	alertError: '#c62828', // Error text
	alertErrorBg: '#ffebee', // Error background
	alertSuccess: '#2e7d32', // Success text
	alertSuccessBg: '#e8f5e9', // Success background
	alertWarning: '#f57c00', // Warning text
	alertWarningBg: '#fff3e0', // Warning background
	alertInfo: '#1565c0', // Info text
	alertInfoBg: '#e3f2fd', // Info background

	// Backgrounds
	bgWhite: '#FFFFFF',
	bgLight: '#FAFAF8',
	bgDark: '#1F2937',

	// Borders
	border: '#e5e7eb',
	borderLight: '#f3f4f6',
	borderDark: '#9ca3af',

	// Text
	textPrimary: '#1F2937', // Slate for main text
	textSecondary: '#6b7280', // Medium gray for secondary text
	textMuted: '#9ca3af', // Light gray for muted text
	textInverse: '#FFFFFF', // White for inverse text

	// Gradients
	gradientPrimary: 'linear-gradient(135deg, #047857 0%, #009E71 100%)',
	gradientWarm: 'linear-gradient(135deg, #047857 0%, #009E71 100%)',
	gradientCool: 'linear-gradient(135deg, #047857 0%, #009E71 100%)',
	gradientLight: 'linear-gradient(135deg, #FAFAF8 0%, #f3f4f2 100%)',

	// Shadows
	shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
	shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
	shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
	shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',

	// Overlay
	overlay: 'rgba(0, 0, 0, 0.5)',
	overlayLight: 'rgba(0, 0, 0, 0.25)',
};

export default COLORS;
