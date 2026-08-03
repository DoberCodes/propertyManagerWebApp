const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
	scanCompatibilityBoundaries,
} = require('./checkCompatibilityBoundaries.cjs');

const repositoryRoot = path.resolve(__dirname, '..');
const read = (relativePath) =>
	fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

test('rejects duplicate access and embedded property-memory paths', () => {
	const failures = scanCompatibilityBoundaries(
		[
			'const ids = await resolveAccessibleAccountIds();',
			'const member = await getTeamMemberForAccountUser(ids);',
			'const documents = property?.documents || [];',
			'const suggestions = property.knowledgeSuggestions || [];',
		].join('\n'),
		'src/feature/example.ts',
	);

	assert.equal(failures.length, 4);
});

test('allows compatibility reads only inside their shared adapters', () => {
	assert.deepEqual(
		scanCompatibilityBoundaries(
			'const documents = property.documents || [];',
			'src/propertyKnowledge/propertyMemoryRecordService.ts',
		),
		[],
	);
	assert.deepEqual(
		scanCompatibilityBoundaries(
			"collection(db, 'maintenanceHistory')",
			'src/Redux/API/maintenanceSlice.tsx',
		),
		[],
	);
});

test('rejects new direct legacy maintenance collection reads', () => {
	const failures = scanCompatibilityBoundaries(
		"const records = collection(db, 'maintenanceHistory');",
		'src/pages/example.tsx',
	);

	assert.equal(failures.length, 1);
});

test('primary data slices resolve account and property scope through the shared context', () => {
	for (const relativePath of [
		'src/Redux/API/propertySlice.tsx',
		'src/Redux/API/taskSlice.tsx',
		'src/Redux/API/deviceSlice.ts',
		'src/Redux/API/contractorSlice.tsx',
		'src/Redux/API/maintenanceSlice.tsx',
		'src/Redux/API/userSlice.tsx',
	]) {
		assert.match(read(relativePath), /resolveAccountAccessContext/);
	}
});
