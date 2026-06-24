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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserAccount = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const stripe_1 = __importDefault(require("stripe"));
const dotenv = __importStar(require("dotenv"));
// Load environment variables from .env file
dotenv.config();
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const auth = admin.auth();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
const PAID_SUBSCRIPTION_PLANS = new Set([
    'homeowner_plus',
    'property',
    'portfolio',
]);
/**
 * Delete User Account
 * POST /api/delete-user-account
 * Body: { userId }
 *
 * This function deletes all user-related data from Firestore.
 * Only the original owner of properties can delete everything.
 * Co-owners/shared users only lose access but properties remain.
 */
exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId } = data;
    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing userId parameter');
    }
    // Ensure user can only delete their own account
    if (context.auth.uid !== userId) {
        throw new functions.https.HttpsError('permission-denied', 'You can only delete your own account');
    }
    // Check if user has an active Stripe subscription
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    if (userData === null || userData === void 0 ? void 0 : userData.subscription) {
        const subscription = userData.subscription;
        const normalizedPlan = String(subscription.plan || '')
            .trim()
            .toLowerCase();
        const hasPaidPlan = PAID_SUBSCRIPTION_PLANS.has(normalizedPlan);
        console.log('User subscription data:', subscription);
        const now = Math.floor(Date.now() / 1000);
        console.log('Current timestamp:', now);
        console.log('Subscription status:', subscription.status);
        console.log('Trial ends at:', subscription.trialEndsAt);
        // Check if subscription is in trial period
        const isInTrial = subscription.trialEndsAt && subscription.trialEndsAt > now;
        console.log('Is in trial period:', isInTrial);
        // Block deletion for active or past_due subscriptions that are NOT in trial
        if (hasPaidPlan &&
            ((subscription.status === 'active' && !isInTrial) ||
                subscription.status === 'past_due')) {
            console.log('Blocking deletion: subscription is active/past_due and not in trial');
            throw new functions.https.HttpsError('failed-precondition', 'You cannot delete your account while you have an active subscription. Please cancel your subscription first.');
        }
        console.log('Allowing deletion: subscription is either in trial or not active/past_due');
        // If user has a trial subscription, cancel it immediately
        if (subscription.status === 'trial' || isInTrial) {
            console.log('Attempting to cancel trial subscription');
            if (subscription.stripeSubscriptionId) {
                try {
                    console.log(`Cancelling trial subscription: ${subscription.stripeSubscriptionId}`);
                    await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
                    console.log('Trial subscription cancelled successfully');
                }
                catch (cancelError) {
                    console.error('Error cancelling trial subscription:', cancelError);
                    // Continue with account deletion even if cancellation fails
                }
            }
            else {
                console.log('No stripeSubscriptionId found for trial subscription');
            }
        }
        else {
            console.log('Not cancelling subscription: not in trial status');
        }
    }
    else {
        console.log('No subscription data found for user');
    }
    const batch = db.batch();
    let isOwner = false;
    try {
        console.log(`Starting account deletion for user: ${userId}`);
        // Check if user is an original owner of any properties
        const propertiesSnapshot = await db
            .collection('properties')
            .where('userId', '==', userId)
            .get();
        isOwner = !propertiesSnapshot.empty;
        if (isOwner) {
            console.log('User is an original owner - deleting all owned data');
            // Delete owned property groups
            const propertyGroupsSnapshot = await db
                .collection('propertyGroups')
                .where('userId', '==', userId)
                .get();
            propertyGroupsSnapshot.forEach((doc) => {
                console.log(`Deleting property group: ${doc.id}`);
                batch.delete(doc.ref);
            });
            // Delete owned properties and all related data
            for (const propertyDoc of propertiesSnapshot.docs) {
                const propertyId = propertyDoc.id;
                console.log(`Deleting property: ${propertyId}`);
                // Delete property document
                batch.delete(propertyDoc.ref);
                // Delete related tasks
                const tasksSnapshot = await db
                    .collection('tasks')
                    .where('propertyId', '==', propertyId)
                    .get();
                tasksSnapshot.forEach((doc) => {
                    console.log(`Deleting task: ${doc.id}`);
                    batch.delete(doc.ref);
                });
                // Delete related suites
                const suitesSnapshot = await db
                    .collection('suites')
                    .where('propertyId', '==', propertyId)
                    .get();
                suitesSnapshot.forEach((doc) => {
                    console.log(`Deleting suite: ${doc.id}`);
                    batch.delete(doc.ref);
                });
                // Delete related units
                const unitsSnapshot = await db
                    .collection('units')
                    .where('propertyId', '==', propertyId)
                    .get();
                unitsSnapshot.forEach((doc) => {
                    console.log(`Deleting unit: ${doc.id}`);
                    batch.delete(doc.ref);
                });
                // Delete related devices
                const devicesSnapshot = await db
                    .collection('devices')
                    .where('location.propertyId', '==', propertyId)
                    .get();
                devicesSnapshot.forEach((doc) => {
                    console.log(`Deleting device: ${doc.id}`);
                    batch.delete(doc.ref);
                });
                // Delete property shares
                const sharesSnapshot = await db
                    .collection('propertyShares')
                    .where('propertyId', '==', propertyId)
                    .get();
                sharesSnapshot.forEach((doc) => {
                    console.log(`Deleting property share: ${doc.id}`);
                    batch.delete(doc.ref);
                });
                // Delete user invitations for this property
                const invitationsSnapshot = await db
                    .collection('userInvitations')
                    .where('propertyId', '==', propertyId)
                    .get();
                invitationsSnapshot.forEach((doc) => {
                    console.log(`Deleting invitation: ${doc.id}`);
                    batch.delete(doc.ref);
                });
            }
            // Delete owned team groups
            const teamGroupsSnapshot = await db
                .collection('teamGroups')
                .where('userId', '==', userId)
                .get();
            teamGroupsSnapshot.forEach((doc) => {
                console.log(`Deleting team group: ${doc.id}`);
                batch.delete(doc.ref);
            });
            // Delete owned team members
            const teamMembersSnapshot = await db
                .collection('teamMembers')
                .where('userId', '==', userId)
                .get();
            teamMembersSnapshot.forEach((doc) => {
                console.log(`Deleting team member: ${doc.id}`);
                batch.delete(doc.ref);
            });
        }
        else {
            console.log('User is not an original owner - removing access only');
            // Remove user from co-owners lists
            const coOwnerPropertiesSnapshot = await db
                .collection('properties')
                .where('coOwners', 'array-contains', userId)
                .get();
            coOwnerPropertiesSnapshot.forEach((doc) => {
                var _a;
                const property = doc.data();
                const updatedCoOwners = ((_a = property.coOwners) === null || _a === void 0 ? void 0 : _a.filter((id) => id !== userId)) || [];
                console.log(`Removing ${userId} from co-owners of property: ${doc.id}`);
                batch.update(doc.ref, { coOwners: updatedCoOwners });
            });
            // Remove user from administrators lists
            const adminPropertiesSnapshot = await db
                .collection('properties')
                .where('administrators', 'array-contains', userId)
                .get();
            adminPropertiesSnapshot.forEach((doc) => {
                var _a;
                const property = doc.data();
                const updatedAdmins = ((_a = property.administrators) === null || _a === void 0 ? void 0 : _a.filter((id) => id !== userId)) ||
                    [];
                console.log(`Removing ${userId} from administrators of property: ${doc.id}`);
                batch.update(doc.ref, { administrators: updatedAdmins });
            });
            // Remove user from viewers lists
            const viewerPropertiesSnapshot = await db
                .collection('properties')
                .where('viewers', 'array-contains', userId)
                .get();
            viewerPropertiesSnapshot.forEach((doc) => {
                var _a;
                const property = doc.data();
                const updatedViewers = ((_a = property.viewers) === null || _a === void 0 ? void 0 : _a.filter((id) => id !== userId)) || [];
                console.log(`Removing ${userId} from viewers of property: ${doc.id}`);
                batch.update(doc.ref, { viewers: updatedViewers });
            });
            // Delete property shares where user is the shared user
            const userSharesSnapshot = await db
                .collection('propertyShares')
                .where('sharedWithUserId', '==', userId)
                .get();
            userSharesSnapshot.forEach((doc) => {
                console.log(`Deleting property share: ${doc.id}`);
                batch.delete(doc.ref);
            });
            // Delete user invitations where user is the recipient
            const userInvitationsSnapshot = await db
                .collection('userInvitations')
                .where('toEmail', '==', context.auth.token.email)
                .get();
            userInvitationsSnapshot.forEach((doc) => {
                console.log(`Deleting invitation: ${doc.id}`);
                batch.delete(doc.ref);
            });
        }
        // Delete user profile data (always delete these)
        const userProfileSnapshot = await db
            .collection('users')
            .doc(userId)
            .get();
        if (userProfileSnapshot.exists) {
            console.log(`Deleting user profile: ${userId}`);
            batch.delete(userProfileSnapshot.ref);
        }
        // Delete user's notifications (always delete these)
        const notificationsSnapshot = await db
            .collection('notifications')
            .where('userId', '==', userId)
            .get();
        notificationsSnapshot.forEach((doc) => {
            console.log(`Deleting notification: ${doc.id}`);
            batch.delete(doc.ref);
        });
        // Delete user's contractors (always delete these)
        const contractorsSnapshot = await db
            .collection('contractors')
            .where('userId', '==', userId)
            .get();
        contractorsSnapshot.forEach((doc) => {
            console.log(`Deleting contractor: ${doc.id}`);
            batch.delete(doc.ref);
        });
        // Delete user's maintenance history (always delete these)
        const maintenanceHistorySnapshot = await db
            .collection('maintenanceHistory')
            .where('userId', '==', userId)
            .get();
        maintenanceHistorySnapshot.forEach((doc) => {
            console.log(`Deleting maintenance history: ${doc.id}`);
            batch.delete(doc.ref);
        });
        // Delete user's favorites (always delete these)
        const favoritesSnapshot = await db
            .collection('favorites')
            .where('userId', '==', userId)
            .get();
        favoritesSnapshot.forEach((doc) => {
            console.log(`Deleting favorite: ${doc.id}`);
            batch.delete(doc.ref);
        });
        // Delete user's tasks (if not already deleted as part of property deletion)
        const userTasksSnapshot = await db
            .collection('tasks')
            .where('userId', '==', userId)
            .get();
        userTasksSnapshot.forEach((doc) => {
            console.log(`Deleting user task: ${doc.id}`);
            batch.delete(doc.ref);
        });
        // Commit all Firestore changes
        await batch.commit();
        console.log('Firestore data deletion completed');
        // Delete the user from Firebase Auth
        await auth.deleteUser(userId);
        console.log('Firebase Auth user deleted');
        return {
            success: true,
            message: isOwner
                ? 'Account and all associated data deleted successfully'
                : 'Account access removed successfully. Properties owned by others remain intact.',
            wasOwner: isOwner,
        };
    }
    catch (error) {
        console.error('Error deleting user account:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete account. Please contact support.');
    }
});
