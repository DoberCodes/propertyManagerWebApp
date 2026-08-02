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
	assert.match(maintenanceTab, /isEmbeddedCompatibilityRecord/);
	assert.match(maintenanceTab, /read-only until it is migrated/);
});

test('equipment, reporting, profile, dashboard, and Intelligence use the shared device-source boundary', () => {
	for (const relativePath of [
		'src/pages/DeviceDetailPage/DeviceDetailPage.tsx',
		'src/pages/DevicesHubPage/DevicesHubPage.tsx',
		'src/pages/PropertyDetailPage/PropertyDetailPage.tsx',
		'src/pages/PropertyDetailPage/TabSystem/DevicesTab.tsx',
		'src/pages/DashboardTab/DashboardTab.tsx',
		'src/pages/UserProfile/UserProfile.tsx',
		'src/pages/MaintenanceProfilePage/MaintenanceProfilePage.tsx',
		'src/Components/ReportBuilder/ReportBuilder.tsx',
		'src/reporting/reportDataAdapters.ts',
		'src/intelligence/engine.ts',
	]) {
		assert.match(read(relativePath), /mergeMaintenanceHistoryWithDeviceSources/);
	}

	for (const relativePath of [
		'src/pages/DeviceDetailPage/DeviceDetailPage.tsx',
		'src/pages/DevicesHubPage/DevicesHubPage.tsx',
		'src/pages/PropertyDetailPage/TabSystem/DevicesTab.tsx',
		'src/pages/DashboardTab/DashboardTab.tsx',
		'src/pages/UserProfile/UserProfile.tsx',
		'src/reporting/reportDataAdapters.ts',
		'src/intelligence/rules/helpers.ts',
	]) {
		const source = read(relativePath);
		assert.doesNotMatch(source, /Array\.isArray\([^\n]*\.maintenanceHistory/);
		assert.doesNotMatch(source, /\(device\.maintenanceHistory\s*\|\|\s*\[\]\)/);
		assert.doesNotMatch(source, /system\.maintenanceHistory/);
	}
});
