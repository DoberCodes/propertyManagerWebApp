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
 * Scheduled function to automatically mark tasks as overdue
 * Runs daily at 9 AM EST
 */
exports.markTasksAsOverdue = functions.pubsub
    .schedule('0 9 * * *') // Daily at 9 AM
    .timeZone('America/New_York')
    .onRun(async (context) => {
    const functionsLogger = functions.logger;
    try {
        functionsLogger.info('Starting task overdue check...');
        // Get current date (start of today)
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // Query for tasks that:
        // 1. Have a dueDate before today
        // 2. Are not already completed, rejected, or overdue
        // 3. Are not on hold
        const tasksRef = db.collection('tasks');
        const overdueTasksQuery = tasksRef
            .where('dueDate', '<', today.toISOString().split('T')[0]) // Compare date part only
            .where('status', 'in', ['Initiated', 'Pending', 'In Progress', 'Awaiting Approval']);
        const snapshot = await overdueTasksQuery.get();
        if (snapshot.empty) {
            functionsLogger.info('No tasks found that need to be marked as overdue.');
            return null;
        }
        const batch = db.batch();
        let updateCount = 0;
        snapshot.forEach((doc) => {
            const taskData = doc.data();
            const dueDate = new Date(taskData.dueDate);
            const todayStart = new Date(today);
            // Double-check the date comparison in case of timezone issues
            if (dueDate < todayStart) {
                functionsLogger.info(`Marking task ${doc.id} as overdue. Due date: ${taskData.dueDate}, Status: ${taskData.status}`);
                batch.update(doc.ref, {
                    status: 'Overdue',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                updateCount++;
            }
        });
        if (updateCount > 0) {
            await batch.commit();
            functionsLogger.info(`Successfully marked ${updateCount} tasks as overdue.`);
        }
        else {
            functionsLogger.info('No tasks were updated (all were filtered out).');
        }
        return null;
    }
    catch (error) {
        functionsLogger.error('Error marking tasks as overdue:', error);
        throw error;
    }
});
