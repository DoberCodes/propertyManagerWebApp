/**
 * Generate Release Notes from Git Commits
 *
 * This script generates release notes by analyzing git commits since the last version tag.
 * It categorizes commits and suggests a new version number based on conventional commits.
 *
 * Usage: node scripts/generateReleaseNotes.cjs [currentVersion]
 * Example: node scripts/generateReleaseNotes.cjs 1.0.0
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getGitCommits(fromTag) {
	try {
		let command;
		if (fromTag) {
			command = `git log ${fromTag}..HEAD --pretty=format:"%s|||%an|||%ai"`;
		} else {
			// Get last 20 commits if no tag found
			command = 'git log -20 --pretty=format:"%s|||%an|||%ai"';
		}

		const output = execSync(command, { encoding: 'utf-8' }).trim();
		if (!output) return [];

		return output.split('\n').map((line) => {
			const [subject, author, date] = line.split('|||');
			return { subject, author, date };
		});
	} catch (error) {
		console.warn('⚠️  Could not retrieve git commits:', error.message);
		return [];
	}
}

function getLatestTag() {
	try {
		return execSync('git describe --tags --abbrev=0', {
			encoding: 'utf-8',
		}).trim();
	} catch (error) {
		return null;
	}
}

function parseVersion(version) {
	const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
	if (!match) return null;
	return {
		major: parseInt(match[1]),
		minor: parseInt(match[2]),
		patch: parseInt(match[3]),
	};
}

function incrementVersion(version, type) {
	const v = parseVersion(version);
	if (!v) return null;

	switch (type) {
		case 'major':
			return `${v.major + 1}.0.0`;
		case 'minor':
			return `${v.major}.${v.minor + 1}.0`;
		case 'patch':
		default:
			return `${v.major}.${v.minor}.${v.patch + 1}`;
	}
}

function categorizeCommits(commits) {
	const categories = {
		breaking: [],
		features: [],
		fixes: [],
		improvements: [],
		other: [],
	};

	let versionBumpType = 'patch';

	commits.forEach((commit) => {
		const subject = commit.subject.toLowerCase();

		// Breaking changes
		if (subject.includes('breaking') || subject.includes('!:')) {
			categories.breaking.push(commit);
			versionBumpType = 'major';
		}
		// Features
		else if (subject.match(/^feat(\(.*?\))?:/)) {
			categories.features.push(commit);
			if (versionBumpType !== 'major') versionBumpType = 'minor';
		}
		// Fixes
		else if (subject.match(/^fix(\(.*?\))?:/)) {
			categories.fixes.push(commit);
		}
		// Improvements/refactor/perf
		else if (subject.match(/^(refactor|perf|improve|chore)(\(.*?\))?:/)) {
			categories.improvements.push(commit);
		}
		// Other
		else {
			categories.other.push(commit);
		}
	});

	return { categories, versionBumpType };
}

function formatCommitSubject(subject) {
	// Remove conventional commit prefix and clean up
	return subject
		.replace(
			/^(feat|fix|refactor|perf|improve|chore|docs|style|test|build|ci|release)(\(.*?\))?:\s*/i,
			'',
		)
		.replace(/^[a-z]/, (c) => c.toUpperCase());
}

function generateReleaseNotes(commits, currentVersion) {
	if (commits.length === 0) {
		return 'No new changes since last release.';
	}

	const { categories, versionBumpType } = categorizeCommits(commits);
	const suggestedVersion = incrementVersion(currentVersion, versionBumpType);

	let notes = [];

	// Add breaking changes
	if (categories.breaking.length > 0) {
		notes.push('⚠️ BREAKING CHANGES:');
		categories.breaking.forEach((commit) => {
			notes.push(`  • ${formatCommitSubject(commit.subject)}`);
		});
		notes.push('');
	}

	// Add new features
	if (categories.features.length > 0) {
		notes.push('✨ New Features:');
		categories.features.forEach((commit) => {
			notes.push(`  • ${formatCommitSubject(commit.subject)}`);
		});
		notes.push('');
	}

	// Add bug fixes
	if (categories.fixes.length > 0) {
		notes.push('🐛 Bug Fixes:');
		categories.fixes.forEach((commit) => {
			notes.push(`  • ${formatCommitSubject(commit.subject)}`);
		});
		notes.push('');
	}

	// Add improvements
	if (categories.improvements.length > 0) {
		notes.push('🔧 Improvements:');
		categories.improvements.forEach((commit) => {
			notes.push(`  • ${formatCommitSubject(commit.subject)}`);
		});
		notes.push('');
	}

	// Add other changes
	if (categories.other.length > 0) {
		notes.push('📝 Other Changes:');
		categories.other.forEach((commit) => {
			notes.push(`  • ${formatCommitSubject(commit.subject)}`);
		});
		notes.push('');
	}

	return {
		releaseNotes: notes.join('\n').trim(),
		suggestedVersion,
		versionBumpType,
	};
}

function main() {
	console.log('🔍 Analyzing git commits for release notes...\n');

	// Get current version from package.json or argument
	let currentVersion = process.argv[2];
	if (!currentVersion) {
		try {
			const packageJson = JSON.parse(
				fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'),
			);
			currentVersion = packageJson.version;
		} catch (error) {
			currentVersion = '1.0.0';
		}
	}

	console.log(`📦 Current version: ${currentVersion}`);

	// Get git commits
	const latestTag = getLatestTag();
	console.log(`🏷️  Latest git tag: ${latestTag || 'none found'}\n`);

	const commits = getGitCommits(latestTag);

	if (commits.length === 0) {
		console.log('ℹ️  No commits found since last release.');
		console.log(
			'\nSuggested version:',
			incrementVersion(currentVersion, 'patch'),
		);
		console.log('Release notes:', 'Minor updates and maintenance.');
		return;
	}

	console.log(`📊 Found ${commits.length} commits since last release\n`);

	const result = generateReleaseNotes(commits, currentVersion);

	console.log('─'.repeat(60));
	console.log(
		`🎯 Suggested version: ${result.suggestedVersion} (${result.versionBumpType} bump)`,
	);
	console.log('─'.repeat(60));
	console.log('\n📝 Generated Release Notes:\n');
	console.log(result.releaseNotes);
	console.log('\n' + '─'.repeat(60));

	// Write to a file for easy copying
	const outputPath = path.join(__dirname, '..', 'RELEASE_NOTES.txt');
	fs.writeFileSync(outputPath, result.releaseNotes, 'utf-8');
	console.log(`\n✅ Release notes saved to: RELEASE_NOTES.txt`);

	// Output JSON for script consumption
	console.log('\n📄 JSON Output:');
	console.log(
		JSON.stringify(
			{
				version: result.suggestedVersion,
				notes: result.releaseNotes,
				bumpType: result.versionBumpType,
			},
			null,
			2,
		),
	);
}

main();
