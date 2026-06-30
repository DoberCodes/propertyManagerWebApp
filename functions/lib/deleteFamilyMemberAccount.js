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
exports.deleteFamilyMemberAccount = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();
/**
 * Delete Family Member Account
 * This function deletes a family member's account while preserving their tasks and history.
 * Used when removing a family member from the family account.
 */
exports.deleteFamilyMemberAccount = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const callerUid = context.auth.uid;
    const { memberId, accountId } = data;
    if (!memberId || !accountId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing memberId or accountId parameter');
    }
    const callerDoc = await db.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data() || {};
    try {
        const accountRef = db.collection('familyAccounts').doc(accountId);
        let accountData;
        await db.runTransaction(async (transaction) => {
            const accountDoc = await transaction.get(accountRef);
            if (!accountDoc.exists) {
                throw new functions.https.HttpsError('not-found', 'Family account not found');
            }
            accountData = accountDoc.data();
            const callerIsOwner = accountData?.ownerId === callerUid;
            const callerIsAdmin = callerData?.accountId === accountId && callerData?.role === 'admin';
            if (!callerIsOwner && !callerIsAdmin) {
                throw new functions.https.HttpsError('permission-denied', 'Only account owners or admins can delete family members');
            }
            if (memberId === callerUid) {
                throw new functions.https.HttpsError('invalid-argument', 'Cannot delete yourself from the account');
            }
            if (memberId === accountData?.ownerId) {
                throw new functions.https.HttpsError('permission-denied', 'Cannot delete the account owner');
            }
            const memberIds = Array.isArray(accountData?.memberIds)
                ? accountData?.memberIds
                : [];
            if (!memberIds.includes(memberId)) {
                throw new functions.https.HttpsError('not-found', 'Family member not found in account');
            }
            transaction.update(accountRef, {
                memberIds: memberIds.filter((id) => id !== memberId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        console.log(`Deleting family member account: ${memberId} from account: ${accountId}`);
        const batch = db.batch();
        // Delete from Auth
        try {
            await auth.deleteUser(memberId);
            console.log(`Deleted auth user: ${memberId}`);
        }
        catch (authError) {
            console.error('Error deleting auth user:', authError);
            if (authError.code !== 'auth/user-not-found') {
                throw authError;
            }
        }
        // Delete user document
        batch.delete(db.collection('users').doc(memberId));
        console.log(`Deleting user document: ${memberId}`);
        // Delete user preferences
        const prefsSnapshot = await db
            .collection('userPreferences')
            .where('userId', '==', memberId)
            .get();
        prefsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            console.log(`Deleting user preference: ${doc.id}`);
        });
        // Delete notifications for this user
        const notificationsSnapshot = await db
            .collection('notifications')
            .where('userId', '==', memberId)
            .get();
        notificationsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            console.log(`Deleting notification: ${doc.id}`);
        });
        // Delete activity logs for this user
        const activitySnapshot = await db
            .collection('activityLogs')
            .where('userId', '==', memberId)
            .get();
        activitySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            console.log(`Deleting activity log: ${doc.id}`);
        });
        // Delete favorite entries
        const favoritesSnapshot = await db
            .collection('favorites')
            .where('userId', '==', memberId)
            .get();
        favoritesSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            console.log(`Deleting favorite: ${doc.id}`);
        });
        // Delete recently viewed entries
        const recentlyViewedSnapshot = await db
            .collection('recentlyViewed')
            .where('userId', '==', memberId)
            .get();
        recentlyViewedSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            console.log(`Deleting recently viewed: ${doc.id}`);
        });
        // Delete device subscriptions
        const deviceSubsSnapshot = await db
            .collection('deviceSubscriptions')
            .where('userId', '==', memberId)
            .get();
        deviceSubsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            console.log(`Deleting device subscription: ${doc.id}`);
        });
        // NOTE: We do NOT delete tasks, maintenance history, or comments
        // These are preserved with the member's name
        await batch.commit();
        console.log(`Successfully deleted family member account: ${memberId}`);
        return { success: true, message: 'Family member account deleted' };
    }
    catch (error) {
        console.error('Error in deleteFamilyMemberAccount:', error);
        throw error;
    }
});
