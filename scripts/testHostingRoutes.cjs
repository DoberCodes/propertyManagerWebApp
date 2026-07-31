const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const emulatorHost = String(
	process.env.FIREBASE_HOSTING_EMULATOR_HOST || '127.0.0.1:5000',
).replace(/^https?:\/\//, '');
const baseUrl = `http://${emulatorHost}`;

const get = async (pathname) => {
	const response = await fetch(`${baseUrl}${pathname}`);
	const body = await response.text();
	assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
	return { body, headers: response.headers };
};

const run = async () => {
	const firebaseConfig = JSON.parse(
		fs.readFileSync(path.resolve(__dirname, '..', 'firebase.json'), 'utf8'),
	);
	const productionHosting = firebaseConfig.hosting.find(
		(config) => config.target === 'prod',
	);
	assert.ok(productionHosting, 'Missing production Hosting target');
	assert.deepEqual(
		productionHosting.headers.map(({ source }) => source),
		['/**', '/static/**'],
		'General no-cache headers must be defined before the immutable static override',
	);
	assert.equal(
		productionHosting.headers[0].headers[0].value,
		'no-cache, no-store, must-revalidate',
	);
	assert.equal(
		productionHosting.headers[1].headers[0].value,
		'public,max-age=31536000,immutable',
	);

	const root = await get('/');
	assert.match(root.body, /<div id="root">/);

	for (const pathname of [
		'/login',
		'/register?source=hosting-smoke',
		'/legal/privacy-policy',
		'/property/direct-route-smoke',
		'/property/direct-route-smoke/device/equipment-smoke',
		'/property/direct-route-smoke/maintenance-history/history-smoke',
		'/this-route-does-not-exist',
	]) {
		const result = await get(pathname);
		assert.equal(result.body, root.body, `${pathname} did not use the SPA shell`);
	}

	const pricing = await get('/pricing/');
	assert.notEqual(pricing.body, root.body, 'Static pricing page was shadowed by the SPA rewrite');
	assert.match(pricing.body, /<title>[^<]*Maintley[^<]*<\/title>/i);

	const assetPath = root.body.match(/src="(\/static\/js\/[^\"]+\.js)"/)?.[1];
	assert.ok(assetPath, 'Could not find the root-relative application script');
	await get(assetPath);

	console.log('Firebase Hosting route, rewrite, and cache-header smoke tests passed.');
};

run().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
