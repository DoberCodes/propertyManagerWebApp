import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();
const FEEDBACK_COLLECTION = 'feedback';
const CLOSED_STATUSES = new Set(['closed']);
const RETENTION_DAYS = 90;

const extractStoragePathFromGsUrl = (value: string): string | null => {
	const raw = String(value || '').trim();
	if (!raw.toLowerCase().startsWith('gs://')) return null;
	const withoutPrefix = raw.slice(5);
	const slashIndex = withoutPrefix.indexOf('/');
	if (slashIndex <= 0 || slashIndex >= withoutPrefix.length - 1) return null;
	return withoutPrefix.slice(slashIndex + 1);
};

const extractStoragePathFromDownloadUrl = (value: string): string | null => {
	const raw = String(value || '').trim();
	if (!raw) return null;

	try {
		const parsed = new URL(raw);
		if (!parsed.hostname.includes('firebasestorage.googleapis.com')) return null;
		const marker = '/o/';
		const markerIndex = parsed.pathname.indexOf(marker);
		if (markerIndex === -1) return null;
		const encodedPath = parsed.pathname.slice(markerIndex + marker.length);
		if (!encodedPath) return null;
		return decodeURIComponent(encodedPath);
	} catch {
		return null;
	}
};

const parseDateValue = (value: unknown): Date | null => {
	if (!value) return null;

	if (value instanceof Date) {
		return Number.isNaN(value.getTime()) ? null : value;
	}

	if (typeof value === 'string') {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	if (typeof value === 'object') {
		const record = value as Record<string, unknown>;

		if (typeof (record as { toDate?: unknown }).toDate === 'function') {
			const converted = (record as { toDate: () => Date }).toDate();
			return Number.isNaN(converted.getTime()) ? null : converted;
		}

		const seconds = Number(record.seconds || 0);
		if (Number.isFinite(seconds) && seconds > 0) {
			const parsed = new Date(seconds * 1000);
			return Number.isNaN(parsed.getTime()) ? null : parsed;
		}
	}

	return null;
};

const resolveAttachmentPath = (attachment: Record<string, unknown>): string => {
	const directPath = String(attachment.path || attachment.storagePath || '').trim();
	if (directPath) return directPath;

	const gsPath = extractStoragePathFromGsUrl(String(attachment.attachmentUrl || attachment.url || ''));
	if (gsPath) return gsPath;

	const downloadPath = extractStoragePathFromDownloadUrl(
		String(attachment.attachmentUrl || attachment.url || ''),
	);
	return downloadPath || '';
};

const isOlderThanRetention = (value: Date, now: Date): boolean => {
	const retentionMillis = RETENTION_DAYS * 24 * 60 * 60 * 1000;
	return now.getTime() - value.getTime() >= retentionMillis;
};

const getIsoWeekNumber = (date: Date): number => {
	const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const dayNumber = target.getUTCDay() || 7;
	target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
	const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
	return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const cleanupClosedFeedbackAttachments = functions.pubsub
	.schedule('0 3 * * 1')
	.timeZone('Etc/UTC')
	.onRun(async () => {
		const now = new Date();
		const isoWeek = getIsoWeekNumber(now);
		if (isoWeek % 2 !== 0) {
			functions.logger.info('Skipping cleanup this week (bi-weekly cadence).', {
				isoWeek,
			});
			return null;
		}

		const snapshot = await db
			.collection(FEEDBACK_COLLECTION)
			.where('status', '==', 'closed')
			.get();

		let processedTickets = 0;
		let deletedFiles = 0;
		let updatedTickets = 0;

		const bucket = admin.storage().bucket();

		for (const doc of snapshot.docs) {
			const data = (doc.data() || {}) as Record<string, unknown>;
			const status = String(data.status || '').trim().toLowerCase();
			if (!CLOSED_STATUSES.has(status)) continue;

			const closedAt = parseDateValue(data.closedAt);
			const updatedAt = parseDateValue(data.updatedAt);
			const createdAt = parseDateValue(data.createdAt);
			const referenceDate = closedAt || updatedAt || createdAt;

			if (!referenceDate || !isOlderThanRetention(referenceDate, now)) {
				continue;
			}

			const attachments = Array.isArray(data.attachments)
				? (data.attachments as unknown[])
				: [];

			if (attachments.length === 0) continue;

			processedTickets += 1;
			let hasAttachmentChanges = false;
			const nextAttachments = await Promise.all(
				attachments.map(async (rawAttachment) => {
					const attachment =
						typeof rawAttachment === 'object' && rawAttachment
							? ({ ...(rawAttachment as Record<string, unknown>) } as Record<string, unknown>)
							: ({ filename: String(rawAttachment || 'attachment') } as Record<string, unknown>);

					if (attachment.isDeleted || attachment.deletedAt) {
						return attachment;
					}

					const path = resolveAttachmentPath(attachment);
					if (path) {
						try {
							await bucket.file(path).delete({ ignoreNotFound: true });
							deletedFiles += 1;
						} catch (error) {
							functions.logger.warn(
								`Attachment cleanup failed for ${doc.id} at ${path}`,
								error,
							);
						}
					}

					hasAttachmentChanges = true;
					return {
						...attachment,
						isDeleted: true,
						deleteReason: 'retention_expired',
						deletedAt: now.toISOString(),
						attachmentUrl: null,
					};
				}),
			);

			if (!hasAttachmentChanges) continue;

			await doc.ref.set(
				{
					attachments: nextAttachments,
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				},
				{ merge: true },
			);
			updatedTickets += 1;
		}

		functions.logger.info('Closed feedback attachment cleanup complete', {
			retentionDays: RETENTION_DAYS,
			processedTickets,
			updatedTickets,
			deletedFiles,
		});

		return null;
	});
