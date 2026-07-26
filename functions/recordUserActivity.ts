import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();
const MINIMUM_ACTIVITY_WRITE_INTERVAL_MS = 5 * 60 * 1000;

const toMillis = (value: unknown): number => {
	if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
		return (value as { toMillis: () => number }).toMillis();
	}
	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value).getTime();
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
};

/**
 * Records activity only for the authenticated caller. The request deliberately
 * accepts no target user identifier, so admin inspection cannot update the
 * customer being inspected.
 */
export const recordUserActivity = functions
	.region('us-central1')
	.https.onCall(async (_data, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated.',
			);
		}

		const userRef = db.collection('users').doc(context.auth.uid);
		const nowMs = Date.now();
		let recorded = false;
		await db.runTransaction(async (transaction) => {
			const snapshot = await transaction.get(userRef);
			if (!snapshot.exists) {
				throw new functions.https.HttpsError('not-found', 'User profile not found.');
			}
			const lastActiveMs = toMillis(snapshot.data()?.lastActiveAt);
			if (lastActiveMs && nowMs - lastActiveMs < MINIMUM_ACTIVITY_WRITE_INTERVAL_MS) {
				return;
			}
			transaction.update(userRef, {
				lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
			});
			recorded = true;
		});

		return { success: true, recorded };
	});
