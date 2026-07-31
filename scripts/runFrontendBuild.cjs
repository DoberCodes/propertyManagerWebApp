#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { parseDotenv } = require('./syncGitHubEnvironment.cjs');
const { resolveFrontendBuildProfile } = require('./frontendBuildProfile.cjs');

const rootDir = path.resolve(__dirname, '..');
const target = process.argv.includes('--beta') ? 'beta' : 'prod';
const profile = resolveFrontendBuildProfile(process.argv.slice(2));
const targetFile = path.join(rootDir, `.env.${target}`);
const fileValues = fs.existsSync(targetFile)
	? Object.fromEntries(parseDotenv(fs.readFileSync(targetFile, 'utf8')))
	: {};
const environment = {
	...fileValues,
	...process.env,
	PUBLIC_URL: profile.publicUrl,
	REACT_APP_ROUTER_MODE: profile.routerMode,
};
const commands = [
	['scripts/validateFrontendEnv.cjs'],
	['scripts/checkCleanWebRoutes.cjs'],
	['scripts/checkEntitlementBoundaries.cjs'],
	['node_modules/react-scripts/bin/react-scripts.js', 'build'],
];

for (const argumentsList of commands) {
	const result = spawnSync(process.execPath, argumentsList, {
		cwd: rootDir,
		env: environment,
		stdio: 'inherit',
		windowsHide: true,
	});
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status || 1);
}
