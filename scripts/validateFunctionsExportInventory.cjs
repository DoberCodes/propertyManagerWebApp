#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const functionsDir = path.join(projectRoot, 'functions');
const typescript = require(path.join(functionsDir, 'node_modules', 'typescript'));
const sourcePath = path.join(functionsDir, 'index.ts');
const inventoryPath = path.join(functionsDir, 'function-exports.json');

const sourceFile = typescript.createSourceFile(
	sourcePath,
	fs.readFileSync(sourcePath, 'utf8'),
	typescript.ScriptTarget.Latest,
	true,
	typescript.ScriptKind.TS,
);
const actual = [];

for (const statement of sourceFile.statements) {
	if (
		typescript.isExportDeclaration(statement) &&
		statement.exportClause &&
		typescript.isNamedExports(statement.exportClause)
	) {
		for (const element of statement.exportClause.elements) {
			actual.push(element.name.text);
		}
	}
}

actual.sort();
const expected = JSON.parse(fs.readFileSync(inventoryPath, 'utf8')).sort();
const missing = expected.filter((name) => !actual.includes(name));
const unexpected = actual.filter((name) => !expected.includes(name));

if (missing.length || unexpected.length) {
	console.error('Firebase Function export inventory changed.');
	if (missing.length) console.error(`Missing: ${missing.join(', ')}`);
	if (unexpected.length) console.error(`Unexpected: ${unexpected.join(', ')}`);
	console.error(
		'Update functions/function-exports.json only after confirming the deployment and rollback impact.',
	);
	process.exit(1);
}

console.log(`Firebase Function export inventory passed: ${actual.length} exports.`);
