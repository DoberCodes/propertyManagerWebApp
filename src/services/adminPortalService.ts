import { httpsCallable } from 'firebase/functions';
import { functions as cloudFunctions } from '../config/firebase';

export const ADMIN_SESSION_STORAGE_KEY = 'maintley_admin_session_token';

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
	subscriptionPlan: string;
	subscriptionStatus: string;
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
		accountId?: string | null;
		subscriptionPlan: string;
		subscriptionStatus: string;
		createdAt?: string;
		updatedAt?: string;
	};
	metrics: {
		propertyCount: number;
		systemCount: number;
		taskCount: number;
		supportRequestCount: number;
		supportAttachmentStorageBytes: number;
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
	const callable = httpsCallable<
		{ username: string; password: string },
		{ sessionToken: string; expiresAtMillis: number; adminUser: AdminUser }
	>(cloudFunctions, 'adminPortalLogin');

	const result = await callable({ username, password });
	return result.data;
};

export const validateAdminSession = async (
	sessionToken: string,
): Promise<{ valid: true; adminUser: AdminUser }> => {
	const callable = httpsCallable<
		{ sessionToken: string },
		{ valid: true; adminUser: AdminUser }
	>(cloudFunctions, 'validateAdminPortalSession');

	const result = await callable({ sessionToken });
	return result.data;
};

export const adminPortalLogout = async (sessionToken: string): Promise<void> => {
	const callable = httpsCallable<{ sessionToken: string }, { success: true }>(
		cloudFunctions,
		'adminPortalLogout',
	);
	await callable({ sessionToken });
};

export const adminPortalResetPassword = async (params: {
	sessionToken: string;
	currentPassword: string;
	newPassword: string;
}): Promise<{ success: true; message: string }> => {
	const callable = httpsCallable<
		{ sessionToken: string; currentPassword: string; newPassword: string },
		{ success: true; message: string }
	>(cloudFunctions, 'adminPortalResetPassword');

	const result = await callable(params);
	return result.data;
};

export const listAdminFeedbackTickets = async (params: {
	sessionToken: string;
	status?: string;
	type?: string;
	limit?: number;
}): Promise<AdminFeedbackTicket[]> => {
	const callable = httpsCallable<
		{ sessionToken: string; status?: string; type?: string; limit?: number },
		{ tickets: AdminFeedbackTicket[] }
	>(cloudFunctions, 'listFeedbackAdminTickets');

	const result = await callable(params);
	return result.data.tickets || [];
};

export const listAdminPortalUsers = async (params: {
	sessionToken: string;
	query?: string;
	role?: string;
	limit?: number;
}): Promise<AdminPortalUserRecord[]> => {
	const callable = httpsCallable<
		{ sessionToken: string; query?: string; role?: string; limit?: number },
		{ users: AdminPortalUserRecord[] }
	>(cloudFunctions, 'listAdminPortalUsers');

	const result = await callable(params);
	return result.data.users || [];
};

export const getAdminPortalUserTroubleshootingDetails = async (params: {
	sessionToken: string;
	userId: string;
}): Promise<AdminPortalUserTroubleshootingDetails> => {
	const callable = httpsCallable<
		{ sessionToken: string; userId: string },
		AdminPortalUserTroubleshootingDetails
	>(cloudFunctions, 'getAdminPortalUserTroubleshootingDetails');

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
	const callable = httpsCallable<
		{
			sessionToken: string;
			ticketId: string;
			status: string;
			internalNote?: string;
			resolutionNotes?: string;
			type?: string;
		},
		{ success: true }
	>(cloudFunctions, 'updateFeedbackAdminTicketStatus');

	await callable(params);
};

export const linkAdminFeedbackTickets = async (params: {
	sessionToken: string;
	sourceTicketId: string;
	targetTicketRef: string;
}): Promise<{ success: true; linkedTicketIds: string[] }> => {
	const callable = httpsCallable<
		{ sessionToken: string; sourceTicketId: string; targetTicketRef: string },
		{ success: true; linkedTicketIds: string[] }
	>(cloudFunctions, 'linkFeedbackAdminTickets');

	const result = await callable(params);
	return result.data;
};

export const unlinkAdminFeedbackTicket = async (params: {
	sessionToken: string;
	ticketId: string;
}): Promise<{ success: true; parentTicketId?: string }> => {
	const callable = httpsCallable<
		{ sessionToken: string; ticketId: string },
		{ success: true; parentTicketId?: string }
	>(cloudFunctions, 'unlinkFeedbackAdminTicket');

	const result = await callable(params);
	return result.data;
};

export const deleteAdminFeedbackParentTicket = async (params: {
	sessionToken: string;
	ticketId: string;
}): Promise<{ success: true }> => {
	const callable = httpsCallable<
		{ sessionToken: string; ticketId: string },
		{ success: true }
	>(cloudFunctions, 'deleteFeedbackAdminParentTicket');

	const result = await callable(params);
	return result.data;
};
