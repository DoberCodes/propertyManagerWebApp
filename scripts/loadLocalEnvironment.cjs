const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..');

function loadLocalEnvironment({
	environment = process.env.MAINTLEY_ENVIRONMENT || 'development',
	includeOperations = false,
} = {}) {
	if (!['development', 'production'].includes(environment)) {
		throw new Error(`Unsupported MAINTLEY_ENVIRONMENT: ${environment}`);
	}
	const files = environment === 'production'
		? ['.env.production', '.env.production.local']
		: ['.env.development', '.env.development.local'];
	if (includeOperations) files.push('.env.operations.local');
	for (const fileName of files) {
		dotenv.config({
			path: path.join(rootDir, fileName),
			override: true,
		});
	}
	return { environment, files };
}

module.exports = { loadLocalEnvironment };
