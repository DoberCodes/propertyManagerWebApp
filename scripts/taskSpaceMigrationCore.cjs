'use strict';

const { createHash } = require('crypto');

const OUTCOMES = Object.freeze({
	READY: 'ready',
	ALREADY_LINKED: 'already_linked',
	UNMATCHED: 'unmatched',
	AMBIGUOUS: 'ambiguous',
	MISSING_SCOPE: 'missing_scope',
});

const cleanId = (value) => String(value || '').trim();
const normalizeName = (value) =>
	String(value || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-US');

const buildPropertyKnowledgeLinkId = ({
	propertyId,
	fromType,
	fromId,
	relationshipType,
	toType,
	toId,
}) => {
	const canonical = [
		propertyId,
		fromType,
		fromId,
		relationshipType,
		toType,
		toId,
	].join('|');
	return `pkl_${createHash('sha256').update(canonical).digest('hex')}`;
};

const planLegacyTaskSpaceLinks = ({ tasks = [], spaces = [], links = [] }) => {
	const spacesByScopeAndName = new Map();
	for (const space of spaces) {
		const data = space.data || {};
		if (data.isArchived === true) continue;
		const accountId = cleanId(data.accountId);
		const propertyId = cleanId(data.propertyId);
		const name = normalizeName(data.name);
		if (!accountId || !propertyId || !name) continue;
		const key = `${accountId}|${propertyId}|${name}`;
		const matches = spacesByScopeAndName.get(key) || [];
		matches.push(space);
		spacesByScopeAndName.set(key, matches);
	}

	const existingTaskSpaceLinks = new Set(
		links
			.filter((link) => {
				const data = link.data || {};
				return (
					data.fromType === 'task' &&
					data.relationshipType === 'occurs_in' &&
					data.toType === 'space'
				);
			})
			.map((link) => `${cleanId(link.data.fromId)}|${cleanId(link.data.toId)}`),
	);

	return tasks
		.filter((task) => normalizeName(task.data?.location))
		.map((task) => {
			const data = task.data || {};
			const accountId = cleanId(data.accountId || data.userId);
			const propertyId = cleanId(data.propertyId);
			const legacyLocation = String(data.location || '').trim();
			if (!accountId || !propertyId) {
				return { taskId: task.id, legacyLocation, outcome: OUTCOMES.MISSING_SCOPE };
			}

			const matches =
				spacesByScopeAndName.get(
					`${accountId}|${propertyId}|${normalizeName(legacyLocation)}`,
				) || [];
			if (matches.length === 0) {
				return { taskId: task.id, legacyLocation, outcome: OUTCOMES.UNMATCHED };
			}
			if (matches.length > 1) {
				return {
					taskId: task.id,
					legacyLocation,
					outcome: OUTCOMES.AMBIGUOUS,
					matchingSpaceIds: matches.map((space) => space.id),
				};
			}

			const spaceId = matches[0].id;
			if (existingTaskSpaceLinks.has(`${task.id}|${spaceId}`)) {
				return {
					taskId: task.id,
					spaceId,
					legacyLocation,
					outcome: OUTCOMES.ALREADY_LINKED,
				};
			}

			return {
				taskId: task.id,
				spaceId,
				legacyLocation,
				outcome: OUTCOMES.READY,
				linkId: buildPropertyKnowledgeLinkId({
					propertyId,
					fromType: 'task',
					fromId: task.id,
					relationshipType: 'occurs_in',
					toType: 'space',
					toId: spaceId,
				}),
				link: {
					accountId,
					propertyId,
					fromType: 'task',
					fromId: task.id,
					relationshipType: 'occurs_in',
					toType: 'space',
					toId: spaceId,
					source: 'migration',
				},
			};
		});
};

module.exports = {
	OUTCOMES,
	buildPropertyKnowledgeLinkId,
	normalizeName,
	planLegacyTaskSpaceLinks,
};
