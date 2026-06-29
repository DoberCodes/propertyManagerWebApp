export const isLinkedFamilyMember = (
	user?: { id?: string; accountId?: string; isAccountOwner?: boolean } | null,
): boolean => {
	const userId = String(user?.id || '').trim();
	const accountId = String(user?.accountId || '').trim();

	return (
		!!userId &&
		!!accountId &&
		accountId !== userId &&
		user?.isAccountOwner !== true
	);
};

export const shouldBypassOnboarding = (
	user?:
		| {
				id?: string;
				accountId?: string;
				isAccountOwner?: boolean;
				isTeamMemberAccount?: boolean;
		  }
		| null,
): boolean => user?.isTeamMemberAccount === true || isLinkedFamilyMember(user);
