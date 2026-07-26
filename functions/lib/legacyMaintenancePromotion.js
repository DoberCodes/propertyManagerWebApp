"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPromotedLegacyMaintenanceEvent = void 0;
const crypto_1 = require("crypto");
const EVENT_TYPES = new Set([
    'task_completed',
    'task_approved',
    'repair_logged',
    'inspection_completed',
    'invoice_uploaded',
    'document_uploaded',
    'service_note_added',
    'maintenance_recorded',
    'warranty_added',
    'contractor_visit_logged',
    'recurring_maintenance_completed',
]);
const toString = (value) => String(value || '').trim();
const firstString = (record, fields) => {
    for (const field of fields) {
        const value = field.split('.').reduce((current, key) => current?.[key], record);
        const normalized = toString(value);
        if (normalized)
            return normalized;
    }
    return '';
};
const dedupeStrings = (...values) => Array.from(new Set(values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(toString)
    .filter(Boolean)));
const stripUndefined = (value) => {
    if (Array.isArray(value)) {
        return value.map(stripUndefined).filter((entry) => entry !== undefined);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value)
            .map(([key, entry]) => [key, stripUndefined(entry)])
            .filter(([, entry]) => entry !== undefined));
    }
    return value === undefined ? undefined : value;
};
const sourceHash = (legacy) => (0, crypto_1.createHash)('sha256').update(JSON.stringify(legacy)).digest('hex');
const normalizeAttachments = (legacy) => {
    const attachments = Array.isArray(legacy.attachments) ? [...legacy.attachments] : [];
    const completionFile = legacy.completionFile || legacy.completionFileData;
    if (completionFile?.url) {
        attachments.push({
            url: completionFile.url,
            fileName: completionFile.fileName || completionFile.name || 'attachment',
            fileSize: Number(completionFile.fileSize || completionFile.size || 0),
            mimeType: completionFile.mimeType || completionFile.type || 'application/octet-stream',
            uploadedAt: completionFile.uploadedAt,
            description: completionFile.description || 'Completion file',
        });
    }
    const normalized = attachments
        .map((attachment) => ({
        id: toString(attachment?.id) ||
            `legacy_${(0, crypto_1.createHash)('sha256')
                .update(toString(attachment?.url || attachment?.fileUrl))
                .digest('hex')
                .slice(0, 20)}`,
        url: toString(attachment?.url || attachment?.fileUrl),
        fileName: toString(attachment?.fileName || attachment?.name) || 'attachment',
        fileSize: Number(attachment?.fileSize || attachment?.size || 0),
        mimeType: toString(attachment?.mimeType || attachment?.type) ||
            'application/octet-stream',
        uploadedAt: toString(attachment?.uploadedAt) || undefined,
        description: toString(attachment?.description) || undefined,
    }))
        .filter((attachment) => attachment.url);
    return normalized.length ? normalized : undefined;
};
const normalizeFinancials = (legacy) => {
    if (legacy.financials && typeof legacy.financials === 'object') {
        return legacy.financials;
    }
    const actualCost = Number(legacy.totalCost ?? legacy.actualCost ?? legacy.cost);
    const laborCost = Number(legacy.laborCost);
    const materialsCost = Number(legacy.partsCost ?? legacy.materialsCost);
    const actual = stripUndefined({
        laborCost: Number.isFinite(laborCost) ? laborCost : undefined,
        materialsCost: Number.isFinite(materialsCost) ? materialsCost : undefined,
    });
    if (!Number.isFinite(actualCost) && Object.keys(actual).length === 0)
        return undefined;
    return stripUndefined({
        actualCost: Number.isFinite(actualCost) ? actualCost : undefined,
        actual: Object.keys(actual).length ? actual : undefined,
        currency: toString(legacy.currency) || 'USD',
    });
};
const normalizeRecordedBy = (legacy) => {
    if (legacy.recordedBy && typeof legacy.recordedBy === 'object') {
        const userId = toString(legacy.recordedBy.userId);
        const displayName = toString(legacy.recordedBy.displayName);
        return userId ? stripUndefined({ userId, displayName: displayName || undefined }) : undefined;
    }
    const userId = firstString(legacy, ['createdBy']);
    const displayName = firstString(legacy, ['createdByName']);
    return userId ? stripUndefined({ userId, displayName: displayName || undefined }) : undefined;
};
const normalizePerformedBy = (legacy) => {
    if (legacy.performedBy && typeof legacy.performedBy === 'object') {
        return legacy.performedBy;
    }
    const id = firstString(legacy, ['completedBy', 'contractorId']);
    const displayName = firstString(legacy, ['completedByName', 'contractorName']);
    if (!id && !displayName)
        return undefined;
    return stripUndefined({
        type: legacy.contractorId || displayName ? 'external_provider' : 'user',
        id: id || undefined,
        displayName: displayName || undefined,
    });
};
const buildPromotedLegacyMaintenanceEvent = ({ legacyId, legacy, accountId, propertyId, propertyTitle, nowIso, }) => {
    const serviceDate = firstString(legacy, [
        'serviceDate',
        'completionDate',
        'date',
        'timestamp',
        'completedAt',
        'createdAt',
    ]);
    const title = firstString(legacy, [
        'title',
        'servicePerformed',
        'maintenanceType',
        'description',
    ]);
    if (!serviceDate || !title) {
        throw new Error('Legacy maintenance history lacks a service date or description.');
    }
    const eventType = toString(legacy.eventType);
    const recordedBy = normalizeRecordedBy(legacy);
    const originalData = legacy.data && typeof legacy.data === 'object' && !Array.isArray(legacy.data)
        ? legacy.data
        : {};
    const deviceIds = dedupeStrings(legacy.deviceIds, legacy.deviceId, legacy.assignedDeviceId);
    const linkedTaskIds = dedupeStrings(legacy.linkedTaskIds, legacy.originalTaskId, legacy.linkedTaskId, legacy.taskId, legacy.assignedTaskId);
    return stripUndefined({
        id: legacyId,
        accountId,
        propertyId,
        propertyTitle: propertyTitle || firstString(legacy, ['propertyTitle', 'property']) || undefined,
        unitId: toString(legacy.unitId) || undefined,
        deviceIds: deviceIds.length ? deviceIds : undefined,
        title,
        description: firstString(legacy, ['description', 'completionNotes', 'notes']) || undefined,
        serviceDate,
        completionDate: serviceDate,
        maintenanceCategory: toString(legacy.maintenanceCategory) || undefined,
        eventType: EVENT_TYPES.has(eventType) ? eventType : 'maintenance_recorded',
        eventSource: 'system',
        createdBy: toString(legacy.createdBy) || undefined,
        recordedBy,
        recordedAt: firstString(legacy, ['recordedAt', 'createdAt']) || serviceDate,
        performedBy: normalizePerformedBy(legacy),
        correctionCount: 0,
        status: 'active',
        createdAt: firstString(legacy, ['createdAt']) || serviceDate,
        updatedAt: nowIso,
        priority: toString(legacy.priority) || undefined,
        tags: dedupeStrings(legacy.tags, 'legacy-history-promoted'),
        linkedTaskIds: linkedTaskIds.length ? linkedTaskIds : undefined,
        originalTaskId: toString(legacy.originalTaskId) || undefined,
        recurringTaskId: toString(legacy.recurringTaskId) || undefined,
        maintenanceCycleId: toString(legacy.maintenanceCycleId) || undefined,
        attachments: normalizeAttachments(legacy),
        financials: normalizeFinancials(legacy),
        data: {
            ...originalData,
            migration: {
                sourceCollection: 'maintenanceHistory',
                sourceId: legacyId,
                sourceHash: sourceHash(legacy),
                version: 1,
                promotedAt: nowIso,
                promotionReason: 'user_requested_correction',
            },
        },
    });
};
exports.buildPromotedLegacyMaintenanceEvent = buildPromotedLegacyMaintenanceEvent;
