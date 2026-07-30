const assert = require('node:assert/strict');
const test = require('node:test');
const {
	getComplimentaryAccessCodeHash,
	normalizeComplimentaryAccessCode,
	assertRecipientEligibility,
} = require('./lib/complimentaryAccessCodes.js');

const pepper = 'maintley-test-pepper-that-is-longer-than-thirty-two-characters';

test('normalizes human-friendly access code formatting', () => {
	assert.equal(normalizeComplimentaryAccessCode(' maint-ley 2026 '), 'MAINTLEY2026');
	assert.throws(
		() => normalizeComplimentaryAccessCode('short'),
		(error) => error?.code === 'invalid-argument',
	);
});

test('stores a deterministic verifier without retaining plaintext', () => {
	const hash = getComplimentaryAccessCodeHash('MAINT-LEY-2026', pepper);
	assert.equal(hash, getComplimentaryAccessCodeHash('maintley2026', pepper));
	assert.match(hash, /^[a-f0-9]{64}$/);
	assert.equal(hash.includes('MAINTLEY'), false);
	assert.throws(() => getComplimentaryAccessCodeHash('MAINTLEY2026', 'too-short'));
});

test('enforces optional recipient email restrictions', () => {
	assert.doesNotThrow(() =>
		assertRecipientEligibility(
			{ recipientEmailLower: null },
			'customer@example.com',
			false,
		),
	);
	assert.doesNotThrow(() =>
		assertRecipientEligibility(
			{ recipientEmailLower: 'customer@example.com' },
			'CUSTOMER@example.com',
			true,
		),
	);
	assert.throws(
		() => assertRecipientEligibility(
			{ recipientEmailLower: 'customer@example.com' },
			'other@example.com',
			true,
		),
		(error) => error?.code === 'permission-denied',
	);
	assert.throws(
		() => assertRecipientEligibility(
			{ recipientEmailLower: 'customer@example.com' },
			'customer@example.com',
			false,
		),
		(error) => error?.code === 'failed-precondition',
	);
});
