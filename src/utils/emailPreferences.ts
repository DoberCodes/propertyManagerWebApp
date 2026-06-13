import { User } from '../Redux/Slices/userSlice';

export type EmailPreferences = NonNullable<User['emailPreferences']>;

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
	monthlyDigest: true,
	taskReminders: false,
	propertyInsights: false,
	seasonalGuidance: false,
};

export const mergeEmailPreferences = (
	preferences?: User['emailPreferences'],
): EmailPreferences => ({
	...DEFAULT_EMAIL_PREFERENCES,
	...(preferences || {}),
});
