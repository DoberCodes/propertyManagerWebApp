"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeAccessRemovalUpdates = exports.removeIdFromArray = exports.buildAccountDeletionStoragePrefixes = exports.chunkItems = exports.ACCOUNT_DELETION_BATCH_SIZE = void 0;
exports.ACCOUNT_DELETION_BATCH_SIZE = 400;
const chunkItems = (items, size = exports.ACCOUNT_DELETION_BATCH_SIZE) => {
    if (!Number.isInteger(size) || size < 1 || size > 500) {
        throw new Error('Firestore write chunks must contain between 1 and 500 operations.');
    }
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
        chunks.push(items.slice(index, index + size));
    }
    return chunks;
};
exports.chunkItems = chunkItems;
const normalizeIds = (values) => Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
    .sort();
const buildAccountDeletionStoragePrefixes = ({ userId, accountIds, propertyIds, }) => {
    const prefixes = [
        `user-profile-images/${userId}/`,
        `feedback-attachments/${userId}/`,
    ];
    for (const accountId of normalizeIds(accountIds)) {
        prefixes.push(`properties/${accountId}/`, `team-member-images/${accountId}/`, `team-member-files/${accountId}/`);
    }
    for (const propertyId of normalizeIds(propertyIds)) {
        prefixes.push(`device-files/${propertyId}/`, `maintenance-files/${propertyId}/`);
    }
    return Array.from(new Set(prefixes)).sort();
};
exports.buildAccountDeletionStoragePrefixes = buildAccountDeletionStoragePrefixes;
const removeIdFromArray = (value, userId) => (Array.isArray(value) ? value : [])
    .map((entry) => String(entry || '').trim())
    .filter((entry) => entry && entry !== userId);
exports.removeIdFromArray = removeIdFromArray;
const mergeAccessRemovalUpdates = (existing, next) => ({
    data: { ...existing.data, ...next.data },
    removedUserFields: Array.from(new Set([...existing.removedUserFields, ...next.removedUserFields])),
});
exports.mergeAccessRemovalUpdates = mergeAccessRemovalUpdates;
