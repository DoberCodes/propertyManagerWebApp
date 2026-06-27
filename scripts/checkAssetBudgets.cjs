const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rootDir = process.cwd();
const buildDir = path.join(rootDir, 'build');

const budgets = {
	mainJsGzipBytes: 300 * 1024,
	totalJsGzipBytes: 1024 * 1024,
	totalBuildMediaBytes: 6 * 1024 * 1024,
	maxBuildMediaBytes: 750 * 1024,
};

const mediaExtensions = new Set([
	'.avif',
	'.gif',
	'.ico',
	'.jpeg',
	'.jpg',
	'.png',
	'.svg',
	'.webp',
]);

const formatBytes = (bytes) => {
	const units = ['B', 'KB', 'MB', 'GB'];
	let value = bytes;
	let unitIndex = 0;
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024;
		unitIndex += 1;
	}
	return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const walk = (dir) => {
	if (!fs.existsSync(dir)) return [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	return entries.flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) return walk(fullPath);
		return fullPath;
	});
};

const fail = (message) => {
	console.error(`FAIL ${message}`);
	process.exitCode = 1;
};

const pass = (message) => {
	console.log(`PASS ${message}`);
};

if (!fs.existsSync(buildDir)) {
	console.error('No build directory found. Run npm run build first.');
	process.exit(1);
}

const buildFiles = walk(buildDir).filter((file) => !file.endsWith('.map'));
const jsFiles = buildFiles.filter((file) => path.extname(file).toLowerCase() === '.js');
const mediaFiles = buildFiles.filter((file) =>
	mediaExtensions.has(path.extname(file).toLowerCase()),
);

const jsAssets = jsFiles.map((file) => {
	const buffer = fs.readFileSync(file);
	return {
		file,
		relativePath: path.relative(buildDir, file).replace(/\\/g, '/'),
		rawBytes: buffer.length,
		gzipBytes: zlib.gzipSync(buffer).length,
	};
});

const mediaAssets = mediaFiles.map((file) => ({
	file,
	relativePath: path.relative(buildDir, file).replace(/\\/g, '/'),
	rawBytes: fs.statSync(file).size,
}));

const mainJs = jsAssets
	.filter((asset) => /static\/js\/main\.[^.]+\.js$/.test(asset.relativePath))
	.sort((a, b) => b.gzipBytes - a.gzipBytes)[0];

if (!mainJs) {
	fail('Could not find main JavaScript asset.');
} else if (mainJs.gzipBytes > budgets.mainJsGzipBytes) {
	fail(
		`main JS gzip ${formatBytes(mainJs.gzipBytes)} exceeds ${formatBytes(budgets.mainJsGzipBytes)} (${mainJs.relativePath})`,
	);
} else {
	pass(
		`main JS gzip ${formatBytes(mainJs.gzipBytes)} within ${formatBytes(budgets.mainJsGzipBytes)}`,
	);
}

const totalJsGzipBytes = jsAssets.reduce((sum, asset) => sum + asset.gzipBytes, 0);
if (totalJsGzipBytes > budgets.totalJsGzipBytes) {
	fail(
		`total JS gzip ${formatBytes(totalJsGzipBytes)} exceeds ${formatBytes(budgets.totalJsGzipBytes)}`,
	);
} else {
	pass(
		`total JS gzip ${formatBytes(totalJsGzipBytes)} within ${formatBytes(budgets.totalJsGzipBytes)}`,
	);
}

const totalBuildMediaBytes = mediaAssets.reduce(
	(sum, asset) => sum + asset.rawBytes,
	0,
);
if (totalBuildMediaBytes > budgets.totalBuildMediaBytes) {
	fail(
		`build media ${formatBytes(totalBuildMediaBytes)} exceeds ${formatBytes(budgets.totalBuildMediaBytes)}`,
	);
} else {
	pass(
		`build media ${formatBytes(totalBuildMediaBytes)} within ${formatBytes(budgets.totalBuildMediaBytes)}`,
	);
}

const largestMedia = [...mediaAssets].sort((a, b) => b.rawBytes - a.rawBytes)[0];
if (largestMedia && largestMedia.rawBytes > budgets.maxBuildMediaBytes) {
	fail(
		`largest media asset ${formatBytes(largestMedia.rawBytes)} exceeds ${formatBytes(budgets.maxBuildMediaBytes)} (${largestMedia.relativePath})`,
	);
} else if (largestMedia) {
	pass(
		`largest media asset ${formatBytes(largestMedia.rawBytes)} within ${formatBytes(budgets.maxBuildMediaBytes)} (${largestMedia.relativePath})`,
	);
}

if (process.exitCode) {
	console.error('\nAsset budget check failed.');
} else {
	console.log('\nAsset budget check passed.');
}
