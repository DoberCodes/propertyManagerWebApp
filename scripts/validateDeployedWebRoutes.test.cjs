const assert = require('node:assert/strict');
const test = require('node:test');
const {
	DEFAULT_ROUTES,
	normalizeBaseUrl,
	normalizeRoute,
	parseArgs,
	validateDeployedWebRoutes,
} = require('./validateDeployedWebRoutes.cjs');

const appShell = '<!doctype html><html><body><div id="root"></div></body></html>';

const successfulFetch = async (url) => ({
	ok: true,
	status: 200,
	url: url.toString(),
	headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
	text: async () => appShell,
});

test('uses safe public BrowserRouter routes by default', () => {
	assert.deepEqual(DEFAULT_ROUTES, [
		'/',
		'/login',
		'/registration',
		'/forgot-password',
		'/verify-email',
	]);
	assert.deepEqual(parseArgs(['--base-url', 'https://example.web.app']), {
		baseUrl: 'https://example.web.app',
		routes: DEFAULT_ROUTES,
	});
});

test('requires an HTTPS origin and origin-relative routes', () => {
	assert.equal(normalizeBaseUrl('https://example.web.app/path').href, 'https://example.web.app/');
	assert.equal(normalizeRoute('/login'), '/login');
	assert.throws(() => normalizeBaseUrl('http://example.web.app'), /HTTPS/);
	assert.throws(() => normalizeRoute('https://attacker.example'), /origin-relative/);
	assert.throws(() => normalizeRoute('//attacker.example'), /origin-relative/);
});

test('validates every deployed route against the Maintley app shell', async () => {
	const validation = await validateDeployedWebRoutes({
		baseUrl: 'https://example.web.app',
		routes: ['/', '/login'],
		fetchImpl: successfulFetch,
	});

	assert.equal(validation.baseUrl, 'https://example.web.app');
	assert.deepEqual(validation.results, [
		{ route: '/', status: 200 },
		{ route: '/login', status: 200 },
	]);
});

test('rejects failed, redirected, and non-app-shell responses', async () => {
	await assert.rejects(
		validateDeployedWebRoutes({
			baseUrl: 'https://example.web.app',
			routes: ['/login'],
			fetchImpl: async () => ({
				ok: false,
				status: 404,
				url: 'https://example.web.app/login',
				headers: new Headers({ 'content-type': 'text/html' }),
				text: async () => appShell,
			}),
		}),
		/HTTP 404/,
	);

	await assert.rejects(
		validateDeployedWebRoutes({
			baseUrl: 'https://example.web.app',
			routes: ['/login'],
			fetchImpl: async () => ({
				ok: true,
				status: 200,
				url: 'https://other.example/login',
				headers: new Headers({ 'content-type': 'text/html' }),
				text: async () => appShell,
			}),
		}),
		/redirected outside/,
	);

	await assert.rejects(
		validateDeployedWebRoutes({
			baseUrl: 'https://example.web.app',
			routes: ['/login'],
			fetchImpl: async (url) => ({
				ok: true,
				status: 200,
				url: url.toString(),
				headers: new Headers({ 'content-type': 'text/html' }),
				text: async () => '<html><body>Not Maintley</body></html>',
			}),
		}),
		/app shell/,
	);
});
