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
exports.resendFamilyMemberInvite = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const emailService_1 = require("./emailService");
const RESEND_API_KEY = (0, params_1.defineSecret)(process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY');
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Cloud function to resend password reset email to family member
 * Allows account owners to resend password reset links to family members
 */
exports.resendFamilyMemberInvite = functions
    .runWith({ secrets: ['RESEND_API_KEY'] })
    .https.onCall(async (data, context) => {
    var _a;
    const apiKey = RESEND_API_KEY.value();
    const resend = (0, emailService_1.getResendClient)(apiKey);
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, accountId } = data;
    // Validate input
    if (!userId || !accountId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: accountId and userId');
    }
    try {
        // Verify the account exists and current user is owner/admin
        const accountDoc = await db
            .collection('familyAccounts')
            .doc(accountId)
            .get();
        if (!accountDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Family account not found');
        }
        const accountData = accountDoc.data();
        const callerDoc = await db
            .collection('users')
            .doc(context.auth.uid)
            .get();
        const callerData = callerDoc.data() || {};
        const callerIsOwner = (accountData === null || accountData === void 0 ? void 0 : accountData.ownerId) === context.auth.uid;
        const callerIsAdmin = callerData.accountId === accountId && callerData.role === 'admin';
        if (!callerIsOwner && !callerIsAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Only account owners or admins can resend password reset emails');
        }
        // Verify the user is a member of this family account
        const memberIds = Array.isArray(accountData === null || accountData === void 0 ? void 0 : accountData.memberIds)
            ? accountData.memberIds
            : [];
        if (!memberIds.includes(userId)) {
            throw new functions.https.HttpsError('permission-denied', 'User is not a member of this family account');
        }
        // Get family member data
        const memberDoc = await db.collection('users').doc(userId).get();
        if (!memberDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Family member not found');
        }
        const memberData = memberDoc.data();
        const memberEmail = String((memberData === null || memberData === void 0 ? void 0 : memberData.email) || '');
        const memberFirstName = String((memberData === null || memberData === void 0 ? void 0 : memberData.firstName) || 'there');
        // Get account owner data
        const ownerDoc = await db.collection('users').doc(context.auth.uid).get();
        const ownerName = ((_a = ownerDoc.data()) === null || _a === void 0 ? void 0 : _a.firstName) || 'Account Owner';
        // Generate password reset link
        const resetLink = await admin
            .auth()
            .generatePasswordResetLink(memberEmail);
        // Send custom branded email
        if (resend) {
            try {
                const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Password Reset for Maintley</h2>
            <p>Hi ${memberFirstName},</p>
              
            <p>${ownerName} has sent you a password reset link for your Maintley account.</p>

            <p>Click the button below to set a new password:</p>

            <p>
              <a href="${resetLink}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Set Your Password
              </a>
            </p>

            <p style="font-size:14px;color:#6b7280;">
              If you have trouble clicking the button, copy and paste this link into your browser:<br/>
              <a href="${resetLink}" style="color:#16a34a;word-break:break-all;">${resetLink}</a>
            </p>

            <p style="font-size:14px;color:#6b7280;">This link will expire in 1 hour.</p>

            <p>If you didn't request this password reset, you can safely ignore this email.</p>
          </div>
        `;
                await (0, emailService_1.sendMaintleyEmail)(resend, {
                    to: memberEmail,
                    from: (0, emailService_1.getDefaultFromAddress)(),
                    subject: 'Password Reset for Maintley',
                    html,
                });
                console.log('Password reset email sent to:', memberEmail);
                return {
                    success: true,
                    message: `Password reset email sent to ${memberEmail}`,
                };
            }
            catch (emailError) {
                console.error('Failed to send password reset email:', emailError);
                throw new functions.https.HttpsError('internal', 'Failed to send password reset email');
            }
        }
        else {
            throw new functions.https.HttpsError('internal', 'Email service not configured');
        }
    }
    catch (error) {
        console.error('Error in resendFamilyMemberInvite:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred');
    }
});
