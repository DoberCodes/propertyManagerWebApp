import type {
	PropertySpace,
	PropertySpaceSource,
	PropertySpaceType,
} from '../types/Space.types';
import type { PropertySetupAreaId } from '../utils/propertySetupAssistant';

export type GeneratedPropertySpaceTemplate = {
	generationKey: string;
	name: string;
	type: PropertySpaceType;
	sortOrder: number;
};

export type GeneratedPropertySpacePlan = {
	template: GeneratedPropertySpaceTemplate;
	status: 'reuse' | 'create' | 'archived_conflict';
	space?: PropertySpace;
};

const normalizeName = (value: string) =>
	value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const normalizeWholeCount = (value: unknown) =>
	Math.max(0, Math.floor(Number(value) || 0));

export const hasValidBedroomCount = (value: unknown): boolean => {
	const count = Number(value);
	return Number.isFinite(count) && count >= 0 && count === Math.floor(count);
};

export const hasValidBathroomCount = (value: unknown): boolean => {
	const count = Number(value);
	return Number.isFinite(count) && count >= 0 && count * 2 === Math.floor(count * 2);
};

export const buildPropertyProfileSpaceTemplates = ({
	bedrooms,
	bathrooms,
}: {
	bedrooms?: number | null;
	bathrooms?: number | null;
}): GeneratedPropertySpaceTemplate[] => {
	const bedroomCount = normalizeWholeCount(bedrooms);
	const bathroomCount = Math.max(0, Number(bathrooms) || 0);
	const fullBathroomCount = Math.floor(bathroomCount);
	const halfBathroomCount = bathroomCount - fullBathroomCount >= 0.5 ? 1 : 0;
	const templates: GeneratedPropertySpaceTemplate[] = [];

	for (let index = 1; index <= bedroomCount; index += 1) {
		templates.push({
			generationKey: `bedroom:${index}`,
			name: `Bedroom ${index}`,
			type: 'interior',
			sortOrder: 100 + index,
		});
	}

	for (let index = 1; index <= fullBathroomCount; index += 1) {
		templates.push({
			generationKey: `bathroom:${index}`,
			name: `Bathroom ${index}`,
			type: 'interior',
			sortOrder: 200 + index,
		});
	}

	if (halfBathroomCount > 0) {
		templates.push({
			generationKey: 'half-bathroom:1',
			name: 'Half Bathroom 1',
			type: 'interior',
			sortOrder: 250,
		});
	}

	return templates;
};

const SETUP_AREA_SPACE_TEMPLATES: Partial<
	Record<PropertySetupAreaId, GeneratedPropertySpaceTemplate[]>
> = {
	kitchen: [
		{
			generationKey: 'setup:kitchen',
			name: 'Kitchen',
			type: 'interior',
			sortOrder: 10,
		},
	],
	laundry: [
		{
			generationKey: 'setup:laundry',
			name: 'Laundry Room',
			type: 'utility',
			sortOrder: 20,
		},
	],
	garage: [
		{
			generationKey: 'setup:garage',
			name: 'Garage',
			type: 'storage',
			sortOrder: 30,
		},
	],
	exterior: [
		{
			generationKey: 'setup:exterior',
			name: 'Exterior',
			type: 'exterior',
			sortOrder: 40,
		},
	],
};

export const getSetupAreaSpaceTemplates = (
	areaId: PropertySetupAreaId,
	property: { bathrooms?: number | null },
): GeneratedPropertySpaceTemplate[] => {
	if (areaId === 'bathrooms') {
		const bathrooms = buildPropertyProfileSpaceTemplates({
			bathrooms: property.bathrooms,
		}).filter((template) => template.generationKey.includes('bathroom'));
		return bathrooms.length > 0
			? bathrooms
			: [
					{
						generationKey: 'bathroom:1',
						name: 'Bathroom 1',
						type: 'interior',
						sortOrder: 201,
					},
				];
	}

	return SETUP_AREA_SPACE_TEMPLATES[areaId] || [];
};

export const planGeneratedPropertySpaces = (
	templates: GeneratedPropertySpaceTemplate[],
	existingSpaces: PropertySpace[],
): GeneratedPropertySpacePlan[] =>
	templates.map((template) => {
		const generationMatch = existingSpaces.find(
			(space) => space.generationKey === template.generationKey,
		);
		const nameMatch = existingSpaces.find(
			(space) =>
				space.type === template.type &&
				normalizeName(space.name) === normalizeName(template.name),
		);
		const match = generationMatch || nameMatch;

		if (!match) return { template, status: 'create' };
		return {
			template,
			status: match.isArchived ? 'archived_conflict' : 'reuse',
			space: match,
		};
	});

export const ensureGeneratedPropertySpaces = async ({
	accountId,
	propertyId,
	templates,
	existingSpaces,
	source,
	createSpace,
}: {
	accountId: string;
	propertyId: string;
	templates: GeneratedPropertySpaceTemplate[];
	existingSpaces: PropertySpace[];
	source: Extract<PropertySpaceSource, 'property_profile' | 'setup_assistant'>;
	createSpace: (input: {
		accountId: string;
		propertyId: string;
		name: string;
		type: PropertySpaceType;
		sortOrder: number;
		generationKey: string;
		source: PropertySpaceSource;
	}) => Promise<PropertySpace>;
}) => {
	const plan = planGeneratedPropertySpaces(templates, existingSpaces);
	const spacesByGenerationKey = new Map<string, PropertySpace>();
	const created: PropertySpace[] = [];
	const reused: PropertySpace[] = [];
	const archivedConflicts: GeneratedPropertySpacePlan[] = [];

	for (const entry of plan) {
		if (entry.status === 'archived_conflict') {
			archivedConflicts.push(entry);
			continue;
		}
		if (entry.status === 'reuse' && entry.space) {
			reused.push(entry.space);
			spacesByGenerationKey.set(entry.template.generationKey, entry.space);
			continue;
		}

		const createdSpace = await createSpace({
			accountId,
			propertyId,
			...entry.template,
			source,
		});
		created.push(createdSpace);
		spacesByGenerationKey.set(entry.template.generationKey, createdSpace);
	}

	return { created, reused, archivedConflicts, spacesByGenerationKey };
};
