const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('equipment workflows do not append embedded maintenance history', () => {
	const devicePage = read('src/pages/DeviceDetailPage/DeviceDetailPage.tsx');
	const setupAssistant = read(
		'src/Components/PropertySetupAssistant/PropertySetupAssistant.tsx',
	);

	assert.doesNotMatch(devicePage, /updates:\s*\{\s*maintenanceHistory:/);
	assert.doesNotMatch(devicePage, /Recurring maintenance created:/);
	assert.doesNotMatch(setupAssistant, /maintenanceHistory:\s*\[\]/);
});

test('property create and edit flows do not rewrite embedded history arrays', () => {
	for (const relativePath of [
		'src/Components/PropertiesTab/PropertiesTab.tsx',
		'src/pages/PropertyDetailPage/PropertyDetailPage.tsx',
	]) {
		const source = read(relativePath);
		assert.doesNotMatch(source, /taskHistory:\s*formData\.maintenanceHistory/);
	}
});

test('legacy record corrections cross the server-owned promotion boundary', () => {
	const client = read('src/Redux/API/maintenanceSlice.tsx');
	const server = read('functions/maintenanceEvents.ts');

	assert.match(client, /correctMaintenanceHistoryRecord/);
	assert.doesNotMatch(client, /deleteDoc\(doc\(db,\s*['"]maintenanceHistory['"]/);
	assert.doesNotMatch(client, /updateDoc\(doc\(db,\s*['"]maintenanceHistory['"]/);
	assert.match(server, /export const correctMaintenanceHistoryRecord/);
	assert.match(server, /buildPromotedLegacyMaintenanceEvent/);
});
