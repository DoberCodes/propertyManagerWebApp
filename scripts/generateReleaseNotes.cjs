/**
 * Generate Release Notes from Git Commits
 *
 * This script generates release notes by analyzing git commits since the last version tag.
 * It categorizes commits and suggests a new version number based on conventional commits.
 *
 * Usage: node scripts/generateReleaseNotes.cjs [currentVersion]
 * Example: node scripts/generateReleaseNotes.cjs 1.0.0
 */

require('dotenv').config();

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const packageJson = require(path.resolve('./package.json'));

const octokit = new Octokit({
	auth: process.env.GITHUB_TOKEN, // Ensure you have a GitHub token set in your environment variables
});

const owner = 'DoberCodes';
const repo = 'propertyManagerWebApp';

async function getCommitsFromPullRequests() {
	try {
		const { data: pullRequests } = await octokit.pulls.list({
			owner,
			repo,
			state: 'closed',
			per_page: 100,
		});

		return pullRequests
			.filter((pr) => pr.merged_at !== null) // Only merged PRs
			.map((pr) => ({
				sha: pr.merge_commit_sha,
				message: pr.title, // Use PR title as the commit message
				author: pr.user.login,
				date: pr.merged_at,
			}));
	} catch (error) {
		console.error('Error fetching pull requests:', error);
		return [];
	}
}

async function calculateNextVersion(currentVersion, commits) {
	const [major, minor, patch] = currentVersion.split('.').map(Number);
	let newMajor = major;
	let newMinor = minor;
	let newPatch = patch;

	commits.forEach((commit) => {
		const message = commit.message.toLowerCase();
		if (message.includes('breaking change:')) {
			newMajor += 1;
			newMinor = 0; // Reset minor and patch when major is incremented
			newPatch = 0;
		} else if (message.startsWith('feature:')) {
			newMinor += 1;
			newPatch = 0; // Reset patch when minor is incremented
		} else if (message.startsWith('fix:')) {
			newPatch += 1;
		}
	});

	return `${newMajor}.${newMinor}.${newPatch}`;
}

async function getCommitsSinceLastTag() {
	try {
		// Fetch the latest release tag
		const { data: releases } = await octokit.repos.listTags({
			owner,
			repo,
			per_page: 1,
		});

		if (releases.length === 0) {
			console.error('No tags found in the repository.');
			return [];
		}

		const latestTag = releases[0].name;

		// Fetch the commit associated with the latest tag
		const { data: tagCommit } = await octokit.repos.getCommit({
			owner,
			repo,
			ref: latestTag,
		});

		const latestTagDate = new Date(tagCommit.commit.author.date);

		// Fetch all commits and filter by date
		const { data: commits } = await octokit.repos.listCommits({
			owner,
			repo,
			per_page: 100,
		});

		const filteredCommits = commits
			.map((commit) => ({
				sha: commit.sha,
				message: commit.commit.message,
				author: commit.commit.author.name,
				date: commit.commit.author.date,
			}))
			.filter((commit) => new Date(commit.date) > latestTagDate);

		// Filter out `release:` commits
		const finalCommits = filteredCommits.filter(
			(commit) => !commit.message.toLowerCase().startsWith('release:'),
		);

		// Log filtered commits for debugging
		console.log('Filtered Commits:', finalCommits);

		return finalCommits;
	} catch (error) {
		console.error('Error fetching commits:', error);
		return [];
	}
}

async function generateReleaseNotes() {
	const commits = await getCommitsSinceLastTag();

	if (commits.length === 0) {
		console.log('No commits found since the last tag.');
		return;
	}

	// Calculate the next version
	const nextVersion = await calculateNextVersion(packageJson.version, commits);

	// Categorize commits
	const features = [];
	const fixes = [];
	const chores = [];

	commits.forEach((commit) => {
		if (commit.message.toLowerCase().startsWith('feature:')) {
			features.push(commit);
		} else if (commit.message.toLowerCase().startsWith('fix:')) {
			fixes.push(commit);
		} else {
			chores.push(commit);
		}
	});

	// Generate friendly release notes
	let releaseNotes = `🎉 **Release Notes for Version ${nextVersion}** 🎉\n\n`;

	if (features.length > 0) {
		releaseNotes += `## 🚀 New Features\n`;
		features.forEach((commit) => {
			releaseNotes += `- ${commit.message.replace('feature:', '').trim()} (${commit.author})\n`;
		});
		releaseNotes += `\n`;
	}

	if (fixes.length > 0) {
		releaseNotes += `## 🐛 Bug Fixes\n`;
		fixes.forEach((commit) => {
			releaseNotes += `- ${commit.message.replace('fix:', '').trim()} (${commit.author})\n`;
		});
		releaseNotes += `\n`;
	}

	if (chores.length > 0) {
		releaseNotes += `## 🛠️ Other Changes\n`;
		chores.forEach((commit) => {
			releaseNotes += `- ${commit.message.trim()} (${commit.author})\n`;
		});
	}

	fs.writeFileSync('RELEASE_NOTES.txt', releaseNotes);
	console.log('Release notes generated successfully.');

	// Output JSON with version and notes
	console.log('JSON Output:');
	console.log(
		JSON.stringify(
			{
				version: nextVersion,
				notes: releaseNotes,
			},
			null,
			2,
		),
	);
}

generateReleaseNotes();
