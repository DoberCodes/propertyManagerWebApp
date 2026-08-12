const test = require('node:test');
const assert = require('node:assert/strict');

const { replaceUpdates } = require('./updateSupportUpdates.cjs');

test('replaces the final support update collection after article extraction', () => {
	const current = [
		'export const supportFaqItems = [];',
		'',
		'export const recentMaintleyUpdates = [',
		"\t{ version: '2.12.0' },",
		'];',
		'',
	].join('\n');
	const rendered = [
		'export const recentMaintleyUpdates = [',
		"\t{ version: '2.14.0' },",
		'];',
	].join('\n');

	assert.equal(
		replaceUpdates(current, rendered, '\n'),
		[
			'export const supportFaqItems = [];',
			'',
			'export const recentMaintleyUpdates = [',
			"\t{ version: '2.14.0' },",
			'];',
			'',
		].join('\n'),
	);
});

test('rejects a support file without the managed update collection', () => {
	assert.throws(
		() => replaceUpdates('export const supportFaqItems = [];\n', 'updates', '\n'),
		/Could not find recentMaintleyUpdates/,
	);
});
