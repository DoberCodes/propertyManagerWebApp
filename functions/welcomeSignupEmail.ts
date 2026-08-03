import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';
import { escapeHtml, getResendClient, sendMaintleyEmail } from './emailService';
import {
	EMAIL_BRAND,
	renderMaintleyEmailButton,
	renderMaintleyEmailShell,
} from './emailBrand';
import { buildAppRouteUrl, getCanonicalAppOrigin } from './emailLinks';

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

	return renderMaintleyEmailShell({
		title: 'Welcome to Maintley',
		previewText: 'Your Maintley account is ready.',
		bodyHtml: `
					<p style="margin:0 0 16px; font-size:15px; line-height:1.7;">Hi ${safeName},</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7;">Your account is ready.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7;">Maintley helps you keep property records, maintenance history, documents, and recurring care organized in one place.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7;">Most users start by adding a property and recording major systems like HVAC, Water Heater, and Smoke Detectors. As your records grow, Maintley can help surface maintenance opportunities and useful next steps.</p>
					<p style="margin:0 0 10px; font-size:15px; line-height:1.7; font-weight:700;">What you can do next:</p>
					<ul style="margin:0 0 20px 0; padding:0; list-style:none; font-size:15px; line-height:1.8; color:${EMAIL_BRAND.slate};">
						<li style="margin:0 0 4px;">✓ Add your first property</li>
						<li style="margin:0 0 4px;">✓ Record your major systems and appliances</li>
						<li style="margin:0 0 4px;">✓ Create your first maintenance task</li>
						<li style="margin:0;">✓ Upload manuals, receipts, or warranty information</li>
					</ul>
					<div style="margin:20px 0 20px;">${renderMaintleyEmailButton('Open Maintley', safeQuickStartUrl)}</div>
					<p style="margin:0; font-size:14px; color:${EMAIL_BRAND.slate}; line-height:1.7;">Need help getting started? Visit the Support Center for guides, tutorials, and answers to common questions.</p>
		`,
		footerHtml: `Maintley<br /><a href="${safeAppUrl}" style="color:${EMAIL_BRAND.primary}; text-decoration:none;">maintleyapp.com</a>`,
	});
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

		const appUrl = getCanonicalAppOrigin();
		const quickStartUrl = buildAppRouteUrl('/dashboard', appUrl);
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
