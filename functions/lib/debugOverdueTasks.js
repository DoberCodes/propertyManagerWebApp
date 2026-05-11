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
exports.debugOverdueTasks = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * HTTP-callable debug function.
 * Runs the same query as markTasksAsOverdue but does NOT write anything.
 * Invoke from Firebase Console > Functions > debugOverdueTasks > "Test function",
 * or via: curl -X POST https://<region>-<project>.cloudfunctions.net/debugOverdueTasks
 *
 * Returns a summary of what the scheduler would mark as overdue.
 */
exports.debugOverdueTasks = functions.https.onRequest(async (req, res) => {
    try {
        const now = new Date();
        const todayDateString = now.toISOString().split('T')[0]; // e.g. "2026-03-28"
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        functions.logger.info(`[debugOverdueTasks] Running dry-run. today=${todayDateString}`);
        // Replicate exact query from markTasksAsOverdue
        const snapshot = await db
            .collection('tasks')
            .where('dueDate', '<', todayDateString)
            .where('status', 'in', ['Initiated', 'Pending', 'In Progress', 'Awaiting Approval'])
            .get();
        const found = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            const dueDate = new Date(data.dueDate);
            const wouldMark = dueDate < todayStart;
            found.push({
                id: doc.id,
                title: data.title,
                dueDate: data.dueDate,
                dueDateType: typeof data.dueDate,
                status: data.status,
                wouldBeMarkedOverdue: wouldMark,
            });
        });
        // Also run a broader query to check for tasks with no dueDate or wrong types
        const allTasksSnap = await db.collection('tasks').limit(5).get();
        const sampleFields = [];
        allTasksSnap.forEach((doc) => {
            const data = doc.data();
            sampleFields.push({
                id: doc.id,
                dueDateValue: data.dueDate,
                dueDateType: typeof data.dueDate,
                status: data.status,
            });
        });
        const result = {
            runAt: now.toISOString(),
            todayDateString,
            queryMatchCount: snapshot.size,
            wouldUpdateCount: found.filter((t) => t.wouldBeMarkedOverdue).length,
            tasks: found,
            sampleTaskFields: sampleFields,
        };
        functions.logger.info('[debugOverdueTasks] Result:', result);
        res.status(200).json(result);
    }
    catch (error) {
        functions.logger.error('[debugOverdueTasks] Error:', error);
        res.status(500).json({ error: error.message });
    }
});
