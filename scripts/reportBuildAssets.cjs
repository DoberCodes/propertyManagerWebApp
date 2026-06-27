const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rootDir = process.cwd();
const buildDir = path.join(rootDir, 'build');
const staticDir = path.join(buildDir, 'static');

const formatBytes = (bytes) => {
	if (!Number.isFinite(bytes)) return '0 B';
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

const getAssetType = (filePath) => {
	const extension = path.extname(filePath).toLowerCase();
	if (extension === '.js') return 'js';
	if (extension === '.css') return 'css';
	if (extension === '.map') return 'map';
	if (/\.(png|jpe?g|gif|webp|avif|svg|ico)$/i.test(extension)) return 'media';
	return 'other';
};

const analyzeSourceMaps = (files) => {
	const mapFiles = files.filter((file) => file.endsWith('.js.map'));
	if (mapFiles.length === 0) return;

	const sourceSizes = new Map();
	for (const mapFile of mapFiles) {
		let parsed;
		try {
			parsed = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
		} catch {
			continue;
		}

		const sources = Array.isArray(parsed.sources) ? parsed.sources : [];
		const sourcesContent = Array.isArray(parsed.sourcesContent)
			? parsed.sourcesContent
			: [];

		sources.forEach((source, index) => {
			const content = sourcesContent[index];
			if (typeof content !== 'string') return;
			const normalizedSource = String(source).replace(/\\/g, '/');
			const packageMatch = normalizedSource.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
			const appMatch = normalizedSource.match(/webpack:\/\/[^/]+\/\.\/src\/([^/]+)/);
			const key = packageMatch
				? packageMatch[1]
				: appMatch
					? `src/${appMatch[1]}`
					: 'other';
			sourceSizes.set(key, (sourceSizes.get(key) || 0) + Buffer.byteLength(content));
		});
	}

	if (sourceSizes.size === 0) return;

	console.log('\nLargest source-map contributors');
	console.log('--------------------------------');
	[...sourceSizes.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 20)
		.forEach(([name, bytes]) => {
			console.log(`${formatBytes(bytes).padStart(9)}  ${name}`);
		});
};

if (!fs.existsSync(staticDir)) {
	console.error('No build/static directory found. Run npm run build first.');
	process.exit(1);
}

const files = walk(staticDir);
const assets = files.map((file) => {
	const buffer = fs.readFileSync(file);
	return {
		file,
		relativePath: path.relative(buildDir, file).replace(/\\/g, '/'),
		type: getAssetType(file),
		rawBytes: buffer.length,
		gzipBytes: zlib.gzipSync(buffer).length,
	};
});

const byType = new Map();
assets.forEach((asset) => {
	const current = byType.get(asset.type) || { rawBytes: 0, gzipBytes: 0, count: 0 };
	current.rawBytes += asset.rawBytes;
	current.gzipBytes += asset.gzipBytes;
	current.count += 1;
	byType.set(asset.type, current);
});

console.log('Build asset summary');
console.log('-------------------');
[...byType.entries()]
	.sort((a, b) => b[1].rawBytes - a[1].rawBytes)
	.forEach(([type, summary]) => {
		console.log(
			`${type.padEnd(6)} ${String(summary.count).padStart(3)} files  raw ${formatBytes(summary.rawBytes).padStart(9)}  gzip ${formatBytes(summary.gzipBytes).padStart(9)}`,
		);
	});

console.log('\nLargest JavaScript assets');
console.log('-------------------------');
assets
	.filter((asset) => asset.type === 'js')
	.sort((a, b) => b.gzipBytes - a.gzipBytes)
	.slice(0, 20)
	.forEach((asset) => {
		console.log(
			`${formatBytes(asset.gzipBytes).padStart(9)} gzip  ${formatBytes(asset.rawBytes).padStart(9)} raw  ${asset.relativePath}`,
		);
	});

console.log('\nLargest non-map assets');
console.log('----------------------');
assets
	.filter((asset) => asset.type !== 'map')
	.sort((a, b) => b.rawBytes - a.rawBytes)
	.slice(0, 20)
	.forEach((asset) => {
		console.log(
			`${formatBytes(asset.rawBytes).padStart(9)} raw  ${formatBytes(asset.gzipBytes).padStart(9)} gzip  ${asset.relativePath}`,
		);
	});

analyzeSourceMaps(files);
