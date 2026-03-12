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
exports.triggerTaskNotifications = exports.scheduledTaskNotifications = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const taskNotificationScheduler_1 = require("../utils/taskNotificationScheduler");
/**
 * Scheduled function to process task notifications
 * Runs daily at 9 AM EST (2 PM UTC)
 */
exports.scheduledTaskNotifications = functions.pubsub
    .schedule('0 14 * * *') // Daily at 2 PM UTC (9 AM EST)
    .timeZone('America/New_York')
    .onRun(async (context) => {
    console.log('🔔 Starting scheduled task notification processing...');
    try {
        await (0, taskNotificationScheduler_1.processTaskNotifications)();
        console.log('✅ Scheduled task notification processing completed');
    }
    catch (error) {
        console.error('❌ Error in scheduled task notification processing:', error);
        throw error;
    }
});
/**
 * HTTP function to manually trigger task notification processing
 * Useful for testing or manual runs
 */
exports.triggerTaskNotifications = functions.https.onRequest(async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }
    try {
        console.log('🔄 Manually triggering task notification processing...');
        await (0, taskNotificationScheduler_1.processTaskNotifications)();
        res.status(200).json({
            success: true,
            message: 'Task notification processing completed successfully',
        });
    }
    catch (error) {
        console.error('❌ Error in manual task notification processing:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
