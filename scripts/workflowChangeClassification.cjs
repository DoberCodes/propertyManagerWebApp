const fs = require('node:fs');

const normalizePath = (filePath) => filePath.replaceAll('\\', '/').replace(/^\.\//, '');

const matchesAny = (filePath, prefixes, exactPaths = []) => exactPaths.includes(filePath)
	|| prefixes.some((prefix) => filePath.startsWith(prefix));

const classifyWorkflowChanges = (inputPaths) => {
	const paths = [...new Set(inputPaths.map(normalizePath).filter(Boolean))].sort();
	const documentationOnly = paths.length > 0 && paths.every((filePath) => (
		filePath.startsWith('project-docs/')
		|| filePath === 'AGENTS.md'
		|| filePath === 'README.md'
		|| filePath.endsWith('.md')
	));
	const releaseOnly = paths.length > 0 && paths.every((filePath) => [
		'android/app/build.gradle',
		'client/package.json',
		'package.json',
	].includes(filePath));
	const backend = paths.some((filePath) => matchesAny(
		filePath,
		['functions/', 'scripts/'],
		[
			'.firebaserc',
			'firebase.json',
			'firestore.indexes.json',
			'firestore.rules',
			'storage.rules',
			'yarn.lock',
		],
	));
	const frontend = !documentationOnly && paths.some((filePath) => matchesAny(
		filePath,
		['public/', 'src/'],
		[
			'package.json',
			'tsconfig.json',
			'yarn.lock',
		],
	));
	const e2e = frontend || paths.some((filePath) => matchesAny(
		filePath,
		['e2e/'],
		['playwright.config.ts'],
	));
	const ci = paths.some((filePath) => matchesAny(
		filePath,
		['.github/workflows/', 'scripts/'],
		['package.json', 'yarn.lock'],
	));

	return {
		backend,
		ci,
		documentation_only: documentationOnly,
		e2e,
		frontend,
		paths,
		release_only: releaseOnly,
	};
};

const parseArguments = (argumentsList) => {
	const inputIndex = argumentsList.indexOf('--input');
	return {
		input: inputIndex >= 0 ? argumentsList[inputIndex + 1] : '',
	};
};

const runCli = () => {
	const { input } = parseArguments(process.argv.slice(2));
	if (!input) {
		console.error('Usage: node scripts/workflowChangeClassification.cjs --input <newline-delimited-paths>');
		process.exit(1);
	}

	const paths = fs.readFileSync(input, 'utf8').split(/\r?\n/);
	const result = classifyWorkflowChanges(paths);
	const outputLines = Object.entries(result)
		.filter(([key]) => key !== 'paths')
		.map(([key, value]) => `${key}=${value}`);

	if (process.env.GITHUB_OUTPUT) {
		fs.appendFileSync(process.env.GITHUB_OUTPUT, `${outputLines.join('\n')}\n`);
	}

	process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
};

if (require.main === module) {
	runCli();
}

module.exports = {
	classifyWorkflowChanges,
};
