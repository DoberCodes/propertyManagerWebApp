#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const sourceIconPath = path.join(projectRoot, 'public', 'icons', 'icon-512.png');
const androidResRoot = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

const densities = [
	{ name: 'ldpi', launcherSize: 36, adaptiveSize: 81 },
	{ name: 'mdpi', launcherSize: 48, adaptiveSize: 108 },
	{ name: 'hdpi', launcherSize: 72, adaptiveSize: 162 },
	{ name: 'xhdpi', launcherSize: 96, adaptiveSize: 216 },
	{ name: 'xxhdpi', launcherSize: 144, adaptiveSize: 324 },
	{ name: 'xxxhdpi', launcherSize: 192, adaptiveSize: 432 },
];

const clamp = (value) => Math.max(0, Math.min(1, value));

const createWhiteLogo = async () => {
	const { data, info } = await sharp(sourceIconPath)
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const [backgroundRed, backgroundGreen, backgroundBlue] = data;
	const output = Buffer.alloc(info.width * info.height * 4);
	const backgroundChannels = [backgroundRed, backgroundGreen, backgroundBlue];

	for (let index = 0; index < data.length; index += 4) {
		const progress = backgroundChannels.map((background, channel) => {
			const range = 255 - background;
			return range === 0 ? 0 : (data[index + channel] - background) / range;
		});
		const opacity = clamp(progress.reduce((sum, value) => sum + value, 0) / 3);
		output[index] = 255;
		output[index + 1] = 255;
		output[index + 2] = 255;
		output[index + 3] = Math.round(opacity * data[index + 3]);
	}

	return {
		background: {
			r: backgroundRed,
			g: backgroundGreen,
			b: backgroundBlue,
			alpha: 1,
		},
		logo: await sharp(output, {
			raw: {
				width: info.width,
				height: info.height,
				channels: 4,
			},
		})
			.png({ compressionLevel: 9 })
			.toBuffer(),
	};
};

const createRoundMask = (size) =>
	Buffer.from(
		`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${
			size / 2
		}" r="${size / 2}" fill="white"/></svg>`,
	);

const syncIcons = async () => {
	if (!fs.existsSync(sourceIconPath)) {
		throw new Error(`Missing Android launcher source icon: ${sourceIconPath}`);
	}

	const { background, logo } = await createWhiteLogo();

	for (const density of densities) {
		const targetDirectory = path.join(androidResRoot, `mipmap-${density.name}`);
		fs.mkdirSync(targetDirectory, { recursive: true });

		const launcher = await sharp(sourceIconPath)
			.resize(density.launcherSize, density.launcherSize)
			.png({ compressionLevel: 9 })
			.toBuffer();
		const roundLogoSize = Math.round(density.launcherSize * 0.78);
		const roundLogo = await sharp(logo)
			.resize(roundLogoSize, roundLogoSize)
			.png({ compressionLevel: 9 })
			.toBuffer();

		await Promise.all([
			fs.promises.writeFile(path.join(targetDirectory, 'ic_launcher.png'), launcher),
			sharp({
				create: {
					width: density.launcherSize,
					height: density.launcherSize,
					channels: 4,
					background,
				},
			})
				.composite([
					{ input: roundLogo, gravity: 'center' },
					{ input: createRoundMask(density.launcherSize), blend: 'dest-in' },
				])
				.png({ compressionLevel: 9 })
				.toFile(path.join(targetDirectory, 'ic_launcher_round.png')),
			sharp(logo)
				.resize(density.adaptiveSize, density.adaptiveSize)
				.png({ compressionLevel: 9 })
				.toFile(path.join(targetDirectory, 'ic_launcher_foreground.png')),
			sharp({
				create: {
					width: density.adaptiveSize,
					height: density.adaptiveSize,
					channels: 4,
					background,
				},
			})
				.png({ compressionLevel: 9 })
				.toFile(path.join(targetDirectory, 'ic_launcher_background.png')),
		]);
	}

	console.log(
		`Synchronized Android launcher icons from ${path.relative(
			projectRoot,
			sourceIconPath,
		)} across ${densities.length} density buckets.`,
	);
};

syncIcons().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
