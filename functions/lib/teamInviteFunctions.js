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
exports.redeemTeamMemberInvitationCode = exports.revokeTeamMemberInvitationCode = exports.createTeamMemberInvitationCode = exports.validateTeamMemberInvitationCode = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const inviteAuthz_1 = require("./inviteAuthz");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const upsertTeamMemberAccess = async (params) => {
    const now = new Date().toISOString();
    const normalizedEmail = String(params.email || '').trim().toLowerCase();
    const accountId = String(params.accountId || '').trim();
    if (!normalizedEmail || !accountId) {
        return;
    }
    await db.collection('users').doc(params.uid).set({
        accountId,
        isAccountOwner: false,
        isTeamMemberAccount: true,
        ...(params.teamMemberId ? { teamMemberId: params.teamMemberId } : {}),
        updatedAt: now,
    }, { merge: true });
    await db
        .collection('accountMemberships')
        .doc(`${accountId}_${params.uid}`)
        .set({
        accountId,
        userId: params.uid,
        email: normalizedEmail,
        role: 'team_member',
        roles: ['team_member'],
        ...(params.role ? { appRole: params.role } : {}),
        status: 'active',
        updatedAt: now,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    if (params.teamMemberId) {
        await db.collection('teamMembers').doc(params.teamMemberId).set({
            userAccountId: params.uid,
            redeemedByUserId: params.uid,
            redeemedAt: now,
            updatedAt: now,
        }, { merge: true });
    }
};
exports.validateTeamMemberInvitationCode = functions.https.onCall(async (data) => {
    const promoCode = String((data === null || data === void 0 ? void 0 : data.promoCode) || '').trim().toLowerCase();
    const teamMemberEmail = String((data === null || data === void 0 ? void 0 : data.teamMemberEmail) || '')
        .trim()
        .toLowerCase();
    if (!promoCode || !teamMemberEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'promoCode and teamMemberEmail are required');
    }
    const snapshot = await db
        .collection('teamMemberInvitationCodes')
        .where('teamMemberEmail', '==', teamMemberEmail)
        .where('codeLower', '==', promoCode)
        .where('status', '==', 'active')
        .limit(1)
        .get();
    if (snapshot.empty) {
        return { valid: false };
    }
    const inviteDoc = snapshot.docs[0];
    const inviteData = inviteDoc.data();
    if (inviteData.expiresAt) {
        const expiresAtMs = new Date(inviteData.expiresAt).getTime();
        if (!Number.isNaN(expiresAtMs) && expiresAtMs < Date.now()) {
            return { valid: false };
        }
    }
    let teamMemberRole = null;
    if (inviteData.teamMemberId) {
        const teamMemberDoc = await db
            .collection('teamMembers')
            .doc(inviteData.teamMemberId)
            .get();
        if (teamMemberDoc.exists) {
            const teamMemberData = teamMemberDoc.data();
            teamMemberRole = (teamMemberData === null || teamMemberData === void 0 ? void 0 : teamMemberData.role) || null;
        }
    }
    return {
        valid: true,
        teamMemberId: inviteData.teamMemberId || null,
        accountId: inviteData.accountId || null,
        role: teamMemberRole,
    };
});
exports.createTeamMemberInvitationCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const teamMemberId = String((data === null || data === void 0 ? void 0 : data.teamMemberId) || '').trim();
    const teamMemberEmail = String((data === null || data === void 0 ? void 0 : data.teamMemberEmail) || '')
        .trim()
        .toLowerCase();
    const code = String((data === null || data === void 0 ? void 0 : data.code) || '').trim();
    if (!teamMemberId || !teamMemberEmail || !code) {
        throw new functions.https.HttpsError('invalid-argument', 'teamMemberId, teamMemberEmail, and code are required');
    }
    const { accountId } = await (0, inviteAuthz_1.assertInviteCapability)(context.auth.uid, 'team');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const invitationCode = {
        code,
        codeLower: code.toLowerCase(),
        status: 'active',
        accountId,
        createdBy: context.auth.uid,
        createdByUserId: context.auth.uid,
        createdByEmail: context.auth.token.email || undefined,
        email: teamMemberEmail,
        teamMemberEmail,
        teamMemberId,
        createdAt: now,
        updatedAt: now,
        expiresAt,
    };
    const docRef = await db
        .collection('teamMemberInvitationCodes')
        .add(invitationCode);
    return {
        id: docRef.id,
        ...invitationCode,
    };
});
exports.revokeTeamMemberInvitationCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const teamMemberId = String((data === null || data === void 0 ? void 0 : data.teamMemberId) || '').trim();
    if (!teamMemberId) {
        throw new functions.https.HttpsError('invalid-argument', 'teamMemberId is required');
    }
    const { accountId } = await (0, inviteAuthz_1.assertInviteCapability)(context.auth.uid, 'team');
    const snapshot = await db
        .collection('teamMemberInvitationCodes')
        .where('accountId', '==', accountId)
        .where('teamMemberId', '==', teamMemberId)
        .where('status', 'in', ['active', 'redeemed'])
        .get();
    const now = new Date().toISOString();
    const batch = db.batch();
    snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
            status: 'revoked',
            revokedAt: now,
            updatedAt: now,
        });
    });
    const teamMemberRef = db.collection('teamMembers').doc(teamMemberId);
    const teamMemberDoc = await teamMemberRef.get();
    const teamMemberData = teamMemberDoc.data() || {};
    const linkedUserId = String(teamMemberData.userAccountId || teamMemberData.redeemedByUserId || '').trim();
    if (linkedUserId) {
        const membershipRef = db
            .collection('accountMemberships')
            .doc(`${accountId}_${linkedUserId}`);
        batch.set(membershipRef, {
            status: 'disabled',
            disabledAt: now,
            updatedAt: now,
        }, { merge: true });
        batch.set(db.collection('users').doc(linkedUserId), {
            accountId: admin.firestore.FieldValue.delete(),
            isAccountOwner: false,
            isTeamMemberAccount: false,
            teamMemberId: admin.firestore.FieldValue.delete(),
            updatedAt: now,
        }, { merge: true });
    }
    batch.set(teamMemberRef, {
        invitationCodeStatus: 'revoked',
        updatedAt: now,
    }, { merge: true });
    await batch.commit();
    return { success: true, revokedCount: snapshot.size };
});
exports.redeemTeamMemberInvitationCode = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const promoCode = String((data === null || data === void 0 ? void 0 : data.promoCode) || '').trim().toLowerCase();
    const requestedEmail = String((data === null || data === void 0 ? void 0 : data.teamMemberEmail) || '')
        .trim()
        .toLowerCase();
    const callerEmail = String(context.auth.token.email || '').trim().toLowerCase();
    if (!promoCode) {
        throw new functions.https.HttpsError('invalid-argument', 'promoCode is required');
    }
    if (!callerEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Authenticated user email is required');
    }
    if (requestedEmail && requestedEmail !== callerEmail) {
        throw new functions.https.HttpsError('permission-denied', 'Promo code is not valid for this email');
    }
    const snapshot = await db
        .collection('teamMemberInvitationCodes')
        .where('teamMemberEmail', '==', callerEmail)
        .where('codeLower', '==', promoCode)
        .where('status', '==', 'active')
        .limit(1)
        .get();
    if (snapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'Invalid or expired promo code');
    }
    const promoDoc = snapshot.docs[0];
    const inviteData = promoDoc.data();
    const now = new Date().toISOString();
    await promoDoc.ref.update({
        status: 'redeemed',
        redeemedByUserId: context.auth.uid,
        redeemedByEmail: callerEmail,
        redeemedAt: now,
        expiresAt: null,
        updatedAt: now,
    });
    let teamMemberRole = null;
    if (inviteData.teamMemberId) {
        const teamMemberDoc = await db
            .collection('teamMembers')
            .doc(inviteData.teamMemberId)
            .get();
        if (teamMemberDoc.exists) {
            const teamMemberData = teamMemberDoc.data();
            teamMemberRole = (teamMemberData === null || teamMemberData === void 0 ? void 0 : teamMemberData.role) || null;
        }
    }
    if (inviteData.accountId) {
        await upsertTeamMemberAccess({
            uid: context.auth.uid,
            email: callerEmail,
            accountId: inviteData.accountId,
            teamMemberId: inviteData.teamMemberId,
            role: teamMemberRole,
        });
    }
    return {
        success: true,
        accountId: inviteData.accountId || null,
        teamMemberId: inviteData.teamMemberId || null,
    };
});
