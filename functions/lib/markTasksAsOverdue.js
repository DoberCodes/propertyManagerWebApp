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
exports.markTasksAsOverdue = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Scheduled compatibility check for overdue tasks.
 * Overdue is now derived from dueDate at render/notification time, so this
 * function does not mutate task status.
 */
exports.markTasksAsOverdue = functions.pubsub
    .schedule('0 9 * * *') // Daily at 9 AM
    .timeZone('America/New_York')
    .onRun(async (context) => {
    const functionsLogger = functions.logger;
    try {
        functionsLogger.info('Starting derived overdue task check...');
        // Get current date (start of today)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tasksRef = db.collection('tasks');
        const overdueTasksQuery = tasksRef
            .where('dueDate', '<', today.toISOString().split('T')[0]) // Compare date part only
            .where('status', 'in', ['Initiated', 'Pending', 'In Progress', 'Awaiting Approval']);
        const snapshot = await overdueTasksQuery.get();
        if (snapshot.empty) {
            functionsLogger.info('No active tasks currently display as overdue.');
            return null;
        }
        let derivedOverdueCount = 0;
        snapshot.forEach((doc) => {
            const taskData = doc.data();
            const dueDate = new Date(taskData.dueDate);
            const todayStart = new Date(today);
            // Double-check the date comparison in case of timezone issues
            if (dueDate < todayStart) {
                functionsLogger.info(`Task ${doc.id} displays as overdue. Due date: ${taskData.dueDate}, stored status: ${taskData.status}`);
                derivedOverdueCount++;
            }
        });
        functionsLogger.info(`${derivedOverdueCount} active tasks currently display as overdue. No task statuses were updated.`);
        return null;
    }
    catch (error) {
        functionsLogger.error('Error checking derived overdue tasks:', error);
        throw error;
    }
});
