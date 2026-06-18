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
exports.cleanupClosedFeedbackAttachments = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const FEEDBACK_COLLECTION = 'feedback';
const CLOSED_STATUSES = new Set(['resolved', 'closed']);
const RETENTION_DAYS = 90;
const extractStoragePathFromGsUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw.toLowerCase().startsWith('gs://'))
        return null;
    const withoutPrefix = raw.slice(5);
    const slashIndex = withoutPrefix.indexOf('/');
    if (slashIndex <= 0 || slashIndex >= withoutPrefix.length - 1)
        return null;
    return withoutPrefix.slice(slashIndex + 1);
};
const extractStoragePathFromDownloadUrl = (value) => {
    const raw = String(value || '').trim();
    if (!raw)
        return null;
    try {
        const parsed = new URL(raw);
        if (!parsed.hostname.includes('firebasestorage.googleapis.com'))
            return null;
        const marker = '/o/';
        const markerIndex = parsed.pathname.indexOf(marker);
        if (markerIndex === -1)
            return null;
        const encodedPath = parsed.pathname.slice(markerIndex + marker.length);
        if (!encodedPath)
            return null;
        return decodeURIComponent(encodedPath);
    }
    catch {
        return null;
    }
};
const parseDateValue = (value) => {
    if (!value)
        return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object') {
        const record = value;
        if (typeof record.toDate === 'function') {
            const converted = record.toDate();
            return Number.isNaN(converted.getTime()) ? null : converted;
        }
        const seconds = Number(record.seconds || 0);
        if (Number.isFinite(seconds) && seconds > 0) {
            const parsed = new Date(seconds * 1000);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
    }
    return null;
};
const resolveAttachmentPath = (attachment) => {
    const directPath = String(attachment.path || attachment.storagePath || '').trim();
    if (directPath)
        return directPath;
    const gsPath = extractStoragePathFromGsUrl(String(attachment.attachmentUrl || attachment.url || ''));
    if (gsPath)
        return gsPath;
    const downloadPath = extractStoragePathFromDownloadUrl(String(attachment.attachmentUrl || attachment.url || ''));
    return downloadPath || '';
};
const isOlderThanRetention = (value, now) => {
    const retentionMillis = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    return now.getTime() - value.getTime() >= retentionMillis;
};
const getIsoWeekNumber = (date) => {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNumber = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};
exports.cleanupClosedFeedbackAttachments = functions.pubsub
    .schedule('0 3 * * 1')
    .timeZone('Etc/UTC')
    .onRun(async () => {
    const now = new Date();
    const isoWeek = getIsoWeekNumber(now);
    if (isoWeek % 2 !== 0) {
        functions.logger.info('Skipping cleanup this week (bi-weekly cadence).', {
            isoWeek,
        });
        return null;
    }
    const snapshot = await db
        .collection(FEEDBACK_COLLECTION)
        .where('status', 'in', ['resolved', 'closed'])
        .get();
    let processedTickets = 0;
    let deletedFiles = 0;
    let updatedTickets = 0;
    const bucket = admin.storage().bucket();
    for (const doc of snapshot.docs) {
        const data = (doc.data() || {});
        const status = String(data.status || '').trim().toLowerCase();
        if (!CLOSED_STATUSES.has(status))
            continue;
        const closedAt = parseDateValue(data.closedAt);
        const updatedAt = parseDateValue(data.updatedAt);
        const createdAt = parseDateValue(data.createdAt);
        const referenceDate = closedAt || updatedAt || createdAt;
        if (!referenceDate || !isOlderThanRetention(referenceDate, now)) {
            continue;
        }
        const attachments = Array.isArray(data.attachments)
            ? data.attachments
            : [];
        if (attachments.length === 0)
            continue;
        processedTickets += 1;
        let hasAttachmentChanges = false;
        const nextAttachments = await Promise.all(attachments.map(async (rawAttachment) => {
            const attachment = typeof rawAttachment === 'object' && rawAttachment
                ? { ...rawAttachment }
                : { filename: String(rawAttachment || 'attachment') };
            if (attachment.isDeleted || attachment.deletedAt) {
                return attachment;
            }
            const path = resolveAttachmentPath(attachment);
            if (path) {
                try {
                    await bucket.file(path).delete({ ignoreNotFound: true });
                    deletedFiles += 1;
                }
                catch (error) {
                    functions.logger.warn(`Attachment cleanup failed for ${doc.id} at ${path}`, error);
                }
            }
            hasAttachmentChanges = true;
            return {
                ...attachment,
                isDeleted: true,
                deleteReason: 'retention_expired',
                deletedAt: now.toISOString(),
                attachmentUrl: null,
            };
        }));
        if (!hasAttachmentChanges)
            continue;
        await doc.ref.set({
            attachments: nextAttachments,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        updatedTickets += 1;
    }
    functions.logger.info('Closed feedback attachment cleanup complete', {
        retentionDays: RETENTION_DAYS,
        processedTickets,
        updatedTickets,
        deletedFiles,
    });
    return null;
});
