const path = require('path');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..');

function loadLocalEnvironment({
	environment = process.env.MAINTLEY_ENVIRONMENT || 'local',
	includeOperations = false,
} = {}) {
	if (!['local', 'beta', 'development', 'production'].includes(environment)) {
		throw new Error(`Unsupported MAINTLEY_ENVIRONMENT: ${environment}`);
	}
	const normalized = environment === 'development' ? 'beta' : environment;
	const files = [`.env.${normalized === 'production' ? 'prod' : normalized}`];
	if (includeOperations && normalized !== 'local') files.push('.env.local');
	for (const fileName of files) {
		dotenv.config({
			path: path.join(rootDir, fileName),
			override: true,
		});
	}
	return { environment, files };
}

module.exports = { loadLocalEnvironment };
