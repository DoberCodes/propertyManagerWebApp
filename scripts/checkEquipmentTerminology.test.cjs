const assert = require('node:assert/strict');
const test = require('node:test');
const { scanSource } = require('./checkEquipmentTerminology.cjs');

test('rejects legacy names for the user-facing equipment record', () => {
	const failures = scanSource(
		["const label = 'Systems';", "const action = 'Open system record';"].join('\n'),
		'fixture.tsx',
	);

	assert.equal(failures.length, 2);
});

test('allows technical identifiers and real-world equipment categories', () => {
	const failures = scanSource(
		[
			"const systemIds = recommendation.relatedSystemIds;",
			"const category = 'Appliances';",
			"const description = 'Security systems and alarms';",
			"type Category =",
			"\t| 'systems'",
			"devices: 'systems',",
		].join('\n'),
		'fixture.tsx',
	);

	assert.deepEqual(failures, []);
});
