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
exports.sendWelcomeSignupEmail = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const emailService_1 = require("./emailService");
const emailBrand_1 = require("./emailBrand");
const RESEND_API_KEY = (0, params_1.defineSecret)(process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY');
if (!admin.apps.length) {
    admin.initializeApp();
}
const getDisplayName = (user) => {
    const name = String(user.firstName || user.displayName || '').trim();
    return name || 'there';
};
const getWelcomeEmailHtml = (name, appUrl, quickStartUrl) => {
    const safeName = (0, emailService_1.escapeHtml)(name);
    const safeAppUrl = (0, emailService_1.escapeHtml)(appUrl);
    const safeQuickStartUrl = (0, emailService_1.escapeHtml)(quickStartUrl);
    return (0, emailBrand_1.renderMaintleyEmailShell)({
        title: 'Welcome to Maintley',
        previewText: 'Your Maintley account is ready.',
        bodyHtml: `
					<p style="margin:0 0 16px; font-size:15px; line-height:1.7;">Hi ${safeName},</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7;">Your account is ready.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7;">Maintley helps you keep property records, maintenance history, documents, and recurring care organized in one place.</p>
					<p style="margin:0 0 14px; font-size:15px; line-height:1.7;">Most users start by adding a property and recording major systems like HVAC, Water Heater, and Smoke Detectors. As your records grow, Maintley can help surface maintenance opportunities and useful next steps.</p>
					<p style="margin:0 0 10px; font-size:15px; line-height:1.7; font-weight:700;">What you can do next:</p>
					<ul style="margin:0 0 20px 0; padding:0; list-style:none; font-size:15px; line-height:1.8; color:${emailBrand_1.EMAIL_BRAND.slate};">
						<li style="margin:0 0 4px;">✓ Add your first property</li>
						<li style="margin:0 0 4px;">✓ Record your major systems and appliances</li>
						<li style="margin:0 0 4px;">✓ Create your first maintenance task</li>
						<li style="margin:0;">✓ Upload manuals, receipts, or warranty information</li>
					</ul>
					<div style="margin:20px 0 20px;">${(0, emailBrand_1.renderMaintleyEmailButton)('Open Maintley', safeQuickStartUrl)}</div>
					<p style="margin:0; font-size:14px; color:${emailBrand_1.EMAIL_BRAND.slate}; line-height:1.7;">Need help getting started? Visit the Support Center for guides, tutorials, and answers to common questions.</p>
		`,
        footerHtml: `Maintley<br /><a href="${safeAppUrl}" style="color:${emailBrand_1.EMAIL_BRAND.primary}; text-decoration:none;">maintleyapp.com</a>`,
    });
};
exports.sendWelcomeSignupEmail = functions
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 120, memory: '256MB' })
    .firestore.document('users/{userId}')
    .onCreate(async (snapshot, context) => {
    const user = snapshot.data();
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
    const resend = (0, emailService_1.getResendClient)(RESEND_API_KEY.value());
    if (!resend) {
        throw new Error('Resend client is not configured');
    }
    const recipientName = getDisplayName(user);
    await (0, emailService_1.sendMaintleyEmail)(resend, {
        to: email,
        subject: 'Welcome to Maintley',
        html: getWelcomeEmailHtml(recipientName, appUrl, quickStartUrl),
    });
    await snapshot.ref.set({
        welcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    functions.logger.info('Welcome signup email sent', {
        userId: context.params.userId,
        email,
    });
    return null;
});
