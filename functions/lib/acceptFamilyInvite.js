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
exports.acceptFamilyInvite = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const crypto_1 = require("crypto");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const hashToken = (token) => (0, crypto_1.createHash)('sha256').update(token).digest('hex');
exports.acceptFamilyInvite = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const inviteId = String((data === null || data === void 0 ? void 0 : data.inviteId) || '').trim();
    const token = String((data === null || data === void 0 ? void 0 : data.token) || '').trim();
    if (!inviteId || !token) {
        throw new functions.https.HttpsError('invalid-argument', 'inviteId and token are required');
    }
    const callerUid = context.auth.uid;
    const callerEmail = String(context.auth.token.email || '').toLowerCase();
    if (!callerEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Authenticated user email is required to accept an invite');
    }
    const inviteRef = db.collection('familyInvites').doc(inviteId);
    await db.runTransaction(async (transaction) => {
        const inviteDoc = await transaction.get(inviteRef);
        if (!inviteDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Invite not found');
        }
        const inviteData = inviteDoc.data() || {};
        if (inviteData.status !== 'pending') {
            throw new functions.https.HttpsError('failed-precondition', 'Invite is no longer active');
        }
        if (typeof inviteData.expiresAt === 'number' &&
            inviteData.expiresAt <= Date.now()) {
            transaction.update(inviteRef, {
                status: 'expired',
                updatedAt: Date.now(),
            });
            throw new functions.https.HttpsError('failed-precondition', 'Invite has expired');
        }
        if (inviteData.emailLower !== callerEmail) {
            throw new functions.https.HttpsError('permission-denied', 'This invite is for a different email address');
        }
        if (inviteData.tokenHash !== hashToken(token)) {
            throw new functions.https.HttpsError('permission-denied', 'Invalid invite token');
        }
        const accountId = String(inviteData.accountId || '').trim();
        const accountRef = db.collection('familyAccounts').doc(accountId);
        const userRef = db.collection('users').doc(callerUid);
        const [accountDoc, userDoc] = await Promise.all([
            transaction.get(accountRef),
            transaction.get(userRef),
        ]);
        if (!accountDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Family account not found');
        }
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User profile not found');
        }
        const accountData = accountDoc.data() || {};
        const userData = userDoc.data() || {};
        const memberIds = Array.isArray(accountData.memberIds)
            ? accountData.memberIds
            : [];
        if (userData.accountId &&
            userData.accountId !== accountId &&
            userData.accountId !== callerUid) {
            throw new functions.https.HttpsError('failed-precondition', 'You already belong to another family account');
        }
        if (!memberIds.includes(callerUid) && memberIds.length >= 3) {
            throw new functions.https.HttpsError('resource-exhausted', 'Family account member limit has been reached');
        }
        if (!memberIds.includes(callerUid)) {
            transaction.update(accountRef, {
                memberIds: admin.firestore.FieldValue.arrayUnion(callerUid),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        transaction.update(userRef, {
            accountId,
            isAccountOwner: false,
            role: inviteData.role || userData.role || 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        transaction.update(inviteRef, {
            status: 'accepted',
            acceptedAt: Date.now(),
            acceptedByUserId: callerUid,
            updatedAt: Date.now(),
        });
    });
    return { success: true, message: 'Family invite accepted' };
});
