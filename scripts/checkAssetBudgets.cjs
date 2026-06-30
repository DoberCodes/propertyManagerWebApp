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

const warningThresholdMultiplier = 1.15;
let warningCount = 0;

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

const warn = (message) => {
	warningCount += 1;
	console.log(`WARN ${message}`);
};

const pass = (message) => {
	console.log(`PASS ${message}`);
};

const checkBudget = ({ label, actualBytes, budgetBytes, context = '' }) => {
	const warningLimitBytes = Math.round(budgetBytes * warningThresholdMultiplier);
	const formattedContext = context ? ` (${context})` : '';

	if (actualBytes > warningLimitBytes) {
		fail(
			`${label} ${formatBytes(actualBytes)} exceeds ${formatBytes(budgetBytes)} target and ${formatBytes(warningLimitBytes)} blocking threshold${formattedContext}`,
		);
		return;
	}

	if (actualBytes > budgetBytes) {
		warn(
			`${label} ${formatBytes(actualBytes)} exceeds ${formatBytes(budgetBytes)} target but is within the 15% release warning threshold (${formatBytes(warningLimitBytes)}). Treat frontend optimization as a top priority for the next release${formattedContext}`,
		);
		return;
	}

	pass(`${label} ${formatBytes(actualBytes)} within ${formatBytes(budgetBytes)}`);
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
} else {
	checkBudget({
		label: 'main JS gzip',
		actualBytes: mainJs.gzipBytes,
		budgetBytes: budgets.mainJsGzipBytes,
		context: mainJs.relativePath,
	});
}

const totalJsGzipBytes = jsAssets.reduce((sum, asset) => sum + asset.gzipBytes, 0);
checkBudget({
	label: 'total JS gzip',
	actualBytes: totalJsGzipBytes,
	budgetBytes: budgets.totalJsGzipBytes,
});

const totalBuildMediaBytes = mediaAssets.reduce(
	(sum, asset) => sum + asset.rawBytes,
	0,
);
checkBudget({
	label: 'build media',
	actualBytes: totalBuildMediaBytes,
	budgetBytes: budgets.totalBuildMediaBytes,
});

const largestMedia = [...mediaAssets].sort((a, b) => b.rawBytes - a.rawBytes)[0];
if (largestMedia) {
	checkBudget({
		label: 'largest media asset',
		actualBytes: largestMedia.rawBytes,
		budgetBytes: budgets.maxBuildMediaBytes,
		context: largestMedia.relativePath,
	});
}

if (process.exitCode) {
	console.error('\nAsset budget check failed.');
} else if (warningCount > 0) {
	console.log(`\nAsset budget check passed with ${warningCount} warning${warningCount === 1 ? '' : 's'}.`);
} else {
	console.log('\nAsset budget check passed.');
}
