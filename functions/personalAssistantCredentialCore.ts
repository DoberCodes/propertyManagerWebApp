import * as crypto from 'crypto';

export const PERSONAL_ASSISTANT_SCOPES = [
	'properties:read',
	'equipment:read',
	'tasks:read',
	'maintenance:read',
	'intelligence:read',
	'documents:metadata:read',
] as const;

export type PersonalAssistantScope = (typeof PERSONAL_ASSISTANT_SCOPES)[number];

const scopeSet = new Set<string>(PERSONAL_ASSISTANT_SCOPES);

export const normalizePersonalAssistantScopes = (
	value: unknown,
): PersonalAssistantScope[] => {
	if (!Array.isArray(value)) return [];
	return [...new Set(value.map((item) => String(item || '').trim()))].filter(
		(scope): scope is PersonalAssistantScope => scopeSet.has(scope),
	);
};

export const createPersonalAssistantToken = (credentialId: string) => {
	const normalizedId = String(credentialId || '').trim();
	if (!/^[A-Za-z0-9_-]{8,128}$/.test(normalizedId)) {
		throw new Error('A valid credential ID is required.');
	}
	const secret = crypto.randomBytes(32).toString('base64url');
	const tokenPrefix = `mly_pat_${normalizedId}`;
	return { token: `${tokenPrefix}.${secret}`, tokenPrefix };
};

export const parsePersonalAssistantToken = (token: string) => {
	const normalized = String(token || '').trim();
	const match = normalized.match(/^mly_pat_([A-Za-z0-9_-]{8,128})\.([A-Za-z0-9_-]{40,80})$/);
	return match
		? { credentialId: match[1], tokenPrefix: `mly_pat_${match[1]}` }
		: null;
};

export const createTokenVerifier = (token: string, pepper: string): string => {
	if (!pepper) throw new Error('Token verifier secret is unavailable.');
	return crypto.createHmac('sha256', pepper).update(token, 'utf8').digest('hex');
};

export const tokenVerifierMatches = (
	token: string,
	pepper: string,
	expectedVerifier: string,
): boolean => {
	const actual = Buffer.from(createTokenVerifier(token, pepper), 'hex');
	const expected = Buffer.from(String(expectedVerifier || ''), 'hex');
	return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

export const normalizePropertyAllowlist = (value: unknown): string[] =>
	Array.isArray(value)
		? [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, 100)
		: [];
