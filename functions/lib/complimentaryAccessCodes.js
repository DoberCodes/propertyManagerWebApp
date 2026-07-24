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
exports.redeemComplimentaryAccessCode = exports.redeemComplimentaryAccessCodeForAccount = exports.previewComplimentaryAccessCode = exports.getComplimentaryAccessCodeHash = exports.normalizeComplimentaryAccessCode = void 0;
const crypto_1 = require("crypto");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions/v1"));
const params_1 = require("firebase-functions/params");
const entitlements_1 = require("@maintley/entitlements");
const accountAuthz_1 = require("./accountAuthz");
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const ACCESS_CODE_PEPPER = (0, params_1.defineSecret)('COMPLIMENTARY_ACCESS_CODE_PEPPER');
const PROGRAMS_COLLECTION = 'entitlementAccessPrograms';
const CODES_COLLECTION = 'entitlementAccessCodes';
const ATTEMPTS_COLLECTION = 'accessCodeRedemptionAttempts';
const AUDIT_COLLECTION = 'admin_audit_logs';
const MAX_ATTEMPTS_PER_HOUR = 20;
const MAX_CODE_LENGTH = 80;
const DAY_MS = 24 * 60 * 60 * 1000;
const text = (value) => String(value || '').trim();
const isAccessCodeRolloutEnabled = () => process.env.ENABLE_COMPLIMENTARY_ACCESS_CODES === 'true';
const normalizeComplimentaryAccessCode = (value) => {
    const normalized = text(value).toUpperCase().replace(/[\s-]+/g, '');
    if (!/^[A-Z0-9]{8,80}$/.test(normalized) || normalized.length > MAX_CODE_LENGTH) {
        throw new functions.https.HttpsError('invalid-argument', 'Enter a valid complimentary access code.');
    }
    return normalized;
};
exports.normalizeComplimentaryAccessCode = normalizeComplimentaryAccessCode;
const getComplimentaryAccessCodeHash = (code, pepper) => {
    const normalizedPepper = text(pepper);
    if (normalizedPepper.length < 32) {
        throw new Error('Complimentary access-code pepper must contain at least 32 characters.');
    }
    return (0, crypto_1.createHmac)('sha256', normalizedPepper)
        .update((0, exports.normalizeComplimentaryAccessCode)(code))
        .digest('hex');
};
exports.getComplimentaryAccessCodeHash = getComplimentaryAccessCodeHash;
const getRuntimePepper = () => text(ACCESS_CODE_PEPPER.value()) || text(process.env.COMPLIMENTARY_ACCESS_CODE_PEPPER);
const asProgram = (id, value) => {
    const data = (value && typeof value === 'object' ? value : {});
    const program = {
        programId: text(data.programId) || id,
        label: text(data.label),
        status: text(data.status),
        bundleId: text(data.bundleId),
        bundleVersion: text(data.bundleVersion) || entitlements_1.BUNDLE_VERSION,
        durationDays: Number(data.durationDays),
        redemptionExpiresAtMs: Number(data.redemptionExpiresAtMs || 0) || null,
        totalRedemptionLimit: Number(data.totalRedemptionLimit),
        redeemedCount: Number(data.redeemedCount || 0),
        perAccountLimit: Number(data.perAccountLimit),
        eligibleBasePlans: Array.isArray(data.eligibleBasePlans)
            ? data.eligibleBasePlans.map(String)
            : ['homeowner'],
        limitOverrides: typeof data.limitOverrides === 'object' && data.limitOverrides
            ? data.limitOverrides
            : {},
        transitionMode: text(data.transitionMode),
        fallbackPlanId: 'homeowner',
        policyVersion: text(data.policyVersion),
    };
    if (program.status !== 'active' ||
        !['homeowner_plus', 'multi_homeowner', 'property', 'portfolio'].includes(program.bundleId) ||
        !Number.isInteger(program.durationDays) ||
        program.durationDays < 1 ||
        program.durationDays > 730 ||
        !Number.isInteger(program.totalRedemptionLimit) ||
        program.totalRedemptionLimit < 1 ||
        !Number.isInteger(program.perAccountLimit) ||
        program.perAccountLimit !== 1 ||
        !['none', 'checkout_required'].includes(program.transitionMode) ||
        !program.label ||
        !program.policyVersion) {
        throw new functions.https.HttpsError('failed-precondition', 'This complimentary access program is not configured correctly.');
    }
    return program;
};
const asCodeRecord = (value) => {
    const data = (value && typeof value === 'object' ? value : {});
    return {
        programId: text(data.programId),
        status: text(data.status),
        expiresAtMs: Number(data.expiresAtMs || 0) || null,
        maxRedemptions: Number(data.maxRedemptions || 0),
        redeemedCount: Number(data.redeemedCount || 0),
    };
};
const getAttemptWindowId = (accountId, nowMs) => `${accountId}_${Math.floor(nowMs / (60 * 60 * 1000))}`;
const recordAttempt = async (accountId, requestId, outcome, programId) => {
    await db.collection(ATTEMPTS_COLLECTION).doc(`${accountId}_${requestId}`).set({
        accountId,
        requestId,
        outcome,
        programId: programId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: false });
};
const assertRateLimit = async (accountId, nowMs) => {
    const ref = db.collection(ATTEMPTS_COLLECTION).doc(`rate_${getAttemptWindowId(accountId, nowMs)}`);
    await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const count = Number(snapshot.data()?.count || 0);
        if (count >= MAX_ATTEMPTS_PER_HOUR) {
            throw new functions.https.HttpsError('resource-exhausted', 'Too many access-code attempts. Try again later.');
        }
        transaction.set(ref, {
            accountId,
            windowStartsAtMs: Math.floor(nowMs / (60 * 60 * 1000)) * 60 * 60 * 1000,
            count: count + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
};
const writeRedemptionOutcomeAudit = async (params) => {
    const effectiveRequestId = `${params.stage}:${params.requestId}`;
    const eventId = (0, entitlements_1.getAdminAuditEventId)(params.action, effectiveRequestId);
    try {
        await db.collection(AUDIT_COLLECTION).doc(eventId).create({
            eventId,
            action: params.action,
            category: 'entitlement_program',
            actorUserId: params.actorUserId,
            targetAccountId: params.accountId,
            targetUserId: params.actorUserId,
            programId: params.programId || null,
            reason: params.outcome,
            requestId: effectiveRequestId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            before: { redeemed: false },
            after: { redeemed: false, outcome: params.outcome },
            metadata: { source: 'customer_access_code', stage: params.stage, plaintextStored: false },
        });
    }
    catch (error) {
        if (Number(error?.code) !== 6 && String(error?.code || '') !== 'already-exists')
            throw error;
    }
};
const outcomeForError = (error) => {
    if (error instanceof functions.https.HttpsError)
        return String(error.code || 'failed');
    return 'internal';
};
const loadProgramAndCode = async (codeHash, nowMs) => {
    const codeRef = db.collection(CODES_COLLECTION).doc(codeHash);
    const codeSnapshot = await codeRef.get();
    if (!codeSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'That access code is not available.');
    }
    const code = asCodeRecord(codeSnapshot.data());
    if (code.status !== 'active' ||
        !code.programId ||
        (code.expiresAtMs && code.expiresAtMs <= nowMs) ||
        code.maxRedemptions < 1 ||
        Number(code.redeemedCount || 0) >= code.maxRedemptions) {
        throw new functions.https.HttpsError('failed-precondition', 'That access code is no longer available.');
    }
    const programRef = db.collection(PROGRAMS_COLLECTION).doc(code.programId);
    const programSnapshot = await programRef.get();
    if (!programSnapshot.exists) {
        throw new functions.https.HttpsError('failed-precondition', 'The access program is unavailable.');
    }
    const program = asProgram(programSnapshot.id, programSnapshot.data());
    if ((program.redemptionExpiresAtMs && program.redemptionExpiresAtMs <= nowMs) ||
        Number(program.redeemedCount || 0) >= program.totalRedemptionLimit) {
        throw new functions.https.HttpsError('failed-precondition', 'This access program has ended.');
    }
    return { program, programRef, code, codeRef };
};
const previewForProgram = (program) => ({
    programId: program.programId,
    label: program.label,
    bundleId: program.bundleId,
    durationDays: program.durationDays,
    transitionMode: program.transitionMode,
    fallbackPlanId: program.fallbackPlanId,
    limitOverrides: program.limitOverrides || {},
    automaticBilling: false,
});
const requestIdForCodeAction = (accountId, value) => {
    const provided = text(value);
    if (/^[a-zA-Z0-9:_-]{8,120}$/.test(provided))
        return provided;
    return `access-code:${accountId}:${(0, crypto_1.createHash)('sha256')
        .update(`${Date.now()}:${Math.random()}`)
        .digest('hex')
        .slice(0, 24)}`;
};
exports.previewComplimentaryAccessCode = functions
    .region('us-central1')
    .runWith({ secrets: ['COMPLIMENTARY_ACCESS_CODE_PEPPER'] })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign in to preview access.');
    }
    if (!isAccessCodeRolloutEnabled()) {
        throw new functions.https.HttpsError('failed-precondition', 'Complimentary access codes are disabled.');
    }
    const accountId = await (0, accountAuthz_1.resolveAccountIdForUser)(context.auth.uid);
    await (0, accountAuthz_1.assertAccountRole)(context.auth.uid, accountId, ['account_owner']);
    const nowMs = Date.now();
    const requestId = requestIdForCodeAction(accountId, data?.requestId);
    await assertRateLimit(accountId, nowMs);
    try {
        const codeHash = (0, exports.getComplimentaryAccessCodeHash)((0, exports.normalizeComplimentaryAccessCode)(data?.code), getRuntimePepper());
        const { program } = await loadProgramAndCode(codeHash, nowMs);
        await recordAttempt(accountId, requestId, 'previewed', program.programId);
        return { success: true, preview: previewForProgram(program) };
    }
    catch (error) {
        await recordAttempt(accountId, requestId, 'preview_failed');
        await writeRedemptionOutcomeAudit({
            accountId,
            actorUserId: context.auth.uid,
            requestId,
            action: 'program.redemption_failed',
            stage: 'preview',
            outcome: outcomeForError(error),
        });
        throw error;
    }
});
const redeemComplimentaryAccessCodeForAccount = async (params) => {
    const { accountId, beneficiaryUserId, codeHash, requestId, nowMs } = params;
    const loaded = await loadProgramAndCode(codeHash, nowMs);
    const { program, programRef, code, codeRef } = loaded;
    const grantId = `access_${(0, crypto_1.createHash)('sha256')
        .update(`${program.programId}:${accountId}`)
        .digest('hex')
        .slice(0, 32)}`;
    const accountRef = db.collection('familyAccounts').doc(accountId);
    const userRef = db.collection('users').doc(beneficiaryUserId);
    const grantRef = accountRef.collection('entitlementGrants').doc(grantId);
    const auditEventId = (0, entitlements_1.getAdminAuditEventId)('program.applied', requestId);
    const auditRef = db.collection(AUDIT_COLLECTION).doc(auditEventId);
    const replayed = await db.runTransaction(async (transaction) => {
        const [accountSnapshot, userSnapshot, codeSnapshot, programSnapshot, grantSnapshot, auditSnapshot] = await Promise.all([
            transaction.get(accountRef),
            transaction.get(userRef),
            transaction.get(codeRef),
            transaction.get(programRef),
            transaction.get(grantRef),
            transaction.get(auditRef),
        ]);
        if (auditSnapshot.exists || grantSnapshot.exists)
            return true;
        if (!accountSnapshot.exists || !userSnapshot.exists) {
            throw new functions.https.HttpsError('failed-precondition', 'The account is unavailable.');
        }
        const account = accountSnapshot.data() || {};
        const user = userSnapshot.data() || {};
        if (text(account.ownerId) !== beneficiaryUserId || user.isAccountOwner === false) {
            throw new functions.https.HttpsError('permission-denied', 'Only the account owner can redeem access.');
        }
        const liveCode = asCodeRecord(codeSnapshot.data());
        const liveProgram = asProgram(programSnapshot.id, programSnapshot.data());
        const basePlan = text(account.subscription?.plan || user.subscription?.plan || 'homeowner');
        if (!liveProgram.eligibleBasePlans?.includes(basePlan)) {
            throw new functions.https.HttpsError('failed-precondition', 'This account is not eligible for the access program.');
        }
        if (liveCode.status !== 'active' ||
            (liveCode.expiresAtMs && liveCode.expiresAtMs <= nowMs) ||
            Number(liveCode.redeemedCount || 0) >= liveCode.maxRedemptions ||
            (liveProgram.redemptionExpiresAtMs && liveProgram.redemptionExpiresAtMs <= nowMs) ||
            Number(liveProgram.redeemedCount || 0) >= liveProgram.totalRedemptionLimit) {
            throw new functions.https.HttpsError('failed-precondition', 'That access code is no longer available.');
        }
        const startsAtMs = nowMs;
        const endsAtMs = startsAtMs + liveProgram.durationDays * DAY_MS;
        const grant = {
            grantId,
            programId: liveProgram.programId,
            accountId,
            kind: 'temporary',
            state: 'active',
            bundleId: liveProgram.bundleId,
            bundleVersion: liveProgram.bundleVersion || entitlements_1.BUNDLE_VERSION,
            bundleLimitOverrides: liveProgram.limitOverrides || {},
            startsAtMs,
            endsAtMs,
            source: 'promotion',
            beneficiaryUserId,
            idempotencyKey: `${liveProgram.programId}:${accountId}`,
            issuedByUserId: beneficiaryUserId,
            issuedAtMs: startsAtMs,
            auditReason: 'Customer redeemed an approved complimentary access program.',
            policyVersion: liveProgram.policyVersion,
            transition: {
                mode: liveProgram.transitionMode,
                status: 'not_configured',
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const projectedGrant = {
            grantId,
            programId: liveProgram.programId,
            accountId,
            kind: 'temporary',
            state: 'active',
            bundleId: liveProgram.bundleId,
            bundleVersion: liveProgram.bundleVersion || entitlements_1.BUNDLE_VERSION,
            bundleLimitOverrides: liveProgram.limitOverrides || {},
            startsAtMs,
            endsAtMs,
            source: 'promotion',
            policyVersion: liveProgram.policyVersion,
            transition: {
                mode: liveProgram.transitionMode,
                status: 'not_configured',
            },
        };
        const projection = (account.effectiveEntitlementProjection || {});
        const existingGrants = Array.isArray(projection.activeGrants)
            ? projection.activeGrants.filter((item) => text(item?.grantId) !== grantId)
            : [];
        const existingExpirations = typeof projection.bundleExpirationsMs === 'object' && projection.bundleExpirationsMs
            ? projection.bundleExpirationsMs
            : {};
        transaction.create(grantRef, grant);
        transaction.update(codeRef, {
            redeemedCount: Number(liveCode.redeemedCount || 0) + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        transaction.update(programRef, {
            redeemedCount: Number(liveProgram.redeemedCount || 0) + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        transaction.set(accountRef, {
            effectiveEntitlementProjection: {
                ...projection,
                resolverVersion: 'v1',
                activeBundleIds: Array.from(new Set([...(Array.isArray(projection.activeBundleIds) ? projection.activeBundleIds : []), liveProgram.bundleId])),
                bundleVersions: Array.from(new Set([...(Array.isArray(projection.bundleVersions) ? projection.bundleVersions : []), `${liveProgram.bundleId}@${liveProgram.bundleVersion || entitlements_1.BUNDLE_VERSION}`])),
                bundleExpirationsMs: {
                    ...existingExpirations,
                    [liveProgram.bundleId]: Math.max(Number(existingExpirations[liveProgram.bundleId] || 0), endsAtMs),
                },
                activeGrants: [...existingGrants, projectedGrant],
                nextTransitionAtMs: Number(projection.nextTransitionAtMs || 0) > nowMs
                    ? Math.min(Number(projection.nextTransitionAtMs), endsAtMs)
                    : endsAtMs,
                calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.create(auditRef, {
            eventId: auditEventId,
            action: 'program.applied',
            category: 'entitlement_grant',
            actorUserId: beneficiaryUserId,
            targetAccountId: accountId,
            targetUserId: beneficiaryUserId,
            grantId,
            programId: liveProgram.programId,
            reason: 'Customer redeemed an approved complimentary access program.',
            requestId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            before: { basePlan },
            after: { bundleId: liveProgram.bundleId, startsAtMs, endsAtMs },
            metadata: {
                policyVersion: liveProgram.policyVersion,
                transitionMode: liveProgram.transitionMode,
                source: 'customer_access_code',
            },
        });
        return false;
    });
    return { grantId, replayed, preview: previewForProgram(program) };
};
exports.redeemComplimentaryAccessCodeForAccount = redeemComplimentaryAccessCodeForAccount;
exports.redeemComplimentaryAccessCode = functions
    .region('us-central1')
    .runWith({ secrets: ['COMPLIMENTARY_ACCESS_CODE_PEPPER'] })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Sign in to redeem access.');
    }
    if (!isAccessCodeRolloutEnabled()) {
        throw new functions.https.HttpsError('failed-precondition', 'Complimentary access codes are disabled.');
    }
    const accountId = await (0, accountAuthz_1.resolveAccountIdForUser)(context.auth.uid);
    await (0, accountAuthz_1.assertAccountRole)(context.auth.uid, accountId, ['account_owner']);
    const nowMs = Date.now();
    const requestId = requestIdForCodeAction(accountId, data?.requestId);
    await assertRateLimit(accountId, nowMs);
    try {
        const codeHash = (0, exports.getComplimentaryAccessCodeHash)((0, exports.normalizeComplimentaryAccessCode)(data?.code), getRuntimePepper());
        const result = await (0, exports.redeemComplimentaryAccessCodeForAccount)({
            accountId,
            beneficiaryUserId: context.auth.uid,
            codeHash,
            requestId,
            nowMs,
        });
        await recordAttempt(accountId, `${requestId}_result`, result.replayed ? 'replayed' : 'redeemed', result.preview.programId);
        if (result.replayed) {
            await writeRedemptionOutcomeAudit({
                accountId,
                actorUserId: context.auth.uid,
                requestId,
                action: 'program.redemption_replayed',
                stage: 'redeem',
                outcome: 'replayed',
                programId: result.preview.programId,
            });
        }
        return { success: true, ...result };
    }
    catch (error) {
        await recordAttempt(accountId, `${requestId}_result`, 'redemption_failed');
        await writeRedemptionOutcomeAudit({
            accountId,
            actorUserId: context.auth.uid,
            requestId,
            action: 'program.redemption_failed',
            stage: 'redeem',
            outcome: outcomeForError(error),
        });
        throw error;
    }
});
