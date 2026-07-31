#!/usr/bin/env node

function parseArgs(argv = process.argv.slice(2)) {
	const options = { project: '', origin: '', functions: [] };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === '--project') options.project = String(argv[++index] || '').trim();
		else if (argument === '--origin') options.origin = String(argv[++index] || '').trim();
		else if (argument === '--functions') {
			options.functions = String(argv[++index] || '')
				.split(',')
				.map((value) => value.trim())
				.filter(Boolean);
		} else throw new Error(`Unknown argument: ${argument}`);
	}
	if (!options.project || !options.origin || !options.functions.length) {
		throw new Error('--project, --origin, and --functions are required.');
	}
	return options;
}

async function validateCallablePreflight({ project, origin, functionName, fetchImpl = fetch }) {
	const url = `https://us-central1-${project}.cloudfunctions.net/${functionName}`;
	const response = await fetchImpl(url, {
		method: 'OPTIONS',
		headers: {
			Origin: origin,
			'Access-Control-Request-Method': 'POST',
			'Access-Control-Request-Headers':
				'authorization,content-type,x-client-version',
		},
	});
	const allowOrigin = response.headers.get('access-control-allow-origin');
	if (response.status !== 204 || (allowOrigin !== origin && allowOrigin !== '*')) {
		throw new Error(
			`${functionName} rejected callable preflight (status ${response.status}, allow-origin ${allowOrigin || 'missing'}).`,
		);
	}
}

async function main() {
	try {
		const options = parseArgs();
		for (const functionName of options.functions) {
			await validateCallablePreflight({
				project: options.project,
				origin: options.origin,
				functionName,
			});
		}
		console.log(
			`Callable preflight validation passed for ${options.functions.length} Functions from ${options.origin}.`,
		);
	} catch (error) {
		console.error(`Callable preflight validation failed: ${error.message}`);
		process.exit(1);
	}
}

if (require.main === module) main();

module.exports = {
	parseArgs,
	validateCallablePreflight,
};
