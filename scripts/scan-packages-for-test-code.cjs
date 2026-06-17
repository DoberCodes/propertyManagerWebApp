const fs = require('fs');
const path = require('path');
const glob = require('glob');
const root = process.cwd();
const srcFiles = glob.sync('src/**/*.{js,ts,jsx,tsx}');
const pkgSet = new Set();
for (const f of srcFiles) {
	const txt = fs.readFileSync(f, 'utf8');
	const re = /from\s+['\"]([^'\"]+)['\"]/g;
	let m;
	while ((m = re.exec(txt))) {
		const spec = m[1];
		if (!spec.startsWith('.') && !spec.startsWith('/')) {
			const parts = spec.split('/');
			let pkg = parts[0];
			if (pkg.startsWith('@')) pkg = parts.slice(0, 2).join('/');
			pkgSet.add(pkg);
		}
	}
}
const pkgs = Array.from(pkgSet).sort();
const suspicious = [];
for (const pkg of pkgs) {
	try {
		const pkgJsonPath = path.join(root, 'node_modules', pkg, 'package.json');
		if (!fs.existsSync(pkgJsonPath)) continue;
		const pj = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
		const candidates = [];
		if (pj.module) candidates.push(pj.module);
		if (pj.main) candidates.push(pj.main);
		if (pj['jsnext:main']) candidates.push(pj['jsnext:main']);
		if (pj.exports) {
			if (typeof pj.exports === 'string') candidates.push(pj.exports);
			else if (typeof pj.exports === 'object') {
				for (const k of Object.keys(pj.exports))
					if (typeof pj.exports[k] === 'string') candidates.push(pj.exports[k]);
			}
		}
		for (const rel of candidates) {
			const target = path.join(
				path.dirname(pkgJsonPath),
				rel.replace('./', ''),
			);
			if (fs.existsSync(target)) {
				const content = fs.readFileSync(target, 'utf8');
				if (/@testing-library|react-dom\/test-utils|\bact\b/.test(content))
					suspicious.push({ pkg, rel });
			}
		}
	} catch (e) {
		// ignore
	}
}
console.log('scanned packages:', pkgs.length);
if (suspicious.length)
	console.log('suspicious packages:\n', JSON.stringify(suspicious, null, 2));
else console.log('no suspicious package entrypoints found');
