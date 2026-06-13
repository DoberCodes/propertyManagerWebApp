import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import {
	escapeHtml,
	getResendClient,
	sendMaintleyEmail,
} from './emailService';
import { getTaskDisplayStatus } from './taskDisplayStatus';

const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

const ACTIVE_TASK_STATUSES = new Set([
	'Initiated',
	'Pending',
	'In Progress',
	'Awaiting Approval',
	'Overdue',
]);

const PLAN_ALIASES: Record<string, string> = {
	home: 'homeowner',
	homeowner: 'homeowner',
	homeowner_plus: 'homeowner_plus',
	homeownerplus: 'homeowner_plus',
	'homeowner+': 'homeowner_plus',
	property: 'property',
	portfolio: 'portfolio',
	free: 'homeowner',
	basic: 'property',
	professional: 'portfolio',
};

const PAID_TASK_REMINDER_EMAIL_PLANS = new Set([
	'homeowner_plus',
	'property',
	'portfolio',
]);

type TaskNotificationType = 'reminder' | 'overdue';

interface TaskNotificationLike {
	id?: string;
	type?: TaskNotificationType;
	daysBeforeDue?: number;
	enabled?: boolean;
	customMessage?: string;
}

interface TaskLike {
	id: string;
	userId?: string;
	accountId?: string;
	propertyId?: string;
	propertyTitle?: string;
	property?: string;
	title?: string;
	dueDate?: string;
	status?: string;
	enableNotifications?: boolean;
	notifications?: TaskNotificationLike[];
	assignee?: string;
	assignedTo?: {
		id?: string;
		name?: string;
		email?: string;
	};
}

interface UserSubscriptionLike {
	plan?: string;
	hasScheduledSubscription?: boolean;
	scheduledPlan?: string;
}

interface UserLike {
	email?: string;
	firstName?: string;
	displayName?: string;
	subscription?: UserSubscriptionLike;
	emailPreferences?: {
		taskReminders?: boolean;
	};
}

interface DeliveryResult {
	sent: boolean;
	skipped: boolean;
	reason?: string;
}

const normalizePlanId = (planId?: string): string => {
	const normalized = String(planId || '').trim().toLowerCase();
	return PLAN_ALIASES[normalized] || normalized;
};

const getEffectivePlanId = (subscription?: UserSubscriptionLike): string => {
	const scheduledPlan = normalizePlanId(subscription?.scheduledPlan);
	if (subscription?.hasScheduledSubscription && scheduledPlan) {
		return scheduledPlan;
	}

	const plan = normalizePlanId(subscription?.plan);
	return plan || 'homeowner';
};

const canReceiveTaskReminderEmails = (user: UserLike): boolean =>
	user.emailPreferences?.taskReminders === true &&
	PAID_TASK_REMINDER_EMAIL_PLANS.has(getEffectivePlanId(user.subscription));

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

const parseTaskDueDate = (dueDate?: string): Date | null => {
	if (!dueDate) return null;
	const parsed = new Date(dueDate);
	if (Number.isNaN(parsed.getTime())) return null;
	return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getNotificationTriggerDate = (
	dueDate: Date,
	daysBeforeDue: number,
): Date => {
	const triggerDate = new Date(dueDate);
	triggerDate.setDate(dueDate.getDate() - daysBeforeDue);
	return triggerDate;
};

const shouldSendNotificationToday = (
	dueDate: Date,
	daysBeforeDue: number,
	currentDate: Date,
): boolean => {
	const today = new Date(
		currentDate.getFullYear(),
		currentDate.getMonth(),
		currentDate.getDate(),
	);
	return (
		toDateOnly(getNotificationTriggerDate(dueDate, daysBeforeDue)) ===
		toDateOnly(today)
	);
};

const getDefaultNotificationMessage = (
	notification: TaskNotificationLike,
	taskTitle: string,
): string => {
	const type = notification.type || 'reminder';
	const daysBeforeDue = Number(notification.daysBeforeDue || 0);

	if (type === 'reminder') {
		if (daysBeforeDue === 30) return `"${taskTitle}" is coming up in 30 days.`;
		if (daysBeforeDue === 7) return `"${taskTitle}" is due soon.`;
		if (daysBeforeDue === 1) return `"${taskTitle}" is due tomorrow.`;
		if (daysBeforeDue === 0) return `"${taskTitle}" is due today.`;
		return `"${taskTitle}" is coming up in ${daysBeforeDue} days.`;
	}

	const weeksOverdue = Math.abs(daysBeforeDue) / 7;
	if (weeksOverdue === 1) return `"${taskTitle}" was due 1 week ago.`;
	return `"${taskTitle}" was due ${weeksOverdue} weeks ago.`;
};

const getNotificationSubject = (
	notification: TaskNotificationLike,
	taskTitle: string,
): string => {
	if (notification.type === 'overdue') {
		return `Overdue maintenance: ${taskTitle}`;
	}

	if (Number(notification.daysBeforeDue || 0) === 0) {
		return `Maintenance due today: ${taskTitle}`;
	}

	return `Upcoming maintenance: ${taskTitle}`;
};

const getDisplayName = (user: UserLike): string => {
	const name = (user.firstName || user.displayName || '').trim();
	return name || 'there';
};

const getTaskReminderHtml = ({
	name,
	message,
	task,
	appUrl,
}: {
	name: string;
	message: string;
	task: TaskLike;
	appUrl: string;
}): string => {
	const propertyLabel = task.propertyTitle || task.property || 'Property';
	const displayStatus = getTaskDisplayStatus(task);
	const taskUrl = task.propertyId
		? `${appUrl.replace(/\/$/, '')}/properties/${encodeURIComponent(task.propertyId)}`
		: appUrl;

	return `
		<div style="margin:0; padding:0; background:#f3f4f6; font-family:Arial,sans-serif; color:#111827;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:24px 0;">
				<tr><td align="center">
					<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
						<tr><td style="background:#16a34a; color:#ffffff; padding:20px 24px; font-size:24px; font-weight:700;">Maintley</td></tr>
						<tr><td style="padding:24px;">
							<h2 style="margin:0 0 12px 0; font-size:22px; color:#111827;">Maintenance Reminder</h2>
							<p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#374151;">Hi ${escapeHtml(name)}, ${escapeHtml(message)}</p>
							<div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px; margin:0 0 16px 0;">
								<p style="margin:0 0 8px 0; font-size:14px; color:#0f172a;"><strong>Task:</strong> ${escapeHtml(task.title || 'Maintenance task')}</p>
								<p style="margin:0 0 8px 0; font-size:14px; color:#0f172a;"><strong>Property:</strong> ${escapeHtml(propertyLabel)}</p>
								<p style="margin:0 0 8px 0; font-size:14px; color:#0f172a;"><strong>Status:</strong> ${escapeHtml(displayStatus.label)}</p>
								<p style="margin:0; font-size:14px; color:#0f172a;"><strong>Due:</strong> ${escapeHtml(task.dueDate || 'Not set')}</p>
							</div>
							<a href="${escapeHtml(taskUrl)}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:11px 18px; border-radius:8px; font-size:14px; font-weight:600;">Open maintenance task</a>
						</td></tr>
						<tr><td style="padding:16px 24px; border-top:1px solid #e5e7eb; font-size:12px; line-height:1.5; color:#6b7280;">This email follows the notification schedule saved on this task. You can update email preferences anytime in Settings.</td></tr>
					</table>
				</td></tr>
			</table>
		</div>
	`;
};

const resolveUserIdFromAssignee = async (
	task: TaskLike,
): Promise<string | null> => {
	const candidateIds = [
		task.assignedTo?.id,
		task.assignee,
		task.userId,
		task.accountId,
	]
		.map((value) => String(value || '').trim())
		.filter(Boolean);

	for (const candidateId of candidateIds) {
		const userDoc = await db.collection('users').doc(candidateId).get();
		if (userDoc.exists) {
			return candidateId;
		}

		const teamMemberDoc = await db.collection('teamMembers').doc(candidateId).get();
		const linkedUserId = String(teamMemberDoc.data()?.userAccountId || '').trim();
		if (teamMemberDoc.exists && linkedUserId) {
			const linkedUserDoc = await db.collection('users').doc(linkedUserId).get();
			if (linkedUserDoc.exists) {
				return linkedUserId;
			}
		}
	}

	const assignedEmail = String(task.assignedTo?.email || '').trim().toLowerCase();
	if (assignedEmail && task.accountId) {
		const userByEmailSnapshot = await db
			.collection('users')
			.where('accountId', '==', task.accountId)
			.where('email', '==', assignedEmail)
			.limit(1)
			.get();

		if (!userByEmailSnapshot.empty) {
			return userByEmailSnapshot.docs[0].id;
		}
	}

	return null;
};

const getDeliveryId = (
	taskId: string,
	notificationId: string,
	dueDate: string,
): string =>
	[taskId, notificationId, dueDate]
		.join('_')
		.replace(/[^a-zA-Z0-9_-]/g, '_')
		.slice(0, 120);

const sendTaskReminderEmail = async (
	task: TaskLike,
	notification: TaskNotificationLike,
	currentDate: Date,
	appUrl: string,
): Promise<DeliveryResult> => {
	const taskTitle = (task.title || '').trim() || 'Maintenance task';
	const dueDate = parseTaskDueDate(task.dueDate);
	if (!dueDate) {
		return { sent: false, skipped: true, reason: 'missing_due_date' };
	}

	const notificationId =
		String(notification.id || '').trim() ||
		`${notification.type || 'reminder'}-${Number(notification.daysBeforeDue || 0)}`;
	const daysBeforeDue = Number(notification.daysBeforeDue || 0);

	if (!shouldSendNotificationToday(dueDate, daysBeforeDue, currentDate)) {
		return { sent: false, skipped: true, reason: 'not_scheduled_today' };
	}

	const deliveryId = getDeliveryId(task.id, notificationId, task.dueDate || '');
	const deliveryRef = db.collection('taskReminderEmailDeliveries').doc(deliveryId);
	const existingDelivery = await deliveryRef.get();
	if (existingDelivery.exists) {
		return { sent: false, skipped: true, reason: 'already_sent' };
	}

	const recipientUserId = await resolveUserIdFromAssignee(task);
	if (!recipientUserId) {
		return { sent: false, skipped: true, reason: 'recipient_not_found' };
	}

	const userDoc = await db.collection('users').doc(recipientUserId).get();
	const user = userDoc.data() as UserLike | undefined;
	if (!user) {
		return { sent: false, skipped: true, reason: 'recipient_not_found' };
	}

	const email = String(user.email || '').trim();
	if (!email) {
		return { sent: false, skipped: true, reason: 'missing_email' };
	}

	if (!canReceiveTaskReminderEmails(user)) {
		return { sent: false, skipped: true, reason: 'email_preference_disabled' };
	}

	const resendApiKey = RESEND_API_KEY.value();
	const resend = getResendClient(resendApiKey);
	if (!resend) {
		throw new Error('Resend client is not configured');
	}

	const message =
		String(notification.customMessage || '').trim() ||
		getDefaultNotificationMessage(notification, taskTitle);

	await sendMaintleyEmail(resend, {
		to: email,
		subject: getNotificationSubject(notification, taskTitle),
		html: getTaskReminderHtml({
			name: getDisplayName(user),
			message,
			task,
			appUrl,
		}),
	});

	await deliveryRef.set({
		taskId: task.id,
		notificationId,
		recipientUserId,
		dueDate: task.dueDate,
		daysBeforeDue,
		notificationType: notification.type || 'reminder',
		sentAt: admin.firestore.FieldValue.serverTimestamp(),
	});

	return { sent: true, skipped: false };
};

export const sendTaskReminderEmails = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 540, memory: '256MB' })
	.pubsub.schedule('0 8 * * *')
	.timeZone('America/New_York')
	.onRun(async () => {
		const logger = functions.logger;
		const appUrl = process.env.APP_URL || 'https://maintleyapp.com';
		const currentDate = new Date();

		const tasksSnapshot = await db
			.collection('tasks')
			.where('enableNotifications', '==', true)
			.get();

		let sent = 0;
		let skipped = 0;
		let failed = 0;

		for (const taskDoc of tasksSnapshot.docs) {
			const task = {
				id: taskDoc.id,
				...taskDoc.data(),
			} as TaskLike;

			if (!ACTIVE_TASK_STATUSES.has(String(task.status || ''))) {
				skipped++;
				continue;
			}

			const notifications = Array.isArray(task.notifications)
				? task.notifications
				: [];
			for (const notification of notifications) {
				if (notification.enabled !== true) {
					skipped++;
					continue;
				}

				try {
					const result = await sendTaskReminderEmail(
						task,
						notification,
						currentDate,
						appUrl,
					);
					if (result.sent) {
						sent++;
					} else {
						skipped++;
					}
				} catch (error) {
					failed++;
					logger.error('Task reminder email failed', {
						taskId: task.id,
						notificationId: notification.id,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		}

		logger.info('Task reminder email run complete', {
			totalTasks: tasksSnapshot.size,
			sent,
			skipped,
			failed,
		});

		return null;
	});
