const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveFrontendBuildProfile } = require('./frontendBuildProfile.cjs');

test('uses clean browser routes and root assets for web builds', () => {
	assert.deepEqual(resolveFrontendBuildProfile([]), {
		name: 'web',
		publicUrl: '/',
		routerMode: 'browser',
	});
});

test('retains hash routes and relative assets for packaged Android builds', () => {
	assert.deepEqual(resolveFrontendBuildProfile(['--android']), {
		name: 'android',
		publicUrl: '.',
		routerMode: 'hash',
	});
});
