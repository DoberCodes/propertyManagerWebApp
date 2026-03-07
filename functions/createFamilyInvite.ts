import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import { defineSecret } from 'firebase-functions/params';
import {
	getDefaultFromAddress,
	getResendClient,
	sendMaintleyEmail,
} from './emailService';

const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

interface CreateFamilyMemberRequest {
	accountId: string;
	email: string;
	firstName: string;
	lastName: string;
	role?: 'owner' | 'admin' | 'member';
}

export const createFamilyInvite = functions
	.runWith({ secrets: ['RESEND_API_KEY'] })
	.https.onCall(async (data: CreateFamilyMemberRequest, context) => {
		if (!context.auth) {
			throw new functions.https.HttpsError(
				'unauthenticated',
				'User must be authenticated',
			);
		}

		const accountId = String(data?.accountId || '').trim();
		const email = String(data?.email || '').trim();
		const firstName = String(data?.firstName || '').trim();
		const lastName = String(data?.lastName || '').trim();
		const role = (data?.role || 'member') as 'owner' | 'admin' | 'member';

		if (!accountId || !email || !firstName || !lastName) {
			throw new functions.https.HttpsError(
				'invalid-argument',
				'accountId, email, firstName, and lastName are required',
			);
		}

		const normalizedEmail = email.toLowerCase();
		const apiKey = RESEND_API_KEY.value();
		const resend = getResendClient(apiKey);

		// Verify family account exists and caller is owner/admin on that account
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

		const accountData = accountDoc.data() || {};
		const callerDoc = await db.collection('users').doc(context.auth.uid).get();
		const callerData = callerDoc.data() || {};
		const callerIsOwner = accountData.ownerId === context.auth.uid;
		const callerIsAdmin =
			callerData.accountId === accountId && callerData.role === 'admin';

		if (!callerIsOwner && !callerIsAdmin) {
			throw new functions.https.HttpsError(
				'permission-denied',
				'Only account owners or admins can add family members',
			);
		}

		// Check family size limit (owner + 2 members = 3 total)
		const memberIds = Array.isArray(accountData.memberIds)
			? (accountData.memberIds as string[])
			: [];

		if (memberIds.length >= 3) {
			throw new functions.https.HttpsError(
				'resource-exhausted',
				'Family accounts are limited to 2 family members (plus the account owner)',
			);
		}

		// Check if user already exists
		let userExists = false;
		try {
			await admin.auth().getUserByEmail(normalizedEmail);
			userExists = true;
		} catch (error: unknown) {
			const code = (error as { code?: string })?.code;
			if (code !== 'auth/user-not-found') {
				throw error;
			}
		}

		if (userExists) {
			throw new functions.https.HttpsError(
				'already-exists',
				'User with this email already exists',
			);
		}

		// Get owner info for email
		const ownerDoc = await db.collection('users').doc(context.auth.uid).get();
		const ownerName =
			ownerDoc.data()?.firstName || ownerDoc.data()?.email || 'Account Owner';

		// Generate random secure password
		const tempPassword = randomBytes(32).toString('hex');

		// Create Firebase Auth user
		const userRecord = await admin.auth().createUser({
			email: normalizedEmail,
			password: tempPassword,
			emailVerified: false,
			displayName: `${firstName} ${lastName}`,
		});

		const userId = userRecord.uid;

		try {
			// Create user document in Firestore
			await db.collection('users').doc(userId).set({
				uid: userId,
				email: normalizedEmail,
				firstName,
				lastName,
				role,
				accountId,
				createdAt: admin.firestore.FieldValue.serverTimestamp(),
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			});

			// Add user to family memberIds
			await db
				.collection('familyAccounts')
				.doc(accountId)
				.update({
					memberIds: admin.firestore.FieldValue.arrayUnion(userId),
					updatedAt: admin.firestore.FieldValue.serverTimestamp(),
				});

			// Generate password reset link
			const resetLink = await admin
				.auth()
				.generatePasswordResetLink(normalizedEmail);

			// Send custom branded email with password reset link
			if (resend) {
				const html = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #10b981;">Welcome to Maintley!</h2>
					<p>Hi ${firstName},</p>
					<p>${ownerName} has added you to their family account on Maintley.</p>
					<p>Your account has been created. Click the button below to set your password and get started:</p>
					<p>
						<a href="${resetLink}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
							Set Your Password
						</a>
					</p>
					<p style="font-size:14px;color:#6b7280;">
						If you have trouble clicking the button, copy and paste this link into your browser:<br/>
						<a href="${resetLink}" style="color:#10b981;word-break:break-all;">${resetLink}</a>
					</p>
					<p style="font-size:14px;color:#6b7280;">This link will expire in 1 hour.</p>
				</div>
				`;

				console.log('Sending welcome email to:', normalizedEmail);
				try {
					const emailResult = await sendMaintleyEmail(resend, {
						to: normalizedEmail,
						from: getDefaultFromAddress(),
						subject: `${ownerName} added you to Maintley`,
						html,
					});
					console.log('Email sent successfully:', emailResult);
				} catch (emailError) {
					console.error('Failed to send email:', emailError);
					// Don't throw - account is already created
				}
			} else {
				console.warn('Resend client not available, email not sent');
			}

			return {
				success: true,
				userId,
				message: 'Family member added successfully',
			};
		} catch (error) {
			// Rollback: delete the created user if anything fails
			console.error('Error creating family member, rolling back:', error);
			try {
				await admin.auth().deleteUser(userId);
			} catch (deleteError) {
				console.error('Failed to rollback user creation:', deleteError);
			}
			throw error;
		}
	});
