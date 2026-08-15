import {
	addMaintleyRelationshipEvidence,
	getMaintleyRelationshipEvidence,
} from './relationshipEvidence';
import { runMaintleyIntelligence } from './engine';
import {
	MaintleyFinding,
	MaintleyIntelligenceContext,
} from './types';

const finding: MaintleyFinding = {
	id: 'finding-1',
	ruleId: 'test-rule',
	propertyId: 'property-1',
	affectedSystemIds: ['equipment-1'],
	category: 'Maintenance Opportunities',
	severity: 'medium',
	priority: 'medium',
	source: 'property_memory',
	title: 'Review connected records',
	description: 'Maintley found an opportunity.',
	whyItMatters: 'Connected records add useful context.',
	suggestedActionLabel: 'Review',
	suggestedActionType: 'review_setup',
	requiredPlan: 'homeowner',
	requiredCapabilities: [],
	metadata: { taskId: 'task-1' },
	createdAt: '2026-08-02T12:00:00.000Z',
};

const context = {
	property: { id: 'property-1' },
	assets: [{ id: 'equipment-1', name: 'Furnace' }],
	systems: [{ id: 'equipment-1', name: 'Furnace' }],
	tasks: [{ id: 'task-1', title: 'Replace filter' }],
	maintenanceHistory: [],
	documents: [
		{ id: 'document-1', name: 'HVAC manual.pdf' },
		{ id: 'document-2', name: 'Filter instructions.pdf' },
	],
	files: [],
	spaces: [
		{ id: 'space-1', name: 'Mechanical Room', isArchived: false },
		{ id: 'space-archived', name: 'Old Utility Room', isArchived: true },
	],
	supplies: [
		{ id: 'supply-1', name: '20x25 HVAC Filter', isArchived: false },
		{ id: 'supply-archived', name: 'Old Filter', isArchived: true },
	],
	propertyKnowledgeLinks: [
		{
			id: 'link-equipment-space',
			propertyId: 'property-1',
			fromType: 'equipment',
			fromId: 'equipment-1',
			relationshipType: 'located_in',
			toType: 'space',
			toId: 'space-1',
			source: 'manual',
		},
		{
			id: 'link-task-space',
			propertyId: 'property-1',
			fromType: 'task',
			fromId: 'task-1',
			relationshipType: 'occurs_in',
			toType: 'space',
			toId: 'space-1',
			source: 'manual',
		},
		{
			id: 'link-equipment-supply',
			propertyId: 'property-1',
			fromType: 'equipment',
			fromId: 'equipment-1',
			relationshipType: 'uses',
			toType: 'supply',
			toId: 'supply-1',
			source: 'manual',
		},
		{
			id: 'link-equipment-document',
			propertyId: 'property-1',
			fromType: 'document',
			fromId: 'document-1',
			relationshipType: 'documents',
			toType: 'equipment',
			toId: 'equipment-1',
			source: 'document_review',
		},
		{
			id: 'link-task-document',
			propertyId: 'property-1',
			fromType: 'document',
			fromId: 'document-2',
			relationshipType: 'documents',
			toType: 'task',
			toId: 'task-1',
			source: 'document_review',
		},
		{
			id: 'link-archived-space',
			propertyId: 'property-1',
			fromType: 'equipment',
			fromId: 'equipment-1',
			relationshipType: 'located_in',
			toType: 'space',
			toId: 'space-archived',
			source: 'manual',
		},
		{
			id: 'link-other-property',
			propertyId: 'property-2',
			fromType: 'equipment',
			fromId: 'equipment-1',
			relationshipType: 'uses',
			toType: 'supply',
			toId: 'supply-1',
			source: 'manual',
		},
	],
	capabilities: {},
	currentDate: new Date('2026-08-02T12:00:00.000Z'),
	baselineVersion: 'test',
	createdAt: '2026-08-02T12:00:00.000Z',
} as unknown as MaintleyIntelligenceContext;

describe('Maintley relationship evidence', () => {
	it('turns accepted connected records into deterministic supporting evidence', () => {
		expect(
			getMaintleyRelationshipEvidence(finding, context).map(
				(item) => item.label,
			),
		).toEqual([
			'Applies to Mechanical Room',
			'Located in Mechanical Room',
			'Supported by Filter instructions.pdf',
			'Supported by HVAC manual.pdf',
			'Uses 20x25 HVAC Filter',
		]);
	});

	it('adds evidence to metadata without changing recommendation behavior', () => {
		const enriched = addMaintleyRelationshipEvidence(finding, context);

		expect(enriched).toMatchObject({
			...finding,
			metadata: {
				taskId: 'task-1',
				relationshipEvidence: expect.any(Array),
			},
		});
		expect(enriched.priority).toBe(finding.priority);
		expect(enriched.source).toBe(finding.source);
		expect(enriched.suggestedActionType).toBe(finding.suggestedActionType);
	});

	it('does not add metadata when a finding has no affected connected records', () => {
		const unrelatedFinding = {
			...finding,
			affectedSystemIds: ['equipment-2'],
			metadata: {},
		};

		expect(addMaintleyRelationshipEvidence(unrelatedFinding, context)).toBe(
			unrelatedFinding,
		);
	});

	it('enriches engine results after rules run without changing their priority', () => {
		const result = runMaintleyIntelligence(
			{
				property: context.property,
				systems: context.systems,
				tasks: context.tasks,
				maintenanceHistory: [],
				documents: context.documents,
				spaces: context.spaces,
				supplies: context.supplies,
				propertyKnowledgeLinks: context.propertyKnowledgeLinks,
				createdAt: context.createdAt,
			},
			[
				{
					id: 'test-rule',
					evaluate: () => [finding],
				},
			],
		);

		expect(result.findings).toHaveLength(1);
		expect(result.findings[0].priority).toBe('medium');
		expect(result.findings[0].metadata.relationshipEvidence).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ label: 'Located in Mechanical Room' }),
			]),
		);
	});
});
