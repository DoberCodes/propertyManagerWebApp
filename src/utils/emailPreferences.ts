import { User } from '../Redux/Slices/userSlice';

export type EmailPreferences = NonNullable<User['emailPreferences']>;
type TeamMemberReportsPreference = NonNullable<
	EmailPreferences['teamMemberReports']
>;

const DEFAULT_TEAM_MEMBER_REPORTS: TeamMemberReportsPreference = {
	enabled: false,
	frequency: 'weekly',
	teamMemberIds: [],
};

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
	monthlyDigest: true,
	taskReminders: false,
	propertyInsights: false,
	seasonalGuidance: false,
	monthlyDigestFamilyRecipients: false,
	teamMemberReports: DEFAULT_TEAM_MEMBER_REPORTS,
};

export const mergeEmailPreferences = (
	preferences?: User['emailPreferences'],
): EmailPreferences => {
	const teamMemberReports = {
		...DEFAULT_TEAM_MEMBER_REPORTS,
		...(preferences?.teamMemberReports || {}),
		enabled:
			preferences?.teamMemberReports?.enabled ??
			DEFAULT_TEAM_MEMBER_REPORTS.enabled,
		frequency:
			preferences?.teamMemberReports?.frequency ||
			DEFAULT_TEAM_MEMBER_REPORTS.frequency,
		teamMemberIds:
			preferences?.teamMemberReports?.teamMemberIds ||
			DEFAULT_TEAM_MEMBER_REPORTS.teamMemberIds,
	};

	return {
		...DEFAULT_EMAIL_PREFERENCES,
		...(preferences || {}),
		teamMemberReports,
	};
};
