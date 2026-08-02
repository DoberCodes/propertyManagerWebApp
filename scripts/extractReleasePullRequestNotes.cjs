#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const CUSTOMER_NOTES_START = '<!-- maintley-customer-release-notes:start -->';
const CUSTOMER_NOTES_END = '<!-- maintley-customer-release-notes:end -->';
const LEGACY_CUSTOMER_NOTES_MARKER = 'Customer release notes preview:';

const extractCustomerReleaseNotes = (body, version) => {
	const normalizedBody = String(body || '').replace(/\r\n/g, '\n');
	let notes = '';
	const startIndex = normalizedBody.indexOf(CUSTOMER_NOTES_START);
	const endIndex = normalizedBody.indexOf(CUSTOMER_NOTES_END);

	if (startIndex >= 0 || endIndex >= 0) {
		if (startIndex < 0 || endIndex < 0 || endIndex <= startIndex) {
			throw new Error('Release pull request contains an incomplete customer release notes block.');
		}
		notes = normalizedBody.slice(startIndex + CUSTOMER_NOTES_START.length, endIndex);
	} else {
		const legacyIndex = normalizedBody.indexOf(LEGACY_CUSTOMER_NOTES_MARKER);
		if (legacyIndex < 0) {
			throw new Error('Release pull request does not contain customer release notes.');
		}
		notes = normalizedBody.slice(legacyIndex + LEGACY_CUSTOMER_NOTES_MARKER.length);
	}

	const normalizedNotes = notes.trim();
	const expectedHeading = `# Maintley v${version}`;
	const actualHeading = normalizedNotes.split('\n', 1)[0]?.trim();
	if (actualHeading !== expectedHeading) {
		throw new Error(
			`Release notes heading must be "${expectedHeading}", received "${actualHeading || '(missing)'}".`,
		);
	}

	return `${normalizedNotes}\n`;
};

const mergeCustomerNotesMetadata = (metadata, version, customerNotes) => ({
	...metadata,
	version,
	notes: customerNotes,
	customerNotes,
	customerNotesSource: 'release-pull-request-preview',
});

const parseArgs = (argv) => {
	const options = {
		version: '',
		output: '',
		metadataOutput: '',
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		const readValue = () => {
			const value = argv[index + 1];
			if (!value || value.startsWith('--')) {
				throw new Error(`Missing value for ${arg}`);
			}
			index += 1;
			return value;
		};

		if (arg === '--version') options.version = readValue();
		else if (arg === '--output') options.output = readValue();
		else if (arg === '--metadata-output') options.metadataOutput = readValue();
		else throw new Error(`Unknown argument: ${arg}`);
	}

	if (!/^\d+\.\d+\.\d+$/.test(options.version)) {
		throw new Error('--version must be a semantic version such as 2.13.0.');
	}
	if (!options.output) {
		throw new Error('--output is required.');
	}

	return options;
};

const writeFile = (filePath, content) => {
	fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
	fs.writeFileSync(filePath, content);
};

const main = () => {
	const options = parseArgs(process.argv.slice(2));
	const body = fs.readFileSync(0, 'utf8');
	const customerNotes = extractCustomerReleaseNotes(body, options.version);
	writeFile(options.output, customerNotes);

	if (options.metadataOutput) {
		const metadata = JSON.parse(fs.readFileSync(options.metadataOutput, 'utf8'));
		writeFile(
			options.metadataOutput,
			`${JSON.stringify(mergeCustomerNotesMetadata(metadata, options.version, customerNotes), null, 2)}\n`,
		);
	}
};

if (require.main === module) {
	try {
		main();
	} catch (error) {
		process.stderr.write(`Release pull request notes extraction failed: ${error.message}\n`);
		process.exit(1);
	}
}

module.exports = {
	CUSTOMER_NOTES_END,
	CUSTOMER_NOTES_START,
	extractCustomerReleaseNotes,
	mergeCustomerNotesMetadata,
};
