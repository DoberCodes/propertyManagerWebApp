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
exports.updateFeedbackAdminTicketStatus = exports.deleteFeedbackAdminParentTicket = exports.unlinkFeedbackAdminTicket = exports.linkFeedbackAdminTickets = exports.adminPortalManageUserSubscription = exports.adminPortalApplyUserBillingActions = exports.adminPortalRefreshUserSubscriptionFromStripe = exports.adminPortalCreateCheckoutLinkWithCoupon = exports.adminPortalListBillingCoupons = exports.adminPortalCreateBillingCoupon = exports.getAdminPortalUserTroubleshootingDetails = exports.listAdminPortalAuditLogs = exports.listAdminPortalUsers = exports.listFeedbackAdminTickets = exports.adminPortalResetPassword = exports.adminPortalLogout = exports.validateAdminPortalSession = exports.adminPortalLogin = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const crypto_1 = require("crypto");
const stripe_1 = __importDefault(require("stripe"));
const params_1 = require("firebase-functions/params");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const FUNCTIONS_CONFIG_EXPORT = (0, params_1.defineJsonSecret)('FUNCTIONS_CONFIG_EXPORT');
const ADMIN_PORTAL_STRIPE_SECRETS = [STRIPE_SECRET_KEY, FUNCTIONS_CONFIG_EXPORT];
const optionalStringParam = (name) => (0, params_1.defineString)(name, { default: '' });
const STRIPE_PRICE_PARAMS = {
    homeownerPlusMonthlyPriceId: optionalStringParam('STRIPE_HOMEOWNER_PLUS_MONTHLY_PRICE_ID'),
    homeownerPlusAnnualPriceId: optionalStringParam('STRIPE_HOMEOWNER_PLUS_ANNUAL_PRICE_ID'),
    propertyMonthlyPriceId: optionalStringParam('STRIPE_PROPERTY_MONTHLY_PRICE_ID'),
    propertyAnnualPriceId: optionalStringParam('STRIPE_PROPERTY_ANNUAL_PRICE_ID'),
    portfolioMonthlyPriceId: optionalStringParam('STRIPE_PORTFOLIO_MONTHLY_PRICE_ID'),
    portfolioAnnualPriceId: optionalStringParam('STRIPE_PORTFOLIO_ANNUAL_PRICE_ID'),
};
let adminPortalStripe = null;
let exportedFunctionsConfigCache;
const ADMIN_USERS_COLLECTION = 'admin_users';
const ADMIN_SESSIONS_COLLECTION = 'admin_sessions';
const ADMIN_AUDIT_LOGS_COLLECTION = 'admin_audit_logs';
const FEEDBACK_COLLECTION = 'feedback';
const USERS_COLLECTION = 'users';
const PROPERTIES_COLLECTION = 'properties';
const DEVICES_COLLECTION = 'devices';
const TASKS_COLLECTION = 'tasks';
const NOTIFICATIONS_COLLECTION = 'notifications';
const TEAM_MEMBERS_COLLECTION = 'teamMembers';
const MAINTENANCE_EVENTS_COLLECTION = 'maintenanceEvents';
const MAINTENANCE_HISTORY_COLLECTION = 'maintenanceHistory';
const SESSION_TTL_HOURS = 12;
const MAX_TICKET_RESULTS = 250;
const FEEDBACK_TICKET_PREFIX = 'MNT';
const FEEDBACK_STATUSES = new Set([
    'received',
    'in_progress',
    'resolved',
    'closed',
]);
const FEEDBACK_TYPES = new Set([
    'feedback',
    'feature_request',
    'bug_report',
]);
const normalizeUsername = (value) => String(value || '')
    .trim()
    .toLowerCase();
const hashToken = (token) => (0, crypto_1.createHash)('sha256').update(token).digest('hex');
const derivePasswordHash = (usernameLower, password, salt) => (0, crypto_1.scryptSync)(`${usernameLower}:${password}`, salt, 64).toString('hex');
const safeEqualHex = (leftHex, rightHex) => {
    if (!leftHex || !rightHex)
        return false;
    const left = Buffer.from(leftHex, 'hex');
    const right = Buffer.from(rightHex, 'hex');
    if (left.length !== right.length)
        return false;
    return (0, crypto_1.timingSafeEqual)(left, right);
};
const getPublicStatus = (status) => {
    switch (status) {
        case 'received':
            return 'received';
        case 'in_progress':
            return 'planned';
        case 'resolved':
            return 'fixed';
        case 'closed':
            return 'closed';
        default:
            return 'received';
    }
};
const formatFeedbackTicketNumber = (sequence) => `${FEEDBACK_TICKET_PREFIX}-${String(sequence).padStart(6, '0')}`;
const serializeTimestampValue = (value) => {
    if (value && typeof value === 'object' && 'toDate' in value) {
        const tsObj = value;
        return tsObj.toDate().toISOString();
    }
    return value;
};
const extractStoragePathFromGsUrl = (urlValue) => {
    const trimmed = String(urlValue || '').trim();
    if (!trimmed.toLowerCase().startsWith('gs://')) {
        return null;
    }
    const withoutPrefix = trimmed.slice(5);
    const slashIndex = withoutPrefix.indexOf('/');
    if (slashIndex === -1 || slashIndex === withoutPrefix.length - 1) {
        return null;
    }
    return withoutPrefix.slice(slashIndex + 1);
};
const getTicketNumberFromRecord = (record, docId) => {
    const existing = String(record.ticketNumber || '').trim();
    if (existing)
        return existing;
    const sequence = Number(record.ticketSequence || 0);
    if (Number.isFinite(sequence) && sequence > 0) {
        return formatFeedbackTicketNumber(sequence);
    }
    return `MNT-LEGACY-${docId.slice(0, 6).toUpperCase()}`;
};
const normalizeStringArray = (value) => Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))]
    : [];
const isGroupTicketRecord = (record) => Boolean(record.isGroupTicket);
const normalizeTicketStatus = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'reviewed')
        return 'in_progress';
    return FEEDBACK_STATUSES.has(normalized) ? normalized : 'received';
};
const normalizeTicketType = (value) => String(value || '').trim().toLowerCase();
const formatTicketStatusLabel = (status) => {
    switch (normalizeTicketStatus(status)) {
        case 'received':
            return 'Received';
        case 'in_progress':
            return 'In Progress';
        case 'resolved':
            return 'Resolved';
        case 'closed':
            return 'Closed';
        default:
            return 'Received';
    }
};
const pickMergedTicketStatus = (statuses) => {
    const order = ['received', 'in_progress', 'resolved', 'closed'];
    const normalizedSet = new Set(statuses.map((status) => normalizeTicketStatus(status)));
    for (let index = order.length - 1; index >= 0; index -= 1) {
        const candidate = order[index];
        if (normalizedSet.has(candidate)) {
            return candidate;
        }
    }
    return 'received';
};
const mergeUniqueAttachments = (rawAttachmentsList) => {
    const deduped = new Map();
    for (const rawAttachments of rawAttachmentsList) {
        if (!Array.isArray(rawAttachments))
            continue;
        for (const attachment of rawAttachments) {
            const attachmentRecord = typeof attachment === 'object' && attachment
                ? attachment
                : { value: String(attachment || '') };
            const dedupeKey = JSON.stringify({
                filename: String(attachmentRecord.filename || attachmentRecord.name || '').trim(),
                path: String(attachmentRecord.path || attachmentRecord.storagePath || '').trim(),
                attachmentUrl: String(attachmentRecord.attachmentUrl || attachmentRecord.url || attachmentRecord.downloadUrl || '').trim(),
                type: String(attachmentRecord.type || attachmentRecord.contentType || '').trim(),
                sizeBytes: Number(attachmentRecord.sizeBytes || 0),
            });
            if (!deduped.has(dedupeKey)) {
                deduped.set(dedupeKey, attachmentRecord);
            }
        }
    }
    return [...deduped.values()];
};
const buildGroupParentFields = (parentId, childDocs, statusFallback, resolutionNotesFallback, existingParentRecord) => {
    const childRecords = childDocs.map((doc) => ({
        id: doc.id,
        record: (doc.data() || {}),
    }));
    const childTicketIds = childRecords.map((item) => item.id);
    const childTicketNumbers = childRecords.map((item) => getTicketNumberFromRecord(item.record, item.id));
    const uniqueSubjects = [...new Set(childRecords
            .map((item) => String(item.record.subject || '').trim())
            .filter(Boolean))];
    const uniqueMessages = [...new Set(childRecords
            .map((item) => String(item.record.message || '').trim())
            .filter(Boolean))];
    const uniqueTypes = [...new Set(childRecords
            .map((item) => String(item.record.type || '').trim().toLowerCase())
            .filter(Boolean))];
    const uniqueUserEmails = [...new Set(childRecords
            .map((item) => String(item.record.userEmail || '').trim())
            .filter(Boolean))];
    const uniqueUserNames = [...new Set(childRecords
            .map((item) => String(item.record.userName || '').trim())
            .filter(Boolean))];
    const statuses = childRecords.map((item) => String(item.record.status || 'received'));
    const mergedStatus = pickMergedTicketStatus([...statuses, statusFallback]);
    const mergedPublicStatus = getPublicStatus(mergedStatus);
    const mergedResolutionNotes = String(existingParentRecord?.resolutionNotes || '').trim() ||
        resolutionNotesFallback ||
        String(childRecords
            .map((item) => String(item.record.resolutionNotes || '').trim())
            .find(Boolean) || '').trim();
    const mergedMessage = uniqueMessages.length <= 1
        ? (uniqueMessages[0] || 'Linked support case')
        : uniqueMessages
            .map((message, index) => `Message ${index + 1}:\n${message}`)
            .join('\n\n---\n\n');
    const mergedSubject = uniqueSubjects.length <= 1
        ? (uniqueSubjects[0] || `Linked Case (${childDocs.length} tickets)`)
        : `Linked Case (${childDocs.length} tickets): ${uniqueSubjects.join(' | ')}`;
    const mergedAttachments = mergeUniqueAttachments(childRecords.map((item) => item.record.attachments));
    const existingParentTicketNumber = String(existingParentRecord?.ticketNumber || '').trim();
    const existingParentCreatedAt = String(existingParentRecord?.createdAt || '').trim();
    return {
        type: uniqueTypes.length === 1 ? uniqueTypes[0] : 'feedback',
        subject: mergedSubject,
        message: mergedMessage,
        createdAt: existingParentCreatedAt || new Date().toISOString(),
        status: mergedStatus,
        publicStatus: mergedPublicStatus,
        resolutionNotes: mergedResolutionNotes || null,
        linkedPrimaryTicketId: parentId,
        linkedPrimaryTicketNumber: existingParentTicketNumber || `MNT-GRP-${parentId.slice(0, 8).toUpperCase()}`,
        isGroupTicket: true,
        isLinkedPrimary: true,
        isLinkedChild: false,
        linkedTicketIds: childTicketIds,
        linkedTicketNumbers: childTicketNumbers,
        groupChildTicketIds: childTicketIds,
        groupChildTicketNumbers: childTicketNumbers,
        childTicketCount: childTicketIds.length,
        ticketNumber: existingParentTicketNumber || `MNT-GRP-${parentId.slice(0, 8).toUpperCase()}`,
        userEmail: uniqueUserEmails.join(', ') || null,
        userName: uniqueUserNames.join(', ') || null,
        attachments: mergedAttachments,
        groupMeta: {
            combinedFromTicketIds: childTicketIds,
            combinedFromTicketNumbers: childTicketNumbers,
            combinedAt: new Date().toISOString(),
            deduplicatedSubjectCount: uniqueSubjects.length,
            deduplicatedMessageCount: uniqueMessages.length,
        },
    };
};
const getLinkedPrimaryTicketIdFromRecord = (record, docId) => {
    const linkedPrimaryTicketId = String(record.linkedPrimaryTicketId || '').trim();
    return linkedPrimaryTicketId || docId;
};
const loadFeedbackDocsByIds = async (ids) => {
    const uniqueIds = [...new Set(ids.map((item) => String(item || '').trim()).filter(Boolean))];
    const docs = await Promise.all(uniqueIds.map((id) => db.collection(FEEDBACK_COLLECTION).doc(id).get()));
    return docs.filter((doc) => doc.exists);
};
const getPrimaryFeedbackTicketDoc = async (docSnapshot) => {
    const record = (docSnapshot.data() || {});
    const primaryId = getLinkedPrimaryTicketIdFromRecord(record, docSnapshot.id);
    if (primaryId === docSnapshot.id) {
        return docSnapshot;
    }
    const primaryDoc = await db.collection(FEEDBACK_COLLECTION).doc(primaryId).get();
    return primaryDoc.exists ? primaryDoc : docSnapshot;
};
const getFeedbackTicketGroupDocs = async (seedDoc) => {
    const primaryDoc = await getPrimaryFeedbackTicketDoc(seedDoc);
    const primaryData = (primaryDoc.data() || {});
    const linkedIds = normalizeStringArray(primaryData.linkedTicketIds);
    const docs = await loadFeedbackDocsByIds([primaryDoc.id, seedDoc.id, ...linkedIds]);
    return {
        primaryDoc,
        docs: docs.length > 0 ? docs : [primaryDoc],
    };
};
const normalizePersistedAttachments = async (rawAttachments) => {
    if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
        return [];
    }
    const bucket = admin.storage().bucket();
    return Promise.all(rawAttachments.map(async (rawAttachment, index) => {
        const fallbackName = `attachment-${index + 1}`;
        if (typeof rawAttachment === 'string') {
            const value = rawAttachment.trim();
            if (!value) {
                return { filename: fallbackName, type: 'image/unknown', sizeBytes: 0 };
            }
            if (/^https?:\/\//i.test(value)) {
                return {
                    filename: fallbackName,
                    type: 'image/unknown',
                    sizeBytes: 0,
                    attachmentUrl: value,
                };
            }
            const parsedPath = extractStoragePathFromGsUrl(value) || value;
            try {
                const [metadata] = await bucket.file(parsedPath).getMetadata();
                const token = metadata?.metadata?.firebaseStorageDownloadTokens;
                const attachmentUrl = token
                    ? `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(parsedPath)}?alt=media&token=${token}`
                    : undefined;
                return {
                    filename: fallbackName,
                    type: 'image/unknown',
                    sizeBytes: 0,
                    path: parsedPath,
                    ...(attachmentUrl ? { attachmentUrl } : {}),
                };
            }
            catch {
                return {
                    filename: fallbackName,
                    type: 'image/unknown',
                    sizeBytes: 0,
                    path: parsedPath,
                };
            }
        }
        const attachment = typeof rawAttachment === 'object' && rawAttachment
            ? rawAttachment
            : {};
        const filename = String(attachment.filename || fallbackName).trim() || fallbackName;
        const type = String(attachment.type || attachment.contentType || 'image/unknown');
        const sizeBytes = Number(attachment.sizeBytes || 0);
        const rawUrl = String(attachment.attachmentUrl || attachment.url || attachment.downloadUrl || '').trim();
        const rawPath = String(attachment.path || attachment.storagePath || '').trim();
        let attachmentUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : '';
        let path = rawPath;
        if (!path && rawUrl.toLowerCase().startsWith('gs://')) {
            path = extractStoragePathFromGsUrl(rawUrl) || '';
        }
        if (!attachmentUrl && path) {
            try {
                const [metadata] = await bucket.file(path).getMetadata();
                const token = metadata?.metadata?.firebaseStorageDownloadTokens;
                if (token) {
                    attachmentUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
                }
            }
            catch {
                // keep metadata when URL generation fails
            }
        }
        return {
            filename,
            type,
            sizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
            ...(path ? { path } : {}),
            ...(attachmentUrl ? { attachmentUrl } : {}),
        };
    }));
};
const resolveFeedbackTicketByIdOrNumber = async (identifier) => {
    const trimmedIdentifier = String(identifier || '').trim();
    if (!trimmedIdentifier) {
        throw new functions.https.HttpsError('invalid-argument', 'Ticket reference is required.');
    }
    const byIdDoc = await db.collection(FEEDBACK_COLLECTION).doc(trimmedIdentifier).get();
    if (byIdDoc.exists) {
        return byIdDoc;
    }
    const byNumberSnapshot = await db
        .collection(FEEDBACK_COLLECTION)
        .where('ticketNumber', '==', trimmedIdentifier.toUpperCase())
        .limit(1)
        .get();
    if (!byNumberSnapshot.empty) {
        return byNumberSnapshot.docs[0];
    }
    throw new functions.https.HttpsError('not-found', 'Referenced ticket was not found.');
};
const normalizeMaintleyRole = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const toMillis = (value) => {
    if (!value)
        return 0;
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value > 1e12 ? value : value * 1000;
    }
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === 'object' && value && 'toDate' in value) {
        const tsObj = value;
        return tsObj.toDate().getTime();
    }
    return 0;
};
const toIsoString = (value) => {
    const millis = toMillis(value);
    return millis > 0 ? new Date(millis).toISOString() : '';
};
const tryCountWhere = async (collectionName, field, value) => {
    if (!value)
        return 0;
    try {
        const snapshot = await db
            .collection(collectionName)
            .where(field, '==', value)
            .get();
        return snapshot.size;
    }
    catch {
        return 0;
    }
};
const tryRecentByUser = async (collectionName, userId, maxResults) => {
    try {
        const snapshot = await db
            .collection(collectionName)
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(maxResults)
            .get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    catch {
        const fallbackSnapshot = await db
            .collection(collectionName)
            .where('userId', '==', userId)
            .limit(maxResults * 3)
            .get();
        return fallbackSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((left, right) => toMillis(right.createdAt) -
            toMillis(left.createdAt))
            .slice(0, maxResults);
    }
};
const tryRecentByField = async (collectionName, field, value, maxResults) => {
    if (!value)
        return [];
    try {
        const snapshot = await db
            .collection(collectionName)
            .where(field, '==', value)
            .orderBy('createdAt', 'desc')
            .limit(maxResults)
            .get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }
    catch {
        const fallbackSnapshot = await db
            .collection(collectionName)
            .where(field, '==', value)
            .limit(maxResults * 3)
            .get();
        return fallbackSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((left, right) => toMillis(right.createdAt) -
            toMillis(left.createdAt))
            .slice(0, maxResults);
    }
};
const normalizeAdminUserStatus = (record) => {
    const directDisabled = Boolean(record.isDisabled || record.disabled);
    const disabledAt = String(record.disabledAt || '').trim();
    const statusValue = String(record.status || '').trim().toLowerCase();
    if (directDisabled || disabledAt || statusValue === 'disabled' || statusValue === 'inactive') {
        return 'disabled';
    }
    return 'active';
};
const normalizeAdminListFilter = (value) => String(value || '')
    .trim()
    .toLowerCase();
const normalizeSubscriptionAction = (value) => String(value || '')
    .trim()
    .toLowerCase();
const normalizeBillingCouponDuration = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'repeating' || normalized === 'forever')
        return normalized;
    return 'once';
};
const normalizeBillingCycle = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'year' ? 'year' : 'month';
};
const normalizePromoCode = (value) => String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
const sanitizeSecret = (value) => value
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
const readStringParam = (param) => {
    try {
        return sanitizeSecret(param.value() || process.env[param.name] || '');
    }
    catch {
        return sanitizeSecret(process.env[param.name] || '');
    }
};
const readEnv = (name) => sanitizeSecret(process.env[name] || '');
const getExportedFunctionsConfig = () => {
    if (exportedFunctionsConfigCache !== undefined) {
        return exportedFunctionsConfigCache || {};
    }
    try {
        exportedFunctionsConfigCache = FUNCTIONS_CONFIG_EXPORT.value() || {};
        return exportedFunctionsConfigCache || {};
    }
    catch {
        const rawExport = readEnv('FUNCTIONS_CONFIG_EXPORT');
        if (rawExport) {
            try {
                exportedFunctionsConfigCache = JSON.parse(rawExport);
                return exportedFunctionsConfigCache || {};
            }
            catch {
                console.warn('Unable to parse FUNCTIONS_CONFIG_EXPORT as JSON.');
            }
        }
        exportedFunctionsConfigCache = null;
        return {};
    }
};
const readExportedStripeConfig = (key) => {
    const exportedConfig = getExportedFunctionsConfig();
    return sanitizeSecret(exportedConfig?.stripe?.[key] || '');
};
const resolveStripeSecretKey = () => {
    let secretFromManager = '';
    try {
        secretFromManager = STRIPE_SECRET_KEY.value() || '';
    }
    catch {
        console.warn('Unable to read STRIPE_SECRET_KEY from Secret Manager');
    }
    return sanitizeSecret(secretFromManager ||
        process.env.STRIPE_SECRET_KEY ||
        readExportedStripeConfig('secret_key'));
};
const getAdminPortalStripe = () => {
    if (!adminPortalStripe) {
        const stripeSecretKey = resolveStripeSecretKey();
        if (!stripeSecretKey) {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe secret key is not configured for admin subscription actions.');
        }
        adminPortalStripe = new stripe_1.default(stripeSecretKey, {
            apiVersion: '2023-10-16',
        });
    }
    return adminPortalStripe;
};
const resolveStripePriceIdForPlan = (planId, billingCycle = 'month') => {
    const normalizedPlan = String(planId || '').trim().toLowerCase();
    const normalizedCycle = billingCycle === 'year' ? 'year' : 'month';
    const homeownerPlusPriceId = readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusMonthlyPriceId) ||
        readEnv('STRIPE_HOMEOWNER_PLUS_PRICE_ID') ||
        readExportedStripeConfig('homeowner_plus_monthly_price_id') ||
        readExportedStripeConfig('homeowner_plus_price_id') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_MONTHLY_PLAN_ID') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_PLAN_ID');
    const homeownerPlusAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.homeownerPlusAnnualPriceId) ||
        readExportedStripeConfig('homeowner_plus_annual_price_id') ||
        readEnv('REACT_APP_STRIPE_HOMEOWNER_PLUS_ANNUAL_PLAN_ID');
    const propertyPriceId = readStringParam(STRIPE_PRICE_PARAMS.propertyMonthlyPriceId) ||
        readEnv('STRIPE_PROPERTY_PRICE_ID') ||
        readExportedStripeConfig('property_monthly_price_id') ||
        readExportedStripeConfig('property_price_id') ||
        readEnv('REACT_APP_STRIPE_PROPERTY_PLAN_ID');
    const propertyAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.propertyAnnualPriceId) ||
        readExportedStripeConfig('property_annual_price_id') ||
        readEnv('REACT_APP_STRIPE_PROPERTY_ANNUAL_PLAN_ID');
    const portfolioPriceId = readStringParam(STRIPE_PRICE_PARAMS.portfolioMonthlyPriceId) ||
        readEnv('STRIPE_PORTFOLIO_PRICE_ID') ||
        readExportedStripeConfig('portfolio_monthly_price_id') ||
        readExportedStripeConfig('portfolio_price_id') ||
        readEnv('REACT_APP_STRIPE_PORTFOLIO_PLAN_ID');
    const portfolioAnnualPriceId = readStringParam(STRIPE_PRICE_PARAMS.portfolioAnnualPriceId) ||
        readExportedStripeConfig('portfolio_annual_price_id') ||
        readEnv('REACT_APP_STRIPE_PORTFOLIO_ANNUAL_PLAN_ID');
    const monthlyPriceMap = {
        homeowner_plus: homeownerPlusPriceId,
        property: propertyPriceId,
        portfolio: portfolioPriceId,
    };
    const annualPriceMap = {
        homeowner_plus: homeownerPlusAnnualPriceId || homeownerPlusPriceId,
        property: propertyAnnualPriceId || propertyPriceId,
        portfolio: portfolioAnnualPriceId || portfolioPriceId,
    };
    return ((normalizedCycle === 'year' ? annualPriceMap : monthlyPriceMap)[normalizedPlan] || '');
};
const resolveAdminCheckoutBaseUrl = () => {
    const configured = readEnv('ADMIN_PORTAL_CHECKOUT_BASE_URL') ||
        readEnv('REACT_APP_BASE_URL') ||
        readExportedStripeConfig('app_base_url') ||
        readExportedStripeConfig('checkout_base_url');
    return configured.replace(/\/+$/, '');
};
const resolveSuccessUrl = (providedValue) => {
    const provided = String(providedValue || '').trim();
    if (provided)
        return provided;
    const baseUrl = resolveAdminCheckoutBaseUrl();
    return baseUrl
        ? `${baseUrl}/#/dashboard?session_id={CHECKOUT_SESSION_ID}`
        : 'https://maintley.com/#/dashboard?session_id={CHECKOUT_SESSION_ID}';
};
const resolveCancelUrl = (providedValue) => {
    const provided = String(providedValue || '').trim();
    if (provided)
        return provided;
    const baseUrl = resolveAdminCheckoutBaseUrl();
    return baseUrl ? `${baseUrl}/#/paywall` : 'https://maintley.com/#/paywall';
};
const resolveStripeProductIdForPlan = async (planId, billingCycle) => {
    const priceId = resolveStripePriceIdForPlan(planId, billingCycle);
    if (!priceId)
        return null;
    const price = await getAdminPortalStripe().prices.retrieve(priceId);
    const product = price.product;
    return typeof product === 'string' ? product : product?.id || null;
};
const getStripeDashboardCustomerUrl = (customerId) => {
    const normalized = String(customerId || '').trim();
    if (!normalized)
        return null;
    const stripeSecretKey = resolveStripeSecretKey();
    const testPrefix = stripeSecretKey.startsWith('sk_test_') ? '/test' : '';
    return `https://dashboard.stripe.com${testPrefix}/customers/${normalized}`;
};
const formatStripeAmount = (amountCents) => {
    if (!Number.isFinite(Number(amountCents)))
        return null;
    return Math.max(0, Math.round(Number(amountCents)));
};
const serializeAdminPromotionCode = (promotionCode) => {
    const coupon = promotionCode.coupon;
    const couponRecord = coupon && !coupon.deleted ? coupon : null;
    const expiresAt = promotionCode.expires_at || couponRecord?.redeem_by || null;
    const isExpired = Boolean(expiresAt && expiresAt * 1000 <= Date.now());
    const maxRedemptions = promotionCode.max_redemptions ?? couponRecord?.max_redemptions ?? null;
    const redeemedCount = promotionCode.times_redeemed ?? couponRecord?.times_redeemed ?? 0;
    return {
        id: promotionCode.id,
        code: promotionCode.code,
        active: Boolean(promotionCode.active && !isExpired),
        status: promotionCode.active && !isExpired ? 'active' : isExpired ? 'expired' : 'inactive',
        couponId: couponRecord?.id || null,
        name: couponRecord?.name || promotionCode.metadata?.name || '',
        percentOff: couponRecord?.percent_off ?? null,
        amountOff: couponRecord?.amount_off ?? null,
        currency: couponRecord?.currency || null,
        duration: couponRecord?.duration || null,
        durationMonths: couponRecord?.duration_in_months ?? null,
        maxRedemptions,
        redeemedCount,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
        appliesToPlan: promotionCode.metadata?.appliesToPlan || couponRecord?.metadata?.appliesToPlan || '',
        appliesToBillingCycle: promotionCode.metadata?.appliesToBillingCycle ||
            couponRecord?.metadata?.appliesToBillingCycle ||
            '',
        internalNote: promotionCode.metadata?.internalNote || couponRecord?.metadata?.internalNote || '',
        createdAt: promotionCode.created
            ? new Date(promotionCode.created * 1000).toISOString()
            : null,
    };
};
const resolveMaintleyPlanFromStripePriceId = (priceId) => {
    const normalizedPriceId = String(priceId || '').trim();
    if (!normalizedPriceId)
        return '';
    for (const planId of ['homeowner_plus', 'property', 'portfolio']) {
        for (const billingCycle of ['month', 'year']) {
            if (resolveStripePriceIdForPlan(planId, billingCycle) === normalizedPriceId) {
                return planId;
            }
        }
    }
    return '';
};
const getAdminStripeSubscriptionSummary = async (subscriptionId) => {
    const normalizedSubscriptionId = String(subscriptionId || '').trim();
    if (!normalizedSubscriptionId)
        return null;
    try {
        const stripeSubscription = await getAdminPortalStripe().subscriptions.retrieve(normalizedSubscriptionId, { expand: ['items.data.price.product'] });
        const item = stripeSubscription.items.data[0];
        const price = item?.price || null;
        const product = price && typeof price.product === 'object' && price.product
            ? price.product
            : null;
        const interval = price?.recurring?.interval || '';
        const planLabel = product?.name ||
            price?.nickname ||
            price?.lookup_key ||
            (price?.id ? `Stripe price ${price.id}` : 'Stripe subscription');
        return {
            id: stripeSubscription.id,
            status: stripeSubscription.status,
            planLabel: interval ? `${planLabel} (${interval})` : planLabel,
            priceId: price?.id || null,
            productId: product?.id || (typeof price?.product === 'string' ? price.product : null),
            productName: product?.name || null,
            lookupKey: price?.lookup_key || null,
            interval: interval || null,
            maintleyPlan: resolveMaintleyPlanFromStripePriceId(price?.id || '') || null,
            cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
            currentPeriodEnd: stripeSubscription.current_period_end
                ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
                : null,
            trialEnd: stripeSubscription.trial_end
                ? new Date(stripeSubscription.trial_end * 1000).toISOString()
                : null,
        };
    }
    catch (error) {
        const stripeError = error;
        console.warn(`Unable to retrieve Stripe subscription ${normalizedSubscriptionId} for admin details.`, stripeError?.message || error);
        return {
            id: normalizedSubscriptionId,
            status: 'unavailable',
            planLabel: null,
            error: stripeError?.message || 'Unable to retrieve Stripe subscription.',
        };
    }
};
const pickBestStripeSubscription = (subscriptions) => {
    if (subscriptions.length === 0)
        return null;
    const statusRank = {
        active: 0,
        trialing: 1,
        past_due: 2,
        unpaid: 3,
        incomplete: 4,
        canceled: 5,
        incomplete_expired: 6,
    };
    return [...subscriptions].sort((left, right) => {
        const leftRank = statusRank[left.status] ?? 99;
        const rightRank = statusRank[right.status] ?? 99;
        if (leftRank !== rightRank)
            return leftRank - rightRank;
        const leftPeriodEnd = Number(left.current_period_end || 0);
        const rightPeriodEnd = Number(right.current_period_end || 0);
        if (leftPeriodEnd !== rightPeriodEnd)
            return rightPeriodEnd - leftPeriodEnd;
        return Number(right.created || 0) - Number(left.created || 0);
    })[0] || null;
};
const buildAdminSubscriptionPatchFromStripe = (stripeSubscription, currentSubscription) => {
    const item = stripeSubscription.items.data[0];
    const price = item?.price || null;
    const mappedPlan = resolveMaintleyPlanFromStripePriceId(price?.id || '');
    const fallbackPlan = String(currentSubscription.plan || '').trim().toLowerCase();
    return removeUndefinedFields({
        ...currentSubscription,
        status: toLocalStripeSubscriptionStatus(stripeSubscription.status),
        plan: mappedPlan || fallbackPlan || 'homeowner',
        currentPeriodStart: stripeSubscription.current_period_start,
        currentPeriodEnd: stripeSubscription.current_period_end,
        trialEndsAt: stripeSubscription.trial_end,
        canceledAt: stripeSubscription.canceled_at ||
            (stripeSubscription.status === 'canceled' ? stripeSubscription.ended_at : undefined),
        stripeCustomerId: String(stripeSubscription.customer || ''),
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: price?.id || null,
        stripeProductId: typeof price?.product === 'string'
            ? price.product
            : price?.product?.id || null,
        cancelAtPeriodEnd: Boolean(stripeSubscription.cancel_at_period_end),
        hasScheduledSubscription: false,
        scheduledPlan: null,
        updatedAt: new Date().toISOString(),
    });
};
const findAdminStripeSubscriptionForUser = async (userData, currentSubscription) => {
    const stripe = getAdminPortalStripe();
    const stripeSubscriptionId = String(currentSubscription.stripeSubscriptionId || '').trim();
    if (stripeSubscriptionId) {
        try {
            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
                expand: ['items.data.price.product'],
            });
            return {
                subscription,
                matchedBy: 'stripe_subscription_id',
                customerId: String(subscription.customer || '') || null,
                candidateCount: 1,
            };
        }
        catch (error) {
            const stripeError = error;
            console.warn(`Stored Stripe subscription ${stripeSubscriptionId} could not be refreshed.`, stripeError?.message || error);
        }
    }
    const candidateCustomerIds = new Set();
    const storedCustomerId = String(currentSubscription.stripeCustomerId || '').trim();
    if (storedCustomerId) {
        candidateCustomerIds.add(storedCustomerId);
    }
    const email = String(userData.email || '').trim();
    if (email) {
        const customers = await stripe.customers.list({ email, limit: 10 });
        for (const customer of customers.data) {
            if (!customer.deleted) {
                candidateCustomerIds.add(customer.id);
            }
        }
    }
    const candidateSubscriptions = [];
    let matchedCustomerId = null;
    let matchedBy = 'none';
    for (const customerId of candidateCustomerIds) {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'all',
            limit: 20,
            expand: ['data.items.data.price'],
        });
        if (subscriptions.data.length > 0 && !matchedCustomerId) {
            matchedCustomerId = customerId;
            matchedBy = customerId === storedCustomerId ? 'stripe_customer_id' : 'email';
        }
        candidateSubscriptions.push(...subscriptions.data);
    }
    return {
        subscription: pickBestStripeSubscription(candidateSubscriptions),
        matchedBy,
        customerId: matchedCustomerId,
        candidateCount: candidateSubscriptions.length,
    };
};
const toLocalStripeSubscriptionStatus = (stripeStatus) => {
    if (stripeStatus === 'active')
        return 'active';
    if (stripeStatus === 'trialing')
        return 'trial';
    if (stripeStatus === 'canceled')
        return 'cancelled';
    return stripeStatus || 'expired';
};
const removeUndefinedFields = (record) => Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
const syncAdminFamilyAccountSubscription = async (userData, subscription) => {
    const accountId = String(userData.accountId || '').trim();
    if (!accountId)
        return;
    await db
        .collection('familyAccounts')
        .doc(accountId)
        .set({
        subscription: removeUndefinedFields(subscription),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
};
const resolveLastActiveMillis = (record) => {
    const subscription = typeof record.subscription === 'object' && record.subscription
        ? record.subscription
        : {};
    return Math.max(toMillis(record.lastActiveAt), toMillis(record.lastLoginAt), toMillis(record.lastSeenAt), toMillis(record.updatedAt), toMillis(subscription.updatedAt), toMillis(record.createdAt));
};
const addFileUsageFromRecord = (record, fieldName, seen, totals, prefix) => {
    const list = record[fieldName];
    if (!Array.isArray(list))
        return;
    for (let index = 0; index < list.length; index += 1) {
        const raw = list[index];
        const file = typeof raw === 'object' && raw ? raw : {};
        const size = Number(file.sizeBytes || file.size || file.fileSize || 0);
        if (!Number.isFinite(size) || size <= 0)
            continue;
        const key = [
            String(file.path || file.storagePath || '').trim(),
            String(file.attachmentUrl || file.url || '').trim(),
            String(file.filename || file.fileName || file.name || `${prefix}-${index}`).trim(),
            size,
        ].join('|');
        if (seen.has(key))
            continue;
        seen.add(key);
        totals.bytes += size;
        totals.count += 1;
    }
};
const getAccountDocumentUsage = async (accountId) => {
    if (!accountId)
        return { bytes: 0, count: 0 };
    const seen = new Set();
    const totals = { bytes: 0, count: 0 };
    const [devicesSnapshot, propertiesSnapshot, teamMembersSnapshot] = await Promise.all([
        tryRecentByField(DEVICES_COLLECTION, 'accountId', accountId, 500),
        tryRecentByField(PROPERTIES_COLLECTION, 'accountId', accountId, 500),
        tryRecentByField(TEAM_MEMBERS_COLLECTION, 'accountId', accountId, 500),
    ]);
    for (const device of devicesSnapshot) {
        addFileUsageFromRecord(device, 'files', seen, totals, `device-${device.id}`);
    }
    for (const property of propertiesSnapshot) {
        addFileUsageFromRecord(property, 'documents', seen, totals, `property-${property.id}`);
    }
    for (const member of teamMembersSnapshot) {
        addFileUsageFromRecord(member, 'files', seen, totals, `team-member-${member.id}`);
    }
    for (const collectionName of [MAINTENANCE_EVENTS_COLLECTION, MAINTENANCE_HISTORY_COLLECTION]) {
        const records = await tryRecentByField(collectionName, 'accountId', accountId, 500);
        for (const entry of records) {
            addFileUsageFromRecord(entry, 'attachments', seen, totals, `${collectionName}-${entry.id}`);
            const completionFile = typeof entry.completionFile === 'object' && entry.completionFile
                ? entry.completionFile
                : {};
            addFileUsageFromRecord({ completion: completionFile }, 'completion', seen, totals, `${collectionName}-${entry.id}-completion`);
        }
    }
    return totals;
};
const requireMaintleyAdmin = async (context) => {
    const uid = String(context.auth?.uid || '').trim();
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
    }
    const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'User profile not found.');
    }
    const userData = (userDoc.data() || {});
    const maintleyRole = normalizeMaintleyRole(userData.maintley_role);
    if (maintleyRole !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin access is required.');
    }
    const firstName = String(userData.firstName || '').trim();
    const lastName = String(userData.lastName || '').trim();
    const fallbackEmail = String(context.auth?.token?.email || '').trim();
    const profileEmail = String(userData.email || '').trim();
    const email = profileEmail || fallbackEmail || null;
    const displayName = `${firstName} ${lastName}`.trim() || email || 'Maintley Admin';
    return {
        uid,
        email,
        displayName,
    };
};
const TOP_LEVEL_MAINTLEY_ROLE_TOKENS = new Set([
    'admin',
    'top_level',
    'top_level_admin',
    'root',
    'global_admin',
    'super_admin',
    'superadmin',
    'maintley_owner',
    'platform_owner',
    'owner',
]);
const normalizeRoleToken = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
const hasTopLevelMaintleyRole = (maintleyRole) => {
    if (!maintleyRole)
        return false;
    if (typeof maintleyRole === 'string') {
        return TOP_LEVEL_MAINTLEY_ROLE_TOKENS.has(normalizeRoleToken(maintleyRole));
    }
    if (typeof maintleyRole !== 'object')
        return false;
    const roleRecord = maintleyRole;
    for (const flagKey of [
        'isTopLevel',
        'topLevel',
        'isRoot',
        'isSuperAdmin',
        'isMaintleyOwner',
    ]) {
        if (roleRecord[flagKey] === true)
            return true;
    }
    const candidateTokens = new Set();
    const appendToken = (value) => {
        const token = normalizeRoleToken(value);
        if (token)
            candidateTokens.add(token);
    };
    for (const key of ['role', 'value', 'maintley_role', 'level', 'tier', 'scope']) {
        appendToken(roleRecord[key]);
    }
    for (const key of ['roles', 'values', 'adminRoles']) {
        const value = roleRecord[key];
        if (Array.isArray(value)) {
            for (const item of value)
                appendToken(item);
        }
    }
    for (const token of candidateTokens) {
        if (TOP_LEVEL_MAINTLEY_ROLE_TOKENS.has(token))
            return true;
    }
    return false;
};
const requireTopLevelMaintleyAdmin = async (context) => {
    const adminAuth = await requireMaintleyAdmin(context);
    const userDoc = await db.collection(USERS_COLLECTION).doc(adminAuth.uid).get();
    const userData = (userDoc.data() || {});
    const authToken = (context.auth?.token || {});
    const hasTopLevelAccess = hasTopLevelMaintleyRole(userData.maintley_role) ||
        hasTopLevelMaintleyRole(authToken.maintley_role) ||
        hasTopLevelMaintleyRole(authToken.role) ||
        hasTopLevelMaintleyRole(authToken.roles) ||
        hasTopLevelMaintleyRole(authToken.adminRole) ||
        hasTopLevelMaintleyRole(authToken.adminRoles);
    if (!hasTopLevelAccess) {
        throw new functions.https.HttpsError('permission-denied', 'Top-level admin access is required.');
    }
    return adminAuth;
};
const requireAdminSession = async (sessionToken) => {
    const normalizedToken = String(sessionToken || '').trim();
    if (!normalizedToken) {
        throw new functions.https.HttpsError('unauthenticated', 'Admin session is required.');
    }
    const tokenHash = hashToken(normalizedToken);
    const snapshot = await db
        .collection(ADMIN_SESSIONS_COLLECTION)
        .where('tokenHash', '==', tokenHash)
        .where('isActive', '==', true)
        .limit(1)
        .get();
    if (snapshot.empty) {
        throw new functions.https.HttpsError('unauthenticated', 'Admin session is invalid.');
    }
    const sessionDoc = snapshot.docs[0];
    const sessionData = sessionDoc.data();
    const expiresAtMillis = Number(sessionData.expiresAtMillis || 0);
    if (!Number.isFinite(expiresAtMillis) || Date.now() >= expiresAtMillis) {
        await sessionDoc.ref.set({
            isActive: false,
            revokedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        throw new functions.https.HttpsError('unauthenticated', 'Admin session has expired. Please sign in again.');
    }
    const adminUserId = String(sessionData.adminUserId || '').trim();
    if (!adminUserId) {
        throw new functions.https.HttpsError('unauthenticated', 'Admin session is invalid.');
    }
    const adminUserDoc = await db.collection(ADMIN_USERS_COLLECTION).doc(adminUserId).get();
    if (!adminUserDoc.exists) {
        throw new functions.https.HttpsError('unauthenticated', 'Admin user not found.');
    }
    const adminUserData = adminUserDoc.data();
    if (adminUserData.isActive === false) {
        throw new functions.https.HttpsError('unauthenticated', 'Admin user is inactive.');
    }
    await sessionDoc.ref.set({
        lastValidatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return {
        sessionId: sessionDoc.id,
        adminUserId: adminUserDoc.id,
        usernameLower: String(adminUserData.usernameLower || '').trim(),
        username: String(adminUserData.username || adminUserData.usernameLower || '').trim(),
        displayName: String(adminUserData.displayName || adminUserData.username || adminUserData.usernameLower || 'Admin'),
        email: adminUserData.email ? String(adminUserData.email).trim() : null,
        roles: Array.isArray(adminUserData.roles)
            ? adminUserData.roles.map((role) => String(role))
            : [],
    };
};
exports.adminPortalLogin = functions.https.onCall(async (data) => {
    const usernameLower = normalizeUsername(data?.username);
    const password = String(data?.password || '');
    if (!usernameLower || !password.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Username and password are required.');
    }
    const userSnapshot = await db
        .collection(ADMIN_USERS_COLLECTION)
        .where('usernameLower', '==', usernameLower)
        .where('isActive', '==', true)
        .limit(1)
        .get();
    if (userSnapshot.empty) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid admin credentials.');
    }
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const passwordSalt = String(userData.passwordSalt || '').trim();
    const passwordHash = String(userData.passwordHash || '').trim();
    if (!passwordSalt || !passwordHash) {
        throw new functions.https.HttpsError('failed-precondition', 'Admin user record is missing password hash fields.');
    }
    const computedHash = derivePasswordHash(usernameLower, password, passwordSalt);
    if (!safeEqualHex(computedHash, passwordHash)) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid admin credentials.');
    }
    const sessionToken = (0, crypto_1.randomBytes)(48).toString('hex');
    const expiresAtMillis = Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000;
    const tokenHash = hashToken(sessionToken);
    await db.collection(ADMIN_SESSIONS_COLLECTION).add({
        adminUserId: userDoc.id,
        tokenHash,
        isActive: true,
        expiresAtMillis,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastValidatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        sessionToken,
        expiresAtMillis,
        adminUser: {
            id: userDoc.id,
            username: String(userData.username || usernameLower),
            displayName: String(userData.displayName || userData.username || usernameLower),
            email: userData.email ? String(userData.email) : null,
            roles: Array.isArray(userData.roles)
                ? userData.roles.map((role) => String(role))
                : [],
        },
    };
});
exports.validateAdminPortalSession = functions.https.onCall(async (data) => {
    const session = await requireAdminSession(String(data?.sessionToken || ''));
    return {
        valid: true,
        adminUser: {
            id: session.adminUserId,
            username: session.username,
            displayName: session.displayName,
            email: session.email,
            roles: session.roles,
        },
    };
});
exports.adminPortalLogout = functions.https.onCall(async (data) => {
    const token = String(data?.sessionToken || '').trim();
    if (!token) {
        return { success: true };
    }
    const tokenHash = hashToken(token);
    const snapshot = await db
        .collection(ADMIN_SESSIONS_COLLECTION)
        .where('tokenHash', '==', tokenHash)
        .where('isActive', '==', true)
        .limit(1)
        .get();
    if (!snapshot.empty) {
        await snapshot.docs[0].ref.set({
            isActive: false,
            revokedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    return { success: true };
});
exports.adminPortalResetPassword = functions.https.onCall(async (data) => {
    const session = await requireAdminSession(String(data?.sessionToken || ''));
    const currentPassword = String(data?.currentPassword || '');
    const newPassword = String(data?.newPassword || '');
    if (!currentPassword.trim() || !newPassword.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Current and new passwords are required.');
    }
    if (newPassword.length < 10) {
        throw new functions.https.HttpsError('invalid-argument', 'New password must be at least 10 characters long.');
    }
    const adminUserRef = db.collection(ADMIN_USERS_COLLECTION).doc(session.adminUserId);
    const adminUserDoc = await adminUserRef.get();
    if (!adminUserDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Admin user not found.');
    }
    const adminUserData = adminUserDoc.data();
    const existingSalt = String(adminUserData.passwordSalt || '').trim();
    const existingHash = String(adminUserData.passwordHash || '').trim();
    const usernameLower = String(adminUserData.usernameLower || session.usernameLower || '')
        .trim()
        .toLowerCase();
    if (!existingSalt || !existingHash || !usernameLower) {
        throw new functions.https.HttpsError('failed-precondition', 'Admin user record is missing password fields.');
    }
    const currentHash = derivePasswordHash(usernameLower, currentPassword, existingSalt);
    if (!safeEqualHex(currentHash, existingHash)) {
        throw new functions.https.HttpsError('permission-denied', 'Current password is incorrect.');
    }
    const nextSalt = (0, crypto_1.randomBytes)(16).toString('hex');
    const nextHash = derivePasswordHash(usernameLower, newPassword, nextSalt);
    await adminUserRef.set({
        passwordSalt: nextSalt,
        passwordHash: nextHash,
        passwordUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    const activeSessions = await db
        .collection(ADMIN_SESSIONS_COLLECTION)
        .where('adminUserId', '==', session.adminUserId)
        .where('isActive', '==', true)
        .get();
    if (!activeSessions.empty) {
        const batch = db.batch();
        for (const doc of activeSessions.docs) {
            batch.set(doc.ref, {
                isActive: false,
                revokedAt: admin.firestore.FieldValue.serverTimestamp(),
                revokedReason: 'password_reset',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        await batch.commit();
    }
    return {
        success: true,
        message: 'Password updated. Please sign in again.',
    };
});
exports.listFeedbackAdminTickets = functions.https.onCall(async (data, context) => {
    await requireMaintleyAdmin(context);
    const requestedStatus = String(data?.status || '').trim().toLowerCase();
    const requestedType = String(data?.type || '').trim().toLowerCase();
    const requestedLimit = Number(data?.limit || 100);
    const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), MAX_TICKET_RESULTS)
        : 100;
    const snapshot = await db
        .collection(FEEDBACK_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    let tickets = await Promise.all(snapshot.docs.map(async (doc) => {
        const raw = doc.data();
        return {
            id: doc.id,
            ...raw,
            ticketNumber: getTicketNumberFromRecord(raw, doc.id),
            createdAt: serializeTimestampValue(raw.createdAt),
            updatedAt: serializeTimestampValue(raw.updatedAt),
            attachments: await normalizePersistedAttachments(raw.attachments),
        };
    }));
    if (requestedStatus) {
        tickets = tickets.filter((ticket) => String(ticket['status'] || '')
            .trim()
            .toLowerCase() === requestedStatus);
    }
    if (requestedType) {
        tickets = tickets.filter((ticket) => String(ticket['type'] || '')
            .trim()
            .toLowerCase() === requestedType);
    }
    return { tickets };
});
exports.listAdminPortalUsers = functions.https.onCall(async (data, context) => {
    await requireMaintleyAdmin(context);
    const requestedLimit = Number(data?.limit || 100);
    const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 300)
        : 100;
    const normalizedQuery = String(data?.query || '').trim().toLowerCase();
    const normalizedRole = String(data?.role || '').trim().toLowerCase();
    const normalizedFilter = normalizeAdminListFilter(data?.filter);
    const propertyCountByAccount = new Map();
    const propertyCountByUser = new Map();
    const snapshot = await db.collection(USERS_COLLECTION).limit(limit).get();
    let users = await Promise.all(snapshot.docs.map(async (doc) => {
        const raw = (doc.data() || {});
        const firstName = String(raw.firstName || '').trim();
        const lastName = String(raw.lastName || '').trim();
        const email = String(raw.email || '').trim() || null;
        const maintleyRole = normalizeMaintleyRole(raw.maintley_role) || 'user';
        const accountStatus = normalizeAdminUserStatus(raw);
        const accountId = String(raw.accountId || '').trim() || null;
        const lastActiveAtMillis = resolveLastActiveMillis(raw);
        const subscription = typeof raw.subscription === 'object' && raw.subscription
            ? raw.subscription
            : {};
        let propertyCount = 0;
        if (accountId) {
            if (!propertyCountByAccount.has(accountId)) {
                propertyCountByAccount.set(accountId, await tryCountWhere(PROPERTIES_COLLECTION, 'accountId', accountId));
            }
            propertyCount = propertyCountByAccount.get(accountId) || 0;
        }
        else {
            if (!propertyCountByUser.has(doc.id)) {
                const [byUser, byOwner] = await Promise.all([
                    tryCountWhere(PROPERTIES_COLLECTION, 'userId', doc.id),
                    tryCountWhere(PROPERTIES_COLLECTION, 'ownerId', doc.id),
                ]);
                propertyCountByUser.set(doc.id, byOwner || byUser || 0);
            }
            propertyCount = propertyCountByUser.get(doc.id) || 0;
        }
        return {
            id: doc.id,
            email,
            accountId,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`.trim() || email || `User ${doc.id.slice(0, 6)}`,
            maintleyRole,
            accountStatus,
            propertyCount,
            subscriptionPlan: String(subscription.plan || '').trim() || 'none',
            subscriptionStatus: String(subscription.status || '').trim() || 'none',
            createdAt: serializeTimestampValue(raw.createdAt),
            updatedAt: serializeTimestampValue(raw.updatedAt),
            lastActiveAt: lastActiveAtMillis > 0 ? new Date(lastActiveAtMillis).toISOString() : null,
            lastLoginAt: toIsoString(raw.lastLoginAt),
        };
    }));
    if (normalizedRole) {
        users = users.filter((user) => String(user.maintleyRole || '').trim().toLowerCase() === normalizedRole);
    }
    if (normalizedFilter) {
        users = users.filter((user) => {
            const plan = String(user.subscriptionPlan || '').trim().toLowerCase();
            const status = String(user.subscriptionStatus || '').trim().toLowerCase();
            const accountStatus = String(user.accountStatus || '').trim().toLowerCase();
            const role = String(user.maintleyRole || '').trim().toLowerCase();
            switch (normalizedFilter) {
                case 'active':
                    return accountStatus === 'active';
                case 'disabled':
                    return accountStatus === 'disabled';
                case 'trial':
                    return status === 'trial';
                case 'free':
                    return plan === 'homeowner' || plan === 'free' || plan === 'none';
                case 'paid':
                    return !['homeowner', 'free', 'none'].includes(plan);
                case 'property_manager':
                    return role === 'property_manager';
                default:
                    return true;
            }
        });
    }
    if (normalizedQuery) {
        users = users.filter((user) => {
            const haystack = [
                String(user.displayName || ''),
                String(user.email || ''),
                String(user.maintleyRole || ''),
                String(user.subscriptionPlan || ''),
                String(user.accountStatus || ''),
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }
    users.sort((left, right) => {
        const roleCompare = String(left.maintleyRole || '').localeCompare(String(right.maintleyRole || ''));
        if (roleCompare !== 0)
            return roleCompare;
        return String(left.displayName || '').localeCompare(String(right.displayName || ''));
    });
    return { users };
});
exports.listAdminPortalAuditLogs = functions.https.onCall(async (data, context) => {
    await requireTopLevelMaintleyAdmin(context);
    const requestedLimit = Number(data?.limit || 100);
    const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 300)
        : 100;
    const queryToken = String(data?.query || '').trim().toLowerCase();
    const actionToken = String(data?.action || '').trim().toLowerCase();
    const targetIdToken = String(data?.targetId || '').trim().toLowerCase();
    const snapshot = await db
        .collection(ADMIN_AUDIT_LOGS_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    let logs = snapshot.docs.map((doc) => {
        const record = (doc.data() || {});
        const performedBy = typeof record.performedBy === 'object' && record.performedBy
            ? record.performedBy
            : {};
        return {
            id: doc.id,
            category: String(record.category || '').trim() || null,
            action: String(record.action || '').trim() || null,
            targetType: String(record.targetType || '').trim() || null,
            targetId: String(record.targetId || record.targetUserId || '').trim() || null,
            performedBy: {
                uid: String(performedBy.uid ||
                    performedBy.adminUserId ||
                    performedBy.userId ||
                    '').trim() || null,
                displayName: String(performedBy.displayName || performedBy.username || '').trim() || null,
                email: String(performedBy.email || '').trim() || null,
            },
            before: typeof record.before === 'object' && record.before
                ? record.before
                : null,
            after: typeof record.after === 'object' && record.after
                ? record.after
                : null,
            metadata: typeof record.metadata === 'object' && record.metadata
                ? record.metadata
                : null,
            createdAt: serializeTimestampValue(record.createdAt),
        };
    });
    if (actionToken) {
        logs = logs.filter((log) => String(log.action || '').trim().toLowerCase() === actionToken);
    }
    if (targetIdToken) {
        logs = logs.filter((log) => String(log.targetId || '').trim().toLowerCase() === targetIdToken);
    }
    if (queryToken) {
        logs = logs.filter((log) => {
            const performedBy = typeof log.performedBy === 'object' && log.performedBy
                ? log.performedBy
                : {};
            const haystack = [
                String(log.category || ''),
                String(log.action || ''),
                String(log.targetType || ''),
                String(log.targetId || ''),
                String(performedBy.displayName || ''),
                String(performedBy.email || ''),
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(queryToken);
        });
    }
    return { logs };
});
exports.getAdminPortalUserTroubleshootingDetails = functions
    .runWith({ secrets: ADMIN_PORTAL_STRIPE_SECRETS })
    .https.onCall(async (data, context) => {
    await requireMaintleyAdmin(context);
    const targetUserId = String(data?.userId || '').trim();
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required.');
    }
    const userDoc = await db.collection(USERS_COLLECTION).doc(targetUserId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User was not found.');
    }
    const userData = (userDoc.data() || {});
    const firstName = String(userData.firstName || '').trim();
    const lastName = String(userData.lastName || '').trim();
    const email = String(userData.email || '').trim() || null;
    const accountId = String(userData.accountId || '').trim();
    const maintleyRole = normalizeMaintleyRole(userData.maintley_role) || 'user';
    const accountStatus = normalizeAdminUserStatus(userData);
    const subscription = typeof userData.subscription === 'object' && userData.subscription
        ? userData.subscription
        : {};
    const stripeSubscriptionId = String(subscription.stripeSubscriptionId || '').trim();
    const stripeSubscriptionSummary = await getAdminStripeSubscriptionSummary(stripeSubscriptionId);
    const inviteCode = String(userData.inviteCode || userData.invitationCode || userData.teamInviteCode || '')
        .trim() || null;
    const [propertyCountByAccount, propertyCountByUserId, propertyCountByOwnerId] = await Promise.all([
        tryCountWhere(PROPERTIES_COLLECTION, 'accountId', accountId),
        tryCountWhere(PROPERTIES_COLLECTION, 'userId', targetUserId),
        tryCountWhere(PROPERTIES_COLLECTION, 'ownerId', targetUserId),
    ]);
    const [systemsCountByAccount, systemsCountByUserId, tasksCountByAccount, tasksCountByUserId] = await Promise.all([
        tryCountWhere(DEVICES_COLLECTION, 'accountId', accountId),
        tryCountWhere(DEVICES_COLLECTION, 'userId', targetUserId),
        tryCountWhere(TASKS_COLLECTION, 'accountId', accountId),
        tryCountWhere(TASKS_COLLECTION, 'userId', targetUserId),
    ]);
    const [recentSupportDocs, recentBugDocs, recentNotificationDocs, recentTaskDocs, recentPropertyDocs] = await Promise.all([
        tryRecentByUser(FEEDBACK_COLLECTION, targetUserId, 50),
        tryRecentByUser(FEEDBACK_COLLECTION, targetUserId, 20),
        tryRecentByUser(NOTIFICATIONS_COLLECTION, targetUserId, 8),
        accountId
            ? tryRecentByField(TASKS_COLLECTION, 'accountId', accountId, 30)
            : tryRecentByUser(TASKS_COLLECTION, targetUserId, 30),
        accountId
            ? tryRecentByField(PROPERTIES_COLLECTION, 'accountId', accountId, 12)
            : tryRecentByUser(PROPERTIES_COLLECTION, targetUserId, 12),
    ]);
    const totalSupportRequestCount = await tryCountWhere(FEEDBACK_COLLECTION, 'userId', targetUserId);
    const teamMemberCount = accountId
        ? await tryCountWhere(TEAM_MEMBERS_COLLECTION, 'accountId', accountId)
        : await tryCountWhere(TEAM_MEMBERS_COLLECTION, 'userId', targetUserId);
    const usage = await getAccountDocumentUsage(accountId || targetUserId);
    const recentSupportRequests = recentSupportDocs.map((doc) => {
        const type = String(doc.type || 'feedback').trim().toLowerCase();
        return {
            id: doc.id,
            ticketNumber: String(doc.ticketNumber || '').trim() || null,
            type,
            subject: String(doc.subject || '').trim() || '(No subject)',
            status: String(doc.status || 'received').trim() || 'received',
            createdAt: toIsoString(doc.createdAt),
        };
    });
    const recentErrors = recentBugDocs
        .filter((doc) => String(doc.type || '').trim().toLowerCase() === 'bug_report')
        .slice(0, 8)
        .map((doc) => {
        const submissionContext = typeof doc.submissionContext === 'object' && doc.submissionContext
            ? doc.submissionContext
            : {};
        return {
            id: doc.id,
            ticketNumber: String(doc.ticketNumber || '').trim() || null,
            subject: String(doc.subject || '').trim() || '(No subject)',
            status: String(doc.status || 'received').trim() || 'received',
            pageUrl: String(submissionContext.pageUrl || '').trim() || null,
            appVersion: String(submissionContext.appVersion || '').trim() || null,
            createdAt: toIsoString(doc.createdAt),
        };
    });
    const recentNotifications = recentNotificationDocs.map((doc) => ({
        id: doc.id,
        title: String(doc.title || doc.type || 'Notification').trim(),
        message: String(doc.message || doc.body || '').trim(),
        status: String(doc.status || '').trim() || null,
        createdAt: toIsoString(doc.createdAt),
    }));
    const recentActivity = [
        ...recentSupportRequests.map((item) => ({
            source: 'support_request',
            description: `${item.type}: ${item.subject}`,
            createdAt: item.createdAt,
        })),
        ...recentNotifications.map((item) => ({
            source: 'notification',
            description: item.title,
            createdAt: item.createdAt,
        })),
        ...recentTaskDocs.map((item) => ({
            source: 'task',
            description: String(item.task_name || item.taskName || item.title || '').trim() ||
                'Task activity',
            createdAt: toIsoString(item.updatedAt || item.createdAt),
        })),
        ...recentPropertyDocs.map((item) => ({
            source: 'property',
            description: String(item.property_name || item.name || item.title || '').trim() ||
                'Property activity',
            createdAt: toIsoString(item.updatedAt || item.createdAt),
        })),
    ]
        .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt))
        .slice(0, 30);
    const supportAttachmentStorageBytes = recentSupportDocs.reduce((total, doc) => {
        const attachments = Array.isArray(doc.attachments) ? doc.attachments : [];
        const attachmentBytes = attachments.reduce((sum, attachment) => {
            const record = typeof attachment === 'object' && attachment
                ? attachment
                : {};
            const size = Number(record.sizeBytes || 0);
            return sum + (Number.isFinite(size) ? size : 0);
        }, 0);
        return total + attachmentBytes;
    }, 0);
    return {
        profile: {
            id: targetUserId,
            email,
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`.trim() || email || `User ${targetUserId.slice(0, 6)}`,
            maintleyRole,
            accountStatus,
            accountId: accountId || null,
            subscriptionPlan: String(subscription.plan || '').trim() || 'none',
            subscriptionStatus: String(subscription.status || '').trim() || 'none',
            stripeCustomerId: String(subscription.stripeCustomerId || '').trim() || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
            stripeSubscription: stripeSubscriptionSummary,
            stripeCustomerUrl: getStripeDashboardCustomerUrl(String(subscription.stripeCustomerId || '').trim()),
            hasStripeSubscription: Boolean(stripeSubscriptionId) ||
                Boolean(String(subscription.stripeCustomerId || '').trim()),
            inviteCode,
            lastLoginAt: toIsoString(userData.lastLoginAt),
            lastActivityAt: recentActivity.length > 0
                ? String(recentActivity[0]?.createdAt || '')
                : toIsoString(userData.updatedAt),
            createdAt: toIsoString(userData.createdAt),
            updatedAt: toIsoString(userData.updatedAt),
        },
        metrics: {
            propertyCount: propertyCountByAccount || propertyCountByOwnerId || propertyCountByUserId || 0,
            systemCount: systemsCountByAccount || systemsCountByUserId || 0,
            taskCount: tasksCountByAccount || tasksCountByUserId || 0,
            documentCount: usage.count,
            teamMemberCount,
            supportRequestCount: totalSupportRequestCount || recentSupportRequests.length,
            supportAttachmentStorageBytes: Math.max(supportAttachmentStorageBytes, usage.bytes),
            recentErrorCount: recentErrors.length,
            openTicketCount: recentSupportRequests.filter((entry) => !['resolved', 'closed'].includes(String(entry.status || '').trim().toLowerCase())).length,
        },
        recentSupportRequests,
        recentErrors,
        recentNotifications,
        recentActivity,
    };
});
exports.adminPortalCreateBillingCoupon = functions
    .runWith({ secrets: ADMIN_PORTAL_STRIPE_SECRETS })
    .https.onCall(async (data) => {
    const adminSession = await requireAdminSession(String(data?.sessionToken || ''));
    const stripe = getAdminPortalStripe();
    const code = normalizePromoCode(data?.code);
    if (!code) {
        throw new functions.https.HttpsError('invalid-argument', 'Coupon code is required.');
    }
    const discountType = String(data?.discountType || '').trim().toLowerCase();
    const percentOff = Number(data?.percentOff || 0);
    const amountOffCents = formatStripeAmount(Number(data?.amountOffCents || 0));
    if (discountType === 'percent') {
        if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
            throw new functions.https.HttpsError('invalid-argument', 'Percent off must be between 1 and 100.');
        }
    }
    else if (discountType === 'amount') {
        if (!amountOffCents || amountOffCents <= 0) {
            throw new functions.https.HttpsError('invalid-argument', 'Dollar off must be greater than 0.');
        }
    }
    else {
        throw new functions.https.HttpsError('invalid-argument', 'Discount type must be percent or amount.');
    }
    const duration = normalizeBillingCouponDuration(data?.duration);
    const durationMonths = Number(data?.durationMonths || 0);
    if (duration === 'repeating' &&
        (!Number.isFinite(durationMonths) || durationMonths < 1 || durationMonths > 36)) {
        throw new functions.https.HttpsError('invalid-argument', 'Repeating coupons must last between 1 and 36 months.');
    }
    const maxRedemptions = Number(data?.maxRedemptions || 0);
    if (data?.maxRedemptions && (!Number.isFinite(maxRedemptions) || maxRedemptions < 1)) {
        throw new functions.https.HttpsError('invalid-argument', 'Max redemptions must be at least 1.');
    }
    let expiresAtSeconds;
    const expiresAt = String(data?.expiresAt || '').trim();
    if (expiresAt) {
        const parsed = Date.parse(expiresAt);
        if (Number.isNaN(parsed) || parsed <= Date.now()) {
            throw new functions.https.HttpsError('invalid-argument', 'Expiration date must be in the future.');
        }
        expiresAtSeconds = Math.floor(parsed / 1000);
    }
    const appliesToPlan = String(data?.appliesToPlan || '').trim().toLowerCase();
    const appliesToBillingCycle = normalizeBillingCycle(data?.appliesToBillingCycle);
    const appliesToProductId = appliesToPlan
        ? await resolveStripeProductIdForPlan(appliesToPlan, appliesToBillingCycle)
        : null;
    if (appliesToPlan && !appliesToProductId) {
        throw new functions.https.HttpsError('failed-precondition', `No Stripe price is configured for ${appliesToPlan}.`);
    }
    const metadata = removeUndefinedFields({
        source: 'maintley_admin_portal',
        createdByAdminUserId: adminSession.adminUserId,
        createdByAdminUsername: adminSession.username,
        appliesToPlan: appliesToPlan || undefined,
        appliesToBillingCycle: appliesToPlan ? appliesToBillingCycle : undefined,
        internalNote: String(data?.internalNote || '').trim() || undefined,
        name: String(data?.name || '').trim() || undefined,
    });
    try {
        const coupon = await stripe.coupons.create({
            name: String(data?.name || '').trim() || code,
            duration,
            ...(duration === 'repeating'
                ? { duration_in_months: Math.round(durationMonths) }
                : {}),
            ...(discountType === 'percent'
                ? { percent_off: percentOff }
                : { amount_off: amountOffCents || 0, currency: 'usd' }),
            ...(maxRedemptions > 0 ? { max_redemptions: Math.round(maxRedemptions) } : {}),
            ...(expiresAtSeconds ? { redeem_by: expiresAtSeconds } : {}),
            ...(appliesToProductId ? { applies_to: { products: [appliesToProductId] } } : {}),
            metadata,
        });
        const promotionCode = await stripe.promotionCodes.create({
            coupon: coupon.id,
            code,
            active: true,
            metadata,
        });
        await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).add({
            action: 'create_billing_coupon',
            targetType: 'stripe_promotion_code',
            targetId: promotionCode.id,
            performedBy: {
                adminUserId: adminSession.adminUserId,
                username: adminSession.username,
                displayName: adminSession.displayName,
                email: adminSession.email,
            },
            metadata: {
                code,
                couponId: coupon.id,
                discountType,
                duration,
                appliesToPlan: appliesToPlan || null,
                appliesToBillingCycle: appliesToPlan ? appliesToBillingCycle : null,
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            success: true,
            coupon: serializeAdminPromotionCode(promotionCode),
        };
    }
    catch (error) {
        const stripeError = error;
        throw new functions.https.HttpsError(stripeError?.code === 'resource_already_exists'
            ? 'already-exists'
            : 'internal', stripeError?.message || 'Failed to create Stripe coupon.');
    }
});
exports.adminPortalListBillingCoupons = functions
    .runWith({ secrets: ADMIN_PORTAL_STRIPE_SECRETS })
    .https.onCall(async (data) => {
    await requireAdminSession(String(data?.sessionToken || ''));
    const stripe = getAdminPortalStripe();
    const limit = Math.min(Math.max(Number(data?.limit || 100), 1), 100);
    const [activeCodes, inactiveCodes] = await Promise.all([
        stripe.promotionCodes.list({ active: true, limit }),
        stripe.promotionCodes.list({ active: false, limit }),
    ]);
    const byId = new Map();
    for (const code of [...activeCodes.data, ...inactiveCodes.data]) {
        byId.set(code.id, code);
    }
    const coupons = [...byId.values()]
        .map(serializeAdminPromotionCode)
        .sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));
    return { coupons };
});
exports.adminPortalCreateCheckoutLinkWithCoupon = functions
    .runWith({ secrets: ADMIN_PORTAL_STRIPE_SECRETS })
    .https.onCall(async (data) => {
    const adminSession = await requireAdminSession(String(data?.sessionToken || ''));
    const stripe = getAdminPortalStripe();
    const targetUserId = String(data?.userId || '').trim();
    const planId = String(data?.planId || '').trim().toLowerCase();
    const billingCycle = normalizeBillingCycle(data?.billingCycle);
    const promoCode = normalizePromoCode(data?.promoCode);
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required.');
    }
    if (!planId || planId === 'homeowner') {
        throw new functions.https.HttpsError('invalid-argument', 'Select a paid plan before creating a checkout link.');
    }
    if (!promoCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Coupon code is required.');
    }
    const priceId = resolveStripePriceIdForPlan(planId, billingCycle);
    if (!priceId) {
        throw new functions.https.HttpsError('failed-precondition', `No Stripe price is configured for ${planId}.`);
    }
    const promotionCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
    });
    const promotionCode = promotionCodes.data[0];
    if (!promotionCode) {
        throw new functions.https.HttpsError('not-found', 'No active Stripe coupon code was found.');
    }
    const userRef = db.collection(USERS_COLLECTION).doc(targetUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User was not found.');
    }
    const userData = (userDoc.data() || {});
    const subscription = typeof userData.subscription === 'object' && userData.subscription
        ? userData.subscription
        : {};
    const email = String(userData.email || '').trim();
    if (!email) {
        throw new functions.https.HttpsError('failed-precondition', 'This user does not have an email address for Stripe Checkout.');
    }
    let customerId = String(subscription.stripeCustomerId || '').trim();
    if (!customerId) {
        const customer = await stripe.customers.create({
            email,
            metadata: {
                firebaseUID: targetUserId,
                createdBy: 'maintley_admin_portal',
            },
        });
        customerId = customer.id;
        await userRef.set({
            subscription: {
                ...subscription,
                stripeCustomerId: customerId,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: resolveSuccessUrl(data?.successUrl),
        cancel_url: resolveCancelUrl(data?.cancelUrl),
        discounts: [{ promotion_code: promotionCode.id }],
        metadata: {
            firebaseUID: targetUserId,
            promoCode,
            createdBy: 'maintley_admin_portal',
            createdByAdminUserId: adminSession.adminUserId,
        },
    });
    await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).add({
        action: 'create_checkout_link_with_coupon',
        targetType: 'user',
        targetId: targetUserId,
        performedBy: {
            adminUserId: adminSession.adminUserId,
            username: adminSession.username,
            displayName: adminSession.displayName,
            email: adminSession.email,
        },
        metadata: {
            planId,
            billingCycle,
            promoCode,
            promotionCodeId: promotionCode.id,
            checkoutSessionId: session.id,
            stripeCustomerId: customerId,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
        stripeCustomerId: customerId,
    };
});
exports.adminPortalRefreshUserSubscriptionFromStripe = functions
    .runWith({ secrets: ADMIN_PORTAL_STRIPE_SECRETS })
    .https.onCall(async (data, context) => {
    const adminAuth = await requireMaintleyAdmin(context);
    const rawSessionToken = String(data?.sessionToken || '').trim();
    let adminSession = null;
    if (rawSessionToken) {
        try {
            adminSession = await requireAdminSession(rawSessionToken);
        }
        catch {
            adminSession = null;
        }
    }
    const targetUserId = String(data?.userId || '').trim();
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required.');
    }
    const userRef = db.collection(USERS_COLLECTION).doc(targetUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User was not found.');
    }
    const userData = (userDoc.data() || {});
    const currentSubscription = typeof userData.subscription === 'object' && userData.subscription
        ? userData.subscription
        : {};
    const match = await findAdminStripeSubscriptionForUser(userData, currentSubscription);
    if (!match.subscription) {
        throw new functions.https.HttpsError('not-found', 'No Stripe subscription was found for this user by subscription ID, customer ID, or email.');
    }
    const nextSubscription = buildAdminSubscriptionPatchFromStripe(match.subscription, currentSubscription);
    await userRef.set({
        subscription: nextSubscription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await syncAdminFamilyAccountSubscription(userData, nextSubscription);
    await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).add({
        action: 'refresh_user_subscription_from_stripe',
        targetType: 'user',
        targetId: targetUserId,
        performedBy: {
            adminUserId: adminSession?.adminUserId || adminAuth.uid,
            username: adminSession?.username ||
                String(adminAuth.email || adminAuth.uid),
            displayName: adminSession?.displayName || adminAuth.displayName,
            email: adminSession?.email || adminAuth.email,
        },
        before: {
            plan: String(currentSubscription.plan || '').trim() || 'none',
            status: String(currentSubscription.status || '').trim() || 'none',
            trialEndsAt: Number(currentSubscription.trialEndsAt || 0) || null,
            stripeCustomerId: String(currentSubscription.stripeCustomerId || '').trim() || null,
            stripeSubscriptionId: String(currentSubscription.stripeSubscriptionId || '').trim() || null,
        },
        after: {
            plan: String(nextSubscription.plan || '').trim() || 'none',
            status: String(nextSubscription.status || '').trim() || 'none',
            trialEndsAt: Number(nextSubscription.trialEndsAt || 0) || null,
            stripeCustomerId: String(nextSubscription.stripeCustomerId || '').trim() || null,
            stripeSubscriptionId: String(nextSubscription.stripeSubscriptionId || '').trim() || null,
        },
        metadata: {
            matchedBy: match.matchedBy,
            candidateCount: match.candidateCount,
            stripeStatus: match.subscription.status,
            stripePriceId: match.subscription.items.data[0]?.price?.id || null,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        success: true,
        subscriptionPlan: String(nextSubscription.plan || '').trim() || 'none',
        subscriptionStatus: String(nextSubscription.status || '').trim() || 'none',
        trialEndsAt: Number(nextSubscription.trialEndsAt || 0) || null,
        stripeCustomerId: String(nextSubscription.stripeCustomerId || '').trim() || null,
        stripeSubscriptionId: String(nextSubscription.stripeSubscriptionId || '').trim() || null,
        matchedBy: match.matchedBy,
        candidateCount: match.candidateCount,
    };
});
exports.adminPortalApplyUserBillingActions = functions
    .runWith({ secrets: ADMIN_PORTAL_STRIPE_SECRETS })
    .https.onCall(async (data, context) => {
    const adminAuth = await requireMaintleyAdmin(context);
    const rawSessionToken = String(data?.sessionToken || '').trim();
    let adminSession = null;
    if (rawSessionToken) {
        try {
            adminSession = await requireAdminSession(rawSessionToken);
        }
        catch {
            adminSession = null;
        }
    }
    const stripe = getAdminPortalStripe();
    const targetUserId = String(data?.userId || '').trim();
    const nextPlanId = String(data?.planId || '').trim().toLowerCase();
    const billingCycle = normalizeBillingCycle(data?.billingCycle);
    const rawTrialDays = String(data?.trialDays ?? '').trim();
    const trialDays = rawTrialDays ? Number(rawTrialDays) : 0;
    const promoCode = normalizePromoCode(data?.promoCode);
    const syncStripe = Boolean(data?.syncStripe);
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required.');
    }
    if (nextPlanId &&
        !['homeowner', 'homeowner_plus', 'property', 'portfolio'].includes(nextPlanId)) {
        throw new functions.https.HttpsError('invalid-argument', 'Select a valid plan.');
    }
    if (rawTrialDays && (!Number.isFinite(trialDays) || trialDays < 1 || trialDays > 90)) {
        throw new functions.https.HttpsError('invalid-argument', 'Trial days must be a number between 1 and 90.');
    }
    if (!nextPlanId && !trialDays && !promoCode) {
        throw new functions.https.HttpsError('invalid-argument', 'Add a plan change, trial days, or coupon code before applying billing updates.');
    }
    let promotionCode = null;
    if (promoCode) {
        const promotionCodes = await stripe.promotionCodes.list({
            code: promoCode,
            active: true,
            limit: 1,
        });
        promotionCode = promotionCodes.data[0] || null;
        if (!promotionCode) {
            throw new functions.https.HttpsError('not-found', 'No active Stripe coupon code was found.');
        }
    }
    const userRef = db.collection(USERS_COLLECTION).doc(targetUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User was not found.');
    }
    const userData = (userDoc.data() || {});
    const currentSubscription = typeof userData.subscription === 'object' && userData.subscription
        ? userData.subscription
        : {};
    const currentPlan = String(currentSubscription.plan || '').trim().toLowerCase();
    const planChanged = Boolean(nextPlanId && nextPlanId !== currentPlan);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const nextSubscription = {
        ...currentSubscription,
        updatedAt: new Date().toISOString(),
    };
    const stripeSubscriptionId = String(currentSubscription.stripeSubscriptionId || '').trim();
    let stripeUpdated = false;
    let checkoutUrl = null;
    let checkoutSessionId = null;
    let stripeCustomerId = String(currentSubscription.stripeCustomerId || '').trim();
    if (syncStripe && stripeSubscriptionId) {
        const existingSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const existingItem = existingSubscription.items.data[0];
        if (!existingItem?.id) {
            throw new functions.https.HttpsError('failed-precondition', 'The Stripe subscription does not have an editable subscription item.');
        }
        const updateParams = {
            metadata: {
                ...(existingSubscription.metadata || {}),
                firebaseUID: targetUserId,
                maintleyAdminAction: 'apply_billing_updates',
                maintleyAdminPlan: nextPlanId || currentPlan || '',
                maintleyAdminTrialDays: trialDays ? String(trialDays) : '',
                maintleyAdminPromoCode: promoCode || '',
            },
        };
        if (nextPlanId) {
            if (nextPlanId === 'homeowner') {
                throw new functions.https.HttpsError('failed-precondition', 'Stripe plan changes require a paid plan. Use Cancel Subscription when moving to Homeowner.');
            }
            const priceId = resolveStripePriceIdForPlan(nextPlanId, billingCycle);
            if (!priceId) {
                throw new functions.https.HttpsError('failed-precondition', `No Stripe price is configured for ${nextPlanId}.`);
            }
            updateParams.items = [
                {
                    id: existingItem.id,
                    price: priceId,
                    quantity: existingItem.quantity || 1,
                },
            ];
            updateParams.proration_behavior = 'create_prorations';
        }
        if (trialDays) {
            if (existingSubscription.status !== 'trialing') {
                throw new functions.https.HttpsError('failed-precondition', 'Stripe trials can only be extended while the Stripe subscription is still in trial.');
            }
            const trialBase = Math.max(existingSubscription.trial_end || nowSeconds, nowSeconds);
            updateParams.trial_end = trialBase + trialDays * 24 * 60 * 60;
        }
        if (promotionCode) {
            updateParams.promotion_code = promotionCode.id;
        }
        const updatedSubscription = await stripe.subscriptions.update(existingSubscription.id, updateParams);
        const updatedItem = updatedSubscription.items.data[0];
        const resolvedPlan = nextPlanId ||
            resolveMaintleyPlanFromStripePriceId(updatedItem?.price?.id || '') ||
            currentPlan ||
            'homeowner';
        Object.assign(nextSubscription, removeUndefinedFields({
            status: toLocalStripeSubscriptionStatus(updatedSubscription.status),
            plan: resolvedPlan,
            currentPeriodStart: updatedSubscription.current_period_start,
            currentPeriodEnd: updatedSubscription.current_period_end,
            trialEndsAt: updatedSubscription.trial_end,
            stripeCustomerId: String(updatedSubscription.customer || ''),
            stripeSubscriptionId: updatedSubscription.id,
            hasScheduledSubscription: false,
            scheduledPlan: null,
        }));
        stripeCustomerId = String(updatedSubscription.customer || stripeCustomerId || '');
        stripeUpdated = true;
    }
    else {
        if (planChanged) {
            nextSubscription.plan = nextPlanId;
            if (!String(nextSubscription.status || '').trim()) {
                nextSubscription.status = 'active';
            }
        }
        if (trialDays) {
            const currentTrialEnd = Number(currentSubscription.trialEndsAt || 0);
            const trialBase = Math.max(currentTrialEnd || nowSeconds, nowSeconds);
            nextSubscription.status = 'trial';
            nextSubscription.trialEndsAt = trialBase + trialDays * 24 * 60 * 60;
            nextSubscription.currentPeriodStart =
                Number(currentSubscription.currentPeriodStart || 0) || nowSeconds;
            nextSubscription.currentPeriodEnd = nextSubscription.trialEndsAt;
        }
    }
    if (promotionCode && !stripeUpdated) {
        const checkoutPlanId = nextPlanId || currentPlan;
        if (!checkoutPlanId || checkoutPlanId === 'homeowner') {
            throw new functions.https.HttpsError('invalid-argument', 'Select a paid plan before creating a checkout link with a coupon.');
        }
        const priceId = resolveStripePriceIdForPlan(checkoutPlanId, billingCycle);
        if (!priceId) {
            throw new functions.https.HttpsError('failed-precondition', `No Stripe price is configured for ${checkoutPlanId}.`);
        }
        const email = String(userData.email || '').trim();
        if (!email) {
            throw new functions.https.HttpsError('failed-precondition', 'This user does not have an email address for Stripe Checkout.');
        }
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email,
                metadata: {
                    firebaseUID: targetUserId,
                    createdBy: 'maintley_admin_portal',
                },
            });
            stripeCustomerId = customer.id;
            nextSubscription.stripeCustomerId = stripeCustomerId;
        }
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: resolveSuccessUrl(data?.successUrl),
            cancel_url: resolveCancelUrl(data?.cancelUrl),
            discounts: [{ promotion_code: promotionCode.id }],
            metadata: {
                firebaseUID: targetUserId,
                promoCode,
                createdBy: 'maintley_admin_portal',
                createdByAdminUserId: adminSession?.adminUserId || adminAuth.uid,
            },
        });
        checkoutUrl = session.url || null;
        checkoutSessionId = session.id;
    }
    await userRef.set({
        subscription: removeUndefinedFields(nextSubscription),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await syncAdminFamilyAccountSubscription(userData, nextSubscription);
    await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).add({
        action: 'apply_user_billing_updates',
        targetType: 'user',
        targetId: targetUserId,
        performedBy: {
            adminUserId: adminSession?.adminUserId || adminAuth.uid,
            username: adminSession?.username ||
                String(adminAuth.email || adminAuth.uid),
            displayName: adminSession?.displayName || adminAuth.displayName,
            email: adminSession?.email || adminAuth.email,
        },
        before: {
            plan: String(currentSubscription.plan || '').trim() || 'none',
            status: String(currentSubscription.status || '').trim() || 'none',
            trialEndsAt: Number(currentSubscription.trialEndsAt || 0) || null,
        },
        after: {
            plan: String(nextSubscription.plan || '').trim() || 'none',
            status: String(nextSubscription.status || '').trim() || 'none',
            trialEndsAt: Number(nextSubscription.trialEndsAt || 0) || null,
        },
        metadata: {
            planId: nextPlanId || null,
            billingCycle,
            trialDays: trialDays || null,
            promoCode: promoCode || null,
            promotionCodeId: promotionCode?.id || null,
            syncStripe,
            stripeUpdated,
            stripeSubscriptionId: String(nextSubscription.stripeSubscriptionId || '').trim() || null,
            stripeCustomerId: stripeCustomerId || null,
            checkoutSessionId,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        success: true,
        subscriptionPlan: String(nextSubscription.plan || '').trim() || 'none',
        subscriptionStatus: String(nextSubscription.status || '').trim() || 'none',
        trialEndsAt: Number(nextSubscription.trialEndsAt || 0) || null,
        stripeUpdated,
        checkoutUrl,
        checkoutSessionId,
        stripeCustomerId: stripeCustomerId || null,
        applied: {
            planChanged,
            trialExtended: Boolean(trialDays),
            couponApplied: Boolean(promotionCode && stripeUpdated),
            checkoutLinkCreated: Boolean(checkoutUrl),
        },
    };
});
const updateStripeForAdminSubscriptionAction = async (params) => {
    const stripeSubscriptionId = String(params.currentSubscription.stripeSubscriptionId || '').trim();
    if (!stripeSubscriptionId) {
        throw new functions.https.HttpsError('failed-precondition', 'This user does not have a Stripe subscription ID on their Maintley record.');
    }
    const stripe = getAdminPortalStripe();
    const existingSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const existingItem = existingSubscription.items.data[0];
    if (!existingItem?.id) {
        throw new functions.https.HttpsError('failed-precondition', 'The Stripe subscription does not have an editable subscription item.');
    }
    const baseMetadata = {
        ...(existingSubscription.metadata || {}),
        firebaseUID: params.targetUserId,
        maintleyAdminAction: params.action,
    };
    if (params.action === 'change_plan') {
        if (params.nextPlanId === 'homeowner') {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe plan changes require a paid plan. Use Cancel Subscription when moving to Homeowner.');
        }
        const priceId = resolveStripePriceIdForPlan(params.nextPlanId);
        if (!priceId) {
            throw new functions.https.HttpsError('failed-precondition', `No Stripe price is configured for ${params.nextPlanId}.`);
        }
        const updatedSubscription = await stripe.subscriptions.update(existingSubscription.id, {
            items: [
                {
                    id: existingItem.id,
                    price: priceId,
                    quantity: existingItem.quantity || 1,
                },
            ],
            proration_behavior: 'create_prorations',
            metadata: {
                ...baseMetadata,
                maintleyAdminPlan: params.nextPlanId,
            },
        });
        return removeUndefinedFields({
            status: toLocalStripeSubscriptionStatus(updatedSubscription.status),
            plan: params.nextPlanId,
            currentPeriodStart: updatedSubscription.current_period_start,
            currentPeriodEnd: updatedSubscription.current_period_end,
            trialEndsAt: updatedSubscription.trial_end,
            stripeCustomerId: String(updatedSubscription.customer || ''),
            stripeSubscriptionId: updatedSubscription.id,
            hasScheduledSubscription: false,
            scheduledPlan: null,
        });
    }
    if (params.action === 'extend_trial') {
        if (existingSubscription.status !== 'trialing') {
            throw new functions.https.HttpsError('failed-precondition', 'Stripe trials can only be extended while the Stripe subscription is still in trial.');
        }
        const trialEnd = Math.floor(Date.now() / 1000) + params.trialDays * 24 * 60 * 60;
        const updatedSubscription = await stripe.subscriptions.update(existingSubscription.id, {
            trial_end: trialEnd,
            metadata: {
                ...baseMetadata,
                maintleyAdminTrialDays: String(params.trialDays),
            },
        });
        return removeUndefinedFields({
            status: toLocalStripeSubscriptionStatus(updatedSubscription.status),
            plan: String(params.currentSubscription.plan || '').trim() || 'homeowner',
            currentPeriodStart: updatedSubscription.current_period_start,
            currentPeriodEnd: updatedSubscription.current_period_end,
            trialEndsAt: updatedSubscription.trial_end,
            stripeCustomerId: String(updatedSubscription.customer || ''),
            stripeSubscriptionId: updatedSubscription.id,
        });
    }
    if (params.action === 'cancel_subscription') {
        const updatedSubscription = await stripe.subscriptions.update(existingSubscription.id, {
            cancel_at_period_end: true,
            metadata: baseMetadata,
        });
        return removeUndefinedFields({
            status: 'cancelled',
            canceledAt: updatedSubscription.cancel_at ||
                updatedSubscription.current_period_end ||
                Math.floor(Date.now() / 1000),
            currentPeriodStart: updatedSubscription.current_period_start,
            currentPeriodEnd: updatedSubscription.current_period_end,
            trialEndsAt: updatedSubscription.trial_end,
            stripeCustomerId: String(updatedSubscription.customer || ''),
            stripeSubscriptionId: updatedSubscription.id,
        });
    }
    return {};
};
exports.adminPortalManageUserSubscription = functions
    .runWith({ secrets: ADMIN_PORTAL_STRIPE_SECRETS })
    .https.onCall(async (data, context) => {
    const adminAuth = await requireMaintleyAdmin(context);
    const targetUserId = String(data?.userId || '').trim();
    const action = normalizeSubscriptionAction(data?.action);
    const nextPlanId = String(data?.planId || '').trim().toLowerCase();
    const trialDays = Number(data?.trialDays || 0);
    const syncStripe = Boolean(data?.syncStripe);
    if (!targetUserId) {
        throw new functions.https.HttpsError('invalid-argument', 'userId is required.');
    }
    if (!['change_plan', 'extend_trial', 'cancel_subscription'].includes(action)) {
        throw new functions.https.HttpsError('invalid-argument', 'action must be change_plan, extend_trial, or cancel_subscription.');
    }
    if (action === 'change_plan' && !nextPlanId) {
        throw new functions.https.HttpsError('invalid-argument', 'planId is required for change_plan.');
    }
    if (action === 'extend_trial' && (!Number.isFinite(trialDays) || trialDays < 1 || trialDays > 90)) {
        throw new functions.https.HttpsError('invalid-argument', 'trialDays must be a number between 1 and 90.');
    }
    const userRef = db.collection(USERS_COLLECTION).doc(targetUserId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User was not found.');
    }
    const userData = (userDoc.data() || {});
    const currentSubscription = typeof userData.subscription === 'object' && userData.subscription
        ? userData.subscription
        : {};
    const nowSeconds = Math.floor(Date.now() / 1000);
    const nextSubscription = {
        ...currentSubscription,
        updatedAt: new Date().toISOString(),
    };
    let stripeUpdated = false;
    if (syncStripe) {
        const stripePatch = await updateStripeForAdminSubscriptionAction({
            action,
            nextPlanId,
            trialDays,
            targetUserId,
            currentSubscription,
        });
        Object.assign(nextSubscription, stripePatch);
        stripeUpdated = true;
    }
    if (action === 'change_plan' && !syncStripe) {
        nextSubscription.plan = nextPlanId;
        if (!String(nextSubscription.status || '').trim()) {
            nextSubscription.status = 'active';
        }
    }
    if (action === 'extend_trial' && !syncStripe) {
        nextSubscription.status = 'trial';
        nextSubscription.trialEndsAt = nowSeconds + trialDays * 24 * 60 * 60;
        nextSubscription.currentPeriodStart = nowSeconds;
        nextSubscription.currentPeriodEnd = nowSeconds + trialDays * 24 * 60 * 60;
    }
    if (action === 'cancel_subscription' && !syncStripe) {
        nextSubscription.status = 'cancelled';
        nextSubscription.canceledAt = nowSeconds;
    }
    await userRef.set({
        subscription: nextSubscription,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    await syncAdminFamilyAccountSubscription(userData, nextSubscription);
    await db.collection(ADMIN_AUDIT_LOGS_COLLECTION).add({
        category: 'user_subscription',
        action,
        targetUserId,
        performedBy: {
            uid: adminAuth.uid,
            email: adminAuth.email,
            displayName: adminAuth.displayName,
        },
        before: {
            plan: String(currentSubscription.plan || '').trim() || 'none',
            status: String(currentSubscription.status || '').trim() || 'none',
            trialEndsAt: Number(currentSubscription.trialEndsAt || 0) || null,
        },
        after: {
            plan: String(nextSubscription.plan || '').trim() || 'none',
            status: String(nextSubscription.status || '').trim() || 'none',
            trialEndsAt: Number(nextSubscription.trialEndsAt || 0) || null,
        },
        metadata: {
            planId: nextPlanId || null,
            trialDays: action === 'extend_trial' ? trialDays : null,
            syncStripe,
            stripeUpdated,
            stripeSubscriptionId: String(nextSubscription.stripeSubscriptionId || '').trim() || null,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return {
        success: true,
        subscriptionPlan: String(nextSubscription.plan || '').trim() || 'none',
        subscriptionStatus: String(nextSubscription.status || '').trim() || 'none',
        trialEndsAt: Number(nextSubscription.trialEndsAt || 0) || null,
        stripeUpdated,
    };
});
exports.linkFeedbackAdminTickets = functions.https.onCall(async (data, context) => {
    try {
        console.log('[linkFeedbackAdminTickets] Starting link operation');
        const adminAuth = await requireMaintleyAdmin(context);
        console.log('[linkFeedbackAdminTickets] Session validated for user:', adminAuth.displayName);
        const sourceTicketId = String(data?.sourceTicketId || '').trim();
        const targetTicketRef = String(data?.targetTicketRef || '').trim();
        console.log('[linkFeedbackAdminTickets] Linking:', sourceTicketId, '->', targetTicketRef);
        if (!sourceTicketId || !targetTicketRef) {
            throw new functions.https.HttpsError('invalid-argument', 'Source and target ticket references are required.');
        }
        const sourceDoc = await db.collection(FEEDBACK_COLLECTION).doc(sourceTicketId).get();
        if (!sourceDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Source ticket was not found.');
        }
        console.log('[linkFeedbackAdminTickets] Source ticket found:', sourceTicketId);
        const targetDoc = await resolveFeedbackTicketByIdOrNumber(targetTicketRef);
        if (!targetDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Target ticket was not found.');
        }
        console.log('[linkFeedbackAdminTickets] Target ticket found:', targetDoc.id);
        if (targetDoc.id === sourceDoc.id) {
            throw new functions.https.HttpsError('invalid-argument', 'A ticket cannot be linked to itself.');
        }
        const sourceGroup = await getFeedbackTicketGroupDocs(sourceDoc);
        const targetGroup = await getFeedbackTicketGroupDocs(targetDoc);
        const sourcePrimaryRecord = (sourceGroup.primaryDoc.data() || {});
        const targetPrimaryRecord = (targetGroup.primaryDoc.data() || {});
        const sourceHasGroupParent = isGroupTicketRecord(sourcePrimaryRecord);
        const targetHasGroupParent = isGroupTicketRecord(targetPrimaryRecord);
        if (sourceHasGroupParent && targetHasGroupParent && sourceGroup.primaryDoc.id === targetGroup.primaryDoc.id) {
            const existingLinkedIds = normalizeStringArray(sourcePrimaryRecord.linkedTicketIds);
            return { success: true, linkedTicketIds: existingLinkedIds };
        }
        const resolvedParentRef = targetHasGroupParent
            ? targetGroup.primaryDoc.ref
            : sourceHasGroupParent
                ? sourceGroup.primaryDoc.ref
                : db.collection(FEEDBACK_COLLECTION).doc();
        const resolvedParentSnapshot = await resolvedParentRef.get();
        const existingParentRecord = resolvedParentSnapshot.exists
            ? (resolvedParentSnapshot.data() || {})
            : undefined;
        const statusSeed = normalizeTicketStatus(targetPrimaryRecord.status || sourcePrimaryRecord.status || 'received');
        const resolutionNotesSeed = String(targetPrimaryRecord.resolutionNotes || '').trim() ||
            String(sourcePrimaryRecord.resolutionNotes || '').trim();
        const groupedDocsById = new Map();
        for (const doc of [...targetGroup.docs, ...sourceGroup.docs]) {
            groupedDocsById.set(doc.id, doc);
        }
        const allGroupDocs = [...groupedDocsById.values()];
        const childDocs = allGroupDocs.filter((doc) => {
            if (doc.id === resolvedParentRef.id)
                return false;
            const record = (doc.data() || {});
            return !isGroupTicketRecord(record);
        });
        if (childDocs.length === 0) {
            throw new functions.https.HttpsError('failed-precondition', 'No child tickets were available to link into a parent case.');
        }
        const parentFields = buildGroupParentFields(resolvedParentRef.id, childDocs, statusSeed, resolutionNotesSeed, existingParentRecord);
        const parentTicketNumber = String(parentFields.ticketNumber || '').trim();
        const linkedTicketIds = childDocs.map((doc) => doc.id);
        const linkedTicketNumbers = childDocs.map((doc) => getTicketNumberFromRecord((doc.data() || {}), doc.id));
        console.log('[linkFeedbackAdminTickets] Group parent ticket:', parentTicketNumber);
        const timestamp = admin.firestore.FieldValue.serverTimestamp();
        const nowIso = new Date().toISOString();
        const noteEntry = {
            note: `Linked into group case ${parentTicketNumber}`,
            createdAt: nowIso,
            adminUserId: adminAuth.uid,
            adminUsername: adminAuth.email || adminAuth.displayName,
        };
        const batch = db.batch();
        batch.set(resolvedParentRef, {
            ...parentFields,
            updatedAt: timestamp,
            updatedByAdminUserId: adminAuth.uid,
            updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
            adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
        }, { merge: true });
        const parentStatus = normalizeTicketStatus(parentFields.status);
        const parentPublicStatus = getPublicStatus(parentStatus);
        const parentResolutionNotes = String(parentFields.resolutionNotes || '').trim();
        for (const doc of childDocs) {
            const docData = (doc.data() || {});
            const docTicketNumber = getTicketNumberFromRecord(docData, doc.id);
            const updates = {
                ticketNumber: docTicketNumber,
                linkedPrimaryTicketId: resolvedParentRef.id,
                linkedPrimaryTicketNumber: parentTicketNumber,
                linkedTicketIds,
                linkedTicketNumbers,
                isLinkedPrimary: false,
                isLinkedChild: true,
                isGroupTicket: false,
                groupParentTicketId: resolvedParentRef.id,
                groupParentTicketNumber: parentTicketNumber,
                updatedAt: timestamp,
                updatedByAdminUserId: adminAuth.uid,
                updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
                status: parentStatus,
                publicStatus: parentPublicStatus,
                adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
            };
            if (parentResolutionNotes) {
                updates.resolutionNotes = parentResolutionNotes;
            }
            batch.set(doc.ref, updates, { merge: true });
        }
        for (const doc of allGroupDocs) {
            if (doc.id === resolvedParentRef.id)
                continue;
            if (childDocs.some((childDoc) => childDoc.id === doc.id))
                continue;
            const docData = (doc.data() || {});
            if (!isGroupTicketRecord(docData))
                continue;
            batch.set(doc.ref, {
                isGroupTicket: false,
                isLinkedPrimary: false,
                isLinkedChild: true,
                linkedPrimaryTicketId: resolvedParentRef.id,
                linkedPrimaryTicketNumber: parentTicketNumber,
                linkedTicketIds,
                linkedTicketNumbers,
                updatedAt: timestamp,
                updatedByAdminUserId: adminAuth.uid,
                updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
            }, { merge: true });
        }
        console.log('[linkFeedbackAdminTickets] Committing batch write...');
        await batch.commit();
        console.log('[linkFeedbackAdminTickets] Batch commit successful');
        const refreshedPrimary = await resolvedParentRef.get();
        const refreshedLinkedTicketIds = Array.isArray(refreshedPrimary.data()?.linkedTicketIds)
            ? (refreshedPrimary.data()?.linkedTicketIds).map((item) => String(item))
            : [];
        console.log('[linkFeedbackAdminTickets] Link completed successfully');
        return { success: true, linkedTicketIds: refreshedLinkedTicketIds };
    }
    catch (error) {
        console.error('[linkFeedbackAdminTickets] Error:', error);
        // If it's already an HttpsError, re-throw it
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        // Otherwise wrap it as internal error with details
        const message = error?.message || String(error) || 'Unknown error';
        throw new functions.https.HttpsError('internal', `Link operation failed: ${message}`);
    }
});
exports.unlinkFeedbackAdminTicket = functions.https.onCall(async (data, context) => {
    const adminAuth = await requireMaintleyAdmin(context);
    const ticketId = String(data?.ticketId || '').trim();
    if (!ticketId) {
        throw new functions.https.HttpsError('invalid-argument', 'Ticket ID is required.');
    }
    const childRef = db.collection(FEEDBACK_COLLECTION).doc(ticketId);
    const childDoc = await childRef.get();
    if (!childDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Ticket not found.');
    }
    const childRecord = (childDoc.data() || {});
    const parentTicketId = String(childRecord.linkedPrimaryTicketId || '').trim();
    const isLinkedChild = Boolean(childRecord.isLinkedChild);
    if (!isLinkedChild || !parentTicketId || parentTicketId === ticketId) {
        throw new functions.https.HttpsError('failed-precondition', 'Only linked child tickets can be unlinked.');
    }
    const parentRef = db.collection(FEEDBACK_COLLECTION).doc(parentTicketId);
    const parentDoc = await parentRef.get();
    if (!parentDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Parent ticket not found.');
    }
    const parentRecord = (parentDoc.data() || {});
    const previousLinkedIds = normalizeStringArray(parentRecord.linkedTicketIds);
    const remainingLinkedIds = previousLinkedIds.filter((id) => id !== ticketId);
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const nowIso = new Date().toISOString();
    const noteEntry = {
        note: `Unlinked ticket ${getTicketNumberFromRecord(childRecord, ticketId)} from group case ${String(parentRecord.ticketNumber || parentTicketId)}`,
        createdAt: nowIso,
        adminUserId: adminAuth.uid,
        adminUsername: adminAuth.email || adminAuth.displayName,
    };
    const batch = db.batch();
    batch.set(childRef, {
        linkedPrimaryTicketId: admin.firestore.FieldValue.delete(),
        linkedPrimaryTicketNumber: admin.firestore.FieldValue.delete(),
        linkedTicketIds: admin.firestore.FieldValue.delete(),
        linkedTicketNumbers: admin.firestore.FieldValue.delete(),
        groupParentTicketId: admin.firestore.FieldValue.delete(),
        groupParentTicketNumber: admin.firestore.FieldValue.delete(),
        isLinkedPrimary: false,
        isLinkedChild: false,
        isGroupTicket: false,
        updatedAt: timestamp,
        updatedByAdminUserId: adminAuth.uid,
        updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
        adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
    }, { merge: true });
    if (remainingLinkedIds.length > 0) {
        const remainingDocs = await loadFeedbackDocsByIds(remainingLinkedIds);
        const statusFallback = normalizeTicketStatus(parentRecord.status || 'received');
        const resolutionFallback = String(parentRecord.resolutionNotes || '').trim();
        const rebuiltParentFields = buildGroupParentFields(parentTicketId, remainingDocs, statusFallback, resolutionFallback, parentRecord);
        batch.set(parentRef, {
            ...rebuiltParentFields,
            updatedAt: timestamp,
            updatedByAdminUserId: adminAuth.uid,
            updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
            adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
        }, { merge: true });
        const nextLinkedTicketIds = remainingDocs.map((doc) => doc.id);
        const nextLinkedTicketNumbers = remainingDocs.map((doc) => getTicketNumberFromRecord((doc.data() || {}), doc.id));
        for (const remainingDoc of remainingDocs) {
            const remainingData = (remainingDoc.data() || {});
            batch.set(remainingDoc.ref, {
                ticketNumber: getTicketNumberFromRecord(remainingData, remainingDoc.id),
                linkedPrimaryTicketId: parentTicketId,
                linkedPrimaryTicketNumber: String(rebuiltParentFields.ticketNumber || parentRecord.ticketNumber || ''),
                linkedTicketIds: nextLinkedTicketIds,
                linkedTicketNumbers: nextLinkedTicketNumbers,
                isLinkedPrimary: false,
                isLinkedChild: true,
                isGroupTicket: false,
                groupParentTicketId: parentTicketId,
                groupParentTicketNumber: String(rebuiltParentFields.ticketNumber || parentRecord.ticketNumber || ''),
                updatedAt: timestamp,
                updatedByAdminUserId: adminAuth.uid,
                updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
            }, { merge: true });
        }
    }
    else {
        batch.set(parentRef, {
            linkedTicketIds: [],
            linkedTicketNumbers: [],
            groupChildTicketIds: [],
            groupChildTicketNumbers: [],
            childTicketCount: 0,
            isGroupTicket: true,
            isLinkedPrimary: true,
            isLinkedChild: false,
            updatedAt: timestamp,
            updatedByAdminUserId: adminAuth.uid,
            updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
            adminNotes: admin.firestore.FieldValue.arrayUnion(noteEntry),
        }, { merge: true });
    }
    await batch.commit();
    return { success: true, parentTicketId };
});
exports.deleteFeedbackAdminParentTicket = functions.https.onCall(async (data, context) => {
    await requireMaintleyAdmin(context);
    const ticketId = String(data?.ticketId || '').trim();
    if (!ticketId) {
        throw new functions.https.HttpsError('invalid-argument', 'Ticket ID is required.');
    }
    const ticketRef = db.collection(FEEDBACK_COLLECTION).doc(ticketId);
    const ticketDoc = await ticketRef.get();
    if (!ticketDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Parent ticket not found.');
    }
    const record = (ticketDoc.data() || {});
    const isParentLike = Boolean(record.isGroupTicket) || Boolean(record.isLinkedPrimary);
    if (!isParentLike) {
        throw new functions.https.HttpsError('failed-precondition', 'Only primary parent tickets can be deleted with this action.');
    }
    const linkedIds = normalizeStringArray(record.linkedTicketIds);
    if (linkedIds.length > 0) {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot delete parent ticket while child tickets are still linked.');
    }
    await ticketRef.delete();
    return { success: true };
});
exports.updateFeedbackAdminTicketStatus = functions.https.onCall(async (data, context) => {
    const adminAuth = await requireMaintleyAdmin(context);
    const ticketId = String(data?.ticketId || '').trim();
    const nextStatus = normalizeTicketStatus(data?.status);
    const internalNote = String(data?.internalNote || '').trim();
    const resolutionNotes = String(data?.resolutionNotes || '').trim();
    const requestedType = String(data?.type || '').trim();
    const nextType = requestedType ? normalizeTicketType(requestedType) : '';
    if (!ticketId) {
        throw new functions.https.HttpsError('invalid-argument', 'Ticket ID is required.');
    }
    if (!FEEDBACK_STATUSES.has(nextStatus)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid status value.');
    }
    if (nextType && !FEEDBACK_TYPES.has(nextType)) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid type value.');
    }
    if ((nextStatus === 'resolved' || nextStatus === 'closed') && !resolutionNotes) {
        throw new functions.https.HttpsError('invalid-argument', 'Maintly update is required when setting status to resolved or closed.');
    }
    const docRef = db.collection(FEEDBACK_COLLECTION).doc(ticketId);
    const docSnapshot = await docRef.get();
    if (!docSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Feedback ticket not found.');
    }
    const currentRecord = (docSnapshot.data() || {});
    const currentStatus = normalizeTicketStatus(currentRecord.status);
    const existingResolutionNotes = String(currentRecord.resolutionNotes || '').trim();
    const hasAnyResolutionNotes = Boolean(resolutionNotes || existingResolutionNotes);
    const isTransitioningIntoClosedLikeStatus = nextStatus !== currentStatus && (nextStatus === 'resolved' || nextStatus === 'closed');
    if (isTransitioningIntoClosedLikeStatus && !hasAnyResolutionNotes) {
        throw new functions.https.HttpsError('invalid-argument', 'Maintly update is required when setting status to resolved or closed.');
    }
    const { docs: groupedDocs } = await getFeedbackTicketGroupDocs(docSnapshot);
    const nowIso = new Date().toISOString();
    const didStatusChange = nextStatus !== currentStatus;
    const hasMaintleyUpdate = Boolean(resolutionNotes);
    const noteEntries = [
        internalNote
            ? {
                note: internalNote,
                createdAt: nowIso,
                adminUserId: adminAuth.uid,
                adminUsername: adminAuth.email || adminAuth.displayName,
                noteType: 'internal',
                visibility: 'internal',
            }
            : null,
        resolutionNotes
            ? {
                note: resolutionNotes,
                createdAt: nowIso,
                adminUserId: adminAuth.uid,
                adminUsername: adminAuth.email || adminAuth.displayName,
                noteType: 'maintley_update',
                visibility: 'customer',
            }
            : null,
    ].filter(Boolean);
    const notificationRecipients = new Map();
    for (const groupedDoc of groupedDocs) {
        const groupedRecord = (groupedDoc.data() || {});
        const recipientUserId = String(groupedRecord.userId || '').trim();
        if (!recipientUserId || notificationRecipients.has(recipientUserId))
            continue;
        notificationRecipients.set(recipientUserId, {
            ticketId: groupedDoc.id,
            ticketNumber: getTicketNumberFromRecord(groupedRecord, groupedDoc.id),
        });
    }
    const statusLabel = formatTicketStatusLabel(nextStatus);
    const notificationsToCreate = [];
    if (didStatusChange || hasMaintleyUpdate) {
        for (const [recipientUserId, recipientTicket] of notificationRecipients.entries()) {
            const ticketLabel = String(recipientTicket.ticketNumber || '').trim() || recipientTicket.ticketId;
            if (didStatusChange && hasMaintleyUpdate) {
                notificationsToCreate.push({
                    userId: recipientUserId,
                    type: 'maintenance_request',
                    title: 'Service Ticket Updated',
                    message: `Ticket ${ticketLabel} moved to ${statusLabel} and includes a new Maintley update.`,
                    data: {
                        ticketId: recipientTicket.ticketId,
                        ticketNumber: ticketLabel,
                        status: nextStatus,
                        hasMaintleyUpdate: true,
                        source: 'service_ticket',
                    },
                    status: 'unread',
                    actionUrl: '/settings?category=notifications',
                    createdAt: nowIso,
                    updatedAt: nowIso,
                });
                continue;
            }
            if (didStatusChange) {
                notificationsToCreate.push({
                    userId: recipientUserId,
                    type: 'maintenance_request',
                    title: 'Service Ticket Status Updated',
                    message: `Ticket ${ticketLabel} is now ${statusLabel}.`,
                    data: {
                        ticketId: recipientTicket.ticketId,
                        ticketNumber: ticketLabel,
                        status: nextStatus,
                        source: 'service_ticket',
                    },
                    status: 'unread',
                    actionUrl: '/settings?category=notifications',
                    createdAt: nowIso,
                    updatedAt: nowIso,
                });
            }
            if (hasMaintleyUpdate) {
                notificationsToCreate.push({
                    userId: recipientUserId,
                    type: 'maintenance_request',
                    title: 'New Maintley Update',
                    message: `Ticket ${ticketLabel} has a new Maintley update from support.`,
                    data: {
                        ticketId: recipientTicket.ticketId,
                        ticketNumber: ticketLabel,
                        hasMaintleyUpdate: true,
                        source: 'service_ticket',
                    },
                    status: 'unread',
                    actionUrl: '/settings?category=notifications',
                    createdAt: nowIso,
                    updatedAt: nowIso,
                });
            }
        }
    }
    const updates = {
        status: nextStatus,
        publicStatus: getPublicStatus(nextStatus),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedByAdminUserId: adminAuth.uid,
        updatedByAdminUsername: adminAuth.email || adminAuth.displayName,
        lastCustomerUpdateAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (nextStatus === 'resolved') {
        updates.resolvedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    if (nextStatus === 'closed') {
        updates.closedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    if (resolutionNotes) {
        updates.resolutionNotes = resolutionNotes;
    }
    if (noteEntries.length > 0) {
        updates.adminNotes = admin.firestore.FieldValue.arrayUnion(...noteEntries);
    }
    if (nextType) {
        updates.type = nextType;
    }
    const batch = db.batch();
    for (const groupedDoc of groupedDocs) {
        batch.set(groupedDoc.ref, updates, { merge: true });
    }
    for (const notification of notificationsToCreate) {
        const notificationRef = db.collection('notifications').doc();
        batch.set(notificationRef, notification);
    }
    await batch.commit();
    return { success: true };
});
