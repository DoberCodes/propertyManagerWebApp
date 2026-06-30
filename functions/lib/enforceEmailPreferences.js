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
exports.enforceEmailPreferences = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const PAID_TASK_REMINDER_EMAIL_PLANS = new Set([
    'homeowner_plus',
    'property',
    'portfolio',
]);
const PROPERTY_INSIGHTS_PLANS = new Set([
    'homeowner_plus',
    'property',
    'portfolio',
]);
const TEAM_MEMBER_REPORT_PLANS = new Set(['property', 'portfolio']);
const normalizePlanId = (planId) => {
    return String(planId || '').trim().toLowerCase();
};
const getEffectivePlanId = (subscription) => {
    const scheduledPlan = normalizePlanId(subscription?.scheduledPlan);
    if (subscription?.hasScheduledSubscription && scheduledPlan) {
        return scheduledPlan;
    }
    const plan = normalizePlanId(subscription?.plan);
    return plan || 'homeowner';
};
exports.enforceEmailPreferences = functions.firestore
    .document('users/{userId}')
    .onWrite(async (change, context) => {
    if (!change.after.exists) {
        return null;
    }
    const afterData = change.after.data();
    const taskRemindersEnabled = !!afterData.emailPreferences?.taskReminders;
    const propertyInsightsEnabled = !!afterData.emailPreferences?.propertyInsights;
    const teamMemberReportsEnabled = !!afterData.emailPreferences?.teamMemberReports?.enabled;
    if (!taskRemindersEnabled &&
        !propertyInsightsEnabled &&
        !teamMemberReportsEnabled) {
        return null;
    }
    const effectivePlan = getEffectivePlanId(afterData.subscription);
    const canUseTaskReminderEmails = PAID_TASK_REMINDER_EMAIL_PLANS.has(effectivePlan);
    const canUsePropertyInsights = PROPERTY_INSIGHTS_PLANS.has(effectivePlan);
    const canUseTeamMemberReports = TEAM_MEMBER_REPORT_PLANS.has(effectivePlan);
    const updates = {};
    if (taskRemindersEnabled && !canUseTaskReminderEmails) {
        updates['emailPreferences.taskReminders'] = false;
    }
    if (propertyInsightsEnabled && !canUsePropertyInsights) {
        updates['emailPreferences.propertyInsights'] = false;
    }
    if (teamMemberReportsEnabled && !canUseTeamMemberReports) {
        updates['emailPreferences.teamMemberReports.enabled'] = false;
    }
    if (Object.keys(updates).length === 0) {
        return null;
    }
    await db
        .collection('users')
        .doc(context.params.userId)
        .update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    functions.logger.info('Disabled paid-only email preferences for ineligible plan', {
        userId: context.params.userId,
        effectivePlan,
        updates: Object.keys(updates),
    });
    return null;
});
