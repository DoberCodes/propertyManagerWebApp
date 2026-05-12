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
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const countCollectionDocsForAccount = async (collectionName, accountId) => {
    const snapshot = await db
        .collection(collectionName)
        .where('accountId', '==', accountId)
        .get();
    return snapshot.size;
};
const run = async () => {
    console.log('Starting account counter backfill...');
    const familyAccountsSnapshot = await db.collection('familyAccounts').get();
    let processed = 0;
    let skipped = 0;
    for (const familyDoc of familyAccountsSnapshot.docs) {
        const accountId = familyDoc.id;
        const familyData = familyDoc.data() || {};
        if (!accountId) {
            skipped += 1;
            continue;
        }
        const [propertyCount, deviceCount] = await Promise.all([
            countCollectionDocsForAccount('properties', accountId),
            countCollectionDocsForAccount('devices', accountId),
        ]);
        await familyDoc.ref.set({
            propertyCount,
            deviceCount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        processed += 1;
        console.log(`Backfilled ${accountId}: properties=${propertyCount}, devices=${deviceCount}`);
        void familyData;
    }
    console.log(`Account counter backfill completed. Processed=${processed}, skipped=${skipped}`);
};
run()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error('Account counter backfill failed:', error);
    process.exit(1);
});
