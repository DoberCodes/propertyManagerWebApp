export interface WelcomeEmailEligibility {
	isTeamMemberAccount?: boolean;
	registrationStatus?: string;
	welcomeEmailSentAt?: unknown;
}

export const shouldSendWelcomeSignupEmail = (
	current: WelcomeEmailEligibility,
	previous: WelcomeEmailEligibility | null,
	authEmailVerified: boolean,
): boolean =>
	current.isTeamMemberAccount !== true &&
	!current.welcomeEmailSentAt &&
	current.registrationStatus === 'active' &&
	previous?.registrationStatus !== 'active' &&
	authEmailVerified;
