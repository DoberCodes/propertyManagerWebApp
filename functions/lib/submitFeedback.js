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
exports.listMyFeedbackTickets = exports.submitFeedback = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const crypto_1 = require("crypto");
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
const FEEDBACK_TICKET_COUNTER_COLLECTION = 'system_counters';
const FEEDBACK_TICKET_COUNTER_DOC = 'feedback_ticket_number';
const FEEDBACK_TICKET_PREFIX = 'MNT';
const isFeedbackType = (value) => value === 'feedback' || value === 'feature_request' || value === 'bug_report';
const isSafeBase64 = (value) => /^[A-Za-z0-9+/=]+$/.test(value);
const sanitizeAttachmentFilename = (name) => name
    .replace(/[\r\n]/g, '')
    .trim()
    .slice(0, 120) || 'screenshot.png';
const formatFeedbackTicketNumber = (sequence) => `${FEEDBACK_TICKET_PREFIX}-${String(sequence).padStart(6, '0')}`;
const extractStoragePathFromGsUrl = (urlValue) => {
    const trimmed = String(urlValue || '').trim();
    if (!trimmed.toLowerCase().startsWith('gs://')) {
        return null;
    }
    const withoutPrefix = trimmed.slice(5);
    const slashIndex = withoutPrefix.indexOf('/');
    if (slashIndex === -1 || slashIndex === withoutPrefix.length - 1) {
        return null;
    }
    return withoutPrefix.slice(slashIndex + 1);
};
const allocateFeedbackTicketNumber = async () => {
    const counterRef = db
        .collection(FEEDBACK_TICKET_COUNTER_COLLECTION)
        .doc(FEEDBACK_TICKET_COUNTER_DOC);
    const ticketSequence = await db.runTransaction(async (tx) => {
        var _a;
        const counterSnapshot = await tx.get(counterRef);
        const currentSequence = Number(((_a = counterSnapshot.data()) === null || _a === void 0 ? void 0 : _a.current) || 0);
        const nextSequence = Number.isFinite(currentSequence)
            ? currentSequence + 1
            : 1;
        tx.set(counterRef, {
            current: nextSequence,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return nextSequence;
    });
    return {
        ticketSequence,
        ticketNumber: formatFeedbackTicketNumber(ticketSequence),
    };
};
const normalizePersistedAttachments = async (rawAttachments) => {
    if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
        return [];
    }
    const bucket = admin.storage().bucket();
    const normalized = await Promise.all(rawAttachments.map(async (rawAttachment, index) => {
        var _a, _b;
        const fallbackName = `attachment-${index + 1}`;
        if (typeof rawAttachment === 'string') {
            const value = rawAttachment.trim();
            if (!value) {
                return {
                    filename: fallbackName,
                    type: 'image/unknown',
                    sizeBytes: 0,
                };
            }
            if (/^https?:\/\//i.test(value)) {
                return {
                    filename: fallbackName,
                    type: 'image/unknown',
                    sizeBytes: 0,
                    attachmentUrl: value,
                };
            }
            const parsedPath = extractStoragePathFromGsUrl(value) || value;
            try {
                const [metadata] = await bucket.file(parsedPath).getMetadata();
                const token = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.metadata) === null || _a === void 0 ? void 0 : _a.firebaseStorageDownloadTokens;
                const attachmentUrl = token
                    ? `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(parsedPath)}?alt=media&token=${token}`
                    : undefined;
                return {
                    filename: fallbackName,
                    type: 'image/unknown',
                    sizeBytes: 0,
                    path: parsedPath,
                    ...(attachmentUrl ? { attachmentUrl } : {}),
                };
            }
            catch {
                return {
                    filename: fallbackName,
                    type: 'image/unknown',
                    sizeBytes: 0,
                    path: parsedPath,
                };
            }
        }
        const attachment = typeof rawAttachment === 'object' && rawAttachment
            ? rawAttachment
            : {};
        const filename = sanitizeAttachmentFilename(String(attachment.filename || fallbackName));
        const type = String(attachment.type || attachment.contentType || 'image/unknown');
        const sizeBytes = Number(attachment.sizeBytes || 0);
        const rawUrl = String(attachment.attachmentUrl || attachment.url || attachment.downloadUrl || '').trim();
        const rawPath = String(attachment.path || attachment.storagePath || '').trim();
        let attachmentUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : '';
        let path = rawPath;
        if (!path && rawUrl.toLowerCase().startsWith('gs://')) {
            path = extractStoragePathFromGsUrl(rawUrl) || '';
        }
        if (!attachmentUrl && path) {
            try {
                const [metadata] = await bucket.file(path).getMetadata();
                const token = (_b = metadata === null || metadata === void 0 ? void 0 : metadata.metadata) === null || _b === void 0 ? void 0 : _b.firebaseStorageDownloadTokens;
                if (token) {
                    attachmentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
                }
            }
            catch {
                // keep returning metadata even when URL generation fails
            }
        }
        return {
            filename,
            type,
            sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
            ...(path ? { path } : {}),
            ...(attachmentUrl ? { attachmentUrl } : {}),
        };
    }));
    return normalized;
};
const serializeTimestampValue = (value) => {
    if (value && typeof value === 'object' && 'toDate' in value) {
        const tsObj = value;
        return tsObj.toDate().toISOString();
    }
    return value;
};
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
    const bugReportContext = typeof data.bugReportContext === 'object' && data.bugReportContext
        ? {
            userId: String(data.bugReportContext.userId || context.auth.uid).trim() || context.auth.uid,
            propertyId: String(data.bugReportContext.propertyId || '').trim() || null,
            pageUrl: String(data.bugReportContext.pageUrl || '').trim() || null,
            browser: String(data.bugReportContext.browser || '').trim() || null,
            deviceType: String(data.bugReportContext.deviceType || '').trim().toLowerCase() === 'mobile'
                ? 'mobile'
                : 'desktop',
            appVersion: String(data.bugReportContext.appVersion || '').trim() || null,
            timestamp: String(data.bugReportContext.timestamp || '').trim() || new Date().toISOString(),
        }
        : null;
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
    const { ticketNumber, ticketSequence } = await allocateFeedbackTicketNumber();
    const feedbackDoc = {
        ticketNumber,
        ticketSequence,
        type: data.type,
        subject,
        message,
        userId: context.auth.uid,
        userEmail: userEmail || null,
        userName: data.userName || null,
        submissionContext: bugReportContext,
        attachments: emailAttachments.map((attachment) => ({
            filename: attachment.filename,
            type: attachment.type,
            sizeBytes: attachment.sizeBytes,
        })),
        status: 'received',
        publicStatus: 'received',
        emailDispatchStatus: 'not_sent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const feedbackRef = await db.collection('feedback').add(feedbackDoc);
    const bucket = admin.storage().bucket();
    const persistedAttachments = [];
    for (const attachment of emailAttachments) {
        const safeFileName = sanitizeAttachmentFilename(attachment.filename).replace(/\s+/g, '_');
        const attachmentPath = `feedback-attachments/${context.auth.uid}/${feedbackRef.id}/${Date.now()}-${safeFileName}`;
        const file = bucket.file(attachmentPath);
        try {
            const downloadToken = (0, crypto_1.randomUUID)();
            await file.save(Buffer.from(attachment.content, 'base64'), {
                contentType: attachment.type,
                resumable: false,
                metadata: {
                    metadata: {
                        feedbackId: feedbackRef.id,
                        uploaderUserId: context.auth.uid,
                        originalFilename: attachment.filename,
                        firebaseStorageDownloadTokens: downloadToken,
                    },
                },
            });
            const encodedPath = encodeURIComponent(attachmentPath);
            const attachmentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
            persistedAttachments.push({
                filename: attachment.filename,
                type: attachment.type,
                sizeBytes: attachment.sizeBytes,
                path: attachmentPath,
                attachmentUrl,
            });
        }
        catch (uploadError) {
            console.error(`[submitFeedback] Failed to upload attachment ${attachment.filename}:`, uploadError);
            // Record that the attachment was received even if storage failed
            persistedAttachments.push({
                filename: attachment.filename,
                type: attachment.type,
                sizeBytes: attachment.sizeBytes,
            });
        }
    }
    if (persistedAttachments.length > 0) {
        await feedbackRef.set({
            attachments: persistedAttachments,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    const internalSubject = `[Maintley] ${feedbackTypeLabels[data.type]}: ${subject}`;
    const contextBlock = bugReportContext
        ? `
				<div style="background: #fffbeb; border: 1px solid #fdba74; padding: 14px; border-radius: 8px; margin: 20px 0;">
					<h3 style="margin-top: 0; color: #7c2d12;">Submission Context</h3>
					<p><strong>Page URL:</strong> ${(0, emailService_1.escapeHtml)(String(bugReportContext.pageUrl || 'n/a'))}</p>
					<p><strong>Property ID:</strong> ${(0, emailService_1.escapeHtml)(String(bugReportContext.propertyId || 'n/a'))}</p>
					<p><strong>Browser:</strong> ${(0, emailService_1.escapeHtml)(String(bugReportContext.browser || 'n/a'))}</p>
					<p><strong>Device:</strong> ${(0, emailService_1.escapeHtml)(String(bugReportContext.deviceType || 'desktop'))}</p>
					<p><strong>App Version:</strong> ${(0, emailService_1.escapeHtml)(String(bugReportContext.appVersion || 'n/a'))}</p>
					<p><strong>Captured At:</strong> ${(0, emailService_1.escapeHtml)(String(bugReportContext.timestamp || new Date().toISOString()))}</p>
				</div>
			`
        : '';
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
				<div style="background: #ffffff; border: 1px solid #cfe8d4; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3 style="margin-top: 0; color: #374151;">Message</h3>
					<div style="white-space: pre-wrap; line-height: 1.6;">${escapedMessage}</div>
				</div>
				${contextBlock}
				<p style="font-size: 13px; color: #6b7280; margin: 0;">
					Screenshots attached: ${emailAttachments.length}
				</p>
			</div>
		`;
    const escapedTicketNumber = (0, emailService_1.escapeHtml)(ticketNumber);
    const confirmationSubject = `Thanks for your feedback — ${ticketNumber} — Maintley`;
    const confirmationHtml = `
			<div style="margin:0; padding:0; background:#edf7ef; font-family:Arial,sans-serif; color:#111827;">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf7ef; padding:24px 0;">
					<tr><td align="center">
						<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #cfe8d4;">
							<tr><td style="background:#16a34a; color:#ffffff; padding:20px 24px; font-size:24px; font-weight:700;">Maintley</td></tr>
							<tr><td style="padding:24px;">
								<h2 style="margin:0 0 12px 0; font-size:22px; color:#111827;">Thanks for your feedback, ${escapedUserName}!</h2>
								<p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#374151;">We received your ${feedbackTypeLabels[data.type].toLowerCase()} and our team will review it shortly.</p>
								<div style="background:#f9fafb; border:1px solid #cfe8d4; border-radius:10px; padding:12px 16px; margin:0 0 16px 0;">
									<p style="margin:0; font-size:14px; color:#111827;"><strong>Ticket number:</strong> ${escapedTicketNumber}</p>
								</div>
								<div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; padding:16px; margin:0 0 16px 0;">
									<p style="margin:0 0 8px 0; font-size:14px; color:#065f46;"><strong>Subject:</strong> ${escapedSubject}</p>
									<p style="margin:0; font-size:14px; color:#065f46; white-space:pre-wrap;"><strong>Your message:</strong><br/>${escapedMessage}</p>
								</div>
								<a href="${helpCenterUrl}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:11px 18px; border-radius:8px; font-size:14px; font-weight:600;">Visit Help Center</a>
							</td></tr>
							<tr><td style="padding:16px 24px; border-top:1px solid #cfe8d4; font-size:12px; line-height:1.5; color:#6b7280;">Maintley Support • <a href="mailto:${supportEmail}" style="color:#16a34a; text-decoration:none;">${supportEmail}</a></td></tr>
						</table>
					</td></tr>
				</table>
			</div>
		`;
    let internalEmailStatus = 'not_sent';
    let internalEmailError = null;
    let confirmationEmailStatus = userEmail ? 'not_sent' : 'not_requested';
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
        internalEmailStatus = 'sent_via_resend';
    }
    catch (internalError) {
        internalEmailStatus = 'resend_failed';
        internalEmailError =
            internalError instanceof Error ? internalError.message : String(internalError);
        console.error('[submitFeedback] Internal email dispatch failed:', internalError);
    }
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
            console.error('[submitFeedback] Confirmation email dispatch failed:', confirmationError);
        }
    }
    try {
        await feedbackRef.update({
            emailDispatchStatus: internalEmailStatus,
            ...(internalEmailStatus === 'sent_via_resend' && {
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            ...(internalEmailError && { resendError: internalEmailError }),
            confirmationEmailStatus,
            ...(confirmationEmailStatus === 'sent_via_resend' && {
                confirmationSentAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            ...(confirmationEmailError && { confirmationEmailError }),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (updateError) {
        console.error('[submitFeedback] Could not update email dispatch status:', updateError);
        // Feedback is already saved — do not throw. Email status update failure is non-fatal.
    }
    return {
        id: feedbackRef.id,
        ticketNumber,
        message: 'Feedback submitted successfully',
    };
});
exports.listMyFeedbackTickets = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to view support requests.');
    }
    const requestedLimit = Number((data === null || data === void 0 ? void 0 : data.limit) || 25);
    const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 100)
        : 25;
    let snapshot;
    try {
        snapshot = await db
            .collection('feedback')
            .where('userId', '==', context.auth.uid)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
    }
    catch (error) {
        const rawCode = String((error === null || error === void 0 ? void 0 : error.code) ||
            (error === null || error === void 0 ? void 0 : error.details) ||
            '').toLowerCase();
        const rawMessage = String((error === null || error === void 0 ? void 0 : error.message) || '').toLowerCase();
        const isIndexError = rawCode.includes('failed-precondition') ||
            rawCode === '9' ||
            rawMessage.includes('index') ||
            rawMessage.includes('failed precondition');
        if (!isIndexError) {
            throw error;
        }
        functions.logger.warn('listMyFeedbackTickets: falling back to non-ordered query due to index precondition error', { uid: context.auth.uid });
        snapshot = await db
            .collection('feedback')
            .where('userId', '==', context.auth.uid)
            .limit(limit)
            .get();
    }
    const tickets = (await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const rawAdminNotes = Array.isArray(data.adminNotes) ? data.adminNotes : [];
        const resolutionNotes = data.resolutionNotes
            ? String(data.resolutionNotes).trim()
            : '';
        const normalizedAdminNotes = rawAdminNotes
            .map((rawNote) => {
            if (typeof rawNote === 'string') {
                const noteText = rawNote.trim();
                if (!noteText)
                    return null;
                return {
                    note: noteText,
                    visibility: 'customer',
                };
            }
            const noteRecord = typeof rawNote === 'object' && rawNote
                ? rawNote
                : null;
            if (!noteRecord)
                return null;
            const noteText = String(noteRecord.note ||
                noteRecord.message ||
                noteRecord.text ||
                noteRecord.resolutionNotes ||
                '').trim();
            if (!noteText)
                return null;
            const rawVisibility = String(noteRecord.visibility || '')
                .trim()
                .toLowerCase();
            const noteType = String(noteRecord.noteType || '')
                .trim()
                .toLowerCase();
            const isInternal = rawVisibility === 'internal' || noteType === 'internal';
            const createdAtValue = noteRecord.createdAt !== undefined
                ? serializeTimestampValue(noteRecord.createdAt)
                : noteRecord.date !== undefined
                    ? serializeTimestampValue(noteRecord.date)
                    : noteRecord.timestamp !== undefined
                        ? serializeTimestampValue(noteRecord.timestamp)
                        : undefined;
            const createdAt = createdAtValue
                ? String(createdAtValue)
                : undefined;
            return {
                note: noteText,
                createdAt,
                date: createdAt,
                noteType: noteType || undefined,
                visibility: rawVisibility || (isInternal ? 'internal' : 'customer'),
                adminUserId: noteRecord.adminUserId
                    ? String(noteRecord.adminUserId)
                    : undefined,
                adminUsername: noteRecord.adminUsername
                    ? String(noteRecord.adminUsername)
                    : undefined,
            };
        })
            .filter((note) => Boolean(note));
        if (resolutionNotes) {
            const hasResolutionInNotes = normalizedAdminNotes.some((note) => String(note.note || '').trim() === resolutionNotes);
            if (!hasResolutionInNotes) {
                normalizedAdminNotes.push({
                    note: resolutionNotes,
                    createdAt: data.updatedAt
                        ? String(serializeTimestampValue(data.updatedAt) || '')
                        : undefined,
                    date: data.updatedAt
                        ? String(serializeTimestampValue(data.updatedAt) || '')
                        : undefined,
                    noteType: 'maintley_update',
                    visibility: 'customer',
                });
            }
        }
        let ticketNumber = String(data.ticketNumber || '').trim();
        if (!ticketNumber) {
            const docSequence = Number(data.ticketSequence || 0);
            if (Number.isFinite(docSequence) && docSequence > 0) {
                ticketNumber = formatFeedbackTicketNumber(docSequence);
            }
            else {
                ticketNumber = `MNT-LEGACY-${doc.id.slice(0, 6).toUpperCase()}`;
            }
        }
        return {
            id: doc.id,
            ticketNumber,
            type: String(data.type || 'feedback'),
            subject: String(data.subject || '(No subject)'),
            message: String(data.message || ''),
            status: String(data.status || 'received'),
            publicStatus: String(data.publicStatus || data.status || 'received'),
            emailDispatchStatus: data.emailDispatchStatus
                ? String(data.emailDispatchStatus)
                : undefined,
            createdAt: data.createdAt
                ? String(serializeTimestampValue(data.createdAt) || '')
                : undefined,
            updatedAt: data.updatedAt
                ? String(serializeTimestampValue(data.updatedAt) || '')
                : undefined,
            resolutionNotes: resolutionNotes || undefined,
            adminNotes: normalizedAdminNotes,
            attachments: await normalizePersistedAttachments(data.attachments),
        };
    })))
        .sort((a, b) => {
        const aTime = Date.parse(String(a.createdAt || ''));
        const bTime = Date.parse(String(b.createdAt || ''));
        const safeA = Number.isNaN(aTime) ? 0 : aTime;
        const safeB = Number.isNaN(bTime) ? 0 : bTime;
        return safeB - safeA;
    })
        .slice(0, limit);
    return { tickets };
});
