"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = exports.sendMaintleyEmail = exports.getFeedbackFromAddress = exports.getDefaultFromAddress = exports.getResendClient = void 0;
const resend_1 = require("resend");
const getResendClient = (apiKey) => {
    if (!apiKey)
        return null;
    return new resend_1.Resend(apiKey);
};
exports.getResendClient = getResendClient;
const getDefaultFromAddress = (fallback = 'Maintley <noreply@maintleyapp.com>') => process.env.RESEND_FROM_EMAIL || fallback;
exports.getDefaultFromAddress = getDefaultFromAddress;
const getFeedbackFromAddress = () => process.env.RESEND_FEEDBACK_FROM_EMAIL ||
    'Maintley Feedback <feedback@maintleyapp.com>';
exports.getFeedbackFromAddress = getFeedbackFromAddress;
const sendMaintleyEmail = async (client, request) => {
    if (!client) {
        throw new Error('Resend client is not configured');
    }
    const response = await client.emails.send({
        to: request.to,
        from: request.from || (0, exports.getDefaultFromAddress)(),
        subject: request.subject,
        html: request.html,
        ...(request.replyTo && { replyTo: request.replyTo }),
        ...(request.attachments && { attachments: request.attachments }),
    }, request.idempotencyKey
        ? { idempotencyKey: request.idempotencyKey }
        : undefined);
    if (response.error) {
        throw new Error(response.error.message || 'Email provider rejected the message.');
    }
    return response;
};
exports.sendMaintleyEmail = sendMaintleyEmail;
const escapeHtml = (value) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
exports.escapeHtml = escapeHtml;
