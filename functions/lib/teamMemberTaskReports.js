"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTeamMemberTaskReports = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const emailService_1 = require("./emailService");
const taskDisplayStatus_1 = require("./taskDisplayStatus");
const RESEND_API_KEY = (0, params_1.defineSecret)(process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY');
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
const COMPLETED_EVENT_TYPES = new Set([
    'task_completed',
    'task_approved',
    'maintenance_recorded',
    'repair_logged',
    'inspection_completed',
    'recurring_maintenance_completed',
]);
const TEAM_REPORT_PLANS = new Set(['property', 'portfolio']);
const normalizePlanId = (value) => {
    return String(value || '').trim().toLowerCase();
};
const canUseTeamReports = (user) => {
    const scheduledPlan = normalizePlanId(user.subscription?.scheduledPlan);
    const plan = user.subscription?.hasScheduledSubscription && scheduledPlan
        ? scheduledPlan
        : normalizePlanId(user.subscription?.plan);
    return TEAM_REPORT_PLANS.has(plan);
};
const getAccountId = (userId, user) => String(user.accountId || '').trim() || userId;
const getName = (member) => {
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    return name || String(member.email || '').trim() || 'there';
};
const parseDate = (value) => {
    if (!value)
        return null;
    if (typeof value.toDate === 'function') {
        return value.toDate();
    }
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};
const getDateOnly = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const formatDate = (value) => {
    const date = parseDate(value);
    if (!date)
        return 'No date recorded';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};
const getDocsByAccount = async (collectionName, accountId) => {
    const snapshot = await db
        .collection(collectionName)
        .where('accountId', '==', accountId)
        .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
const getFrequencyDays = (frequency) => {
    if (frequency === 'monthly')
        return 30;
    if (frequency === 'biweekly')
        return 14;
    return 7;
};
const getPeriodKey = (date, frequency) => {
    if (frequency === 'monthly') {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    const start = new Date(date.getFullYear(), 0, 1);
    const dayMs = 24 * 60 * 60 * 1000;
    const week = Math.floor((getDateOnly(date).getTime() - start.getTime()) / dayMs / 7);
    return `${date.getFullYear()}-w${String(week).padStart(2, '0')}`;
};
const shouldSendForFrequency = (date, frequency) => {
    if (frequency === 'monthly') {
        return date.getDate() === 1;
    }
    if (date.getDay() !== 1) {
        return false;
    }
    if (frequency === 'weekly') {
        return true;
    }
    const anchor = new Date(2026, 0, 5);
    const dayMs = 24 * 60 * 60 * 1000;
    const weeksSinceAnchor = Math.floor((getDateOnly(date).getTime() - anchor.getTime()) / dayMs / 7);
    return weeksSinceAnchor % 2 === 0;
};
const getTeamMemberMatchValues = (member) => new Set([
    member.id,
    member.userAccountId,
    member.redeemedByUserId,
    member.email?.toLowerCase(),
    getName(member).toLowerCase(),
]
    .map((value) => String(value || '').trim().toLowerCase())
    .filter(Boolean));
const getTaskAssignmentValues = (task) => {
    const assignedTo = task.assignedTo && typeof task.assignedTo === 'object'
        ? task.assignedTo
        : undefined;
    const assignedToString = typeof task.assignedTo === 'string' ? task.assignedTo : '';
    return new Set([
        task.assignee,
        assignedToString,
        assignedTo?.id,
        assignedTo?.email?.toLowerCase(),
        assignedTo?.name?.toLowerCase(),
        task.completedBy,
    ]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean));
};
const hasAnyMatch = (left, right) => {
    for (const value of left) {
        if (right.has(value))
            return true;
    }
    return false;
};
const isTaskRelevantToMember = (task, member) => {
    const memberValues = getTeamMemberMatchValues(member);
    const taskValues = getTaskAssignmentValues(task);
    if (hasAnyMatch(memberValues, taskValues)) {
        return true;
    }
    const linkedProperties = new Set((member.linkedProperties || []).map((id) => String(id || '').trim()));
    return linkedProperties.size > 0 && linkedProperties.has(String(task.propertyId || ''));
};
const isEventRelevantToMember = (event, member) => {
    const memberValues = getTeamMemberMatchValues(member);
    const eventValues = new Set([
        event.createdBy,
        event.createdByName?.toLowerCase(),
    ]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean));
    if (hasAnyMatch(memberValues, eventValues)) {
        return true;
    }
    const linkedProperties = new Set((member.linkedProperties || []).map((id) => String(id || '').trim()));
    return linkedProperties.size > 0 && linkedProperties.has(String(event.propertyId || ''));
};
const getPropertyLabel = (item, propertyById) => {
    const propertyId = String(item.propertyId || '').trim();
    return (String(item.propertyTitle || '').trim() ||
        String(item.property || '').trim() ||
        propertyById.get(propertyId)?.title ||
        'Property not labeled');
};
const getUpcomingTasks = (tasks, now, windowDays) => {
    const windowEnd = new Date(now);
    windowEnd.setDate(windowEnd.getDate() + windowDays);
    return tasks
        .filter((task) => ACTIVE_TASK_STATUSES.has(String(task.status || '')))
        .filter((task) => (0, taskDisplayStatus_1.getTaskDisplayStatus)(task).label !== 'Overdue')
        .filter((task) => {
        const dueDate = parseDate(task.dueDate);
        return (!!dueDate &&
            getDateOnly(dueDate).getTime() >= getDateOnly(now).getTime() &&
            getDateOnly(dueDate).getTime() <= getDateOnly(windowEnd).getTime());
    })
        .sort((a, b) => (parseDate(a.dueDate)?.getTime() || 0) -
        (parseDate(b.dueDate)?.getTime() || 0));
};
const getOverdueTasks = (tasks) => tasks
    .filter((task) => ACTIVE_TASK_STATUSES.has(String(task.status || '')))
    .filter((task) => (0, taskDisplayStatus_1.getTaskDisplayStatus)(task).isOverdue)
    .sort((a, b) => (parseDate(a.dueDate)?.getTime() || 0) -
    (parseDate(b.dueDate)?.getTime() || 0));
const getCompletedEvents = (events, now, windowDays) => {
    const start = new Date(now);
    start.setDate(start.getDate() - windowDays);
    return events
        .filter((event) => {
        const type = String(event.eventType || '');
        if (type && !COMPLETED_EVENT_TYPES.has(type))
            return false;
        const eventDate = parseDate(event.completionDate || event.createdAt);
        return !!eventDate && eventDate.getTime() >= start.getTime();
    })
        .sort((a, b) => (parseDate(b.completionDate || b.createdAt)?.getTime() || 0) -
        (parseDate(a.completionDate || a.createdAt)?.getTime() || 0));
};
const renderRows = (items, propertyById, emptyText, getDateValue) => {
    if (items.length === 0) {
        return `<p style="margin:0; font-size:14px; color:#667085;">${(0, emailService_1.escapeHtml)(emptyText)}</p>`;
    }
    return `
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
			${items.slice(0, 6).map((item) => `
				<tr>
					<td style="padding:12px 0; border-top:1px solid #e8eee9;">
						<div style="font-size:15px; font-weight:800; color:#10251a;">${(0, emailService_1.escapeHtml)(item.title || 'Maintenance task')}</div>
						<div style="font-size:13px; color:#667085; margin-top:5px;">${(0, emailService_1.escapeHtml)(getPropertyLabel(item, propertyById))} &middot; ${(0, emailService_1.escapeHtml)(formatDate(getDateValue(item)))}</div>
					</td>
				</tr>
			`).join('')}
		</table>
	`;
};
const getTeamReportHtml = ({ member, frequency, upcomingTasks, overdueTasks, completedEvents, propertyById, appUrl, }) => {
    const dashboardUrl = appUrl.replace(/\/$/, '');
    const frequencyLabel = frequency === 'biweekly'
        ? 'Every 2 weeks'
        : frequency === 'monthly'
            ? 'Monthly'
            : 'Weekly';
    return `
		<div style="margin:0; padding:0; background:#edf7ef; font-family:Arial,sans-serif; color:#10251a;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf7ef; padding:34px 14px;">
				<tr><td align="center">
					<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px; width:100%; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #cfe8d4;">
						<tr>
							<td style="background:#16a34a; color:#ffffff; padding:28px 32px;">
								<div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; font-weight:800;">Maintley</div>
								<h1 style="margin:10px 0 0 0; font-size:27px; line-height:1.2;">Team Task Update</h1>
								<p style="margin:10px 0 0 0; font-size:15px; line-height:1.6; color:#eaf8ee;">${(0, emailService_1.escapeHtml)(frequencyLabel)} maintenance task update.</p>
							</td>
						</tr>
						<tr><td style="padding:32px;">
							<p style="margin:0 0 22px 0; font-size:16px; line-height:1.65; color:#33443a;">Hi ${(0, emailService_1.escapeHtml)(getName(member))}, here is what is coming up, what was completed, and what is overdue in Maintley.</p>

							<div style="border:1px solid #dbe7dc; border-radius:16px; padding:20px; margin-bottom:18px; background:#ffffff;">
								<h2 style="margin:0 0 12px 0; font-size:18px; color:#10251a;">Coming Up</h2>
								${renderRows(upcomingTasks, propertyById, 'No upcoming tasks are currently recorded for this report period.', (task) => task.dueDate)}
							</div>

							<div style="border:1px solid #dbe7dc; border-radius:16px; padding:20px; margin-bottom:18px; background:#ffffff;">
								<h2 style="margin:0 0 12px 0; font-size:18px; color:#10251a;">Done</h2>
								${renderRows(completedEvents, propertyById, 'No completed maintenance activity was recorded for this report period.', (event) => event.completionDate || event.createdAt)}
							</div>

							<div style="border:1px solid #dbe7dc; border-radius:16px; padding:20px; margin-bottom:24px; background:#ffffff;">
								<h2 style="margin:0 0 12px 0; font-size:18px; color:#10251a;">Overdue</h2>
								${renderRows(overdueTasks, propertyById, 'No overdue tasks are currently recorded.', (task) => task.dueDate)}
							</div>

							<a href="${(0, emailService_1.escapeHtml)(dashboardUrl)}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:13px 20px; border-radius:12px; font-size:14px; font-weight:900;">Open Maintley</a>
						</td></tr>
						<tr><td style="padding:18px 32px; border-top:1px solid #e5efe7; font-size:12px; line-height:1.6; color:#667085;">This report is controlled by the account owner in Maintley email preferences.</td></tr>
					</table>
				</td></tr>
			</table>
		</div>
	`;
};
const sendTeamReportForOwner = async (userId, user, now, appUrl) => {
    const preference = user.emailPreferences?.teamMemberReports;
    if (preference?.enabled !== true) {
        return [{ sent: false, skipped: true, reason: 'disabled' }];
    }
    const accountId = getAccountId(userId, user);
    const isAccountOwner = user.isTeamMemberAccount !== true && accountId === userId;
    if (!isAccountOwner || !canUseTeamReports(user)) {
        return [{ sent: false, skipped: true, reason: 'not_allowed' }];
    }
    const frequency = preference.frequency || 'weekly';
    if (!shouldSendForFrequency(now, frequency)) {
        return [{ sent: false, skipped: true, reason: 'not_scheduled_today' }];
    }
    const selectedMemberIds = new Set((preference.teamMemberIds || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean));
    const [teamMembers, tasks, properties, events] = await Promise.all([
        getDocsByAccount('teamMembers', accountId),
        getDocsByAccount('tasks', accountId),
        getDocsByAccount('properties', accountId),
        getDocsByAccount('maintenanceEvents', accountId),
    ]);
    const recipients = teamMembers.filter((member) => {
        if (!String(member.email || '').trim())
            return false;
        return selectedMemberIds.size === 0 || selectedMemberIds.has(member.id);
    });
    if (recipients.length === 0) {
        return [{ sent: false, skipped: true, reason: 'no_recipients' }];
    }
    const resendApiKey = RESEND_API_KEY.value();
    const resend = (0, emailService_1.getResendClient)(resendApiKey);
    if (!resend) {
        throw new Error('Resend client is not configured');
    }
    const propertyById = new Map(properties.map((property) => [property.id, property]));
    const windowDays = getFrequencyDays(frequency);
    const periodKey = getPeriodKey(now, frequency);
    const results = [];
    for (const member of recipients) {
        const deliveryId = [accountId, member.id, frequency, periodKey]
            .join('_')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .slice(0, 140);
        const deliveryRef = db.collection('teamMemberTaskReportDeliveries').doc(deliveryId);
        const existingDelivery = await deliveryRef.get();
        if (existingDelivery.exists) {
            results.push({ sent: false, skipped: true, reason: 'already_sent' });
            continue;
        }
        const memberTasks = tasks.filter((task) => isTaskRelevantToMember(task, member));
        const memberEvents = events.filter((event) => isEventRelevantToMember(event, member));
        const upcomingTasks = getUpcomingTasks(memberTasks, now, windowDays);
        const overdueTasks = getOverdueTasks(memberTasks);
        const completedEvents = getCompletedEvents(memberEvents, now, windowDays);
        await (0, emailService_1.sendMaintleyEmail)(resend, {
            to: String(member.email || '').trim(),
            subject: 'Your Maintley Team Task Update',
            html: getTeamReportHtml({
                member,
                frequency,
                upcomingTasks,
                overdueTasks,
                completedEvents,
                propertyById,
                appUrl,
            }),
        });
        await deliveryRef.set({
            accountId,
            ownerUserId: userId,
            teamMemberId: member.id,
            teamMemberEmail: String(member.email || '').trim(),
            frequency,
            periodKey,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        results.push({ sent: true, skipped: false });
    }
    return results;
};
exports.sendTeamMemberTaskReports = functions
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 540, memory: '256MB' })
    .pubsub.schedule('0 9 * * *')
    .timeZone('America/New_York')
    .onRun(async () => {
    const logger = functions.logger;
    const appUrl = process.env.APP_URL || 'https://maintleyapp.com';
    const now = new Date();
    const usersSnapshot = await db
        .collection('users')
        .where('emailPreferences.teamMemberReports.enabled', '==', true)
        .get();
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    for (const userDoc of usersSnapshot.docs) {
        try {
            const results = await sendTeamReportForOwner(userDoc.id, userDoc.data(), now, appUrl);
            results.forEach((result) => {
                if (result.sent) {
                    sent++;
                }
                else {
                    skipped++;
                }
            });
        }
        catch (error) {
            failed++;
            logger.error('Team member task report failed', {
                userId: userDoc.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    logger.info('Team member task report run complete', {
        totalCandidates: usersSnapshot.size,
        sent,
        skipped,
        failed,
    });
    return null;
});
