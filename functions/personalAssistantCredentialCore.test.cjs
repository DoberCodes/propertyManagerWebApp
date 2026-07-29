'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('./lib/personalAssistantCredentialCore.js');

test('creates parseable tokens without storing plaintext in the verifier', () => {
	const issued = core.createPersonalAssistantToken('credential_123');
	assert.equal(core.parsePersonalAssistantToken(issued.token).credentialId, 'credential_123');
	const verifier = core.createTokenVerifier(issued.token, 'test-pepper');
	assert.equal(verifier.includes(issued.token), false);
	assert.equal(core.tokenVerifierMatches(issued.token, 'test-pepper', verifier), true);
	assert.equal(core.tokenVerifierMatches(`${issued.token}x`, 'test-pepper', verifier), false);
});

test('normalizes scopes and property allowlists', () => {
	assert.deepEqual(
		core.normalizePersonalAssistantScopes(['tasks:read', 'unknown', 'tasks:read']),
		['tasks:read'],
	);
	assert.deepEqual(core.normalizePropertyAllowlist(['property-1', '', 'property-1']), ['property-1']);
});
