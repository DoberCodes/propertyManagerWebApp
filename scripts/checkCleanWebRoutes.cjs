const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const roots = ['src', 'public', 'e2e'];
const directFiles = ['scripts/seedDemoAccount.cjs', 'scripts/syncPublicPricing.cjs'];
const extensions = new Set(['.ts', '.tsx', '.js', '.cjs', '.json', '.html']);
const failures = [];

const inspect = (filePath) => {
	if (!extensions.has(path.extname(filePath))) return;
	const contents = fs.readFileSync(filePath, 'utf8');
	if (!contents.includes('/#/') && !/["']#\//.test(contents)) return;
	failures.push(path.relative(rootDir, filePath).replace(/\\/g, '/'));
};

const walk = (directory) => {
	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		const absolutePath = path.join(directory, entry.name);
		if (entry.isDirectory()) walk(absolutePath);
		else inspect(absolutePath);
	}
};

for (const relativeRoot of roots) walk(path.join(rootDir, relativeRoot));
for (const relativePath of directFiles) inspect(path.join(rootDir, relativePath));

if (failures.length) {
	console.error(
		`Hash-based application URLs remain in web-owned files:\n${failures
			.map((filePath) => `- ${filePath}`)
			.join('\n')}`,
	);
	process.exitCode = 1;
} else {
	console.log('Web-owned application URLs use clean routes.');
}
