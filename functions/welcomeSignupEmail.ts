import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { escapeHtml, getResendClient, sendMaintleyEmail } from './emailService';

const RESEND_API_KEY = defineSecret(
	process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY',
);

if (!admin.apps.length) {
	admin.initializeApp();
}

interface SignupUserRecord {
	email?: string;
	firstName?: string;
	displayName?: string;
	isTeamMemberAccount?: boolean;
	welcomeEmailSentAt?: unknown;
}

const getDisplayName = (user: SignupUserRecord): string => {
	const name = String(user.firstName || user.displayName || '').trim();
	return name || 'there';
};

const getWelcomeEmailHtml = (
	name: string,
	appUrl: string,
	quickStartUrl: string,
): string => {
	const safeName = escapeHtml(name);
	const safeAppUrl = escapeHtml(appUrl);
	const safeQuickStartUrl = escapeHtml(quickStartUrl);

	return `
		<div style="background:#f4faf6; padding:24px; font-family: Arial, sans-serif; color:#1f2937;">
			<div style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #dfeee4; border-radius:14px; overflow:hidden;">
				<div style="background:linear-gradient(90deg,#065f46 0%,#047857 100%); color:#ffffff; padding:22px 24px;">
					<div style="font-size:13px; letter-spacing:0.04em; text-transform:uppercase; opacity:0.9;">Maintley</div>
					<h1 style="margin:10px 0 0; font-size:24px; line-height:1.3;">Welcome to Maintley</h1>
				</div>
				<div style="padding:24px;">
					<p style="margin:0 0 12px; font-size:15px; line-height:1.7;">Hi ${safeName},</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7;">Your account is ready. Maintley helps you stay organized with clear property records, maintenance history, and practical next steps.</p>
					<p style="margin:0 0 16px; font-size:15px; line-height:1.7;">A great first step is adding your first property, then checking in on upcoming tasks.</p>
					<div style="margin:20px 0 24px;">
						<a href="${safeQuickStartUrl}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:700; font-size:14px;">Open Maintley</a>
					</div>
					<div style="font-size:13px; color:#5f6b65; line-height:1.7;">
						Need help getting started? Visit your dashboard for guidance and recommended next actions.
					</div>
				</div>
				<div style="padding:14px 24px; border-top:1px solid #e8eee9; font-size:12px; color:#667085;">
					Maintley • <a href="${safeAppUrl}" style="color:#047857; text-decoration:none;">${safeAppUrl}</a>
				</div>
			</div>
		</div>
	`;
};

export const sendWelcomeSignupEmail = functions
	.runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 120, memory: '256MB' })
	.firestore.document('users/{userId}')
	.onCreate(async (snapshot, context) => {
		const user = snapshot.data() as SignupUserRecord;
		if (user.isTeamMemberAccount) {
			return null;
		}

		if (user.welcomeEmailSentAt) {
			return null;
		}

		const email = String(user.email || '').trim();
		if (!email) {
			functions.logger.info('Skipping welcome email due to missing email', {
				userId: context.params.userId,
			});
			return null;
		}

		const appUrl = String(process.env.APP_URL || 'https://maintleyapp.com').trim();
		const quickStartUrl = `${appUrl.replace(/\/$/, '')}/#/dashboard`;
		const resend = getResendClient(RESEND_API_KEY.value());

		if (!resend) {
			throw new Error('Resend client is not configured');
		}

		const recipientName = getDisplayName(user);
		await sendMaintleyEmail(resend, {
			to: email,
			subject: 'Welcome to Maintley',
			html: getWelcomeEmailHtml(recipientName, appUrl, quickStartUrl),
		});

		await snapshot.ref.set(
			{
				welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);

		functions.logger.info('Welcome signup email sent', {
			userId: context.params.userId,
			email,
		});

		return null;
	});
