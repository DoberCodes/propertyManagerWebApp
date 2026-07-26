import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';
import { getAdminAuditEventId } from '@maintley/entitlements';
import { resolveGrantAdminAuthority } from './adminPortal';
import { EMAIL_BRAND, renderMaintleyEmailShell } from './emailBrand';
import { escapeHtml, getResendClient, sendMaintleyEmail } from './emailService';

if (!admin.apps.length) admin.initializeApp();

const db = admin.firestore();
const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);
const ADMIN_AUDIT_LOGS_COLLECTION = 'admin_audit_logs';
const TEAM_ROLES = new Set(['owner', 'admin', 'support', 'operations']);
const ELEVATED_ROLES = new Set(['owner', 'admin']);

const normalizeRole = (value: unknown): string =>
	String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const roleFromValue = (value: unknown): string => {
	if (typeof value === 'string') return normalizeRole(value);
	if (!value || typeof value !== 'object') return '';
	const record = value as Record<string, unknown>;
	return normalizeRole(record.role || record.value || record.maintley_role);
};

const displayNameForUser = (user: Record<string, unknown>): string =>
	`${String(user.firstName || '').trim()} ${String(user.lastName || '').trim()}`.trim() ||
	String(user.email || '').trim() ||
	'Maintley team member';

export const adminPortalListMaintleyTeam = functions
	.region('us-central1')
	.https.onCall(async (data: { sessionToken?: string }, context) => {
		const authority = await resolveGrantAdminAuthority(
			context,
			String(data?.sessionToken || ''),
			false,
		);
		const snapshot = await db.collection('users').limit(1000).get();
		const members = snapshot.docs
			.map((document) => {
				const user = document.data() || {};
				const maintleyRole = roleFromValue(user.maintley_role);
				return {
					id: document.id,
					email: String(user.email || '').trim() || null,
					displayName: displayNameForUser(user),
					maintleyRole,
					permissions: Array.isArray(user.maintley_permissions)
						? user.maintley_permissions.map(String)
						: [],
					updatedAt: user.maintleyRoleUpdatedAt || user.updatedAt || null,
				};
			})
			.filter((member) => TEAM_ROLES.has(member.maintleyRole))
			.sort((left, right) => left.displayName.localeCompare(right.displayName));

		return {
			members,
			actorRole: normalizeRole(authority.maintleyRole),
			canAssignElevatedRoles: authority.isMaintleyOwner,
		};
	});

export const adminPortalMutateMaintleyTeam = functions
	.region('us-central1')
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 180, memory: '256MB' })
	.https.onCall(
		async (
			data: {
				sessionToken?: string;
				action?: 'invite' | 'update' | 'revoke';
				targetUserId?: string;
				email?: string;
				firstName?: string;
				lastName?: string;
				role?: string;
				reason?: string;
				requestId?: string;
				confirmation?: string;
			},
			context,
		) => {
			const authority = await resolveGrantAdminAuthority(
				context,
				String(data?.sessionToken || ''),
				false,
			);
			try {
			const action = String(data?.action || '') as 'invite' | 'update' | 'revoke';
			const nextRole = normalizeRole(data?.role);
			const reason = String(data?.reason || '').trim();
			const requestId = String(data?.requestId || '').trim();
			const confirmation = String(data?.confirmation || '').trim();
			if (!['invite', 'update', 'revoke'].includes(action)) {
				throw new functions.https.HttpsError('invalid-argument', 'A supported team action is required.');
			}
			if (reason.length < 10 || reason.length > 500) {
				throw new functions.https.HttpsError('invalid-argument', 'An audit reason between 10 and 500 characters is required.');
			}
			if (!/^[a-zA-Z0-9:_-]{8,120}$/.test(requestId)) {
				throw new functions.https.HttpsError('invalid-argument', 'A stable request ID is required.');
			}
			if (action !== 'revoke' && !TEAM_ROLES.has(nextRole)) {
				throw new functions.https.HttpsError('invalid-argument', 'A supported Maintley role is required.');
			}
			if (!authority.isMaintleyOwner && ELEVATED_ROLES.has(nextRole)) {
				throw new functions.https.HttpsError('permission-denied', 'Only the Maintley Owner can assign Owner or Admin authority.');
			}

			const auditAction = action === 'invite'
				? 'maintley_team.invited'
				: action === 'revoke'
					? 'maintley_team.revoked'
					: 'maintley_role.updated';
			const eventId = getAdminAuditEventId(auditAction, requestId);
			const auditRef = db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(eventId);
			if ((await auditRef.get()).exists) {
				return { success: true, outcome: 'replayed', requestId };
			}

			let authUser: admin.auth.UserRecord;
			let createdAuthUser = false;
			if (action === 'invite') {
				const email = String(data?.email || '').trim().toLowerCase();
				if (!email || !email.includes('@')) {
					throw new functions.https.HttpsError('invalid-argument', 'A valid invitation email is required.');
				}
				try {
					authUser = await admin.auth().getUserByEmail(email);
				} catch (error: any) {
					if (error?.code !== 'auth/user-not-found') throw error;
					authUser = await admin.auth().createUser({
						email,
						displayName: `${String(data?.firstName || '').trim()} ${String(data?.lastName || '').trim()}`.trim() || undefined,
					});
					createdAuthUser = true;
				}
			} else {
				const targetUserId = String(data?.targetUserId || '').trim();
				if (!targetUserId) {
					throw new functions.https.HttpsError('invalid-argument', 'A target user is required.');
				}
				authUser = await admin.auth().getUser(targetUserId);
			}

			const targetRef = db.collection('users').doc(authUser.uid);
			const targetSnapshot = await targetRef.get();
			const target = targetSnapshot.data() || {};
			const previousRole = roleFromValue(target.maintley_role);
			if (!authority.isMaintleyOwner && ELEVATED_ROLES.has(previousRole)) {
				throw new functions.https.HttpsError('permission-denied', 'Only the Maintley Owner can modify Owner or Admin team members.');
			}
			if (authUser.uid === authority.actorUserId && !authority.isMaintleyOwner) {
				throw new functions.https.HttpsError('permission-denied', 'Administrators cannot change their own Maintley role.');
			}
			if ((nextRole === 'owner' || previousRole === 'owner') && confirmation !== 'CONFIRM MAINTLEY OWNER') {
				throw new functions.https.HttpsError('failed-precondition', 'Owner changes require the confirmation phrase.');
			}
			if (action === 'revoke' && previousRole === 'owner') {
				const owners = await db.collection('users').where('maintley_role', '==', 'owner').limit(2).get();
				if (owners.size <= 1) {
					throw new functions.https.HttpsError('failed-precondition', 'The final Maintley Owner cannot be revoked.');
				}
			}

			const nextUserData: Record<string, unknown> = {
				email: String(target.email || authUser.email || '').trim().toLowerCase(),
				maintley_role: action === 'revoke' ? admin.firestore.FieldValue.delete() : nextRole,
				maintleyRoleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
				maintleyRoleUpdatedBy: authority.actorUserId,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			};
			if (!targetSnapshot.exists) {
				nextUserData.firstName = String(data?.firstName || '').trim();
				nextUserData.lastName = String(data?.lastName || '').trim();
				// Maintley employment authority is intentionally separate from the
				// customer's workspace role. A new employee starts with the same empty,
				// homeowner-oriented workspace as any other new customer identity.
				nextUserData.role = 'homeowner';
				nextUserData.createdAt = admin.firestore.FieldValue.serverTimestamp();
			}
			await targetRef.set(nextUserData, { merge: true });
			await auditRef.create({
				eventId,
				action: auditAction,
				category: 'maintley_team',
				actorUserId: authority.actorUserId,
				targetAccountId: authUser.uid,
				targetUserId: authUser.uid,
				reason,
				requestId,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				before: { maintleyRole: previousRole || null },
				after: { maintleyRole: action === 'revoke' ? null : nextRole },
				metadata: { email: authUser.email || null, createdAuthUser },
			});

			let invitationEmailOutcome: 'not_applicable' | 'sent' | 'failed' = 'not_applicable';
			if (action === 'invite') {
				try {
					const email = String(authUser.email || '').trim();
					const signInLink = createdAuthUser
						? await admin.auth().generatePasswordResetLink(email)
						: 'https://maintleyapp.com/login';
					const html = renderMaintleyEmailShell({
					title: 'You have been added to the Maintley team',
					previewText: 'Your Maintley team access is ready.',
					eyebrow: 'Maintley team',
					bodyHtml: `
						<p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">You were added as <strong>${escapeHtml(nextRole)}</strong>.</p>
						<p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${EMAIL_BRAND.slate};">Use the secure link below to ${createdAuthUser ? 'set your password and sign in' : 'open Maintley'}.</p>
						<a href="${escapeHtml(signInLink)}" style="display:inline-block; background:${EMAIL_BRAND.primary}; color:${EMAIL_BRAND.white}; text-decoration:none; padding:12px 18px; border-radius:9px; font-size:14px; font-weight:800;">Open Maintley</a>
					`,
					footerHtml: 'This invitation grants Maintley employment authority, not ownership of any customer property.',
					});
					await sendMaintleyEmail(getResendClient(RESEND_API_KEY.value()), {
						to: email,
						subject: 'Your Maintley team access',
						html,
						idempotencyKey: `maintley-team-${requestId}`,
					});
					invitationEmailOutcome = 'sent';
				} catch (emailError) {
					invitationEmailOutcome = 'failed';
					const failureRequestId = `${requestId}:email`;
					const failureEventId = getAdminAuditEventId('admin_action.failed', failureRequestId);
					await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(failureEventId).create({
						eventId: failureEventId,
						action: 'admin_action.failed',
						category: 'maintley_team',
						actorUserId: authority.actorUserId,
						targetAccountId: authUser.uid,
						targetUserId: authUser.uid,
						reason: 'Maintley role was assigned, but the invitation email could not be delivered.',
						requestId: failureRequestId,
						createdAt: admin.firestore.FieldValue.serverTimestamp(),
						before: { invitationEmail: 'pending' },
						after: { invitationEmail: 'failed' },
						metadata: { error: emailError instanceof Error ? emailError.message : String(emailError) },
					});
				}
			}

			return {
				success: true,
				outcome: 'completed',
				requestId,
				targetUserId: authUser.uid,
				createdAuthUser,
				invitationEmailOutcome,
			};
			} catch (mutationError) {
				const failedRequestId = String(data?.requestId || '').trim();
				if (/^[a-zA-Z0-9:_-]{8,120}$/.test(failedRequestId)) {
					const failureRequestId = `${failedRequestId}:failed`;
					const failureEventId = getAdminAuditEventId('admin_action.failed', failureRequestId);
					const failureRef = db.collection(ADMIN_AUDIT_LOGS_COLLECTION).doc(failureEventId);
					if (!(await failureRef.get()).exists) {
						await failureRef.create({
							eventId: failureEventId,
							action: 'admin_action.failed',
							category: 'maintley_team',
							actorUserId: authority.actorUserId,
							targetAccountId: String(data?.targetUserId || data?.email || 'unknown'),
							targetUserId: String(data?.targetUserId || '') || null,
							reason: String(data?.reason || '').trim() || 'Maintley Team administrative action failed.',
							requestId: failureRequestId,
							createdAt: admin.firestore.FieldValue.serverTimestamp(),
							before: null,
							after: { outcome: 'failed' },
							metadata: {
								action: String(data?.action || ''),
								error: mutationError instanceof Error ? mutationError.message : String(mutationError),
							},
						});
					}
				}
				throw mutationError;
			}
		},
	);
