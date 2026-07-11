import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { callFirebaseFunction } from '../../config/firebaseFunctions';

// Types
export type SharePermission = 'co-owner' | 'admin' | 'viewer';

export interface CompletionFile {
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

export interface MyFeedbackAdminNote {
	note: string;
	createdAt?: string;
	date?: string;
	noteType?: string;
	visibility?: string;
	adminUserId?: string;
	adminUsername?: string;
}

export interface MyFeedbackTicket {
	id: string;
	ticketNumber?: string;
	type: 'feedback' | 'feature_request' | 'bug_report' | string;
	subject: string;
	message: string;
	status: string;
	publicStatus: string;
	emailDispatchStatus?: string;
	createdAt?: string;
	updatedAt?: string;
	closedAt?: string;
	adminNotes?: MyFeedbackAdminNote[];
	linkedTicketIds?: string[];
	linkedTicketNumbers?: string[];
	attachments?: Array<{
		filename?: string;
		attachmentUrl?: string;
		path?: string;
	}>;
}

// Helper to recursively sanitize Firestore data, converting Timestamp objects to ISO strings
const sanitizeFirestoreData = (data: any): any => {
	if (data === undefined || data === null) return data;
	if (Array.isArray(data)) return data.map(sanitizeFirestoreData);
	if (typeof data === 'object') {
		// Firestore Timestamp object has a toDate() method
		if (typeof (data as any).toDate === 'function') {
			return (data as any).toDate().toISOString();
		}
		const out: any = {};
		for (const [k, v] of Object.entries(data)) {
			out[k] = sanitizeFirestoreData(v as any);
		}
		return out;
	}
	return data;
};

// Utility function to clean objects of undefined values for Firebase
// const cleanObjectForFirebase = (obj: any): any => {
// 	if (obj === null || obj === undefined) return obj;
// 	if (typeof obj !== 'object') return obj;
// 	if (Array.isArray(obj)) {
// 		return obj.map(cleanObjectForFirebase).filter((item) => item !== undefined);
// 	}

// 	const cleaned: any = {};
// 	for (const [key, value] of Object.entries(obj)) {
// 		const cleanedValue = cleanObjectForFirebase(value);
// 		if (cleanedValue !== undefined) {
// 			cleaned[key] = cleanedValue;
// 		}
// 	}
// 	return cleaned;
// };

// Helper function to convert Firestore docs to data with IDs and sanitized fields
export const docToData = (docSnapshot: any) => {
	if (!docSnapshot.exists()) return null;
	const data = sanitizeFirestoreData(docSnapshot.data());
	// Ensure the ID from the document reference is used, not from the data
	// Remove any 'id' field from data to prevent it from overriding the document ID
	const { id: _, ...dataWithoutId } = data;
	return { id: docSnapshot.id, ...dataWithoutId };
};

export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fakeBaseQuery(),
	tagTypes: [
		'PropertyGroups',
		'Properties',
		'TeamGroups',
		'TeamMembers',
		'Tasks',
		'Devices',
		'Suites',
		'Units',
		'Favorites',
		'UserInvitations',
		'Notifications',
		'TenantProfiles',
		'TenantInvitationCodes',
		'TeamMemberInvitationCodes',
		'MaintenanceHistory',
		'Contractors',
		'MaintenanceEvents',
		'PropertyScanSnapshots',
		'StorageUsage',
	],
	endpoints: (builder) => ({
		// App Version
		getAppVersion: builder.query<
			{
				version: string;
				releaseDate?: string;
				releaseNotes?: string;
				apkUrl?: string;
				releaseUrl?: string;
			},
			void
		>({
			async queryFn() {
				try {
					const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));

					if (!versionDoc.exists()) {
						// Return default version if not configured yet
						return {
							data: {
								version: '1.0.0',
								releaseDate: new Date().toISOString(),
								releaseNotes: 'Initial release',
							},
						};
					}

					const data = versionDoc.data();
					return {
						data: {
							version: data.version || '1.0.0',
							releaseDate: data.releaseDate,
							releaseNotes: data.releaseNotes,
							apkUrl: data.apkUrl,
							releaseUrl: data.releaseUrl,
						},
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		// Feedback (server-side callable flow to avoid client Firestore blocker issues)
		submitFeedback: builder.mutation<
			{ id: string; ticketNumber?: string; message: string },
			{
				type: 'feedback' | 'feature_request' | 'bug_report';
				subject: string;
				message: string;
				userId?: string;
				userEmail?: string;
				userName?: string;
				bugReportContext?: {
					userId?: string;
					propertyId?: string;
					pageUrl: string;
					browser: string;
					deviceType: 'mobile' | 'desktop';
					appVersion: string;
					timestamp: string;
				};
				attachments?: Array<{
					filename: string;
					contentBase64: string;
					contentType: string;
					sizeBytes: number;
				}>;
			}
		>({
			async queryFn(feedbackData) {
				try {
					const result = await callFirebaseFunction<
						{
							type: 'feedback' | 'feature_request' | 'bug_report';
							subject: string;
							message: string;
							userEmail?: string;
							userName?: string;
							bugReportContext?: {
								userId?: string;
								propertyId?: string;
								pageUrl: string;
								browser: string;
								deviceType: 'mobile' | 'desktop';
								appVersion: string;
								timestamp: string;
							};
							attachments?: Array<{
								filename: string;
								contentBase64: string;
								contentType: string;
								sizeBytes: number;
							}>;
						},
						{ id: string; ticketNumber?: string; message: string }
					>('submitFeedback', {
						type: feedbackData.type,
						subject: feedbackData.subject,
						message: feedbackData.message,
						userEmail: feedbackData.userEmail,
						userName: feedbackData.userName,
						bugReportContext: feedbackData.bugReportContext,
						attachments: feedbackData.attachments,
					});

					return {
						data: {
							id: result.data.id,
							ticketNumber: result.data.ticketNumber,
							message: result.data.message || 'Feedback submitted successfully',
						},
					};
				} catch (error: any) {
					const rawMessage = String(error?.message || '').toLowerCase();
					const isBlockedByClient =
						rawMessage.includes('err_blocked_by_client') ||
						rawMessage.includes('blocked by client') ||
						rawMessage.includes('failed to fetch') ||
						rawMessage.includes('network request failed');

					if (isBlockedByClient) {
						return {
							error:
								'Your browser blocked the feedback request. Please disable ad/tracker blocking for this site (and firestore.googleapis.com) and try again.',
						};
					}

					return { error: error.message || 'Failed to submit feedback' };
				}
			},
		}),

		getMyFeedbackTickets: builder.query<
			MyFeedbackTicket[],
			{ limit?: number } | void
		>({
			async queryFn(args) {
				try {
					const result = await callFirebaseFunction<
						{ limit?: number },
						{ tickets: MyFeedbackTicket[] }
					>('listMyFeedbackTickets', {
						limit: args?.limit,
					});
					return {
						data: Array.isArray(result.data?.tickets)
							? result.data.tickets
							: [],
					};
				} catch (error: any) {
					return { error: error?.message || 'Failed to load support tickets' };
				}
			},
		}),
	}),
});

export const {
	// App Version
	useGetAppVersionQuery,
	// Feedback
	useSubmitFeedbackMutation,
	useGetMyFeedbackTicketsQuery,
} = apiSlice;
