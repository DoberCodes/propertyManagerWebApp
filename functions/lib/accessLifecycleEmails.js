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
exports.sendAdminOperationalUserEmail = exports.sendAdminAccessLifecycleEmail = exports.sendAccessLifecycleEmailTest = exports.sendAccessLifecycleEmails = exports.sendAccessLifecycleActivationOnGrantCreate = exports.processAccessLifecycleGrant = exports.renderPromotionalAccessLifecycleEmail = exports.renderAccessLifecycleEmail = exports.getDueLifecycleMilestones = exports.getLifecycleProviderIdempotencyKey = exports.getLifecycleDeliveryId = exports.getLifecycleMilestoneDefinitions = exports.formatLifecycleDate = exports.ACCESS_LIFECYCLE_MILESTONES = exports.ACCESS_LIFECYCLE_DELIVERIES_COLLECTION = exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION = void 0;
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
const adminEntitlementGrantPolicy_1 = require("./adminEntitlementGrantPolicy");
const adminPortal_1 = require("./adminPortal");
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const RESEND_API_KEY = (0, params_1.defineSecret)(process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY');
exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION = 'v1';
exports.ACCESS_LIFECYCLE_DELIVERIES_COLLECTION = 'accessLifecycleDeliveries';
const DELIVERY_LEASE_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIME_ZONE = 'America/New_York';
const ADMIN_AUDIT_LOGS_COLLECTION = 'admin_audit_logs';
exports.ACCESS_LIFECYCLE_MILESTONES = Object.freeze([
    { id: 'activation', offsetDays: 0, graceHours: 48, inApp: true },
    { id: 'progress', offsetDays: 7, graceHours: 72, inApp: false },
    { id: 'ending', offsetDays: 21, graceHours: 72, inApp: true },
    { id: 'expired', offsetDays: 30, graceHours: 168, inApp: true },
]);
const asRecord = (value) => typeof value === 'object' && value ? value : {};
const toMillis = (value) => {
    if (typeof value === 'number')
        return Number.isFinite(value) ? value : 0;
    if (value && typeof value === 'object' && 'toMillis' in value) {
        return Number(value.toMillis()) || 0;
    }
    const parsed = Date.parse(String(value || ''));
    return Number.isFinite(parsed) ? parsed : 0;
};
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
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
}).format(new Date(valueMs));
exports.formatLifecycleDate = formatLifecycleDate;
const isHomeownerPlusTrial = (grant) => String(grant.programId || '') === entitlementGrants_1.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID;
const getLifecycleMilestoneDefinitions = (grant) => {
    const startsAtMs = Number(grant.startsAtMs || 0);
    const endsAtMs = Number(grant.endsAtMs || 0);
    if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs))
        return [];
    if (isHomeownerPlusTrial(grant)) {
        return exports.ACCESS_LIFECYCLE_MILESTONES.map((definition) => ({
            id: definition.id,
            targetAtMs: definition.id === 'expired'
                ? endsAtMs
                : startsAtMs + definition.offsetDays * DAY_MS,
            graceHours: definition.graceHours,
            inApp: definition.inApp,
        }));
    }
    const transition = asRecord(grant.transition);
    const automatic = transition.mode === 'automatic' &&
        (0, entitlements_1.getComplimentaryTransitionIssues)(transition).length === 0;
    const firstChargeAtMs = toMillis(transition.firstChargeAt) || endsAtMs;
    const definitions = [
        { id: 'activation', targetAtMs: startsAtMs, graceHours: 48, inApp: true },
    ];
    if (automatic) {
        for (const [id, days] of [
            ['renewal_30', 30],
            ['renewal_7', 7],
            ['renewal_1', 1],
        ]) {
            const targetAtMs = firstChargeAtMs - days * DAY_MS;
            // Activation already satisfies a reminder due on the same day.
            if (targetAtMs > startsAtMs + 60 * 1000) {
                definitions.push({ id, targetAtMs, graceHours: 72, inApp: true });
            }
        }
    }
    else {
        const targetAtMs = endsAtMs - 7 * DAY_MS;
        if (targetAtMs > startsAtMs) {
            definitions.push({
                id: 'access_ending_7',
                targetAtMs,
                graceHours: 72,
                inApp: true,
            });
        }
    }
    definitions.push({ id: 'expired', targetAtMs: endsAtMs, graceHours: 168, inApp: true });
    return definitions.sort((left, right) => left.targetAtMs - right.targetAtMs);
};
exports.getLifecycleMilestoneDefinitions = getLifecycleMilestoneDefinitions;
const getMilestoneDefinition = (milestone, grant) => (0, exports.getLifecycleMilestoneDefinitions)(grant).find((candidate) => candidate.id === milestone);
const getMilestoneTargetMs = (milestone, grant) => getMilestoneDefinition(milestone, grant)?.targetAtMs || 0;
const getLifecycleDeliveryId = (grantId, milestone, programId = entitlementGrants_1.HOMEOWNER_PLUS_TRIAL_PROGRAM_ID) => `${programId}__${grantId}__${milestone}__${exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 180);
exports.getLifecycleDeliveryId = getLifecycleDeliveryId;
const getLifecycleProviderIdempotencyKey = (accountId, deliveryId) => `${accountId}__${deliveryId}`
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 240);
exports.getLifecycleProviderIdempotencyKey = getLifecycleProviderIdempotencyKey;
const getDueLifecycleMilestones = (grant, nowMs) => (0, exports.getLifecycleMilestoneDefinitions)(grant).filter((milestone) => milestone.targetAtMs <= nowMs).map((milestone) => milestone.id);
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
            subject: 'Your first property is ready - Homeowner+ is active',
            html: (0, emailBrand_1.renderMaintleyEmailShell)({
                title: 'Congratulations on creating your first property',
                previewText: `Your complimentary Homeowner+ access ends ${endDate}.`,
                bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your first property record is ready. Creating it also activated 30 days of complimentary Homeowner+ access on your Free account. Access ends on <strong>${endDate}</strong>.</p>
					<div style="margin:18px 0; padding:16px; border-radius:10px; background:${emailBrand_1.EMAIL_BRAND.canvas}; border:1px solid ${emailBrand_1.EMAIL_BRAND.accent}; color:${emailBrand_1.EMAIL_BRAND.slate};"><strong>No payment method is connected.</strong><br />You will not be charged automatically. Continuing with Homeowner+ later requires an intentional Checkout.</div>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Continue building your home record, then use Home Review and Maintley Intelligence to understand the details, history, and maintenance patterns Maintley can connect.</p>
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
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your Free account keeps the complete maintenance workflow, including recurring care, ordinary reminders, property records, maintenance history, and saved documents. New Homeowner+ Intelligence reviews and advanced document processing stop when the trial ends.</p>
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
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your property memory, maintenance history, recurring care, ordinary reminders, and existing records have not expired. New Homeowner+ Intelligence reviews and advanced processing have stopped, while the complete Free maintenance workflow remains available.</p>
				<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">You were not charged. If you want Homeowner+ again, you can intentionally start Checkout from Maintley.</p>
				${(0, emailBrand_1.renderMaintleyEmailButton)('Open your account', safeDashboardUrl)}
				<span style="display:inline-block; width:8px;"></span>
				${(0, emailBrand_1.renderMaintleyEmailButton)('Review Homeowner+ options', safeUpgradeUrl)}`,
        }),
    };
};
exports.renderAccessLifecycleEmail = renderAccessLifecycleEmail;
const bundleLabel = (bundleId) => {
    const labels = {
        homeowner_plus: 'Homeowner+',
        multi_homeowner: 'Multi-Homeowner',
        property: 'Property',
        portfolio: 'Portfolio',
    };
    return labels[String(bundleId || '')] || 'Maintley';
};
const formatTransitionPrice = (transition) => {
    const amount = Number(transition.recurringAmountMinor);
    const currency = String(transition.currency || 'USD').toUpperCase();
    if (!Number.isFinite(amount) || amount < 0)
        return 'the disclosed recurring price';
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
        }).format(amount / 100);
    }
    catch {
        return `${currency} ${(amount / 100).toFixed(2)}`;
    }
};
const renderPromotionalAccessLifecycleEmail = ({ milestone, name, endsAtMs, timeZone, dashboardUrl, upgradeUrl, grant, }) => {
    const safeName = (0, emailService_1.escapeHtml)(name || 'there');
    const accessLabel = (0, emailService_1.escapeHtml)(bundleLabel(grant.bundleId));
    const endDate = (0, emailService_1.escapeHtml)((0, exports.formatLifecycleDate)(endsAtMs, timeZone));
    const transition = asRecord(grant.transition);
    const automatic = transition.mode === 'automatic' &&
        (0, entitlements_1.getComplimentaryTransitionIssues)(transition).length === 0;
    const firstChargeAtMs = toMillis(transition.firstChargeAt) || endsAtMs;
    const firstChargeDate = (0, emailService_1.escapeHtml)((0, exports.formatLifecycleDate)(firstChargeAtMs, timeZone));
    const safeDashboardUrl = (0, emailService_1.escapeHtml)(dashboardUrl);
    const safeUpgradeUrl = (0, emailService_1.escapeHtml)(upgradeUrl);
    const commonIntro = `<p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Hi ${safeName},</p>`;
    if (milestone === 'activation') {
        const transitionCopy = automatic
            ? `Your complimentary period is connected to a Stripe billing relationship. Unless you opt out, the first charge is scheduled for <strong>${firstChargeDate}</strong> at <strong>${(0, emailService_1.escapeHtml)(formatTransitionPrice(transition))}</strong> per ${(0, emailService_1.escapeHtml)(String(transition.billingCycle || 'billing period'))}.`
            : transition.mode === 'checkout_required'
                ? 'No automatic charge is scheduled. Continuing after the complimentary period requires an intentional Stripe Checkout.'
                : 'No payment method is required and no automatic charge is scheduled.';
        return {
            subject: `Your complimentary ${accessLabel} access is active`,
            html: (0, emailBrand_1.renderMaintleyEmailShell)({
                title: `${accessLabel} access is active`,
                previewText: `Your complimentary access ends ${endDate}.`,
                bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your account now includes complimentary <strong>${accessLabel}</strong> access through <strong>${endDate}</strong>.</p>
					<div style="margin:18px 0; padding:16px; border-radius:10px; background:${emailBrand_1.EMAIL_BRAND.canvas}; border:1px solid ${emailBrand_1.EMAIL_BRAND.accent}; color:${emailBrand_1.EMAIL_BRAND.slate};">${transitionCopy}</div>
					${(0, emailBrand_1.renderMaintleyEmailButton)('Open Maintley', safeDashboardUrl)}`,
            }),
        };
    }
    if (['renewal_30', 'renewal_7', 'renewal_1'].includes(milestone)) {
        const days = milestone === 'renewal_30' ? 30 : milestone === 'renewal_7' ? 7 : 1;
        return {
            subject: `${accessLabel} billing begins in ${days} day${days === 1 ? '' : 's'}`,
            html: (0, emailBrand_1.renderMaintleyEmailShell)({
                title: 'Upcoming paid continuation',
                previewText: `Your first charge is scheduled for ${firstChargeDate}.`,
                bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your complimentary ${accessLabel} period is approaching its paid continuation.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Stripe reports the first charge is scheduled for <strong>${firstChargeDate}</strong> at <strong>${(0, emailService_1.escapeHtml)(formatTransitionPrice(transition))}</strong> per ${(0, emailService_1.escapeHtml)(String(transition.billingCycle || 'billing period'))}.</p>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Review, cancel, or opt out before that date if you do not want paid access to continue.</p>
					${(0, emailBrand_1.renderMaintleyEmailButton)('Manage billing', safeDashboardUrl)}`,
            }),
        };
    }
    if (milestone === 'access_ending_7') {
        return {
            subject: `Your complimentary ${accessLabel} access ends soon`,
            html: (0, emailBrand_1.renderMaintleyEmailShell)({
                title: 'Complimentary access is ending',
                previewText: `Your access ends ${endDate}; your saved records remain available.`,
                bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your complimentary ${accessLabel} access ends on <strong>${endDate}</strong>.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Every existing property and saved record remains available through your resulting plan. New properties, team members, uploads, and premium processing pause when they exceed that plan's limits.</p>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">No automatic charge is scheduled. Continuing requires intentional Checkout.</p>
					${(0, emailBrand_1.renderMaintleyEmailButton)('Review plan options', safeUpgradeUrl)}`,
            }),
        };
    }
    return {
        subject: `Your complimentary ${accessLabel} period has ended`,
        html: (0, emailBrand_1.renderMaintleyEmailShell)({
            title: 'Your saved records remain available',
            previewText: 'Complimentary access ended without deleting your property memory.',
            bodyHtml: `${commonIntro}
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your complimentary ${accessLabel} access ended on <strong>${endDate}</strong>.</p>
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Your existing properties, files, maintenance history, and active relationships were not deleted. Premium processing and expansion beyond your resulting limits have stopped.</p>
				${(0, emailBrand_1.renderMaintleyEmailButton)('Open your account', safeDashboardUrl)}
				<span style="display:inline-block; width:8px;"></span>
				${(0, emailBrand_1.renderMaintleyEmailButton)('Review plan options', safeUpgradeUrl)}`,
        }),
    };
};
exports.renderPromotionalAccessLifecycleEmail = renderPromotionalAccessLifecycleEmail;
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
    return (String(normalizedSubscription.status || '').trim().toLowerCase() === 'active' &&
        (0, entitlements_1.hasCapability)(result, 'recurring_tasks.use') &&
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
const publishLifecycleNotice = async (milestone, accountId, ownerId, grantId, endsAtMs, timeZone, grant) => {
    const definition = getMilestoneDefinition(milestone, grant);
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
        access_ending_7: {
            title: 'Complimentary access ending soon',
            message: `Your access ends ${endDate}. Existing properties and saved records remain available through your resulting plan.`,
            actionLabel: 'Review your plan',
            actionUrl: '/profile',
        },
        renewal_30: {
            title: 'Paid continuation in 30 days',
            message: 'Review the first-charge date, recurring price, payment method, and opt-out options in Plan & Usage.',
            actionLabel: 'Manage billing',
            actionUrl: '/profile',
        },
        renewal_7: {
            title: 'Paid continuation in 7 days',
            message: 'Review or change your paid continuation before the first scheduled charge.',
            actionLabel: 'Manage billing',
            actionUrl: '/profile',
        },
        renewal_1: {
            title: 'Paid continuation tomorrow',
            message: 'Your account shows the scheduled first charge and a direct billing-management path.',
            actionLabel: 'Manage billing',
            actionUrl: '/profile',
        },
        expired: {
            title: 'Your account is now on Free',
            message: 'Your complete maintenance workflow remains available. New Homeowner+ Intelligence reviews and advanced processing have stopped.',
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
    const definition = getMilestoneDefinition(milestone, grant);
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
        const renderInput = {
            milestone,
            name: String(context.owner.firstName || context.owner.displayName || 'there'),
            endsAtMs: Number(grant.endsAtMs),
            timeZone,
            progress,
            dashboardUrl: (0, emailLinks_1.buildAppRouteUrl)('/dashboard', origin),
            upgradeUrl: (0, emailLinks_1.buildAppRouteUrl)('/paywall', origin),
        };
        const rendered = isHomeownerPlusTrial(grant)
            ? (0, exports.renderAccessLifecycleEmail)(renderInput)
            : (0, exports.renderPromotionalAccessLifecycleEmail)({ ...renderInput, grant });
        const resend = (0, emailService_1.getResendClient)(RESEND_API_KEY.value());
        const response = await (0, emailService_1.sendMaintleyEmail)(resend, {
            to: email,
            subject: rendered.subject,
            html: rendered.html,
            idempotencyKey: (0, exports.getLifecycleProviderIdempotencyKey)(accountId, deliveryId),
        });
        await publishLifecycleNotice(milestone, accountId, context.ownerId, grantId, Number(grant.endsAtMs), timeZone, grant);
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
    if (!String(grant.programId || '').trim() ||
        !String(grant.grantId || '').trim() ||
        !Number.isFinite(Number(grant.startsAtMs)) ||
        !Number.isFinite(Number(grant.endsAtMs)) ||
        Number(grant.endsAtMs) <= Number(grant.startsAtMs)) {
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
    const snapshot = await db.collectionGroup('entitlementGrants').get();
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
    if (failed > 0) {
        functions.logger.warn('Access lifecycle delivery requires operational review', {
            failed,
            candidates: snapshot.size,
        });
    }
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
exports.sendAdminAccessLifecycleEmail = functions
    .region('us-central1')
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!isLifecycleEnabled()) {
        throw new functions.https.HttpsError('failed-precondition', 'Access lifecycle communication is disabled.');
    }
    const authority = await (0, adminPortal_1.resolveGrantAdminAuthority)(context, String(data?.sessionToken || ''), true);
    const targetUserId = String(data?.targetUserId || '').trim();
    const grantId = String(data?.grantId || '').trim();
    const requestId = String(data?.requestId || '').trim();
    const reason = String(data?.reason || '').trim();
    const milestone = String(data?.milestone || 'activation');
    if (!targetUserId || !grantId || !/^[a-zA-Z0-9:_-]{8,120}$/.test(requestId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Target, grant, and stable request ID are required.');
    }
    if (reason.length < 10 || reason.length > 500) {
        throw new functions.https.HttpsError('invalid-argument', 'An audit reason between 10 and 500 characters is required.');
    }
    const targetSnapshot = await db.collection('users').doc(targetUserId).get();
    if (!targetSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Target user was not found.');
    }
    const target = targetSnapshot.data() || {};
    const accountId = String(target.accountId || targetUserId).trim();
    if (!(0, adminEntitlementGrantPolicy_1.isMaintleyOwnerGrantRole)(authority.maintleyRole) &&
        (authority.actorAccountId === accountId || authority.actorUserId === targetUserId)) {
        throw new functions.https.HttpsError('permission-denied', 'Administrators cannot send grant email to their own account.');
    }
    const accountRef = db.collection('familyAccounts').doc(accountId);
    const grantSnapshot = await accountRef.collection('entitlementGrants').doc(grantId).get();
    if (!grantSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'The access grant was not found.');
    }
    const grant = grantSnapshot.data();
    if (!getMilestoneDefinition(milestone, grant)) {
        throw new functions.https.HttpsError('invalid-argument', 'That message is not valid for this access program.');
    }
    const sentEventId = (0, entitlements_1.getAdminAuditEventId)('access_email.sent', requestId);
    const sentAuditRef = db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(sentEventId);
    if ((await sentAuditRef.get()).exists) {
        return { success: true, outcome: 'replayed', requestId };
    }
    const outcome = await processMilestone(accountRef, grant, milestone, Date.now());
    const action = outcome === 'sent' ? 'access_email.sent' : 'admin_action.replayed';
    const effectiveRequestId = outcome === 'sent' ? requestId : `${requestId}:replay`;
    const eventId = (0, entitlements_1.getAdminAuditEventId)(action, effectiveRequestId);
    await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(eventId).create({
        eventId,
        action,
        category: 'access_lifecycle',
        actorUserId: authority.actorUserId,
        targetAccountId: accountId,
        targetUserId,
        grantId,
        programId: String(grant.programId || ''),
        reason,
        requestId: effectiveRequestId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        before: { milestone, deliveryRequested: false },
        after: { milestone, deliveryRequested: true, outcome },
        metadata: { source: 'admin_access_email', templateVersion: exports.ACCESS_LIFECYCLE_TEMPLATE_VERSION },
    });
    return { success: true, outcome, requestId };
});
const OPERATIONAL_EMAIL_CATEGORIES = new Set([
    'support_follow_up',
    'account_notice',
    'billing_access',
]);
exports.sendAdminOperationalUserEmail = functions
    .region('us-central1')
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
    .https.onCall(async (data, context) => {
    const authority = await (0, adminPortal_1.resolveGrantAdminAuthority)(context, String(data?.sessionToken || ''), false);
    const targetUserId = String(data?.targetUserId || '').trim();
    const category = String(data?.category || '').trim();
    const subject = String(data?.subject || '').trim();
    const message = String(data?.message || '').trim();
    const reason = String(data?.reason || '').trim();
    const requestId = String(data?.requestId || '').trim();
    if (!targetUserId || !OPERATIONAL_EMAIL_CATEGORIES.has(category)) {
        throw new functions.https.HttpsError('invalid-argument', 'A target user and approved operational email category are required.');
    }
    if (subject.length < 5 || subject.length > 120) {
        throw new functions.https.HttpsError('invalid-argument', 'Subject must be between 5 and 120 characters.');
    }
    if (message.length < 10 || message.length > 3000) {
        throw new functions.https.HttpsError('invalid-argument', 'Message must be between 10 and 3,000 characters.');
    }
    if (reason.length < 10 || reason.length > 500) {
        throw new functions.https.HttpsError('invalid-argument', 'An audit reason between 10 and 500 characters is required.');
    }
    if (!/^[a-zA-Z0-9:_-]{8,120}$/.test(requestId)) {
        throw new functions.https.HttpsError('invalid-argument', 'A stable request ID is required.');
    }
    const eventId = (0, entitlements_1.getAdminAuditEventId)('user_email.sent', requestId);
    const auditRef = db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(eventId);
    if ((await auditRef.get()).exists) {
        return { success: true, outcome: 'replayed', requestId };
    }
    const targetSnapshot = await db.collection('users').doc(targetUserId).get();
    if (!targetSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Target user was not found.');
    }
    const target = targetSnapshot.data() || {};
    const email = String(target.email || '').trim().toLowerCase();
    if (!email) {
        throw new functions.https.HttpsError('failed-precondition', 'Target user does not have an email address.');
    }
    const displayName = `${String(target.firstName || '').trim()} ${String(target.lastName || '').trim()}`.trim() ||
        ' there';
    const safeMessage = (0, emailService_1.escapeHtml)(message).replace(/\r?\n/g, '<br />');
    const html = (0, emailBrand_1.renderMaintleyEmailShell)({
        title: (0, emailService_1.escapeHtml)(subject),
        previewText: (0, emailService_1.escapeHtml)(message.slice(0, 140)),
        eyebrow: 'Maintley account message',
        bodyHtml: `
					<p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">Hi ${(0, emailService_1.escapeHtml)(displayName)},</p>
					<p style="margin:0; font-size:15px; line-height:1.7; color:${emailBrand_1.EMAIL_BRAND.slate};">${safeMessage}</p>
				`,
        footerHtml: 'This operational message was sent by Maintley about your account or support request.',
    });
    await (0, emailService_1.sendMaintleyEmail)((0, emailService_1.getResendClient)(RESEND_API_KEY.value()), {
        to: email,
        subject,
        html,
        idempotencyKey: `admin-user-email-${requestId}`,
    });
    await auditRef.create({
        eventId,
        action: 'user_email.sent',
        category: 'admin_communication',
        actorUserId: authority.actorUserId,
        targetAccountId: String(target.accountId || targetUserId),
        targetUserId,
        reason,
        requestId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        before: { deliveryRequested: false },
        after: { deliveryRequested: true, deliveryStatus: 'sent' },
        metadata: { category, subject, recipientEmail: email },
    });
    return { success: true, outcome: 'sent', requestId };
});
