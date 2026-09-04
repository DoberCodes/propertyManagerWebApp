const DEFAULT_ROUTES = [
	'/',
	'/login',
	'/registration',
	'/forgot-password',
	'/verify-email',
];

const parseArgs = (argv) => {
	const options = {
		baseUrl: '',
		routes: [...DEFAULT_ROUTES],
	};

	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--base-url') {
			options.baseUrl = argv[index + 1] || '';
			index += 1;
		} else if (argument === '--routes') {
			options.routes = String(argv[index + 1] || '')
				.split(',')
				.map((route) => route.trim())
				.filter(Boolean);
			index += 1;
		} else if (argument === '--help' || argument === '-h') {
			options.help = true;
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}

	return options;
};

const normalizeBaseUrl = (value) => {
	const url = new URL(String(value || ''));
	if (url.protocol !== 'https:') {
		throw new Error('Deployed web validation requires an HTTPS base URL.');
	}
	url.pathname = '/';
	url.search = '';
	url.hash = '';
	return url;
};

const normalizeRoute = (route) => {
	const normalized = String(route || '').trim();
	if (!normalized.startsWith('/') || normalized.startsWith('//')) {
		throw new Error(`Route must be an origin-relative path: ${normalized || '(empty)'}`);
	}
	return normalized;
};

const validateDeployedWebRoutes = async ({
	baseUrl,
	routes = DEFAULT_ROUTES,
	fetchImpl = global.fetch,
}) => {
	if (typeof fetchImpl !== 'function') {
		throw new Error('A Fetch-compatible implementation is required.');
	}
	if (!Array.isArray(routes) || routes.length === 0) {
		throw new Error('At least one deployed route is required.');
	}

	const base = normalizeBaseUrl(baseUrl);
	const results = [];

	for (const routeValue of routes) {
		const route = normalizeRoute(routeValue);
		const requestUrl = new URL(route, base);
		const response = await fetchImpl(requestUrl, {
			headers: {
				accept: 'text/html',
				'cache-control': 'no-cache',
			},
			redirect: 'follow',
			signal: AbortSignal.timeout(15000),
		});

		if (!response.ok) {
			throw new Error(`Deployed route ${route} returned HTTP ${response.status}.`);
		}
		if (response.url && new URL(response.url).origin !== base.origin) {
			throw new Error(`Deployed route ${route} redirected outside ${base.origin}.`);
		}

		const contentType = response.headers.get('content-type') || '';
		if (!contentType.toLowerCase().includes('text/html')) {
			throw new Error(`Deployed route ${route} did not return HTML.`);
		}

		const body = await response.text();
		if (!/<div\s+id=["']root["'][^>]*>/i.test(body)) {
			throw new Error(`Deployed route ${route} did not return the Maintley app shell.`);
		}

		results.push({ route, status: response.status });
	}

	return {
		baseUrl: base.origin,
		results,
	};
};

const printHelp = () => {
	console.log(`Validate deployed Maintley BrowserRouter routes.

Usage:
  node scripts/validateDeployedWebRoutes.cjs --base-url <https-url> [--routes /,/login]
`);
};

const main = async () => {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}
	if (!options.baseUrl) {
		throw new Error('--base-url is required.');
	}

	const validation = await validateDeployedWebRoutes(options);
	for (const result of validation.results) {
		console.log(`Validated ${validation.baseUrl}${result.route} (HTTP ${result.status}).`);
	}
};

if (require.main === module) {
	main().catch((error) => {
		console.error(`Deployed web route validation failed: ${error.message}`);
		process.exit(1);
	});
}

module.exports = {
	DEFAULT_ROUTES,
	normalizeBaseUrl,
	normalizeRoute,
	parseArgs,
	validateDeployedWebRoutes,
};
