import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../config/firebaseFunctions';

export const ADMIN_SESSION_STORAGE_KEY = 'maintley_admin_session_token';

const getAdminCallable = async <RequestData, ResponseData>(name: string) => {
	const functions = await getFirebaseFunctions();
	return httpsCallable<RequestData, ResponseData>(functions, name);
};

export type AdminUser = {
	id: string;
	username: string;
	displayName: string;
	email: string | null;
	roles: string[];
};

export type AdminFeedbackTicket = {
	id: string;
	type?: 'feedback' | 'feature_request' | 'bug_report' | string;
	subject?: string;
	message?: string;
	userEmail?: string;
	userName?: string;
	status?: string;
	publicStatus?: string;
	ticketNumber?: string;
	linkedPrimaryTicketId?: string;
	linkedPrimaryTicketNumber?: string;
	isLinkedPrimary?: boolean;
	isLinkedChild?: boolean;
	linkedTicketIds?: string[];
	linkedTicketNumbers?: string[];
	createdAt?: string;
	updatedAt?: string;
	resolutionNotes?: string;
	confirmationEmailStatus?: string;
	adminNotes?: Array<{
		note: string;
		createdAt: string;
		adminUserId?: string;
		adminUsername?: string;
		noteType?: 'internal' | 'maintley_update' | string;
		visibility?: 'internal' | 'customer' | string;
	}>;
	submissionContext?: {
		userId?: string;
		propertyId?: string | null;
		pageUrl?: string | null;
		browser?: string | null;
		deviceType?: 'mobile' | 'desktop' | string;
		appVersion?: string | null;
		timestamp?: string | null;
	};
	[key: string]: unknown;
};

export type AdminPortalUserRecord = {
	id: string;
	email: string | null;
	accountId?: string | null;
	firstName: string;
	lastName: string;
	displayName: string;
	maintleyRole: string;
	accountStatus?: 'active' | 'disabled' | string;
	propertyCount?: number;
	subscriptionPlan: string;
	subscriptionStatus: string;
	lastActiveAt?: string | null;
	lastLoginAt?: string | null;
	createdAt?: string;
	updatedAt?: string;
	[key: string]: unknown;
};

export type AdminPortalUserTroubleshootingDetails = {
	profile: {
		id: string;
		email: string | null;
		firstName: string;
		lastName: string;
		displayName: string;
		maintleyRole: string;
		accountStatus?: 'active' | 'disabled' | string;
		accountId?: string | null;
		subscriptionPlan: string;
		subscriptionStatus: string;
		hasStripeSubscription?: boolean;
		stripeCustomerId?: string | null;
		stripeSubscriptionId?: string | null;
		stripeCustomerUrl?: string | null;
		stripeSubscription?: {
			id?: string | null;
			status?: string | null;
			planLabel?: string | null;
			priceId?: string | null;
			productId?: string | null;
			productName?: string | null;
			lookupKey?: string | null;
			interval?: string | null;
			maintleyPlan?: string | null;
			cancelAtPeriodEnd?: boolean;
			currentPeriodEnd?: string | null;
			trialEnd?: string | null;
			error?: string | null;
		} | null;
		inviteCode?: string | null;
		lastLoginAt?: string;
		lastActivityAt?: string;
		createdAt?: string;
		updatedAt?: string;
	};
	metrics: {
		propertyCount: number;
		systemCount: number;
		taskCount: number;
		documentCount?: number;
		teamMemberCount?: number;
		supportRequestCount: number;
		supportAttachmentStorageBytes: number;
		recentErrorCount?: number;
		openTicketCount?: number;
	};
	access?: {
		basePlan: string;
		effectiveBundles: string[];
		activeGrantCount: number;
		grants: Array<{
			grantId: string;
			programId: string;
			state: string;
			kind: string;
			bundleId?: string | null;
			startsAt?: string | null;
			endsAt?: string | null;
			source?: string;
		}>;
		homeownerPlusTrial?: {
			state: string;
			startsAt: string;
			endsAt: string;
		} | null;
		timeline: Array<{
			id: string;
			action: string;
			reason: string;
			createdAt?: string | null;
			grantId?: string | null;
			programId?: string | null;
		}>;
	};
	recentSupportRequests: Array<{
		id: string;
		ticketNumber?: string | null;
		type: string;
		subject: string;
		status: string;
		createdAt?: string;
	}>;
	recentErrors: Array<{
		id: string;
		ticketNumber?: string | null;
		subject: string;
		status: string;
		pageUrl?: string | null;
		appVersion?: string | null;
		createdAt?: string;
	}>;
	recentNotifications: Array<{
		id: string;
		title: string;
		message?: string;
		status?: string | null;
		createdAt?: string;
	}>;
	recentActivity: Array<{
		source: string;
		description: string;
		createdAt?: string;
	}>;
};

export type AdminBillingCoupon = {
	id: string;
	code: string;
	active: boolean;
	status: 'active' | 'expired' | 'inactive' | string;
	couponId?: string | null;
	name?: string;
	percentOff?: number | null;
	amountOff?: number | null;
	currency?: string | null;
	duration?: 'once' | 'repeating' | 'forever' | string | null;
	durationMonths?: number | null;
	maxRedemptions?: number | null;
	redeemedCount?: number | null;
	expiresAt?: string | null;
	appliesToPlan?: string;
	appliesToBillingCycle?: string;
	internalNote?: string;
	createdAt?: string | null;
};

export type AdminPortalAuditLogRecord = {
	id: string;
	category?: string | null;
	action?: string | null;
	targetType?: string | null;
	targetId?: string | null;
	performedBy?: {
		uid?: string | null;
		displayName?: string | null;
		email?: string | null;
	} | null;
	before?: Record<string, unknown> | null;
	after?: Record<string, unknown> | null;
	metadata?: Record<string, unknown> | null;
	createdAt?: string | null;
};

export const saveAdminSessionToken = (token: string): void => {
	localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, token);
};

export const getAdminSessionToken = (): string | null => {
	const token = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
	return token && token.trim() ? token : null;
};

export const clearAdminSessionToken = (): void => {
	localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
};

export const adminPortalLogin = async (
	username: string,
	password: string,
): Promise<{ sessionToken: string; expiresAtMillis: number; adminUser: AdminUser }> => {
	const callable = await getAdminCallable<
		{ username: string; password: string },
		{ sessionToken: string; expiresAtMillis: number; adminUser: AdminUser }
	>('adminPortalLogin');

	const result = await callable({ username, password });
	return result.data;
};

export const validateAdminSession = async (
	sessionToken: string,
): Promise<{ valid: true; adminUser: AdminUser }> => {
	const callable = await getAdminCallable<
		{ sessionToken: string },
		{ valid: true; adminUser: AdminUser }
	>('validateAdminPortalSession');

	const result = await callable({ sessionToken });
	return result.data;
};

export const adminPortalLogout = async (sessionToken: string): Promise<void> => {
	const callable = await getAdminCallable<{ sessionToken: string }, { success: true }>(
		'adminPortalLogout',
	);
	await callable({ sessionToken });
};

export const adminPortalResetPassword = async (params: {
	sessionToken: string;
	currentPassword: string;
	newPassword: string;
}): Promise<{ success: true; message: string }> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; currentPassword: string; newPassword: string },
		{ success: true; message: string }
	>('adminPortalResetPassword');

	const result = await callable(params);
	return result.data;
};

export const listAdminFeedbackTickets = async (params: {
	sessionToken: string;
	status?: string;
	type?: string;
	limit?: number;
}): Promise<AdminFeedbackTicket[]> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; status?: string; type?: string; limit?: number },
		{ tickets: AdminFeedbackTicket[] }
	>('listFeedbackAdminTickets');

	const result = await callable(params);
	return result.data.tickets || [];
};

export const listAdminPortalUsers = async (params: {
	sessionToken: string;
	query?: string;
	role?: string;
	filter?: string;
	limit?: number;
}): Promise<AdminPortalUserRecord[]> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; query?: string; role?: string; filter?: string; limit?: number },
		{ users: AdminPortalUserRecord[] }
	>('listAdminPortalUsers');

	const result = await callable(params);
	return result.data.users || [];
};

export const listAdminPortalAuditLogs = async (params: {
	sessionToken: string;
	limit?: number;
	query?: string;
	action?: string;
	targetId?: string;
}): Promise<AdminPortalAuditLogRecord[]> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; limit?: number; query?: string; action?: string; targetId?: string },
		{ logs: AdminPortalAuditLogRecord[] }
	>('listAdminPortalAuditLogs');

	const result = await callable(params);
	return result.data.logs || [];
};

export const getAdminPortalUserTroubleshootingDetails = async (params: {
	sessionToken: string;
	userId: string;
}): Promise<AdminPortalUserTroubleshootingDetails> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; userId: string },
		AdminPortalUserTroubleshootingDetails
	>('getAdminPortalUserTroubleshootingDetails');

	const result = await callable(params);
	return result.data;
};

export const adminPortalManageUserSubscription = async (params: {
	sessionToken: string;
	userId: string;
	action: 'change_plan' | 'extend_trial' | 'cancel_subscription';
	planId?: string;
	trialDays?: number;
	syncStripe?: boolean;
}): Promise<{
	success: true;
	subscriptionPlan: string;
	subscriptionStatus: string;
	trialEndsAt: number | null;
	stripeUpdated: boolean;
}> => {
	const callable = await getAdminCallable<
		{
			sessionToken: string;
			userId: string;
			action: 'change_plan' | 'extend_trial' | 'cancel_subscription';
			planId?: string;
			trialDays?: number;
			syncStripe?: boolean;
		},
		{
			success: true;
			subscriptionPlan: string;
			subscriptionStatus: string;
			trialEndsAt: number | null;
			stripeUpdated: boolean;
		}
	>('adminPortalManageUserSubscription');

	const result = await callable(params);
	return result.data;
};

export const adminPortalApplyUserBillingActions = async (params: {
	sessionToken: string;
	userId: string;
	planId?: string;
	billingCycle?: 'month' | 'year';
	trialDays?: number;
	promoCode?: string;
	syncStripe?: boolean;
	successUrl?: string;
	cancelUrl?: string;
}): Promise<{
	success: true;
	subscriptionPlan: string;
	subscriptionStatus: string;
	trialEndsAt: number | null;
	stripeUpdated: boolean;
	checkoutUrl?: string | null;
	checkoutSessionId?: string | null;
	stripeCustomerId?: string | null;
	applied: {
		planChanged: boolean;
		trialExtended: boolean;
		couponApplied: boolean;
		checkoutLinkCreated: boolean;
	};
}> => {
	const callable = await getAdminCallable<
		{
			sessionToken: string;
			userId: string;
			planId?: string;
			billingCycle?: 'month' | 'year';
			trialDays?: number;
			promoCode?: string;
			syncStripe?: boolean;
			successUrl?: string;
			cancelUrl?: string;
		},
		{
			success: true;
			subscriptionPlan: string;
			subscriptionStatus: string;
			trialEndsAt: number | null;
			stripeUpdated: boolean;
			checkoutUrl?: string | null;
			checkoutSessionId?: string | null;
			stripeCustomerId?: string | null;
			applied: {
				planChanged: boolean;
				trialExtended: boolean;
				couponApplied: boolean;
				checkoutLinkCreated: boolean;
			};
		}
	>('adminPortalApplyUserBillingActions');

	const result = await callable(params);
	return result.data;
};

export const adminPortalRefreshUserSubscriptionFromStripe = async (params: {
	sessionToken: string;
	userId: string;
}): Promise<{
	success: true;
	subscriptionPlan: string;
	subscriptionStatus: string;
	trialEndsAt: number | null;
	stripeCustomerId?: string | null;
	stripeSubscriptionId?: string | null;
	matchedBy: 'stripe_subscription_id' | 'stripe_customer_id' | 'email' | 'none' | string;
	candidateCount: number;
}> => {
	const callable = await getAdminCallable<
		{
			sessionToken: string;
			userId: string;
		},
		{
			success: true;
			subscriptionPlan: string;
			subscriptionStatus: string;
			trialEndsAt: number | null;
			stripeCustomerId?: string | null;
			stripeSubscriptionId?: string | null;
			matchedBy: 'stripe_subscription_id' | 'stripe_customer_id' | 'email' | 'none' | string;
			candidateCount: number;
		}
	>('adminPortalRefreshUserSubscriptionFromStripe');

	const result = await callable(params);
	return result.data;
};

export const adminPortalCreateBillingCoupon = async (params: {
	sessionToken: string;
	code: string;
	name?: string;
	discountType: 'percent' | 'amount';
	percentOff?: number;
	amountOffCents?: number;
	duration: 'once' | 'repeating' | 'forever';
	durationMonths?: number;
	maxRedemptions?: number;
	expiresAt?: string;
	appliesToPlan?: string;
	appliesToBillingCycle?: 'month' | 'year';
	internalNote?: string;
}): Promise<{ success: true; coupon: AdminBillingCoupon }> => {
	const callable = await getAdminCallable<
		{
			sessionToken: string;
			code: string;
			name?: string;
			discountType: 'percent' | 'amount';
			percentOff?: number;
			amountOffCents?: number;
			duration: 'once' | 'repeating' | 'forever';
			durationMonths?: number;
			maxRedemptions?: number;
			expiresAt?: string;
			appliesToPlan?: string;
			appliesToBillingCycle?: 'month' | 'year';
			internalNote?: string;
		},
		{ success: true; coupon: AdminBillingCoupon }
	>('adminPortalCreateBillingCoupon');

	const result = await callable(params);
	return result.data;
};

export const adminPortalListBillingCoupons = async (params: {
	sessionToken: string;
	limit?: number;
}): Promise<AdminBillingCoupon[]> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; limit?: number },
		{ coupons: AdminBillingCoupon[] }
	>('adminPortalListBillingCoupons');

	const result = await callable(params);
	return result.data.coupons || [];
};

export const adminPortalCreateCheckoutLinkWithCoupon = async (params: {
	sessionToken: string;
	userId: string;
	planId: string;
	billingCycle: 'month' | 'year';
	promoCode: string;
	successUrl?: string;
	cancelUrl?: string;
}): Promise<{
	success: true;
	checkoutUrl: string;
	sessionId: string;
	stripeCustomerId: string;
}> => {
	const callable = await getAdminCallable<
		{
			sessionToken: string;
			userId: string;
			planId: string;
			billingCycle: 'month' | 'year';
			promoCode: string;
			successUrl?: string;
			cancelUrl?: string;
		},
		{
			success: true;
			checkoutUrl: string;
			sessionId: string;
			stripeCustomerId: string;
		}
	>('adminPortalCreateCheckoutLinkWithCoupon');

	const result = await callable(params);
	return result.data;
};

export const updateAdminFeedbackTicketStatus = async (params: {
	sessionToken: string;
	ticketId: string;
	status: string;
	internalNote?: string;
	resolutionNotes?: string;
	type?: string;
}): Promise<void> => {
	const callable = await getAdminCallable<
		{
			sessionToken: string;
			ticketId: string;
			status: string;
			internalNote?: string;
			resolutionNotes?: string;
			type?: string;
		},
		{ success: true }
	>('updateFeedbackAdminTicketStatus');

	await callable(params);
};

export const linkAdminFeedbackTickets = async (params: {
	sessionToken: string;
	sourceTicketId: string;
	targetTicketRef: string;
}): Promise<{ success: true; linkedTicketIds: string[] }> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; sourceTicketId: string; targetTicketRef: string },
		{ success: true; linkedTicketIds: string[] }
	>('linkFeedbackAdminTickets');

	const result = await callable(params);
	return result.data;
};

export const unlinkAdminFeedbackTicket = async (params: {
	sessionToken: string;
	ticketId: string;
}): Promise<{ success: true; parentTicketId?: string }> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; ticketId: string },
		{ success: true; parentTicketId?: string }
	>('unlinkFeedbackAdminTicket');

	const result = await callable(params);
	return result.data;
};

export const deleteAdminFeedbackParentTicket = async (params: {
	sessionToken: string;
	ticketId: string;
}): Promise<{ success: true }> => {
	const callable = await getAdminCallable<
		{ sessionToken: string; ticketId: string },
		{ success: true }
	>('deleteFeedbackAdminParentTicket');

	const result = await callable(params);
	return result.data;
};

