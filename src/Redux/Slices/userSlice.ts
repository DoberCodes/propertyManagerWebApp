import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { clearUserLocalStorage } from '../../utils/localStorageCleanup';
import { UserRole } from 'constants/roles';
import type { EntitlementGrant } from '@maintley/entitlements';

export type WorkspaceMode = 'homeowner' | 'property_operator';

// Family account type for shared subscriptions
export interface FamilyAccount {
	id: string;
	ownerId: string; // User ID of the account owner
	memberIds: string[]; // Array of user IDs in this family account
	subscription: {
		status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';
		plan: string;
		currentPeriodStart: number;
		currentPeriodEnd: number;
		trialEndsAt?: number | null;
		canceledAt?: number;
		stripeCustomerId?: string;
		stripeSubscriptionId?: string;
		promoCode?: string;
		updatedAt?: string;
		hasScheduledSubscription?: boolean;
		scheduledPlan?: string;
		pendingCheckoutPlan?: string;
		pendingCheckoutStartedAt?: number;
	};
	createdAt: string;
	updatedAt: string;
}

// User model matching Firebase Auth + Firestore user data
export interface User {
	id: string;
	email: string;
	role: UserRole;
	firstName?: string;
	lastName?: string;
	title?: string;
	phone?: string;
	address?: string;
	image?: string;
	maintley_role?: Record<string, unknown> | string | boolean;
	assignedPropertyId?: number;
	hiddenPropertyIds?: string[]; // Properties hidden from dashboard
	dashboardPreferences?: {
		scope?: 'my_focus' | 'all_visible_properties';
	};
	workspaceMode?: WorkspaceMode;
	pushToken?: string; // Push notification token for FCM
	pushTokenUpdatedAt?: string; // When push token was last updated
	pushTokens?: Array<{
		token: string;
		provider: 'fcm';
		platform: 'web' | 'native';
		deviceLabel?: string;
		userAgent?: string;
		createdAt: string;
		updatedAt: string;
		lastSeenAt?: string;
		disabled?: boolean;
	}>;
	accountId?: string; // Family account ID for shared subscriptions
	isAccountOwner?: boolean; // Whether this user owns the account/subscription
	isTeamMemberAccount?: boolean; // Invited team members are scoped to assigned properties
	teamMemberId?: string; // Team member record that granted access
	subscription?: {
		status: 'trial' | 'active' | 'cancelled' | 'expired' | 'past_due';
		plan: string;
		currentPeriodStart: number;
		currentPeriodEnd: number;
		trialEndsAt?: number | null;
		canceledAt?: number;
		stripeCustomerId?: string;
		stripeSubscriptionId?: string;
		promoCode?: string;
		updatedAt?: string;
		hasScheduledSubscription?: boolean;
		scheduledPlan?: string;
		pendingCheckoutPlan?: string;
		pendingCheckoutStartedAt?: number;
		entitlementAccountId?: string;
		entitlementGrants?: EntitlementGrant[];
	};
	effectiveEntitlementProjection?: {
		resolverVersion?: string;
		bundleVersions?: string[];
		activeBundleIds?: string[];
		bundleExpirationsMs?: Record<string, number>;
		activeGrants?: EntitlementGrant[];
		calculatedAt?: string;
		nextTransitionAtMs?: number;
	};
	legalAgreement?: {
		agreedToTerms: boolean;
		agreedAt: string; // ISO date string
		agreedVersion: string; // Version of terms agreed to
		documents?: {
			termsOfService?: {
				accepted: boolean;
				agreedAt: string;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			privacyPolicy?: {
				accepted: boolean;
				agreedAt: string;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			maintenanceDisclaimer?: {
				accepted: boolean;
				agreedAt: string;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			subscriptionTerms?: {
				accepted: boolean;
				agreedAt: string;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
			eula?: {
				accepted: boolean;
				agreedAt: string;
				agreedVersion: string;
				fileName: string;
				title: string;
			};
		};
	};
	notificationPreferences?: {
		enabled: boolean; // Master switch for all notifications
		types: {
			property_added: boolean;
			property_updated: boolean;
			property_deleted: boolean;
			property_group_created: boolean;
			property_group_updated: boolean;
			property_group_deleted: boolean;
			task_created: boolean;
			task_assigned: boolean;
			task_updated: boolean;
			task_deleted: boolean;
			task_completed: boolean;
			task_reminder: boolean;
			task_due_today: boolean;
			task_overdue: boolean;
			task_unassigned_critical: boolean;
			task_approval_required: boolean;
			task_recurring_generation_failed: boolean;
			team_member_added: boolean;
			team_member_updated: boolean;
			team_member_removed: boolean;
			team_group_created: boolean;
			team_group_updated: boolean;
			team_group_deleted: boolean;
			maintenance_request: boolean;
			maintenance_request_created: boolean;
			document_scan_started: boolean;
			document_scan_completed: boolean;
			quick_scan_completed: boolean;
			property_audit_completed: boolean;
			legal_update: boolean;
			property_shared: boolean;
			share_invitation: boolean;
			share_invitation_accepted: boolean;
		};
	};
	emailPreferences?: {
		monthlyDigest: boolean;
		taskReminders: boolean;
		propertyInsights: boolean;
		seasonalGuidance: boolean;
		monthlyDigestFamilyRecipients?: boolean;
		teamMemberReports?: {
			enabled: boolean;
			frequency: 'weekly' | 'biweekly' | 'monthly';
			teamMemberIds: string[];
		};
	};
	onboardingCompleted?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface UserState {
	currentUser: User | null;
	cred: any; // Legacy credential object
	authLoading: boolean;
}

const initialState: UserState = {
	currentUser: null,
	cred: null,
	authLoading: true,
};

const getLoggedUserSession = (user: User) => ({
	token: `firebase-token-${user.id}`,
	user,
});

const userSlice = createSlice({
	name: 'user',
	initialState,
	reducers: {
		beginAuthTransition: (state) => {
			state.currentUser = null;
			state.cred = null;
			state.authLoading = true;
			localStorage.removeItem('loggedUser');
		},
		setCurrentUser: (state, action: PayloadAction<User | null>) => {
			if (action.payload) {
				state.currentUser = action.payload;
				localStorage.setItem(
					'loggedUser',
					JSON.stringify(getLoggedUserSession(action.payload)),
				);
			} else {
				state.currentUser = null;
				localStorage.removeItem('loggedUser');
			}
			state.authLoading = false;
		},
		updateEntitlementProjection: (
			state,
			action: PayloadAction<{
				accountId: string;
				projection: User['effectiveEntitlementProjection'] | null;
			}>,
		) => {
			if (!state.currentUser?.subscription) return;
			const currentAccountId =
				String(state.currentUser.accountId || '').trim() || state.currentUser.id;
			if (currentAccountId !== action.payload.accountId) return;

			const projection = action.payload.projection || undefined;
			state.currentUser.effectiveEntitlementProjection = projection;
			state.currentUser.subscription.entitlementAccountId = currentAccountId;
			state.currentUser.subscription.entitlementGrants =
				projection?.activeGrants || [];
			localStorage.setItem(
				'loggedUser',
				JSON.stringify(getLoggedUserSession(state.currentUser)),
			);
		},
		setUserCred: (state, action: PayloadAction<any>) => {
			state.cred = action.payload;
		},
		setAuthLoading: (state, action: PayloadAction<boolean>) => {
			state.authLoading = action.payload;
		},
		logout: (state) => {
			const userId = state.currentUser?.id;
			state.currentUser = null;
			state.cred = null;
			state.authLoading = false;
			clearUserLocalStorage(userId);
		},
	},
});

export const {
	beginAuthTransition,
	setCurrentUser,
	updateEntitlementProjection,
	setUserCred,
	setAuthLoading,
	logout,
} = userSlice.actions;
export default userSlice.reducer;
