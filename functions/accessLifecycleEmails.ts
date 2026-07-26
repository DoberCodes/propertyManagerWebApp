import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';
import {
	getAdminAuditEventId,
	getComplimentaryTransitionIssues,
	hasCapability,
	isSubscriptionCurrentlyEntitled,
	resolveAccountEntitlements,
} from '@maintley/entitlements';
import {
	EMAIL_BRAND,
	renderMaintleyEmailButton,
	renderMaintleyEmailShell,
} from './emailBrand';
import { buildAppRouteUrl, getCanonicalAppOrigin } from './emailLinks';
import { escapeHtml, getResendClient, sendMaintleyEmail } from './emailService';
import { publishMaintleyEventRecord } from './maintleyEventEngine';
import {
	HOMEOWNER_PLUS_TRIAL_GRANT_ID,
	HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
} from './entitlementGrants';
import { ENTITLEMENT_FEATURE_FLAGS } from './subscriptionEntitlements';
import {
	isMaintleyOwnerGrantRole,
} from './adminEntitlementGrantPolicy';
import { resolveGrantAdminAuthority } from './adminPortal';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);

export const ACCESS_LIFECYCLE_TEMPLATE_VERSION = 'v1';
export const ACCESS_LIFECYCLE_DELIVERIES_COLLECTION =
	'accessLifecycleDeliveries';
const DELIVERY_LEASE_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_TIME_ZONE = 'America/New_York';
const ADMIN_AUDIT_LOGS_COLLECTION = 'admin_audit_logs';

export type AccessLifecycleMilestone =
	| 'activation'
	| 'progress'
	| 'ending'
	| 'access_ending_7'
	| 'renewal_30'
	| 'renewal_7'
	| 'renewal_1'
	| 'expired';

export const ACCESS_LIFECYCLE_MILESTONES: ReadonlyArray<{
	id: AccessLifecycleMilestone;
	offsetDays: number;
	graceHours: number;
	inApp: boolean;
}> = Object.freeze([
	{ id: 'activation', offsetDays: 0, graceHours: 48, inApp: true },
	{ id: 'progress', offsetDays: 7, graceHours: 72, inApp: false },
	{ id: 'ending', offsetDays: 21, graceHours: 72, inApp: true },
	{ id: 'expired', offsetDays: 30, graceHours: 168, inApp: true },
]);

type GrantRecord = Record<string, unknown> & {
	grantId?: string;
	programId?: string;
	accountId?: string;
	state?: string;
	startsAtMs?: number;
	endsAtMs?: number;
	beneficiaryUserId?: string;
	bundleId?: string;
	transition?: Record<string, unknown>;
};

type ProgressCounts = {
	properties: number;
	equipment: number;
	documents: number;
	recurringTasks: number;
};

type LifecycleEmailInput = {
	milestone: AccessLifecycleMilestone;
	name: string;
	endsAtMs: number;
	timeZone: string;
	progress: ProgressCounts;
	dashboardUrl: string;
	upgradeUrl: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value ? (value as Record<string, unknown>) : {};

const toMillis = (value: unknown): number => {
	if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
	if (value && typeof value === 'object' && 'toMillis' in value) {
		return Number((value as { toMillis: () => number }).toMillis()) || 0;
	}
	const parsed = Date.parse(String(value || ''));
	return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTimeZone = (value: unknown): string => {
	const candidate = String(value || '').trim() || DEFAULT_TIME_ZONE;
	try {
		new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date());
		return candidate;
	} catch {
		return DEFAULT_TIME_ZONE;
	}
};

export const formatLifecycleDate = (
	valueMs: number,
	timeZone: string,
): string =>
	new Intl.DateTimeFormat('en-US', {
		timeZone: normalizeTimeZone(timeZone),
		month: 'long',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
		timeZoneName: 'short',
	}).format(new Date(valueMs));

type LifecycleMilestoneDefinition = {
	id: AccessLifecycleMilestone;
	targetAtMs: number;
	graceHours: number;
	inApp: boolean;
};

const isHomeownerPlusTrial = (grant: GrantRecord): boolean =>
	String(grant.programId || '') === HOMEOWNER_PLUS_TRIAL_PROGRAM_ID;

export const getLifecycleMilestoneDefinitions = (
	grant: GrantRecord,
): LifecycleMilestoneDefinition[] => {
	const startsAtMs = Number(grant.startsAtMs || 0);
	const endsAtMs = Number(grant.endsAtMs || 0);
	if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs)) return [];
	if (isHomeownerPlusTrial(grant)) {
		return ACCESS_LIFECYCLE_MILESTONES.map((definition) => ({
			id: definition.id,
			targetAtMs:
				definition.id === 'expired'
					? endsAtMs
					: startsAtMs + definition.offsetDays * DAY_MS,
			graceHours: definition.graceHours,
			inApp: definition.inApp,
		}));
	}

	const transition = asRecord(grant.transition);
	const automatic =
		transition.mode === 'automatic' &&
		getComplimentaryTransitionIssues(transition as any).length === 0;
	const firstChargeAtMs = toMillis(transition.firstChargeAt) || endsAtMs;
	const definitions: LifecycleMilestoneDefinition[] = [
		{ id: 'activation', targetAtMs: startsAtMs, graceHours: 48, inApp: true },
	];
	if (automatic) {
		for (const [id, days] of [
			['renewal_30', 30],
			['renewal_7', 7],
			['renewal_1', 1],
		] as const) {
			const targetAtMs = firstChargeAtMs - days * DAY_MS;
			// Activation already satisfies a reminder due on the same day.
			if (targetAtMs > startsAtMs + 60 * 1000) {
				definitions.push({ id, targetAtMs, graceHours: 72, inApp: true });
			}
		}
	} else {
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

const getMilestoneDefinition = (
	milestone: AccessLifecycleMilestone,
	grant: GrantRecord,
): LifecycleMilestoneDefinition | undefined =>
	getLifecycleMilestoneDefinitions(grant).find((candidate) => candidate.id === milestone);

const getMilestoneTargetMs = (
	milestone: AccessLifecycleMilestone,
	grant: GrantRecord,
): number => getMilestoneDefinition(milestone, grant)?.targetAtMs || 0;

export const getLifecycleDeliveryId = (
	grantId: string,
	milestone: AccessLifecycleMilestone,
	programId = HOMEOWNER_PLUS_TRIAL_PROGRAM_ID,
): string =>
	`${programId}__${grantId}__${milestone}__${ACCESS_LIFECYCLE_TEMPLATE_VERSION}`
		.replace(/[^a-zA-Z0-9_-]/g, '_')
		.slice(0, 180);

export const getLifecycleProviderIdempotencyKey = (
	accountId: string,
	deliveryId: string,
): string =>
	`${accountId}__${deliveryId}`
		.replace(/[^a-zA-Z0-9_-]/g, '_')
		.slice(0, 240);

export const getDueLifecycleMilestones = (
	grant: GrantRecord,
	nowMs: number,
): AccessLifecycleMilestone[] =>
	getLifecycleMilestoneDefinitions(grant).filter(
		(milestone) => milestone.targetAtMs <= nowMs,
	).map((milestone) => milestone.id);

const renderProgressCards = (progress: ProgressCounts): string =>
	[
		['Properties', progress.properties],
		['Systems and equipment', progress.equipment],
		['Documents', progress.documents],
		['Recurring tasks', progress.recurringTasks],
	]
		.map(
			([label, value]) => `
				<td width="50%" style="padding:6px;">
					<div style="background:${EMAIL_BRAND.canvas}; border:1px solid ${EMAIL_BRAND.accent}; border-radius:10px; padding:14px;">
						<div style="font-size:24px; font-weight:800; color:${EMAIL_BRAND.primary};">${value}</div>
						<div style="margin-top:4px; font-size:12px; color:${EMAIL_BRAND.slate};">${label}</div>
					</div>
				</td>`,
		)
		.reduce(
			(rows, card, index) =>
				`${rows}${index % 2 === 0 ? '<tr>' : ''}${card}${index % 2 === 1 ? '</tr>' : ''}`,
			'',
		);

export const renderAccessLifecycleEmail = ({
	milestone,
	name,
	endsAtMs,
	timeZone,
	progress,
	dashboardUrl,
	upgradeUrl,
}: LifecycleEmailInput): { subject: string; html: string } => {
	const safeName = escapeHtml(name || 'there');
	const endDate = escapeHtml(formatLifecycleDate(endsAtMs, timeZone));
	const safeDashboardUrl = escapeHtml(dashboardUrl);
	const safeUpgradeUrl = escapeHtml(upgradeUrl);
	const commonIntro = `<p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Hi ${safeName},</p>`;

	if (milestone === 'activation') {
		return {
			subject: 'Your first property is ready - Homeowner+ is active',
			html: renderMaintleyEmailShell({
				title: 'Congratulations on creating your first property',
				previewText: `Your complimentary Homeowner+ access ends ${endDate}.`,
				bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your first property record is ready. Creating it also activated 30 days of complimentary Homeowner+ access on your Free account. Access ends on <strong>${endDate}</strong>.</p>
					<div style="margin:18px 0; padding:16px; border-radius:10px; background:${EMAIL_BRAND.canvas}; border:1px solid ${EMAIL_BRAND.accent}; color:${EMAIL_BRAND.slate};"><strong>No payment method is connected.</strong><br />You will not be charged automatically. Continuing with Homeowner+ later requires an intentional Checkout.</div>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Continue setup to add the major systems you want Maintley to remember and review suggested recurring maintenance before anything is created.</p>
					${renderMaintleyEmailButton('Continue property setup', safeDashboardUrl)}`,
			}),
		};
	}

	if (milestone === 'progress') {
		return {
			subject: 'Your Homeowner+ trial progress',
			html: renderMaintleyEmailShell({
				title: 'Your property memory is taking shape',
				previewText: 'A factual summary of what you have recorded in Maintley.',
				bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Here is what is currently recorded in your Maintley account. These counts reflect saved records—not a physical inspection or certified maintenance history.</p>
					<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -6px 18px;">${renderProgressCards(progress)}</table>
					${renderMaintleyEmailButton('Open Maintley', safeDashboardUrl)}`,
			}),
		};
	}

	if (milestone === 'ending') {
		return {
			subject: `Your Homeowner+ trial ends ${endDate}`,
			html: renderMaintleyEmailShell({
				title: 'Your trial is ending soon',
				previewText: `Homeowner+ access ends ${endDate}; your records remain available.`,
				bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your complimentary Homeowner+ access ends on <strong>${endDate}</strong>.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your Free account, property records, maintenance history, and saved documents remain available. Homeowner+ automation—including recurring-care generation—stops when the trial ends.</p>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">You will not be charged automatically. Choose Homeowner+ through Checkout only if you want to continue.</p>
					${renderMaintleyEmailButton('Review Homeowner+ options', safeUpgradeUrl)}`,
			}),
		};
	}

	return {
		subject: 'Your Maintley account is now on the Free plan',
		html: renderMaintleyEmailShell({
			title: 'Your records are still here',
			previewText: 'Your Homeowner+ trial ended; your Free account and saved records remain available.',
			bodyHtml: `${commonIntro}
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your complimentary Homeowner+ access ended on <strong>${endDate}</strong>. Your account is now on the Free plan.</p>
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your property memory, maintenance history, and existing records have not expired. Homeowner+ automation has stopped, but you can still open and manage the information included with Free.</p>
				<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">You were not charged. If you want Homeowner+ again, you can intentionally start Checkout from Maintley.</p>
				${renderMaintleyEmailButton('Open your account', safeDashboardUrl)}
				<span style="display:inline-block; width:8px;"></span>
				${renderMaintleyEmailButton('Review Homeowner+ options', safeUpgradeUrl)}`,
		}),
	};
};

type PromotionalLifecycleEmailInput = LifecycleEmailInput & {
	grant: GrantRecord;
};

const bundleLabel = (bundleId: unknown): string => {
	const labels: Record<string, string> = {
		homeowner_plus: 'Homeowner+',
		multi_homeowner: 'Multi-Homeowner',
		property: 'Property',
		portfolio: 'Portfolio',
	};
	return labels[String(bundleId || '')] || 'Maintley';
};

const formatTransitionPrice = (transition: Record<string, unknown>): string => {
	const amount = Number(transition.recurringAmountMinor);
	const currency = String(transition.currency || 'USD').toUpperCase();
	if (!Number.isFinite(amount) || amount < 0) return 'the disclosed recurring price';
	try {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency,
		}).format(amount / 100);
	} catch {
		return `${currency} ${(amount / 100).toFixed(2)}`;
	}
};

export const renderPromotionalAccessLifecycleEmail = ({
	milestone,
	name,
	endsAtMs,
	timeZone,
	dashboardUrl,
	upgradeUrl,
	grant,
}: PromotionalLifecycleEmailInput): { subject: string; html: string } => {
	const safeName = escapeHtml(name || 'there');
	const accessLabel = escapeHtml(bundleLabel(grant.bundleId));
	const endDate = escapeHtml(formatLifecycleDate(endsAtMs, timeZone));
	const transition = asRecord(grant.transition);
	const automatic =
		transition.mode === 'automatic' &&
		getComplimentaryTransitionIssues(transition as any).length === 0;
	const firstChargeAtMs = toMillis(transition.firstChargeAt) || endsAtMs;
	const firstChargeDate = escapeHtml(formatLifecycleDate(firstChargeAtMs, timeZone));
	const safeDashboardUrl = escapeHtml(dashboardUrl);
	const safeUpgradeUrl = escapeHtml(upgradeUrl);
	const commonIntro = `<p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Hi ${safeName},</p>`;

	if (milestone === 'activation') {
		const transitionCopy = automatic
			? `Your complimentary period is connected to a Stripe billing relationship. Unless you opt out, the first charge is scheduled for <strong>${firstChargeDate}</strong> at <strong>${escapeHtml(formatTransitionPrice(transition))}</strong> per ${escapeHtml(String(transition.billingCycle || 'billing period'))}.`
			: transition.mode === 'checkout_required'
				? 'No automatic charge is scheduled. Continuing after the complimentary period requires an intentional Stripe Checkout.'
				: 'No payment method is required and no automatic charge is scheduled.';
		return {
			subject: `Your complimentary ${accessLabel} access is active`,
			html: renderMaintleyEmailShell({
				title: `${accessLabel} access is active`,
				previewText: `Your complimentary access ends ${endDate}.`,
				bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your account now includes complimentary <strong>${accessLabel}</strong> access through <strong>${endDate}</strong>.</p>
					<div style="margin:18px 0; padding:16px; border-radius:10px; background:${EMAIL_BRAND.canvas}; border:1px solid ${EMAIL_BRAND.accent}; color:${EMAIL_BRAND.slate};">${transitionCopy}</div>
					${renderMaintleyEmailButton('Open Maintley', safeDashboardUrl)}`,
			}),
		};
	}

	if (['renewal_30', 'renewal_7', 'renewal_1'].includes(milestone)) {
		const days = milestone === 'renewal_30' ? 30 : milestone === 'renewal_7' ? 7 : 1;
		return {
			subject: `${accessLabel} billing begins in ${days} day${days === 1 ? '' : 's'}`,
			html: renderMaintleyEmailShell({
				title: 'Upcoming paid continuation',
				previewText: `Your first charge is scheduled for ${firstChargeDate}.`,
				bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your complimentary ${accessLabel} period is approaching its paid continuation.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Stripe reports the first charge is scheduled for <strong>${firstChargeDate}</strong> at <strong>${escapeHtml(formatTransitionPrice(transition))}</strong> per ${escapeHtml(String(transition.billingCycle || 'billing period'))}.</p>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Review, cancel, or opt out before that date if you do not want paid access to continue.</p>
					${renderMaintleyEmailButton('Manage billing', safeDashboardUrl)}`,
			}),
		};
	}

	if (milestone === 'access_ending_7') {
		return {
			subject: `Your complimentary ${accessLabel} access ends soon`,
			html: renderMaintleyEmailShell({
				title: 'Complimentary access is ending',
				previewText: `Your access ends ${endDate}; your saved records remain available.`,
				bodyHtml: `${commonIntro}
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your complimentary ${accessLabel} access ends on <strong>${endDate}</strong>.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Every existing property and saved record remains available through your resulting plan. New properties, team members, uploads, and paid automation pause when they exceed that plan's limits.</p>
					<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">No automatic charge is scheduled. Continuing requires intentional Checkout.</p>
					${renderMaintleyEmailButton('Review plan options', safeUpgradeUrl)}`,
			}),
		};
	}

	return {
		subject: `Your complimentary ${accessLabel} period has ended`,
		html: renderMaintleyEmailShell({
			title: 'Your saved records remain available',
			previewText: 'Complimentary access ended without deleting your property memory.',
			bodyHtml: `${commonIntro}
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your complimentary ${accessLabel} access ended on <strong>${endDate}</strong>.</p>
				<p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Your existing properties, files, maintenance history, and active relationships were not deleted. Paid automation and expansion beyond your resulting limits have stopped.</p>
				${renderMaintleyEmailButton('Open your account', safeDashboardUrl)}
				<span style="display:inline-block; width:8px;"></span>
				${renderMaintleyEmailButton('Review plan options', safeUpgradeUrl)}`,
		}),
	};
};

const isLifecycleEnabled = (): boolean =>
	ENTITLEMENT_FEATURE_FLAGS.accessLifecycleCommunication === true;

const getProgressCounts = async (accountId: string): Promise<ProgressCounts> => {
	const getCount = async (
		collectionName: string,
		additionalFilter?: (record: Record<string, unknown>) => boolean,
	): Promise<number> => {
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

const hasConfirmedPaidAccess = (subscription: unknown, nowMs: number): boolean => {
	const normalizedSubscription = asRecord(subscription);
	const result = resolveAccountEntitlements({
		subscription: normalizedSubscription,
		grants: [],
		fallbackPlanId: 'homeowner',
		mode: 'compatibility',
		allowLegacyPlanWithoutStatus: true,
		featureFlags: ENTITLEMENT_FEATURE_FLAGS,
		nowMs,
	});
	return (
		String(normalizedSubscription.status || '').trim().toLowerCase() === 'active' &&
		hasCapability(result, 'recurring_tasks.use') &&
		isSubscriptionCurrentlyEntitled(normalizedSubscription, nowMs)
	);
};

const markDelivery = async (
	deliveryRef: admin.firestore.DocumentReference,
	data: Record<string, unknown>,
): Promise<void> => {
	await deliveryRef.set(
		{
			...data,
			updatedAt: admin.firestore.FieldValue.serverTimestamp(),
		},
		{ merge: true },
	);
};

const claimDelivery = async (
	deliveryRef: admin.firestore.DocumentReference,
	base: Record<string, unknown>,
	nowMs: number,
): Promise<boolean> =>
	db.runTransaction(async (transaction) => {
		const snapshot = await transaction.get(deliveryRef);
		const existing = snapshot.exists ? snapshot.data() || {} : {};
		if (existing.status === 'sent' || existing.status === 'skipped') return false;
		if (
			existing.status === 'processing' &&
			Number(existing.leaseExpiresAtMs || 0) > nowMs
		) {
			return false;
		}
		transaction.set(
			deliveryRef,
			{
				...base,
				status: 'processing',
				attempts: Number(existing.attempts || 0) + 1,
				leaseExpiresAtMs: nowMs + DELIVERY_LEASE_MS,
				lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
				createdAt:
					existing.createdAt || admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);
		return true;
	});

const getAccountAndOwner = async (
	accountRef: admin.firestore.DocumentReference,
	grant: GrantRecord,
): Promise<{
	account: Record<string, unknown>;
	owner: Record<string, unknown>;
	ownerId: string;
} | null> => {
	const accountSnapshot = await accountRef.get();
	if (!accountSnapshot.exists) return null;
	const account = accountSnapshot.data() || {};
	const ownerId = String(
		grant.beneficiaryUserId || account.ownerId || grant.accountId || accountRef.id,
	).trim();
	if (!ownerId) return null;
	const ownerSnapshot = await db.collection('users').doc(ownerId).get();
	if (!ownerSnapshot.exists) return null;
	return { account, owner: ownerSnapshot.data() || {}, ownerId };
};

const publishLifecycleNotice = async (
	milestone: AccessLifecycleMilestone,
	accountId: string,
	ownerId: string,
	grantId: string,
	endsAtMs: number,
	timeZone: string,
	grant: GrantRecord,
): Promise<void> => {
	const definition = getMilestoneDefinition(milestone, grant);
	if (!definition?.inApp) return;
	const endDate = formatLifecycleDate(endsAtMs, timeZone);
	const content: Record<AccessLifecycleMilestone, { title: string; message: string; actionLabel: string; actionUrl: string }> = {
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
			message: 'Your property memory and saved records are still available. Homeowner+ automation has stopped.',
			actionLabel: 'Open your account',
			actionUrl: '/dashboard',
		},
	};
	const notice = content[milestone];
	await publishMaintleyEventRecord({
		accountId,
		userId: ownerId,
		recipientIds: [ownerId],
		type: 'access_lifecycle',
		workflowKey: 'access-lifecycle',
		entityKey: `${grantId}-${milestone}-${ACCESS_LIFECYCLE_TEMPLATE_VERSION}`,
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

const processMilestone = async (
	accountRef: admin.firestore.DocumentReference,
	grant: GrantRecord,
	milestone: AccessLifecycleMilestone,
	nowMs: number,
): Promise<'sent' | 'skipped' | 'deferred'> => {
	const grantId = String(grant.grantId || HOMEOWNER_PLUS_TRIAL_GRANT_ID);
	const accountId = String(grant.accountId || accountRef.id);
	const programId = String(grant.programId || '');
	const deliveryId = getLifecycleDeliveryId(grantId, milestone, programId);
	const deliveryRef = accountRef
		.collection(ACCESS_LIFECYCLE_DELIVERIES_COLLECTION)
		.doc(deliveryId);
	const targetAtMs = getMilestoneTargetMs(milestone, grant);
	const definition = getMilestoneDefinition(milestone, grant);
	const base = {
		deliveryId,
		accountId,
		grantId,
		programId,
		milestone,
		templateVersion: ACCESS_LIFECYCLE_TEMPLATE_VERSION,
		targetAtMs,
	};

	const existing = await deliveryRef.get();
	if (
		existing.exists &&
		['sent', 'skipped'].includes(String(existing.data()?.status || ''))
	) {
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
	if (!(await claimDelivery(deliveryRef, base, nowMs))) return 'deferred';

	try {
		const timeZone = normalizeTimeZone(
			context.account.timeZone || context.owner.timeZone,
		);
		const progress = await getProgressCounts(accountId);
		const origin = getCanonicalAppOrigin();
		const renderInput = {
			milestone,
			name: String(context.owner.firstName || context.owner.displayName || 'there'),
			endsAtMs: Number(grant.endsAtMs),
			timeZone,
			progress,
			dashboardUrl: buildAppRouteUrl('/dashboard', origin),
			upgradeUrl: buildAppRouteUrl('/paywall', origin),
		};
		const rendered = isHomeownerPlusTrial(grant)
			? renderAccessLifecycleEmail(renderInput)
			: renderPromotionalAccessLifecycleEmail({ ...renderInput, grant });
		const resend = getResendClient(RESEND_API_KEY.value());
		const response = await sendMaintleyEmail(resend, {
			to: email,
			subject: rendered.subject,
			html: rendered.html,
			idempotencyKey: getLifecycleProviderIdempotencyKey(accountId, deliveryId),
		});
		await publishLifecycleNotice(
			milestone,
			accountId,
			context.ownerId,
			grantId,
			Number(grant.endsAtMs),
			timeZone,
			grant,
		);
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
	} catch (error) {
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

export const processAccessLifecycleGrant = async (
	accountRef: admin.firestore.DocumentReference,
	grant: GrantRecord,
	nowMs = Date.now(),
	onlyMilestone?: AccessLifecycleMilestone,
): Promise<void> => {
	if (!isLifecycleEnabled()) return;
	if (
		!String(grant.programId || '').trim() ||
		!String(grant.grantId || '').trim() ||
		!Number.isFinite(Number(grant.startsAtMs)) ||
		!Number.isFinite(Number(grant.endsAtMs)) ||
		Number(grant.endsAtMs) <= Number(grant.startsAtMs)
	) {
		return;
	}
	const due = onlyMilestone
		? [onlyMilestone]
		: getDueLifecycleMilestones(grant, nowMs);
	if (due.length === 0) return;
	const latestDue = due[due.length - 1];
	for (const milestone of due.slice(0, -1)) {
		const deliveryRef = accountRef
			.collection(ACCESS_LIFECYCLE_DELIVERIES_COLLECTION)
			.doc(
				getLifecycleDeliveryId(
					String(grant.grantId || ''),
					milestone,
					String(grant.programId || ''),
				),
			);
		const snapshot = await deliveryRef.get();
		if (!snapshot.exists) {
			await markDelivery(deliveryRef, {
				deliveryId: deliveryRef.id,
				accountId: accountRef.id,
				grantId: String(grant.grantId || ''),
				programId: String(grant.programId || ''),
				milestone,
				templateVersion: ACCESS_LIFECYCLE_TEMPLATE_VERSION,
				targetAtMs: getMilestoneTargetMs(milestone, grant),
				status: 'skipped',
				outcome: 'superseded_by_later_milestone',
				terminalAt: admin.firestore.FieldValue.serverTimestamp(),
			});
		}
	}
	await processMilestone(accountRef, grant, latestDue, nowMs);
};

export const sendAccessLifecycleActivationOnGrantCreate = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
	.firestore.document(
		'familyAccounts/{accountId}/entitlementGrants/{grantId}',
	)
	.onCreate(async (snapshot) => {
		await processAccessLifecycleGrant(
			snapshot.ref.parent.parent as admin.firestore.DocumentReference,
			snapshot.data() as GrantRecord,
			Date.now(),
			'activation',
		);
	});

export const sendAccessLifecycleEmails = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 540, memory: '256MB' })
	.pubsub.schedule('15 * * * *')
	.timeZone('Etc/UTC')
	.onRun(async () => {
		if (!isLifecycleEnabled()) return null;
		const snapshot = await db.collectionGroup('entitlementGrants').get();
		let processed = 0;
		let failed = 0;
		for (const grantDoc of snapshot.docs) {
			try {
				await processAccessLifecycleGrant(
					grantDoc.ref.parent.parent as admin.firestore.DocumentReference,
					grantDoc.data() as GrantRecord,
				);
				processed++;
			} catch (error) {
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

export const sendAccessLifecycleEmailTest = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
	.https.onCall(async (data: { milestone?: string }, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'You must be signed in to send a lifecycle test email.',
			);
		}
		if (!isLifecycleEnabled()) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Access lifecycle communication is disabled.',
			);
		}
		const milestone = String(data?.milestone || '') as AccessLifecycleMilestone;
		if (!ACCESS_LIFECYCLE_MILESTONES.some((item) => item.id === milestone)) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'A valid lifecycle milestone is required.',
			);
		}
		const userSnapshot = await db.collection('users').doc(context.auth.uid).get();
		const user = userSnapshot.data() || {};
		if (!['owner', 'admin'].includes(String(user.maintley_role || '').trim().toLowerCase())) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Lifecycle email tests are restricted to authorized Maintley staff.',
			);
		}
		const accountId = String(user.accountId || context.auth.uid);
		const grantSnapshot = await db
			.collection('familyAccounts')
			.doc(accountId)
			.collection('entitlementGrants')
			.doc(HOMEOWNER_PLUS_TRIAL_GRANT_ID)
			.get();
		if (!grantSnapshot.exists) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'No Homeowner+ trial grant is available for this account.',
			);
		}
		const email = String(user.email || '').trim();
		if (!email) {
			throw new functions.https.HttpsError(
				'failed-precondition',
				'Your account does not have an email address.',
			);
		}
		const grant = grantSnapshot.data() as GrantRecord;
		const progress = await getProgressCounts(accountId);
		const origin = getCanonicalAppOrigin();
		const rendered = renderAccessLifecycleEmail({
			milestone,
			name: String(user.firstName || user.displayName || 'there'),
			endsAtMs: Number(grant.endsAtMs),
			timeZone: normalizeTimeZone(user.timeZone),
			progress,
			dashboardUrl: buildAppRouteUrl('/dashboard', origin),
			upgradeUrl: buildAppRouteUrl('/paywall', origin),
		});
		await sendMaintleyEmail(getResendClient(RESEND_API_KEY.value()), {
			to: email,
			subject: `[Test] ${rendered.subject}`,
			html: rendered.html,
			idempotencyKey: `test-${context.auth.uid}-${milestone}-${Date.now()}`,
		});
		return { success: true, productionDeliveryStateWritten: false };
	});

export const sendAdminAccessLifecycleEmail = functions
	.region('us-central1')
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
	.https.onCall(
		async (
			data: {
				sessionToken?: string;
				targetUserId?: string;
				grantId?: string;
				milestone?: string;
				requestId?: string;
				reason?: string;
			},
			context,
		) => {
			if (!isLifecycleEnabled()) {
				throw new functions.https.HttpsError('failed-precondition', 'Access lifecycle communication is disabled.');
			}
			const authority = await resolveGrantAdminAuthority(
				context,
				String(data?.sessionToken || ''),
				true,
			);
			const targetUserId = String(data?.targetUserId || '').trim();
			const grantId = String(data?.grantId || '').trim();
			const requestId = String(data?.requestId || '').trim();
			const reason = String(data?.reason || '').trim();
			const milestone = String(data?.milestone || 'activation') as AccessLifecycleMilestone;
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
			if (
				!isMaintleyOwnerGrantRole(authority.maintleyRole) &&
				(authority.actorAccountId === accountId || authority.actorUserId === targetUserId)
			) {
				throw new functions.https.HttpsError('permission-denied', 'Administrators cannot send grant email to their own account.');
			}
			const accountRef = db.collection('familyAccounts').doc(accountId);
			const grantSnapshot = await accountRef.collection('entitlementGrants').doc(grantId).get();
			if (!grantSnapshot.exists) {
				throw new functions.https.HttpsError('not-found', 'The access grant was not found.');
			}
			const grant = grantSnapshot.data() as GrantRecord;
			if (!getMilestoneDefinition(milestone, grant)) {
				throw new functions.https.HttpsError('invalid-argument', 'That message is not valid for this access program.');
			}
			const sentEventId = getAdminAuditEventId('access_email.sent', requestId);
			const sentAuditRef = db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(sentEventId);
			if ((await sentAuditRef.get()).exists) {
				return { success: true, outcome: 'replayed', requestId };
			}
			const outcome = await processMilestone(accountRef, grant, milestone, Date.now());
			const action = outcome === 'sent' ? 'access_email.sent' : 'admin_action.replayed';
			const effectiveRequestId = outcome === 'sent' ? requestId : `${requestId}:replay`;
			const eventId = getAdminAuditEventId(action, effectiveRequestId);
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
				metadata: { source: 'admin_access_email', templateVersion: ACCESS_LIFECYCLE_TEMPLATE_VERSION },
			});
			return { success: true, outcome, requestId };
		},
	);
