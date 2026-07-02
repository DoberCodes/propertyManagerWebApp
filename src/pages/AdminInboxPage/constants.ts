/**
 * Admin Inbox Page Constants
 * Centralized configuration for status types, feedback types, and other constants
 */

export const STATUS_OPTIONS = ['received', 'in_progress', 'resolved', 'closed'] as const;

export type StatusOption = (typeof STATUS_OPTIONS)[number];

export const STATUS_LABELS: Record<StatusOption, string> = {
	received: 'Received',
	in_progress: 'In Progress',
	resolved: 'Internally Testing',
	closed: 'Closed',
};

export const MAINTLEY_STATUS_UPDATE_MESSAGES: Record<StatusOption, string> = {
	received:
		"We received your ticket and will review it shortly. Thank you for taking the time to help improve Maintley.",
	in_progress:
		"We're actively investigating this issue and working toward a solution. We'll share another update as progress is made.",
	resolved:
		"We've implemented a fix and are completing final testing before release. We'll let you know if anything changes during testing.",
	closed:
		"This fix has been scheduled for the next Maintley release. Thank you for helping improve the Maintley community.",
};

export const normalizeStatusForAdmin = (value: unknown): StatusOption => {
	const normalized = String(value || '').trim().toLowerCase();
	if (normalized === 'reviewed') return 'in_progress';
	if (normalized === 'closed') return 'closed';
	if (normalized === 'in_progress') return 'in_progress';
	if (normalized === 'resolved') return 'resolved';
	return 'received';
};

export const TYPE_OPTIONS = ['all', 'feedback', 'feature_request', 'bug_report'] as const;

export type TypeOption = (typeof TYPE_OPTIONS)[number];

export const TYPE_LABELS: Record<TypeOption, string> = {
	all: 'All',
	feedback: 'General Feedback',
	feature_request: 'Feature Request',
	bug_report: 'Bug Report',
};

/**
 * Default ticket count structure
 */
export const DEFAULT_TICKET_COUNTS: Record<StatusOption, number> = {
	received: 0,
	in_progress: 0,
	resolved: 0,
	closed: 0,
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	MISSING_CREDENTIALS: 'Username and password are required.',
	LOGIN_FAILED: 'Admin sign-in failed.',
	SESSION_MISSING: 'Admin session is missing. Please sign in again.',
	PASSWORD_REQUIRED: 'Current password, new password, and confirmation are required.',
	PASSWORD_TOO_SHORT: 'New password must be at least 10 characters long.',
	PASSWORD_MISMATCH: 'New password and confirmation do not match.',
	RESET_PASSWORD_FAILED: 'Failed to reset password.',
	LOAD_TICKETS_FAILED: 'Failed to load feedback tickets.',
	UPDATE_TICKET_FAILED: 'Failed to update ticket status.',
	LINK_TICKET_EMPTY: 'Enter a ticket number or ID to link.',
	LINK_TICKET_FAILED: 'Failed to link tickets.',
} as const;

/**
 * Loading/success messages
 */
export const MESSAGES = {
	CHECKING_SESSION: 'Checking admin session...',
	LOADING_TICKETS: 'Loading tickets...',
	RESETTING_PASSWORD: 'Resetting Password...',
	RESET_PASSWORD: 'Reset Password',
	PASSWORD_RESET_SUCCESS: 'Password updated. Please sign in again.',
} as const;
