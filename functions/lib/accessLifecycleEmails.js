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
exports.sendAccessLifecycleEmailTest = exports.sendAccessLifecycleEmails = exports.sendAccessLifecycleActivationOnGrantCreate = exports.processAccessLifecycleGrant = exports.renderAccessLifecycleEmail = exports.getDueLifecycleMilestones = exports.getLifecycleDeliveryId = exports.formatLifecycleDate = exports.ACCESS_LIFECYCLE_MILESTONES = exports.ACCESS_LIFECYCLE_DELIVERIES_COLLECTION = exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const params_1 = require("firebase-functions/params");
const entitlements_1 = require("@maintley/entitlements");
const emailBrand_1 = require("./emailBrand");
const emailLinks_1 = require("./emailLinks");
const emailService_1 = require("./emailService");
const maintleyEventEngine_1 = require("./maintleyEventEngine");
const entitlementGrants_1 = require("./entitlementGrants");
const subscriptionEntitlements_1 = require("./subscriptionEntitlements");
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const RESEND_API_KEY = (0, params_1.defineSecret)(process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY');
exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION = 'v1';
exports.ACCESS_LIFECYCLE_DELIVERIES_COLLECTION = 'accessLifecycleDeliveries';
const DELIVERY_LEASE_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIME_ZONE = 'America/New_York';
exports.ACCESS_LIFECYCLE_MILESTONES = Object.freeze([
    { id: 'activation', offsetDays: 0, graceHours: 48, inApp: true },
    { id: 'progress', offsetDays: 7, graceHours: 72, inApp: false },
    { id: 'ending', offsetDays: 21, graceHours: 72, inApp: true },
    { id: 'expired', offsetDays: 30, graceHours: 168, inApp: true },
]);
const asRecord = (value) => typeof value === 'object' && value ? value : {};
const normalizeTimeZone = (value) => {
    const candidate = String(value || '').trim() || DEFAULT_TIME_ZONE;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
        return candidate;
    }
    catch {
        return DEFAULT_TIME_ZONE;
    }
};
const formatLifecycleDate = (valueMs, timeZone) => new Intl.DateTimeFormat('en-US', {
    timeZone: normalizeTimeZone(timeZone),
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZoneName: 'short',
}).format(new Date(valueMs));
exports.formatLifecycleDate = formatLifecycleDate;
const getMilestoneTargetMs = (milestone, grant) => {
    if (milestone === 'expired' && Number.isFinite(Number(grant.endsAtMs))) {
        return Number(grant.endsAtMs);
    }
    const definition = exports.ACCESS_LIFECYCLE_MILESTONES.find((candidate) => candidate.id === milestone);
    return Number(grant.startsAtMs) + Number(definition?.offsetDays || 0) * DAY_MS;
};
const getLifecycleDeliveryId = (grantId, milestone, programId = entitlementGrants_1.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID) => `${programId}__${grantId}__${milestone}__${exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 180);
exports.getLifecycleDeliveryId = getLifecycleDeliveryId;
const getDueLifecycleMilestones = (grant, nowMs) => exports.ACCESS_LIFECYCLE_MILESTONES.filter((milestone) => getMilestoneTargetMs(milestone.id, grant) <= nowMs).map((milestone) => milestone.id);
exports.getDueLifecycleMilestones = getDueLifecycleMilestones;
const renderProgressCards = (progress) => [
    ['Properties', progress.properties],
    ['Systems and equipment', progress.equipment],
    ['Documents', progress.documents],
    ['Recurring tasks', progress.recurringTasks],
]
    .map(([label, value]) => `
				<td width="50%" style="padding:6px;">
					<div style="background:${emailBrand_1.EMAIL_BRAND.canvas}; border:1px solid ${emailBrand_1.EMAIL_BRAND.accent}; border-radius:10px; padding:14px;">
						<div style="font-size:24px; font-weight:800; color:${emailBrand_1.EMAIL_BRAND.primary};">${value}</div>
						<div style="margin-top:4px; font-size:12px; color:${emailBrand_1.EMAIL_BRAND.slate};">${label}</div>
					</div>
				</td>`)
    .reduce((rows, card, index) => `${rows}${index % 2 === 0 ? '<tr>' : ''}${card}${index % 2 === 1 ? '</tr>' : ''}`, '');
const renderAccessLifecycleEmail = ({ milestone, name, endsAtMs, timeZone, progress, dashboardUrl, upgradeUrl, }) => {
    const safeName = (0, emailService_1.escapeHtml)(name || 'there');
    const endDate = (0, emailService_1.escapeHtml)((0, exports.formatLifecycleDate)(endsAtMs, timeZone));
    const safeDashboardUrl = (0, emailService_1.escapeHtml)(dashboardUrl);
    const safeUpgradeUrl = (0, emailService_1.escapeHtml)(upgradeUrl);
    const commonIntro = `<p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Hi ${safeName},</p>`;
    if (milestone === 'activation') {
        return {
            subject: 'Your 30-day Homeowner+ trial is active',
            html: (0, emailBrand_1.renderMaintleyEmailShell)({
                title: 'Homeowner+ is active',
                previewText: `Your complimentary Homeowner+ access ends ${endDate}.`,
                bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your Free account now includes 30 days of complimentary Homeowner+ access. It ends on <strong>${endDate}</strong>.</p>
					<div style="margin:18px 0; padding:16px; border-radius:10px; background:${emailBrand_1.EMAIL_BRAND.canvas}; border:1px solid ${emailBrand_1.EMAIL_BRAND.accent}; color:${emailBrand_1.EMAIL_BRAND.slate};"><strong>No payment method is connected.</strong><br />You will not be charged automatically. Continuing with Homeowner+ later requires an intentional Checkout.</div>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">A useful next step is to finish your property details and record the major systems you want Maintley to remember.</p>
					${(0, emailBrand_1.renderMaintleyEmailButton)('Continue property setup', safeDashboardUrl)}`,
            }),
        };
    }
    if (milestone === 'progress') {
        return {
            subject: 'Your Homeowner+ trial progress',
            html: (0, emailBrand_1.renderMaintleyEmailShell)({
                title: 'Your property memory is taking shape',
                previewText: 'A factual summary of what you have recorded in Maintley.',
                bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Here is what is currently recorded in your Maintley account. These counts reflect saved records—not a physical inspection or certified maintenance history.</p>
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -6px 18px;">${renderProgressCards(progress)}</table>
					${(0, emailBrand_1.renderMaintleyEmailButton)('Open Maintley', safeDashboardUrl)}`,
            }),
        };
    }
    if (milestone === 'ending') {
        return {
            subject: `Your Homeowner+ trial ends ${endDate}`,
            html: (0, emailBrand_1.renderMaintleyEmailShell)({
                title: 'Your trial is ending soon',
                previewText: `Homeowner+ access ends ${endDate}; your records remain available.`,
                bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your complimentary Homeowner+ access ends on <strong>${endDate}</strong>.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your Free account, property records, maintenance history, and saved documents remain available. Homeowner+ automation—including recurring-care generation—stops when the trial ends.</p>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">You will not be charged automatically. Choose Homeowner+ through Checkout only if you want to continue.</p>
					${(0, emailBrand_1.renderMaintleyEmailButton)('Review Homeowner+ options', safeUpgradeUrl)}`,
            }),
        };
    }
    return {
        subject: 'Your Maintley account is now on the Free plan',
        html: (0, emailBrand_1.renderMaintleyEmailShell)({
            title: 'Your records are still here',
            previewText: 'Your Homeowner+ trial ended; your Free account and saved records remain available.',
            bodyHtml: `${commonIntro}
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your complimentary Homeowner+ access ended on <strong>${endDate}</strong>. Your account is now on the Free plan.</p>
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your property memory, maintenance history, and existing records have not expired. Homeowner+ automation has stopped, but you can still open and manage the information included with Free.</p>
				<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">You were not charged. If you want Homeowner+ again, you can intentionally start Checkout from Maintley.</p>
				${(0, emailBrand_1.renderMaintleyEmailButton)('Open your account', safeDashboardUrl)}
				<span style="display:inline-block; width:8px;"></span>
				${(0, emailBrand_1.renderMaintleyEmailButton)('Review Homeowner+ options', safeUpgradeUrl)}`,
        }),
    };
};
exports.renderAccessLifecycleEmail = renderAccessLifecycleEmail;
const isLifecycleEnabled = () => subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS.accessLifecycleCommunication === true;
const getProgressCounts = async (accountId) => {
    const getCount = async (collectionName, additionalFilter) => {
        const snapshot = await db
            .collection(collectionName)
            .where('accountId', '==', accountId)
            .get();
        return additionalFilter
            ? snapshot.docs.filter((doc) => additionalFilter(doc.data())).length
            : snapshot.size;
    };
    const [propertySnapshot, equipment, recurringTasks] = await Promise.all([
        db.collection('properties').where('accountId', '==', accountId).get(),
        getCount('devices'),
        getCount('tasks', (task) => Boolean(task.isRecurring || task.recurringTaskId || task.frequency)),
    ]);
    const properties = propertySnapshot.size;
    const documents = propertySnapshot.docs.reduce((total, propertyDoc) => {
        const property = propertyDoc.data();
        return total + (Array.isArray(property.documents) ? property.documents.length : 0);
    }, 0);
    return { properties, equipment, documents, recurringTasks };
};
const hasConfirmedPaidAccess = (subscription, nowMs) => {
    const normalizedSubscription = asRecord(subscription);
    const result = (0, entitlements_1.resolveAccountEntitlements)({
        subscription: normalizedSubscription,
        grants: [],
        fallbackPlanId: 'homeowner',
        mode: 'compatibility',
        allowLegacyPlanWithoutStatus: true,
        featureFlags: subscriptionEntitlements_1.ENTITLEMENT_FEATURE_FLAGS,
        nowMs,
    });
    return ((0, entitlements_1.hasCapability)(result, 'recurring_tasks.use') &&
        (0, entitlements_1.isSubscriptionCurrentlyEntitled)(normalizedSubscription, nowMs));
};
const markDelivery = async (deliveryRef, data) => {
    await deliveryRef.set({
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
};
const claimDelivery = async (deliveryRef, base, nowMs) => db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(deliveryRef);
    const existing = snapshot.exists ? snapshot.data() || {} : {};
    if (existing.status === 'sent' || existing.status === 'skipped')
        return false;
    if (existing.status === 'processing' &&
        Number(existing.leaseExpiresAtMs || 0) > nowMs) {
        return false;
    }
    transaction.set(deliveryRef, {
        ...base,
        status: 'processing',
        attempts: Number(existing.attempts || 0) + 1,
        leaseExpiresAtMs: nowMs + DELIVERY_LEASE_MS,
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return true;
});
const getAccountAndOwner = async (accountRef, grant) => {
    const accountSnapshot = await accountRef.get();
    if (!accountSnapshot.exists)
        return null;
    const account = accountSnapshot.data() || {};
    const ownerId = String(grant.beneficiaryUserId || account.ownerId || grant.accountId || accountRef.id).trim();
    if (!ownerId)
        return null;
    const ownerSnapshot = await db.collection('users').doc(ownerId).get();
    if (!ownerSnapshot.exists)
        return null;
    return { account, owner: ownerSnapshot.data() || {}, ownerId };
};
const publishLifecycleNotice = async (milestone, accountId, ownerId, grantId, endsAtMs, timeZone) => {
    const definition = exports.ACCESS_LIFECYCLE_MILESTONES.find((candidate) => candidate.id === milestone);
    if (!definition?.inApp)
        return;
    const endDate = (0, exports.formatLifecycleDate)(endsAtMs, timeZone);
    const content = {
        activation: {
            title: 'Homeowner+ trial active',
            message: `Your complimentary access ends ${endDate}. No payment method is connected and you will not be charged automatically.`,
            actionLabel: 'Continue setup',
            actionUrl: '/dashboard',
        },
        progress: {
            title: 'Your Maintley progress',
            message: 'Review the property information you have recorded so far.',
            actionLabel: 'Open Maintley',
            actionUrl: '/dashboard',
        },
        ending: {
            title: 'Homeowner+ trial ending soon',
            message: `Your trial ends ${endDate}. Your saved property records remain available on Free.`,
            actionLabel: 'Review your plan',
            actionUrl: '/profile',
        },
        expired: {
            title: 'Your account is now on Free',
            message: 'Your property memory and saved records are still available. Homeowner+ automation has stopped.',
            actionLabel: 'Open your account',
            actionUrl: '/dashboard',
        },
    };
    const notice = content[milestone];
    await (0, maintleyEventEngine_1.publishMaintleyEventRecord)({
        accountId,
        userId: ownerId,
        recipientIds: [ownerId],
        type: 'access_lifecycle',
        workflowKey: 'access-lifecycle',
        entityKey: `${grantId}-${milestone}-${exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION}`,
        title: notice.title,
        message: notice.message,
        status: milestone === 'expired' ? 'completed' : 'ready',
        priority: 'normal',
        actionLabel: notice.actionLabel,
        actionUrl: notice.actionUrl,
        metadata: { grantId, milestone, endsAtMs },
        push: false,
        inApp: true,
    });
};
const processMilestone = async (accountRef, grant, milestone, nowMs) => {
    const grantId = String(grant.grantId || entitlementGrants_1.HOMEOWNER_PLUS_TRIAL_GRANT_ID);
    const accountId = String(grant.accountId || accountRef.id);
    const programId = String(grant.programId || '');
    const deliveryId = (0, exports.getLifecycleDeliveryId)(grantId, milestone, programId);
    const deliveryRef = accountRef
        .collection(exports.ACCESS_LIFECYCLE_DELIVERIES_COLLECTION)
        .doc(deliveryId);
    const targetAtMs = getMilestoneTargetMs(milestone, grant);
    const definition = exports.ACCESS_LIFECYCLE_MILESTONES.find((candidate) => candidate.id === milestone);
    const base = {
        deliveryId,
        accountId,
        grantId,
        programId,
        milestone,
        templateVersion: exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION,
        targetAtMs,
    };
    const existing = await deliveryRef.get();
    if (existing.exists &&
        ['sent', 'skipped'].includes(String(existing.data()?.status || ''))) {
        return 'skipped';
    }
    if (String(grant.state || '').trim().toLowerCase() !== 'active') {
        await markDelivery(deliveryRef, {
            ...base,
            status: 'skipped',
            outcome: 'grant_terminal_or_ineligible',
            terminalAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return 'skipped';
    }
    if (nowMs - targetAtMs > Number(definition?.graceHours || 0) * 60 * 60 * 1000) {
        await markDelivery(deliveryRef, {
            ...base,
            status: 'skipped',
            outcome: 'missed_grace_window',
            terminalAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return 'skipped';
    }
    const context = await getAccountAndOwner(accountRef, grant);
    if (!context) {
        await markDelivery(deliveryRef, {
            ...base,
            status: 'skipped',
            outcome: 'account_or_owner_missing',
            terminalAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return 'skipped';
    }
    const subscription = context.account.subscription || context.owner.subscription;
    if (hasConfirmedPaidAccess(subscription, nowMs)) {
        await markDelivery(deliveryRef, {
            ...base,
            status: 'skipped',
            outcome: 'suppressed_paid_conversion',
            terminalAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return 'skipped';
    }
    const email = String(context.owner.email || '').trim();
    if (!email) {
        await markDelivery(deliveryRef, {
            ...base,
            status: 'skipped',
            outcome: 'recipient_email_missing',
            terminalAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return 'skipped';
    }
    if (!(await claimDelivery(deliveryRef, base, nowMs)))
        return 'deferred';
    try {
        const timeZone = normalizeTimeZone(context.account.timeZone || context.owner.timeZone);
        const progress = await getProgressCounts(accountId);
        const origin = (0, emailLinks_1.getCanonicalAppOrigin)();
        const rendered = (0, exports.renderAccessLifecycleEmail)({
            milestone,
            name: String(context.owner.firstName || context.owner.displayName || 'there'),
            endsAtMs: Number(grant.endsAtMs),
            timeZone,
            progress,
            dashboardUrl: (0, emailLinks_1.buildAppRouteUrl)('/dashboard', origin),
            upgradeUrl: (0, emailLinks_1.buildAppRouteUrl)('/paywall', origin),
        });
        const resend = (0, emailService_1.getResendClient)(RESEND_API_KEY.value());
        const response = await (0, emailService_1.sendMaintleyEmail)(resend, {
            to: email,
            subject: rendered.subject,
            html: rendered.html,
            idempotencyKey: deliveryId,
        });
        await publishLifecycleNotice(milestone, accountId, context.ownerId, grantId, Number(grant.endsAtMs), timeZone);
        await markDelivery(deliveryRef, {
            ...base,
            status: 'sent',
            outcome: 'sent',
            providerMessageId: response.data?.id || null,
            recipientEmail: email,
            timeZone,
            leaseExpiresAtMs: 0,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            terminalAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return 'sent';
    }
    catch (error) {
        await markDelivery(deliveryRef, {
            ...base,
            status: 'failed',
            outcome: 'retryable_failure',
            leaseExpiresAtMs: 0,
            lastError: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
};
const processAccessLifecycleGrant = async (accountRef, grant, nowMs = Date.now(), onlyMilestone) => {
    if (!isLifecycleEnabled())
        return;
    if (String(grant.programId || '') !== entitlementGrants_1.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID ||
        !Number.isFinite(Number(grant.startsAtMs)) ||
        !Number.isFinite(Number(grant.endsAtMs))) {
        return;
    }
    const due = onlyMilestone
        ? [onlyMilestone]
        : (0, exports.getDueLifecycleMilestones)(grant, nowMs);
    if (due.length === 0)
        return;
    const latestDue = due[due.length - 1];
    for (const milestone of due.slice(0, -1)) {
        const deliveryRef = accountRef
            .collection(exports.ACCESS_LIFECYCLE_DELIVERIES_COLLECTION)
            .doc((0, exports.getLifecycleDeliveryId)(String(grant.grantId || ''), milestone, String(grant.programId || '')));
        const snapshot = await deliveryRef.get();
        if (!snapshot.exists) {
            await markDelivery(deliveryRef, {
                deliveryId: deliveryRef.id,
                accountId: accountRef.id,
                grantId: String(grant.grantId || ''),
                programId: String(grant.programId || ''),
                milestone,
                templateVersion: exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION,
                targetAtMs: getMilestoneTargetMs(milestone, grant),
                status: 'skipped',
                outcome: 'superseded_by_later_milestone',
                terminalAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
    await processMilestone(accountRef, grant, latestDue, nowMs);
};
exports.processAccessLifecycleGrant = processAccessLifecycleGrant;
exports.sendAccessLifecycleActivationOnGrantCreate = functions
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
    .firestore.document('familyAccounts/{accountId}/entitlementGrants/{grantId}')
    .onCreate(async (snapshot) => {
    await (0, exports.processAccessLifecycleGrant)(snapshot.ref.parent.parent, snapshot.data(), Date.now(), 'activation');
});
exports.sendAccessLifecycleEmails = functions
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 540, memory: '256MB' })
    .pubsub.schedule('15 * * * *')
    .timeZone('Etc/UTC')
    .onRun(async () => {
    if (!isLifecycleEnabled())
        return null;
    const snapshot = await db
        .collectionGroup('entitlementGrants')
        .where('programId', '==', entitlementGrants_1.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID)
        .get();
    let processed = 0;
    let failed = 0;
    for (const grantDoc of snapshot.docs) {
        try {
            await (0, exports.processAccessLifecycleGrant)(grantDoc.ref.parent.parent, grantDoc.data());
            processed++;
        }
        catch (error) {
            failed++;
            functions.logger.error('Access lifecycle delivery failed', {
                grantId: grantDoc.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    functions.logger.info('Access lifecycle delivery run complete', {
        candidates: snapshot.size,
        processed,
        failed,
    });
    return null;
});
exports.sendAccessLifecycleEmailTest = functions
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to send a lifecycle test email.');
    }
    if (!isLifecycleEnabled()) {
        throw new functions.https.HttpsError('failed-precondition', 'Access lifecycle communication is disabled.');
    }
    const milestone = String(data?.milestone || '');
    if (!exports.ACCESS_LIFECYCLE_MILESTONES.some((item) => item.id === milestone)) {
        throw new functions.https.HttpsError('invalid-argument', 'A valid lifecycle milestone is required.');
    }
    const userSnapshot = await db.collection('users').doc(context.auth.uid).get();
    const user = userSnapshot.data() || {};
    if (!['owner', 'admin'].includes(String(user.maintley_role || '').trim().toLowerCase())) {
        throw new functions.https.HttpsError('permission-denied', 'Lifecycle email tests are restricted to authorized Maintley staff.');
    }
    const accountId = String(user.accountId || context.auth.uid);
    const grantSnapshot = await db
        .collection('familyAccounts')
        .doc(accountId)
        .collection('entitlementGrants')
        .doc(entitlementGrants_1.HOMEOWNER_PLUS_TRIAL_GRANT_ID)
        .get();
    if (!grantSnapshot.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'No Homeowner+ trial grant is available for this account.');
    }
    const email = String(user.email || '').trim();
    if (!email) {
        throw new functions.https.HttpsError('failed-precondition', 'Your account does not have an email address.');
    }
    const grant = grantSnapshot.data();
    const progress = await getProgressCounts(accountId);
    const origin = (0, emailLinks_1.getCanonicalAppOrigin)();
    const rendered = (0, exports.renderAccessLifecycleEmail)({
        milestone,
        name: String(user.firstName || user.displayName || 'there'),
        endsAtMs: Number(grant.endsAtMs),
        timeZone: normalizeTimeZone(user.timeZone),
        progress,
        dashboardUrl: (0, emailLinks_1.buildAppRouteUrl)('/dashboard', origin),
        upgradeUrl: (0, emailLinks_1.buildAppRouteUrl)('/paywall', origin),
    });
    await (0, emailService_1.sendMaintleyEmail)((0, emailService_1.getResendClient)(RESEND_API_KEY.value()), {
        to: email,
        subject: `[Test] ${rendered.subject}`,
        html: rendered.html,
        idempotencyKey: `test-${context.auth.uid}-${milestone}-${Date.now()}`,
    });
    return { success: true, productionDeliveryStateWritten: false };
});
