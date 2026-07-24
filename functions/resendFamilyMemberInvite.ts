import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import {
	getResendClient,
	getDefaultFromAddress,
	sendMaintleyEmail,
} from './emailService';

const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

/**
 * Cloud function to resend password reset email to family member
 * Allows account owners to resend password reset links to family members
 */
export const resendFamilyMemberInvite = functions
	.runWith({ secrets: ['RESEND_API_KEY'] })
	.https.onCall(async (data: any, context: any) => {
		const apiKey = RESEND_API_KEY.value();
		const resend = getResendClient(apiKey);

		// Verify authentication
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const { userId, accountId } = data;

		// Validate input
		if (!userId || !accountId) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'Missing required fields: accountId and userId',
			);
		}

		try {
			// Verify the account exists and current user is owner/admin
			const accountDoc = await db
				.collection('familyAccounts')
				.doc(accountId)
				.get();

			if (!accountDoc.exists) {
				throw new functions.https.HttpsError(
					'not-found',
					'Family account not found',
				);
			}

			const accountData = accountDoc.data();
			const callerDoc = await db
				.collection('users')
				.doc(context.auth.uid)
				.get();
			const callerData = callerDoc.data() || {};
			const callerIsOwner = accountData?.ownerId === context.auth.uid;
			const callerIsAdmin =
				callerData.accountId === accountId && callerData.role === 'admin';
			if (!callerIsOwner && !callerIsAdmin) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'Only account owners or admins can resend password reset emails',
				);
			}

			// Verify the user is a member of this family account
			const memberIds = Array.isArray(accountData?.memberIds)
				? accountData.memberIds
				: [];
			if (!memberIds.includes(userId)) {
				throw new functions.https.HttpsError(
					'permission-denied',
					'User is not a member of this family account',
				);
			}

			// Get family member data
			const memberDoc = await db.collection('users').doc(userId).get();
			if (!memberDoc.exists) {
				throw new functions.https.HttpsError(
					'not-found',
					'Family member not found',
				);
			}

			const memberData = memberDoc.data();
			const memberEmail = String(memberData?.email || '');
			const memberFirstName = String(memberData?.firstName || 'there');

			// Get account owner data
			const ownerDoc = await db.collection('users').doc(context.auth.uid).get();
			const ownerName = ownerDoc.data()?.firstName || 'Account Owner';

			// Generate password reset link
			const resetLink = await admin
				.auth()
				.generatePasswordResetLink(memberEmail);

			// Send custom branded email
			if (resend) {
				try {
					const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #047857;">Password Reset for Maintley</h2>
            <p>Hi ${memberFirstName},</p>
              
            <p>${ownerName} has sent you a password reset link for your Maintley account.</p>

            <p>Click the button below to set a new password:</p>

            <p>
              <a href="${resetLink}" style="display: inline-block; background: #047857; color: #FFFFFF; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Set Your Password
              </a>
            </p>

            <p style="font-size:14px;color:#6b7280;">
              If you have trouble clicking the button, copy and paste this link into your browser:<br/>
              <a href="${resetLink}" style="color:#047857;word-break:break-all;">${resetLink}</a>
            </p>

            <p style="font-size:14px;color:#6b7280;">This link will expire in 1 hour.</p>

            <p>If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
        `;

					await sendMaintleyEmail(resend, {
						to: memberEmail,
						from: getDefaultFromAddress(),
						subject: 'Password Reset for Maintley',
						html,
					});

					console.log('Password reset email sent to:', memberEmail);

					return {
						success: true,
						message: `Password reset email sent to ${memberEmail}`,
					};
				} catch (emailError) {
					console.error('Failed to send password reset email:', emailError);
					throw new functions.https.HttpsError(
						'internal',
						'Failed to send password reset email',
					);
				}
			} else {
				throw new functions.https.HttpsError(
					'internal',
					'Email service not configured',
				);
			}
		} catch (error: any) {
			console.error('Error in resendFamilyMemberInvite:', error);
			if (error instanceof functions.https.HttpsError) {
				throw error;
			}
			throw new functions.https.HttpsError(
				'internal',
				'An unexpected error occurred',
			);
		}
	});
