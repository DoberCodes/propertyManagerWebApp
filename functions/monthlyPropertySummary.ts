import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import {
	escapeHtml,
	getResendClient,
	sendMaintleyEmail,
} from './emailService';

const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

interface MonthlyDigestEmailPreferences {
	monthlyDigest?: boolean;
}

interface MonthlyDigestUser {
	accountId?: string;
	email?: string;
	firstName?: string;
	displayName?: string;
	emailPreferences?: MonthlyDigestEmailPreferences;
}

interface SummaryTask {
	id: string;
	title?: string;
	dueDate?: string;
	status?: string;
	propertyId?: string;
	property?: string;
	propertyTitle?: string;
}

interface SummaryEvent {
	id: string;
	title?: string;
	completionDate?: string;
	createdAt?: string;
	propertyId?: string;
	propertyTitle?: string;
}

interface SummaryProperty {
	id: string;
	title?: string;
}

interface SummaryCounts {
	propertyCount: number;
	deviceCount: number;
	upcomingTaskCount: number;
	overdueTaskCount: number;
	recentlyCompletedCount: number;
}

interface SendDigestResult {
	sent: boolean;
	skipped: boolean;
	reason?: string;
}

const ACTIVE_TASK_STATUSES = new Set([
	'Initiated',
	'Pending',
	'In Progress',
	'Awaiting Approval',
	'Overdue',
]);

const COMPLETED_EVENT_TYPES = new Set([
	'task_completed',
	'task_approved',
	'maintenance_recorded',
	'repair_logged',
	'inspection_completed',
	'recurring_maintenance_completed',
]);

const getDisplayName = (user: MonthlyDigestUser): string => {
	const name = (user.firstName || user.displayName || '').trim();
	return name || 'there';
};

const getAccountId = (userId: string, user: MonthlyDigestUser): string =>
	String(user.accountId || '').trim() || userId;

const getDateOnly = (date: Date): Date =>
	new Date(date.getFullYear(), date.getMonth(), date.getDate());

const parseDate = (value?: string): Date | null => {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const isSameOrAfter = (date: Date, threshold: Date): boolean =>
	getDateOnly(date).getTime() >= getDateOnly(threshold).getTime();

const isSameOrBefore = (date: Date, threshold: Date): boolean =>
	getDateOnly(date).getTime() <= getDateOnly(threshold).getTime();

const formatDate = (value?: string): string => {
	const date = parseDate(value);
	if (!date) return 'No date recorded';
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const getDocsByAccount = async <T>(
	collectionName: string,
	accountId: string,
	userId: string,
): Promise<T[]> => {
	const accountSnapshot = await db
		.collection(collectionName)
		.where('accountId', '==', accountId)
		.get();

	const docs = new Map<string, T>();
	accountSnapshot.docs.forEach((doc) =>
		docs.set(doc.id, { id: doc.id, ...doc.data() } as T),
	);

	if (accountId !== userId) {
		const userSnapshot = await db
			.collection(collectionName)
			.where('userId', '==', userId)
			.get();
		userSnapshot.docs.forEach((doc) =>
			docs.set(doc.id, { id: doc.id, ...doc.data() } as T),
		);
	}

	return Array.from(docs.values());
};

const getMonthStart = (date: Date): Date =>
	new Date(date.getFullYear(), date.getMonth(), 1);

const getUpcomingTasks = (tasks: SummaryTask[], now: Date): SummaryTask[] => {
	const windowEnd = new Date(now);
	windowEnd.setDate(windowEnd.getDate() + 30);

	return tasks
		.filter((task) => ACTIVE_TASK_STATUSES.has(String(task.status || '')))
		.filter((task) => String(task.status || '') !== 'Overdue')
		.filter((task) => {
			const dueDate = parseDate(task.dueDate);
			if (!dueDate) return false;
			return isSameOrAfter(dueDate, now) && isSameOrBefore(dueDate, windowEnd);
		})
		.sort(
			(a, b) =>
				(parseDate(a.dueDate)?.getTime() || 0) -
				(parseDate(b.dueDate)?.getTime() || 0),
		);
};

const getOverdueTasks = (tasks: SummaryTask[], now: Date): SummaryTask[] =>
	tasks
		.filter((task) => ACTIVE_TASK_STATUSES.has(String(task.status || '')))
		.filter((task) => {
			if (String(task.status || '') === 'Overdue') return true;
			const dueDate = parseDate(task.dueDate);
			return !!dueDate && getDateOnly(dueDate).getTime() < getDateOnly(now).getTime();
		})
		.sort(
			(a, b) =>
				(parseDate(a.dueDate)?.getTime() || 0) -
				(parseDate(b.dueDate)?.getTime() || 0),
		);

const getRecentlyCompletedEvents = (
	events: SummaryEvent[],
	now: Date,
): SummaryEvent[] => {
	const monthStart = getMonthStart(now);
	return events
		.filter((event) => {
			const type = String((event as any).eventType || '');
			if (type && !COMPLETED_EVENT_TYPES.has(type)) return false;
			const eventDate = parseDate(event.completionDate || event.createdAt);
			return !!eventDate && isSameOrAfter(eventDate, monthStart);
		})
		.sort(
			(a, b) =>
				(parseDate(b.completionDate || b.createdAt)?.getTime() || 0) -
				(parseDate(a.completionDate || a.createdAt)?.getTime() || 0),
		);
};

const getPropertyLabel = (
	item: SummaryTask | SummaryEvent,
	propertyById: Map<string, SummaryProperty>,
): string => {
	const propertyId = String(item.propertyId || '').trim();
	return (
		String(item.propertyTitle || '').trim() ||
		String((item as SummaryTask).property || '').trim() ||
		propertyById.get(propertyId)?.title ||
		'Property not labeled'
	);
};

const renderMetric = (label: string, value: number): string => `
	<td style="width:33.333%; padding:8px;">
		<div style="border:1px solid #dbe7dc; border-radius:14px; padding:16px; background:#f8fbf8;">
			<div style="font-size:28px; line-height:1; font-weight:900; color:#0f5132;">${value}</div>
			<div style="font-size:12px; line-height:1.45; color:#52625a; margin-top:8px;">${escapeHtml(label)}</div>
		</div>
	</td>
`;

const renderTaskRows = (
	tasks: SummaryTask[],
	propertyById: Map<string, SummaryProperty>,
	emptyText: string,
): string => {
	if (tasks.length === 0) {
		return `<p style="margin:0; font-size:14px; color:#667085;">${escapeHtml(emptyText)}</p>`;
	}

	return `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
			${tasks.slice(0, 5).map((task) => `
				<tr>
					<td style="padding:14px 0; border-top:1px solid #e8eee9;">
						<div style="font-size:15px; font-weight:800; color:#10251a;">${escapeHtml(task.title || 'Untitled task')}</div>
						<div style="font-size:13px; color:#667085; margin-top:5px;">${escapeHtml(getPropertyLabel(task, propertyById))} &middot; ${escapeHtml(formatDate(task.dueDate))}</div>
					</td>
				</tr>
			`).join('')}
		</table>
	`;
};

const renderCompletedRows = (
	events: SummaryEvent[],
	propertyById: Map<string, SummaryProperty>,
): string => {
	if (events.length === 0) {
		return '<p style="margin:0; font-size:14px; color:#667085;">No completed maintenance activity was recorded this month.</p>';
	}

	return `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
			${events.slice(0, 5).map((event) => `
				<tr>
					<td style="padding:14px 0; border-top:1px solid #e8eee9;">
						<div style="font-size:15px; font-weight:800; color:#10251a;">${escapeHtml(event.title || 'Maintenance activity')}</div>
						<div style="font-size:13px; color:#667085; margin-top:5px;">${escapeHtml(getPropertyLabel(event, propertyById))} &middot; ${escapeHtml(formatDate(event.completionDate || event.createdAt))}</div>
					</td>
				</tr>
			`).join('')}
		</table>
	`;
};

const getMonthlyDigestHtml = ({
	name,
	counts,
	upcomingTasks,
	overdueTasks,
	recentlyCompleted,
	propertyById,
	appUrl,
}: {
	name: string;
	counts: SummaryCounts;
	upcomingTasks: SummaryTask[];
	overdueTasks: SummaryTask[];
	recentlyCompleted: SummaryEvent[];
	propertyById: Map<string, SummaryProperty>;
	appUrl: string;
}): string => {
	const escapedName = escapeHtml(name);
	const dashboardUrl = appUrl.replace(/\/$/, '');

	return `
		<div style="margin:0; padding:0; background:#edf7ef; font-family:Arial,sans-serif; color:#10251a;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf7ef; padding:34px 14px;">
				<tr><td align="center">
					<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px; width:100%; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #cfe8d4; box-shadow:0 10px 30px rgba(16,37,26,0.08);">
						<tr>
							<td style="background:#13a85b; color:#ffffff; padding:30px 32px;">
								<div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; font-weight:800;">Maintley</div>
								<h1 style="margin:10px 0 0 0; font-size:28px; line-height:1.2;">Monthly Property Summary</h1>
								<p style="margin:10px 0 0 0; font-size:15px; line-height:1.6; color:#eaf8ee;">A calm snapshot of what is currently recorded across your Maintley account.</p>
							</td>
						</tr>
						<tr><td style="padding:32px;">
							<p style="margin:0 0 22px 0; font-size:16px; line-height:1.65; color:#33443a;">Hi ${escapedName}, here is a quick look at the property records, tasks, and maintenance activity already documented in Maintley.</p>

							<div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:900; color:#0f5132; margin-bottom:8px;">This month at a glance</div>
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -8px 24px -8px;">
								<tr>
									${renderMetric('Properties', counts.propertyCount)}
									${renderMetric('Appliances & systems', counts.deviceCount)}
									${renderMetric('Completed this month', counts.recentlyCompletedCount)}
								</tr>
							</table>

							<div style="border:1px solid #dbe7dc; border-radius:16px; padding:20px; margin-bottom:18px; background:#ffffff;">
								<h2 style="margin:0 0 12px 0; font-size:18px; color:#10251a;">Upcoming Tasks</h2>
								${renderTaskRows(upcomingTasks, propertyById, 'No tasks due in the next 30 days are currently recorded.')}
							</div>

							<div style="border:1px solid #dbe7dc; border-radius:16px; padding:20px; margin-bottom:18px; background:#ffffff;">
								<h2 style="margin:0 0 12px 0; font-size:18px; color:#10251a;">Overdue Tasks</h2>
								${renderTaskRows(overdueTasks, propertyById, 'No overdue tasks are currently recorded.')}
							</div>

							<div style="border:1px solid #dbe7dc; border-radius:16px; padding:20px; margin-bottom:24px; background:#ffffff;">
								<h2 style="margin:0 0 12px 0; font-size:18px; color:#10251a;">Recently Completed</h2>
								${renderCompletedRows(recentlyCompleted, propertyById)}
							</div>

							<a href="${escapeHtml(dashboardUrl)}" style="display:inline-block; background:#13a85b; color:#ffffff; text-decoration:none; padding:13px 20px; border-radius:12px; font-size:14px; font-weight:900;">Open Maintley</a>
						</td></tr>
						<tr><td style="padding:18px 32px; border-top:1px solid #e5efe7; font-size:12px; line-height:1.6; color:#667085;">This summary does not make maintenance recommendations. It only reflects information currently recorded in Maintley. You can update email preferences anytime in Settings.</td></tr>
					</table>
				</td></tr>
			</table>
		</div>
	`;
};

const sendDigestForUser = async (
	userId: string,
	appUrl: string,
): Promise<SendDigestResult> => {
	const userDoc = await db.collection('users').doc(userId).get();
	if (!userDoc.exists) {
		return { sent: false, skipped: true, reason: 'user_not_found' };
	}

	const user = userDoc.data() as MonthlyDigestUser;
	if (user.emailPreferences?.monthlyDigest === false) {
		return { sent: false, skipped: true, reason: 'monthly_digest_opted_out' };
	}

	const email = (user.email || '').trim();
	if (!email) {
		return { sent: false, skipped: true, reason: 'missing_email' };
	}

	const resendApiKey = RESEND_API_KEY.value();
	const resend = getResendClient(resendApiKey);
	if (!resend) {
		throw new Error('Resend client is not configured');
	}

	const accountId = getAccountId(userId, user);
	const now = new Date();
	const [properties, tasks, devices, events] = await Promise.all([
		getDocsByAccount<SummaryProperty>('properties', accountId, userId),
		getDocsByAccount<SummaryTask>('tasks', accountId, userId),
		getDocsByAccount<Record<string, unknown>>('devices', accountId, userId),
		getDocsByAccount<SummaryEvent>('maintenanceEvents', accountId, userId),
	]);

	const propertyById = new Map(properties.map((property) => [property.id, property]));
	const upcomingTasks = getUpcomingTasks(tasks, now);
	const overdueTasks = getOverdueTasks(tasks, now);
	const recentlyCompleted = getRecentlyCompletedEvents(events, now);

	await sendMaintleyEmail(resend, {
		to: email,
		subject: 'Your Monthly Property Summary from Maintley',
		html: getMonthlyDigestHtml({
			name: getDisplayName(user),
			counts: {
				propertyCount: properties.length,
				deviceCount: devices.length,
				upcomingTaskCount: upcomingTasks.length,
				overdueTaskCount: overdueTasks.length,
				recentlyCompletedCount: recentlyCompleted.length,
			},
			upcomingTasks,
			overdueTasks,
			recentlyCompleted,
			propertyById,
			appUrl,
		}),
	});

	return { sent: true, skipped: false };
};

export const sendMonthlyPropertySummaries = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 540, memory: '256MB' })
	.pubsub.schedule('0 10 1 * *')
	.timeZone('America/New_York')
	.onRun(async () => {
		const logger = functions.logger;
		const appUrl = process.env.APP_URL || 'https://maintleyapp.com';
		const usersSnapshot = await db.collection('users').get();

		if (usersSnapshot.empty) {
			logger.info('Monthly summary: no users found.');
			return null;
		}

		let sent = 0;
		let skipped = 0;
		let failed = 0;

		for (const userDoc of usersSnapshot.docs) {
			try {
				const result = await sendDigestForUser(userDoc.id, appUrl);
				if (result.sent) {
					sent++;
				} else {
					skipped++;
				}
			} catch (error) {
				failed++;
				logger.error('Monthly summary email failed', {
					userId: userDoc.id,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		logger.info('Monthly summary run complete', {
			totalCandidates: usersSnapshot.size,
			sent,
			skipped,
			failed,
		});

		return null;
	});

export const sendMonthlyPropertySummaryTest = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 120, memory: '256MB' })
	.https.onCall(async (_data: Record<string, never>, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'You must be signed in to send a test monthly property summary.',
			);
		}

		const appUrl = process.env.APP_URL || 'https://maintleyapp.com';

		try {
			const result = await sendDigestForUser(context.auth.uid, appUrl);
			if (result.skipped) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					`Test monthly property summary was skipped: ${result.reason || 'unknown_reason'}`,
				);
			}

			return {
				success: true,
				message: 'Test monthly property summary sent.',
			};
		} catch (error) {
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}
			throw new functions.https.HttpsError(
				'internal',
				error instanceof Error
					? error.message
					: 'Failed to send test monthly property summary.',
			);
		}
	});
