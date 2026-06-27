const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
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

const scanDirs = ['public', 'src'];

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

const mediaFiles = scanDirs
	.flatMap((dir) => walk(path.join(rootDir, dir)))
	.filter((file) => mediaExtensions.has(path.extname(file).toLowerCase()))
	.map((file) => ({
		file,
		relativePath: path.relative(rootDir, file).replace(/\\/g, '/'),
		bytes: fs.statSync(file).size,
	}))
	.sort((a, b) => b.bytes - a.bytes);

const totalBytes = mediaFiles.reduce((sum, asset) => sum + asset.bytes, 0);
const overOneMb = mediaFiles.filter((asset) => asset.bytes > 1024 * 1024);
const overFiveHundredKb = mediaFiles.filter((asset) => asset.bytes > 500 * 1024);

console.log('Media asset summary');
console.log('-------------------');
console.log(`Files: ${mediaFiles.length}`);
console.log(`Total size: ${formatBytes(totalBytes)}`);
console.log(`Over 1 MB: ${overOneMb.length}`);
console.log(`Over 500 KB: ${overFiveHundredKb.length}`);

console.log('\nLargest media assets');
console.log('--------------------');
mediaFiles.slice(0, 30).forEach((asset) => {
	console.log(`${formatBytes(asset.bytes).padStart(9)}  ${asset.relativePath}`);
});
