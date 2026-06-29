import { User } from '../Redux/Slices/userSlice';

export type NotificationPreferences = NonNullable<User['notificationPreferences']>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
	enabled: true,
	types: {
		property_added: false,
		property_updated: false,
		property_deleted: false,
		property_group_created: false,
		property_group_updated: false,
		property_group_deleted: false,
		task_created: false,
		task_assigned: true,
		task_updated: false,
		task_deleted: false,
		task_completed: false,
		task_reminder: true,
		task_due_today: true,
		task_overdue: true,
		task_unassigned_critical: true,
		task_approval_required: true,
		task_recurring_generation_failed: true,
		team_member_added: false,
		team_member_updated: false,
		team_member_removed: false,
		team_group_created: false,
		team_group_updated: false,
		team_group_deleted: false,
		maintenance_request: true,
		maintenance_request_created: true,
		document_scan_started: true,
		document_scan_completed: true,
		legal_update: true,
		property_shared: false,
		share_invitation: true,
		share_invitation_accepted: false,
	},
};

export const mergeNotificationPreferences = (
	preferences?: User['notificationPreferences'],
): NotificationPreferences => ({
	enabled: preferences?.enabled ?? DEFAULT_NOTIFICATION_PREFERENCES.enabled,
	types: {
		...DEFAULT_NOTIFICATION_PREFERENCES.types,
		...(preferences?.types || {}),
	},
});

export const isLegacyAllEnabledNotificationPreferences = (
	preferences?: User['notificationPreferences'],
): boolean => {
	if (!preferences) {
		return false;
	}

	if (preferences.enabled === false) {
		return false;
	}

	const merged = mergeNotificationPreferences(preferences);
	return Object.values(merged.types).every(Boolean);
};

export const shouldCreateNotification = (
	preferences: User['notificationPreferences'] | undefined,
	type: string,
): boolean => {
	const merged = mergeNotificationPreferences(preferences);
	return merged.enabled && merged.types[type as keyof typeof merged.types] !== false;
};
