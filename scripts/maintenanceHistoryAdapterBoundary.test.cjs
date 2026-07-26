const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('property and account history queries use the shared adapter', () => {
	for (const relativePath of [
		'src/Redux/API/maintenanceSlice.tsx',
		'src/Redux/API/userSlice.tsx',
	]) {
		const source = read(relativePath);
		assert.match(source, /mergeMaintenanceHistorySources/);
		assert.match(source, /propertyEmbeddedHistorySources/);
	}
});

test('property detail consumers do not perform a second embedded-history merge', () => {
	const detailHook = read('src/Hooks/useDetailPageData.ts');
	const maintenanceTab = read(
		'src/pages/PropertyDetailPage/TabSystem/MaintenanceTab.tsx',
	);

	assert.doesNotMatch(detailHook, /filterMaintenanceHistory/);
	assert.doesNotMatch(maintenanceTab, /property\.maintenanceHistory\s*\|\|/);
	assert.match(maintenanceTab, /isCanonicalMaintenanceEvent/);
});
