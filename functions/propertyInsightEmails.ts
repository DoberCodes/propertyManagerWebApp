import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import {
	escapeHtml,
	getResendClient,
	sendMaintleyEmail,
} from './emailService';
import { hasSubscriptionCapability } from './subscriptionEntitlements';

const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

interface UserSubscriptionLike {
	status?: string;
	plan?: string;
	trialEndsAt?: number | null;
	hasScheduledSubscription?: boolean;
	scheduledPlan?: string;
	pendingCheckoutPlan?: string;
	stripeSubscriptionId?: string;
}

interface PropertyInsightsUser {
	accountId?: string;
	email?: string;
	firstName?: string;
	displayName?: string;
	isTeamMemberAccount?: boolean;
	subscription?: UserSubscriptionLike;
	emailPreferences?: {
		propertyInsights?: boolean;
	};
}

interface InsightDevice {
	id: string;
	name?: string;
	type?: string;
	brand?: string;
	model?: string;
	serialNumber?: string;
	status?: string;
	decommissionDate?: string;
	location?: {
		propertyId?: string;
	};
	maintenanceHistory?: Array<{
		date?: string;
		description?: string;
	}>;
}

interface InsightEvent {
	id: string;
	title?: string;
	description?: string;
	completionNotes?: string;
	deviceIds?: string[];
	propertyId?: string;
}

interface InsightProperty {
	id: string;
	title?: string;
}

interface RecordObservation {
	title: string;
	body: string;
	propertyTitle?: string;
	priority: 'high' | 'medium' | 'low';
	deviceId?: string;
	tier: 1 | 2;
}

interface SendInsightResult {
	sent: boolean;
	skipped: boolean;
	reason?: string;
}

interface InsightSummary {
	observations: RecordObservation[];
	totalObservationCount: number;
	completenessScore: number;
	topOpportunities: string[];
}

const MAX_EMAIL_OBSERVATIONS = 5;

const canUsePropertyInsights = (user: PropertyInsightsUser): boolean =>
	hasSubscriptionCapability(user.subscription, 'property_intelligence.use');

const getDisplayName = (user: PropertyInsightsUser): string => {
	const name = (user.firstName || user.displayName || '').trim();
	return name || 'there';
};

const getAccountId = (userId: string, user: PropertyInsightsUser): string =>
	String(user.accountId || '').trim() || userId;

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

const getDeviceLabel = (device: InsightDevice): string => {
	const name = String(device.name || '').trim();
	const type = String(device.type || '').trim();
	const brand = String(device.brand || '').trim();
	const model = String(device.model || '').trim();
	return name || [brand, model].filter(Boolean).join(' ') || type || 'Appliance or system';
};

const getDeviceSearchLabel = (device: InsightDevice): string =>
	`${device.name || ''} ${device.type || ''}`.toLowerCase();

const getPropertyTitle = (
	device: InsightDevice,
	propertyById: Map<string, InsightProperty>,
): string | undefined => {
	const propertyId = String(device.location?.propertyId || '').trim();
	return propertyById.get(propertyId)?.title;
};

const eventText = (event: InsightEvent): string =>
	[
		event.title,
		event.description,
		event.completionNotes,
	]
		.map((value) => String(value || '').toLowerCase())
		.join(' ');

const getEventsForDevice = (
	deviceId: string,
	events: InsightEvent[],
): InsightEvent[] =>
	events.filter((event) =>
		Array.isArray(event.deviceIds) ? event.deviceIds.includes(deviceId) : false,
	);

const hasLocalDeviceHistory = (device: InsightDevice): boolean =>
	Array.isArray(device.maintenanceHistory) && device.maintenanceHistory.length > 0;

const isHvacLike = (device: InsightDevice): boolean => {
	const label = getDeviceSearchLabel(device);
	return (
		label.includes('hvac') ||
		label.includes('furnace') ||
		label.includes('air handler') ||
		label.includes('heat pump')
	);
};

const isWaterHeaterLike = (device: InsightDevice): boolean => {
	const label = getDeviceSearchLabel(device);
	return label.includes('water heater');
};

const isDryerLike = (device: InsightDevice): boolean => {
	const label = getDeviceSearchLabel(device);
	return label.includes('dryer');
};

const isSmokeDetectorLike = (device: InsightDevice): boolean => {
	const label = getDeviceSearchLabel(device);
	return (
		label.includes('smoke detector') ||
		label.includes('smoke alarm') ||
		label.includes('carbon monoxide') ||
		label.includes('co detector')
	);
};

const isTierOneInsightDevice = (device: InsightDevice): boolean => {
	const label = getDeviceSearchLabel(device);
	return (
		isHvacLike(device) ||
		isWaterHeaterLike(device) ||
		isDryerLike(device) ||
		isSmokeDetectorLike(device) ||
		label.includes('sump pump') ||
		label.includes('generator') ||
		label.includes('septic') ||
		label.includes('roof') ||
		label.includes('gutter') ||
		label.includes('irrigation') ||
		label.includes('sprinkler')
	);
};

const isTierTwoInsightDevice = (device: InsightDevice): boolean => {
	const label = getDeviceSearchLabel(device);
	return (
		label.includes('refrigerator') ||
		label.includes('dishwasher') ||
		label.includes('washer') ||
		label.includes('garage door')
	);
};

const isTierThreeInsightDevice = (device: InsightDevice): boolean => {
	const label = getDeviceSearchLabel(device);
	return (
		label.includes('microwave') ||
		label.includes('gfci') ||
		label.includes('outlet') ||
		label.includes('plumbing fixture') ||
		label.includes('faucet') ||
		label.includes('toilet') ||
		label.includes('ceiling fan')
	);
};

const getEmailInsightTier = (device: InsightDevice): 1 | 2 | 3 => {
	if (isTierOneInsightDevice(device)) return 1;
	if (isTierTwoInsightDevice(device)) return 2;
	if (isTierThreeInsightDevice(device)) return 3;
	return 3;
};

const hasFilterActivity = (events: InsightEvent[], device: InsightDevice): boolean => {
	const localHistoryText = (device.maintenanceHistory || [])
		.map((entry) => entry.description || '')
		.join(' ')
		.toLowerCase();
	return (
		localHistoryText.includes('filter') ||
		events.some((event) => eventText(event).includes('filter'))
	);
};

const hasSmokeTestActivity = (
	events: InsightEvent[],
	device: InsightDevice,
): boolean => {
	const localHistoryText = (device.maintenanceHistory || [])
		.map((entry) => entry.description || '')
		.join(' ')
		.toLowerCase();
	const combinedText = `${localHistoryText} ${events
		.map((event) => eventText(event))
		.join(' ')}`;
	return (
		combinedText.includes('test') ||
		combinedText.includes('battery') ||
		combinedText.includes('smoke') ||
		combinedText.includes('carbon monoxide')
	);
};

const getObservationWeight = (priority: RecordObservation['priority']): number => {
	if (priority === 'high') return 3;
	if (priority === 'medium') return 2;
	return 1;
};

const buildRecordInsightSummary = (
	devices: InsightDevice[],
	events: InsightEvent[],
	properties: InsightProperty[],
): InsightSummary => {
	const propertyById = new Map(properties.map((property) => [property.id, property]));
	const observationCandidates: RecordObservation[] = [];
	let devicesWithMaintenanceRecords = 0;
	let devicesWithCoreDetails = 0;

	if (devices.length === 0) {
		const observations: RecordObservation[] = [
			{
				title: 'No appliances or systems recorded',
				body: 'No appliances or systems have been documented in Maintley yet.',
				priority: 'high',
				tier: 1,
			},
		];
		return {
			observations,
			totalObservationCount: observations.length,
			completenessScore: 0,
			topOpportunities: ['Add appliances and systems to your property record'],
		};
	}

	for (const device of devices) {
		const label = getDeviceLabel(device);
		const propertyTitle = getPropertyTitle(device, propertyById);
		const deviceEvents = getEventsForDevice(device.id, events);
		const hasAnyMaintenanceRecord =
			deviceEvents.length > 0 || hasLocalDeviceHistory(device);
		const insightTier = getEmailInsightTier(device);
		const missingDetails = [
			!String(device.brand || '').trim() ? 'brand' : '',
			!String(device.model || '').trim() ? 'model' : '',
			!String(device.serialNumber || '').trim() ? 'serial number' : '',
		].filter(Boolean);
		const bodyLines: string[] = [];
		let priority: RecordObservation['priority'] = 'low';

		if (hasAnyMaintenanceRecord) {
			devicesWithMaintenanceRecords++;
		}
		if (missingDetails.length === 0) {
			devicesWithCoreDetails++;
		}

		if (insightTier === 3) {
			continue;
		}

		if (insightTier === 1) {
			if (isHvacLike(device) && !hasFilterActivity(deviceEvents, device)) {
				bodyLines.push(
					`No filter replacement activity has been recorded for this ${label} in Maintley.`,
				);
				priority = 'high';
			} else if (
				isSmokeDetectorLike(device) &&
				!hasSmokeTestActivity(deviceEvents, device)
			) {
				bodyLines.push(
					`No smoke or carbon monoxide testing activity has been recorded for this ${label} in Maintley.`,
				);
				priority = 'high';
			} else if (isWaterHeaterLike(device) && !hasAnyMaintenanceRecord) {
				bodyLines.push(
					'No maintenance activity has been recorded for this water heater in Maintley.',
				);
				priority = 'high';
			} else if (!hasAnyMaintenanceRecord && isDryerLike(device)) {
				bodyLines.push(
					'No maintenance activity has been recorded for this dryer in Maintley.',
				);
				priority = 'medium';
			} else if (!hasAnyMaintenanceRecord) {
				bodyLines.push(
					`No maintenance activity has been recorded for this ${label} in Maintley.`,
				);
				priority = 'medium';
			}
		}

		if (missingDetails.length >= 2) {
			bodyLines.push(
				`Additional details such as ${missingDetails.join(', ')} have not been recorded.`,
			);
			if (priority === 'low' && insightTier === 2) {
				priority = 'low';
			}
		}

		if (
			insightTier === 1 &&
			String(device.status || '').toLowerCase() === 'decommissioned' &&
			!String(device.decommissionDate || '').trim()
		) {
			bodyLines.push(
				`${label} is marked decommissioned, but no decommission date is recorded in Maintley.`,
			);
			if (priority === 'low') {
				priority = 'medium';
			}
		}

		if (bodyLines.length > 0) {
			observationCandidates.push({
				title: label,
				body: bodyLines.join(' '),
				propertyTitle,
				priority,
				deviceId: device.id,
				tier: insightTier,
			});
		}
	}

	const sortedObservations = observationCandidates.sort(
		(a, b) =>
			getObservationWeight(b.priority) - getObservationWeight(a.priority) ||
			a.tier - b.tier,
	);
	const observations =
		sortedObservations.length > 0
			? sortedObservations.slice(0, MAX_EMAIL_OBSERVATIONS)
			: [
					{
						title: 'No obvious record gaps found',
						body: 'Maintley did not find obvious documentation gaps in the appliances, systems, and maintenance history reviewed this month.',
						priority: 'low' as const,
						tier: 1 as const,
					},
			  ];
	const completenessScore = Math.round(
		((devicesWithMaintenanceRecords / devices.length) * 0.55 +
			(devicesWithCoreDetails / devices.length) * 0.35 +
			(events.length > 0 ? 0.1 : 0)) *
			100,
	);

	return {
		observations,
		totalObservationCount: sortedObservations.length || observations.length,
		completenessScore: Math.max(0, Math.min(100, completenessScore)),
		topOpportunities: observations.slice(0, 3).map((observation) => observation.title),
	};
};

const getPriorityLabel = (priority: RecordObservation['priority']): string => {
	if (priority === 'high') return 'High Priority';
	if (priority === 'medium') return 'Medium Priority';
	return 'Low Priority';
};

const getPriorityColor = (priority: RecordObservation['priority']): string => {
	if (priority === 'high') return '#0f766e';
	if (priority === 'medium') return '#2f6f4e';
	return '#667085';
};

const renderObservationRows = (observations: RecordObservation[]): string =>
	observations
		.map(
			(observation) => `
				<tr>
					<td style="padding:0 0 14px 0;">
						<div style="border:1px solid #dbe7dc; border-radius:16px; padding:18px; background:#ffffff;">
							<div style="font-size:11px; text-transform:uppercase; letter-spacing:0.08em; font-weight:900; color:${getPriorityColor(observation.priority)};">${getPriorityLabel(observation.priority)}</div>
							<div style="font-size:16px; font-weight:900; color:#10251a; margin-top:6px;">${escapeHtml(observation.title)}</div>
							${observation.propertyTitle ? `<div style="font-size:12px; color:#667085; margin-top:5px;">${escapeHtml(observation.propertyTitle)}</div>` : ''}
							<p style="margin:10px 0 0 0; font-size:14px; line-height:1.65; color:#405348;">${escapeHtml(observation.body)}</p>
						</div>
					</td>
				</tr>
			`,
		)
		.join('');

const renderTopOpportunities = (topOpportunities: string[]): string =>
	topOpportunities.length > 0
		? `
			<div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:900; color:#0f766e; margin-top:16px;">Possible record gaps to review</div>
			<ul style="margin:8px 0 0 20px; padding:0; color:#405348; font-size:14px; line-height:1.7;">
				${topOpportunities.map((opportunity) => `<li>${escapeHtml(opportunity)}</li>`).join('')}
			</ul>
		`
		: '';

const getPropertyInsightsHtml = ({
	name,
	deviceCount,
	historyCount,
	observations,
	totalObservationCount,
	completenessScore,
	topOpportunities,
	appUrl,
}: {
	name: string;
	deviceCount: number;
	historyCount: number;
	observations: RecordObservation[];
	totalObservationCount: number;
	completenessScore: number;
	topOpportunities: string[];
	appUrl: string;
}): string => {
	const dashboardUrl = appUrl.replace(/\/$/, '');
	const hiddenObservationCount = Math.max(
		0,
		totalObservationCount - observations.length,
	);

	return `
		<div style="margin:0; padding:0; background:#edf7ef; font-family:Arial,sans-serif; color:#10251a;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf7ef; padding:34px 14px;">
				<tr><td align="center">
					<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px; width:100%; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #cfe8d4; box-shadow:0 10px 30px rgba(16,37,26,0.08);">
						<tr>
							<td style="background:#0f766e; color:#ffffff; padding:30px 32px;">
								<div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; font-weight:800;">Maintley</div>
								<h1 style="margin:10px 0 0 0; font-size:28px; line-height:1.2;">Property Insights</h1>
								<p style="margin:10px 0 0 0; font-size:15px; line-height:1.6; color:#eaf8ee;">A focused review of possible record gaps in your documented property information.</p>
							</td>
						</tr>
						<tr><td style="padding:32px;">
							<p style="margin:0 0 22px 0; font-size:16px; line-height:1.65; color:#33443a;">Hi ${escapeHtml(name)}, Maintley reviewed your documented appliances, systems, and maintenance history for possible record gaps. These are observations about your records, not maintenance instructions.</p>

							<div style="border:1px solid #dbe7dc; border-radius:18px; padding:22px; margin-bottom:24px; background:#f8fbf8;">
								<div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; font-weight:800; color:#0f766e;">Property Record Completeness</div>
								<div style="font-size:40px; line-height:1.05; font-weight:900; color:#10251a; margin-top:8px;">${completenessScore}%</div>
								<div style="font-size:13px; color:#52625a; line-height:1.7; margin-top:8px;">${deviceCount} appliances/systems reviewed. ${historyCount} maintenance history records reviewed.</div>
								${renderTopOpportunities(topOpportunities)}
							</div>

							<div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; font-weight:900; color:#0f766e; margin-bottom:12px;">Top ${observations.length} ${observations.length === 1 ? 'Insight' : 'Insights'}</div>
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
								${renderObservationRows(observations)}
							</table>
							${hiddenObservationCount > 0 ? `<p style="margin:0 0 22px 0; font-size:13px; line-height:1.6; color:#667085;">${hiddenObservationCount} additional ${hiddenObservationCount === 1 ? 'observation is' : 'observations are'} available in Maintley.</p>` : ''}

							<a href="${escapeHtml(dashboardUrl)}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:13px 20px; border-radius:12px; font-size:14px; font-weight:900;">View all property insights</a>
						</td></tr>
						<tr><td style="padding:18px 32px; border-top:1px solid #e5efe7; font-size:12px; line-height:1.6; color:#667085;">Property Insights are documentation observations, not professional maintenance advice. They only reflect information recorded in Maintley. You can update email preferences anytime in Settings.</td></tr>
					</table>
				</td></tr>
			</table>
		</div>
	`;
};

const sendPropertyInsightsForUser = async (
	userId: string,
	appUrl: string,
): Promise<SendInsightResult> => {
	const userDoc = await db.collection('users').doc(userId).get();
	if (!userDoc.exists) {
		return { sent: false, skipped: true, reason: 'user_not_found' };
	}

	const user = userDoc.data() as PropertyInsightsUser;
	if (user.emailPreferences?.propertyInsights !== true) {
		return { sent: false, skipped: true, reason: 'property_insights_not_opted_in' };
	}

	if (!canUsePropertyInsights(user)) {
		return { sent: false, skipped: true, reason: 'plan_not_eligible' };
	}

	const email = String(user.email || '').trim();
	if (!email) {
		return { sent: false, skipped: true, reason: 'missing_email' };
	}

	const resendApiKey = RESEND_API_KEY.value();
	const resend = getResendClient(resendApiKey);
	if (!resend) {
		throw new Error('Resend client is not configured');
	}

	const accountId = getAccountId(userId, user);
	const [devices, events, properties] = await Promise.all([
		getDocsByAccount<InsightDevice>('devices', accountId, userId),
		getDocsByAccount<InsightEvent>('maintenanceEvents', accountId, userId),
		getDocsByAccount<InsightProperty>('properties', accountId, userId),
	]);
	const insightSummary = buildRecordInsightSummary(devices, events, properties);

	await sendMaintleyEmail(resend, {
		to: email,
		subject: 'Your Property Insights from Maintley',
		html: getPropertyInsightsHtml({
			name: getDisplayName(user),
			deviceCount: devices.length,
			historyCount: events.length,
			observations: insightSummary.observations,
			totalObservationCount: insightSummary.totalObservationCount,
			completenessScore: insightSummary.completenessScore,
			topOpportunities: insightSummary.topOpportunities,
			appUrl,
		}),
	});

	return { sent: true, skipped: false };
};

export const sendMonthlyPropertyInsights = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 540, memory: '256MB' })
	.pubsub.schedule('0 10 15 * *')
	.timeZone('America/New_York')
	.onRun(async () => {
		const logger = functions.logger;
		const appUrl = process.env.APP_URL || 'https://maintleyapp.com';

		const usersSnapshot = await db
			.collection('users')
			.where('emailPreferences.propertyInsights', '==', true)
			.get();

		let sent = 0;
		let skipped = 0;
		let failed = 0;

		for (const userDoc of usersSnapshot.docs) {
			try {
				const result = await sendPropertyInsightsForUser(userDoc.id, appUrl);
				if (result.sent) {
					sent++;
				} else {
					skipped++;
				}
			} catch (error) {
				failed++;
				logger.error('Property Insights email failed', {
					userId: userDoc.id,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}

		logger.info('Property Insights run complete', {
			totalCandidates: usersSnapshot.size,
			sent,
			skipped,
			failed,
		});

		return null;
	});

export const sendMonthlyPropertyInsightsTest = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 120, memory: '256MB' })
	.https.onCall(async (_data: Record<string, never>, context) => {
		if (!context.auth?.uid) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'You must be signed in to send a test Property Insights email.',
			);
		}

		const appUrl = process.env.APP_URL || 'https://maintleyapp.com';

		try {
			const result = await sendPropertyInsightsForUser(context.auth.uid, appUrl);
			if (result.skipped) {
				throw new functions.https.HttpsError(
					'failed-precondition',
					`Test Property Insights email was skipped: ${result.reason || 'unknown_reason'}`,
				);
			}

			return {
				success: true,
				message: 'Test Property Insights email sent.',
			};
		} catch (error) {
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}
			throw new functions.https.HttpsError(
				'internal',
				error instanceof Error
					? error.message
					: 'Failed to send test Property Insights email.',
			);
		}
	});
