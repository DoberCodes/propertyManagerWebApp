// Syncs CURRENT_APP_VERSION in src/utils/versionCheck.ts with client/package.json version
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../client/package.json');
const versionCheckPath = path.join(__dirname, '../src/utils/versionCheck.ts');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const pkgVersion = pkg.version;

let versionCheck = fs.readFileSync(versionCheckPath, 'utf8');

const versionRegex = /const CURRENT_APP_VERSION = ['"`]([\d.]+)['"`];/;

if (!versionRegex.test(versionCheck)) {
	console.error('Could not find CURRENT_APP_VERSION in versionCheck.ts');
	process.exit(1);
}

versionCheck = versionCheck.replace(
	versionRegex,
	`const CURRENT_APP_VERSION = '${pkgVersion}';`,
);

fs.writeFileSync(versionCheckPath, versionCheck, 'utf8');
console.log(`✓ Synced CURRENT_APP_VERSION to ${pkgVersion}`);
