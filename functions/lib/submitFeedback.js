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
exports.submitFeedback = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const emailService_1 = require("./emailService");
const RESEND_API_KEY = (0, params_1.defineSecret)(process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY');
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024;
const isFeedbackType = (value) => value === 'feedback' || value === 'feature_request' || value === 'bug_report';
const isSafeBase64 = (value) => /^[A-Za-z0-9+/=]+$/.test(value);
const sanitizeAttachmentFilename = (name) => name
    .replace(/[\r\n]/g, '')
    .trim()
    .slice(0, 120) || 'screenshot.png';
exports.submitFeedback = functions
    .runWith({ secrets: ['RESEND_API_KEY'] })
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to submit feedback.');
    }
    if (!data || !isFeedbackType(data.type)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid feedback type.');
    }
    const subject = (data.subject || '').trim();
    const message = (data.message || '').trim();
    if (!subject || !message) {
        throw new functions.https.HttpsError('invalid-argument', 'Subject and message are required.');
    }
    const apiKey = RESEND_API_KEY.value();
    const resend = (0, emailService_1.getResendClient)(apiKey);
    if (!resend) {
        throw new functions.https.HttpsError('internal', 'Email service is not configured.');
    }
    const feedbackTypeLabels = {
        feedback: 'General Feedback',
        feature_request: 'Feature Request',
        bug_report: 'Bug Report',
    };
    const escapedSubject = (0, emailService_1.escapeHtml)(subject);
    const escapedMessage = (0, emailService_1.escapeHtml)(message);
    const escapedUserName = (0, emailService_1.escapeHtml)(data.userName || 'there');
    const userEmail = (data.userEmail || '').trim() || undefined;
    const supportEmail = process.env.SUPPORT_EMAIL || 'maintleyapp@gmail.com';
    const helpCenterUrl = process.env.HELP_CENTER_URL || 'https://maintleyapp.com/#/help';
    const rawAttachments = Array.isArray(data.attachments)
        ? data.attachments
        : [];
    if (rawAttachments.length > MAX_ATTACHMENTS) {
        throw new functions.https.HttpsError('invalid-argument', `You can attach up to ${MAX_ATTACHMENTS} screenshots.`);
    }
    let totalAttachmentSize = 0;
    const emailAttachments = rawAttachments.map((attachment, index) => {
        if (!attachment || typeof attachment !== 'object') {
            throw new functions.https.HttpsError('invalid-argument', `Invalid attachment at index ${index}.`);
        }
        const filename = sanitizeAttachmentFilename(String(attachment.filename || ''));
        const contentType = String(attachment.contentType || '').trim();
        const contentBase64 = String(attachment.contentBase64 || '').trim();
        const declaredSize = Number(attachment.sizeBytes || 0);
        if (!contentType.startsWith('image/')) {
            throw new functions.https.HttpsError('invalid-argument', 'Only image attachments are supported.');
        }
        if (!contentBase64 || !isSafeBase64(contentBase64)) {
            throw new functions.https.HttpsError('invalid-argument', 'Attachment content is invalid.');
        }
        if (!Number.isFinite(declaredSize) ||
            declaredSize <= 0 ||
            declaredSize > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new functions.https.HttpsError('invalid-argument', 'Each screenshot must be 3MB or smaller.');
        }
        totalAttachmentSize += declaredSize;
        return {
            filename,
            content: contentBase64,
            type: contentType,
            sizeBytes: declaredSize,
        };
    });
    if (totalAttachmentSize > MAX_TOTAL_ATTACHMENT_SIZE_BYTES) {
        throw new functions.https.HttpsError('invalid-argument', 'Total screenshot size must be 8MB or less.');
    }
    const feedbackDoc = {
        type: data.type,
        subject,
        message,
        userId: context.auth.uid,
        userEmail,
        userName: data.userName || null,
        attachments: emailAttachments.map((attachment) => ({
            filename: attachment.filename,
            type: attachment.type,
            sizeBytes: attachment.sizeBytes,
        })),
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const feedbackRef = await db.collection('feedback').add(feedbackDoc);
    const internalSubject = `[Maintley] ${feedbackTypeLabels[data.type]}: ${subject}`;
    const internalHtml = `
			<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #6366f1;">New Feedback Received</h2>
				<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3 style="margin-top: 0; color: #374151;">Feedback Details</h3>
					<p><strong>Type:</strong> ${feedbackTypeLabels[data.type]}</p>
					<p><strong>Subject:</strong> ${escapedSubject}</p>
					<p><strong>From:</strong> ${data.userName || 'Anonymous'} ${userEmail ? `(${userEmail})` : ''}</p>
					<p><strong>User ID:</strong> ${context.auth.uid}</p>
					<p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
				</div>
				<div style="background: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3 style="margin-top: 0; color: #374151;">Message</h3>
					<div style="white-space: pre-wrap; line-height: 1.6;">${escapedMessage}</div>
				</div>
				<p style="font-size: 13px; color: #6b7280; margin: 0;">
					Screenshots attached: ${emailAttachments.length}
				</p>
			</div>
		`;
    const confirmationSubject = 'Thanks for your feedback — Maintley';
    const confirmationHtml = `
			<div style="margin:0; padding:0; background:#f3f4f6; font-family:Arial,sans-serif; color:#111827;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6; padding:24px 0;">
					<tr><td align="center">
						<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e5e7eb;">
							<tr><td style="background:#10b981; color:#ffffff; padding:20px 24px; font-size:24px; font-weight:700;">Maintley</td></tr>
							<tr><td style="padding:24px;">
								<h2 style="margin:0 0 12px 0; font-size:22px; color:#111827;">Thanks for your feedback, ${escapedUserName}!</h2>
								<p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#374151;">We received your ${feedbackTypeLabels[data.type].toLowerCase()} and our team will review it shortly.</p>
								<div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:16px; margin:0 0 16px 0;">
									<p style="margin:0 0 8px 0; font-size:14px; color:#065f46;"><strong>Subject:</strong> ${escapedSubject}</p>
									<p style="margin:0; font-size:14px; color:#065f46; white-space:pre-wrap;"><strong>Your message:</strong><br/>${escapedMessage}</p>
								</div>
								<a href="${helpCenterUrl}" style="display:inline-block; background:#10b981; color:#ffffff; text-decoration:none; padding:11px 18px; border-radius:8px; font-size:14px; font-weight:600;">Visit Help Center</a>
							</td></tr>
							<tr><td style="padding:16px 24px; border-top:1px solid #e5e7eb; font-size:12px; line-height:1.5; color:#6b7280;">Maintley Support • <a href="mailto:${supportEmail}" style="color:#10b981; text-decoration:none;">${supportEmail}</a></td></tr>
						</table>
					</td></tr>
				</table>
			</div>
		`;
    let confirmationEmailStatus = 'not_requested';
    let confirmationEmailError = null;
    try {
        await (0, emailService_1.sendMaintleyEmail)(resend, {
            to: 'maintleyapp@gmail.com',
            from: (0, emailService_1.getFeedbackFromAddress)(),
            subject: internalSubject,
            html: internalHtml,
            replyTo: userEmail || 'noreply@maintleyapp.com',
            attachments: emailAttachments.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                type: attachment.type,
            })),
        });
        if (userEmail) {
            try {
                await (0, emailService_1.sendMaintleyEmail)(resend, {
                    to: userEmail,
                    from: (0, emailService_1.getFeedbackFromAddress)(),
                    subject: confirmationSubject,
                    html: confirmationHtml,
                    replyTo: supportEmail,
                });
                confirmationEmailStatus = 'sent_via_resend';
            }
            catch (confirmationError) {
                confirmationEmailStatus = 'resend_failed';
                confirmationEmailError =
                    confirmationError instanceof Error
                        ? confirmationError.message
                        : String(confirmationError);
            }
        }
        await feedbackRef.update({
            status: 'sent_via_resend',
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            confirmationEmailStatus,
            ...(confirmationEmailStatus === 'sent_via_resend' && {
                confirmationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            ...(confirmationEmailError && { confirmationEmailError }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (error) {
        await feedbackRef.update({
            status: 'resend_failed',
            resendError: error instanceof Error ? error.message : String(error),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError('internal', 'Failed to submit feedback. Please try again.');
    }
    return {
        id: feedbackRef.id,
        message: 'Feedback submitted successfully',
    };
});
