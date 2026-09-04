const test = require('node:test');
const assert = require('node:assert/strict');
const {
	shouldSendWelcomeSignupEmail,
} = require('./lib/emailVerificationPolicy');

test('sends welcome only for a newly active verified registration', () => {
	assert.equal(
		shouldSendWelcomeSignupEmail(
			{ registrationStatus: 'active' },
			{ registrationStatus: 'pending_email_verification' },
			true,
		),
		true,
	);
});

test('does not send for pending, unverified, repeated, or team profiles', () => {
	assert.equal(
		shouldSendWelcomeSignupEmail(
			{ registrationStatus: 'pending_email_verification' },
			null,
			true,
		),
		false,
	);
	assert.equal(
		shouldSendWelcomeSignupEmail(
			{ registrationStatus: 'active' },
			{ registrationStatus: 'pending_email_verification' },
			false,
		),
		false,
	);
	assert.equal(
		shouldSendWelcomeSignupEmail(
			{ registrationStatus: 'active' },
			{ registrationStatus: 'active' },
			true,
		),
		false,
	);
	assert.equal(
		shouldSendWelcomeSignupEmail(
			{ registrationStatus: 'active', isTeamMemberAccount: true },
			{ registrationStatus: 'pending_email_verification' },
			true,
		),
		false,
	);
});
