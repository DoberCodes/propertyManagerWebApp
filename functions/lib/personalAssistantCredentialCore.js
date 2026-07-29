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
exports.normalizePropertyAllowlist = exports.tokenVerifierMatches = exports.createTokenVerifier = exports.parsePersonalAssistantToken = exports.createPersonalAssistantToken = exports.normalizePersonalAssistantScopes = exports.PERSONAL_ASSISTANT_SCOPES = void 0;
const crypto = __importStar(require("crypto"));
exports.PERSONAL_ASSISTANT_SCOPES = [
    'properties:read',
    'equipment:read',
    'tasks:read',
    'maintenance:read',
    'intelligence:read',
    'documents:metadata:read',
];
const scopeSet = new Set(exports.PERSONAL_ASSISTANT_SCOPES);
const normalizePersonalAssistantScopes = (value) => {
    if (!Array.isArray(value))
        return [];
    return [...new Set(value.map((item) => String(item || '').trim()))].filter((scope) => scopeSet.has(scope));
};
exports.normalizePersonalAssistantScopes = normalizePersonalAssistantScopes;
const createPersonalAssistantToken = (credentialId) => {
    const normalizedId = String(credentialId || '').trim();
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(normalizedId)) {
        throw new Error('A valid credential ID is required.');
    }
    const secret = crypto.randomBytes(32).toString('base64url');
    const tokenPrefix = `mly_pat_${normalizedId}`;
    return { token: `${tokenPrefix}.${secret}`, tokenPrefix };
};
exports.createPersonalAssistantToken = createPersonalAssistantToken;
const parsePersonalAssistantToken = (token) => {
    const normalized = String(token || '').trim();
    const match = normalized.match(/^mly_pat_([A-Za-z0-9_-]{8,128})\.([A-Za-z0-9_-]{40,80})$/);
    return match
        ? { credentialId: match[1], tokenPrefix: `mly_pat_${match[1]}` }
        : null;
};
exports.parsePersonalAssistantToken = parsePersonalAssistantToken;
const createTokenVerifier = (token, pepper) => {
    if (!pepper)
        throw new Error('Token verifier secret is unavailable.');
    return crypto.createHmac('sha256', pepper).update(token, 'utf8').digest('hex');
};
exports.createTokenVerifier = createTokenVerifier;
const tokenVerifierMatches = (token, pepper, expectedVerifier) => {
    const actual = Buffer.from((0, exports.createTokenVerifier)(token, pepper), 'hex');
    const expected = Buffer.from(String(expectedVerifier || ''), 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};
exports.tokenVerifierMatches = tokenVerifierMatches;
const normalizePropertyAllowlist = (value) => Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, 100)
    : [];
exports.normalizePropertyAllowlist = normalizePropertyAllowlist;
