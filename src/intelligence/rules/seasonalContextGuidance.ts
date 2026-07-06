import { Device } from '../../types/Property.types';
import { getBaselineDefinitionForAsset } from '../baselineCareLibrary';
import { MaintleyIntelligenceRule } from '../types';
import {
	getAssetDisplayName,
	getMaintenanceHistoryDate,
	getMaintenanceHistoryText,
	isTaskOpen,
	makeFinding,
	normalizeText,
} from './helpers';
import { getDeviceAssetType } from '../../utils/systemTypes';

type MaintleySeason = 'spring' | 'summer' | 'fall' | 'winter';

type SeasonalTaskDefinition = {
	id: string;
	season: MaintleySeason;
	title: string;
	description: string;
	whyItMatters: string;
	category: string;
	priority: 'Low' | 'Medium' | 'High';
	severity: 'low' | 'medium' | 'high';
	rank: number;
	matchTerms: string[];
	assetTypeHints?: string[];
};

const SEASON_LABELS: Record<MaintleySeason, string> = {
	spring: 'spring',
	summer: 'summer',
	fall: 'fall',
	winter: 'winter',
};

const SEASONAL_TASKS: SeasonalTaskDefinition[] = [
	{
		id: 'summer-roof-gutter-review',
		season: 'summer',
		title: 'Inspect roof and clear gutters before summer storms',
		description:
			'Look for loose shingles, damaged flashing, roof debris, and clogged gutters or downspouts.',
		whyItMatters:
			'Summer storms can turn small roof or gutter issues into leaks, overflow, siding damage, or foundation problems. This gives the home record a clear seasonal exterior check.',
		category: 'Exterior',
		priority: 'High',
		severity: 'high',
		rank: 10,
		matchTerms: ['roof', 'gutter', 'gutters', 'downspout', 'storm'],
		assetTypeHints: ['Roof', 'Gutter System'],
	},
	{
		id: 'summer-hvac-readiness',
		season: 'summer',
		title: 'Check air conditioning filters and outdoor unit airflow',
		description:
			'Check or replace filters, clear leaves and debris around the outdoor unit, and note any unusual noise or reduced cooling.',
		whyItMatters:
			'Cooling systems work harder in summer. Capturing this check helps prevent forgotten maintenance and creates useful context if cooling performance changes later.',
		category: 'HVAC',
		priority: 'High',
		severity: 'high',
		rank: 20,
		matchTerms: ['hvac', 'air conditioner', 'ac', 'filter', 'outdoor unit'],
		assetTypeHints: ['HVAC'],
	},
	{
		id: 'summer-exterior-seal-check',
		season: 'summer',
		title: 'Seal exterior gaps around windows and doors',
		description:
			'Inspect windows, doors, siding transitions, and wall openings for gaps that let heat, moisture, or insects in.',
		whyItMatters:
			'Sealing small gaps can help comfort, pest control, and energy use while preserving a record of exterior upkeep.',
		category: 'Exterior',
		priority: 'Medium',
		severity: 'medium',
		rank: 30,
		matchTerms: ['window', 'door', 'siding', 'seal', 'caulk', 'gap'],
		assetTypeHints: ['Windows', 'Doors', 'Siding'],
	},
	{
		id: 'summer-lawn-equipment',
		season: 'summer',
		title: 'Service lawn equipment before peak summer use',
		description:
			'Check mower blades, trimmer line, batteries, fuel, oil, and worn parts before lawn care is in full swing.',
		whyItMatters:
			'Lawn equipment is easy to ignore until it fails. A seasonal task keeps outdoor maintenance ready and traceable.',
		category: 'Outdoor',
		priority: 'Medium',
		severity: 'medium',
		rank: 40,
		matchTerms: ['lawn', 'mower', 'trimmer', 'outdoor equipment'],
		assetTypeHints: ['Outdoor Equipment'],
	},
	{
		id: 'summer-sprinkler-review',
		season: 'summer',
		title: 'Test sprinkler coverage and adjust heads',
		description:
			'Run each sprinkler zone, look for dry spots or overspray, and adjust heads before heavy summer watering.',
		whyItMatters:
			'Testing irrigation early helps avoid wasted water, missed coverage, and landscaping stress during hotter weather.',
		category: 'Outdoor',
		priority: 'Medium',
		severity: 'medium',
		rank: 50,
		matchTerms: ['sprinkler', 'irrigation', 'watering'],
		assetTypeHints: ['Irrigation'],
	},
	{
		id: 'summer-tree-trim-review',
		season: 'summer',
		title: 'Trim branches away from the home before summer storms',
		description:
			'Look for branches touching the roof, siding, windows, gutters, service lines, or walkways.',
		whyItMatters:
			'Overgrown branches can cause damage during storms and can make roof, gutter, and siding issues easier to miss.',
		category: 'Exterior',
		priority: 'Medium',
		severity: 'medium',
		rank: 60,
		matchTerms: ['tree', 'branch', 'shrub', 'landscaping'],
	},
	{
		id: 'summer-deck-fence-review',
		season: 'summer',
		title: 'Review deck and fence condition for summer use',
		description:
			'Check for loose boards, damaged fence sections, worn stain or sealant, and areas that need cleaning.',
		whyItMatters:
			'Outdoor spaces get more use in summer. Recording condition and repairs makes future maintenance easier to plan.',
		category: 'Exterior',
		priority: 'Medium',
		severity: 'medium',
		rank: 70,
		matchTerms: ['deck', 'fence', 'patio', 'porch', 'stain', 'sealant'],
		assetTypeHints: ['Deck', 'Fence', 'Patio', 'Porch'],
	},
	{
		id: 'summer-outdoor-lighting',
		season: 'summer',
		title: 'Check outdoor lighting around entries and paths',
		description:
			'Clean fixtures, replace burnt-out bulbs, and confirm entrances, walkways, and outdoor gathering areas are lit.',
		whyItMatters:
			'Outdoor lighting affects safety, security, and evening use. A quick seasonal check keeps the record current.',
		category: 'Exterior',
		priority: 'Low',
		severity: 'low',
		rank: 80,
		matchTerms: ['outdoor lighting', 'light', 'pathway', 'entry'],
	},
	{
		id: 'summer-window-screen-review',
		season: 'summer',
		title: 'Inspect window screens before bug season peaks',
		description:
			'Check screens for tears, loose frames, or missing sections before relying on open windows.',
		whyItMatters:
			'Window screens are small, but they affect comfort, ventilation, and pest control during warmer months.',
		category: 'Exterior',
		priority: 'Low',
		severity: 'low',
		rank: 90,
		matchTerms: ['screen', 'window screen', 'windows'],
		assetTypeHints: ['Windows'],
	},
	{
		id: 'summer-humidity-review',
		season: 'summer',
		title: 'Monitor indoor humidity during summer heat',
		description:
			'Check indoor humidity levels and note any rooms that feel damp, musty, or unusually humid.',
		whyItMatters:
			'Humidity patterns can point to comfort, ventilation, or moisture issues worth tracking over time.',
		category: 'Home Comfort',
		priority: 'Low',
		severity: 'low',
		rank: 100,
		matchTerms: ['humidity', 'moisture', 'damp', 'musty'],
	},
];

const getCurrentSeason = (date: Date): MaintleySeason => {
	const month = date.getMonth();
	if (month >= 2 && month <= 4) return 'spring';
	if (month >= 5 && month <= 7) return 'summer';
	if (month >= 8 && month <= 10) return 'fall';
	return 'winter';
};

const historyReferencesSystem = (history: any, systemId: string): boolean => {
	const deviceId = String(history?.deviceId || history?.systemId || '');
	const deviceIds = Array.isArray(history?.deviceIds)
		? history.deviceIds.map(String)
		: [];
	const taskDeviceIds = Array.isArray(history?.devices)
		? history.devices.map(String)
		: [];

	return (
		deviceId === systemId ||
		deviceIds.includes(systemId) ||
		taskDeviceIds.includes(systemId)
	);
};

const taskReferencesSystem = (task: any, systemId?: string): boolean => {
	if (!systemId) return true;
	const deviceIds = Array.isArray(task?.devices)
		? task.devices.map(String)
		: [];
	const legacyDeviceId = String(task?.deviceId || '').trim();
	return deviceIds.includes(systemId) || legacyDeviceId === systemId;
};

const textIncludesAny = (text: string, terms: string[]): boolean =>
	terms.some((term) => text.includes(normalizeText(term)));

const hasRecentSeasonalHistory = (
	system: Device | null,
	maintenanceHistory: any[],
	seasonStart: Date,
	definition: SeasonalTaskDefinition,
): boolean =>
	maintenanceHistory.some((record) => {
		const recordDate = getMaintenanceHistoryDate(record);
		if (!recordDate || recordDate < seasonStart) return false;
		if (system && !historyReferencesSystem(record, system.id)) return false;
		return textIncludesAny(getMaintenanceHistoryText(record), definition.matchTerms);
	});

const hasOpenSeasonalTask = (
	system: Device | null,
	tasks: any[],
	definition: SeasonalTaskDefinition,
): boolean =>
	tasks.some((task) => {
		if (!isTaskOpen(task) || !taskReferencesSystem(task, system?.id)) return false;
		const taskText = normalizeText([task.title, task.description, task.notes, task.category]
			.filter(Boolean)
			.join(' '));
		return textIncludesAny(taskText, definition.matchTerms);
	});

const getSeasonStart = (date: Date, season: MaintleySeason): Date => {
	const year = date.getFullYear();
	switch (season) {
		case 'spring':
			return new Date(year, 2, 1);
		case 'summer':
			return new Date(year, 5, 1);
		case 'fall':
			return new Date(year, 8, 1);
		case 'winter':
			return new Date(date.getMonth() <= 1 ? year - 1 : year, 11, 1);
		default:
			return new Date(year, 0, 1);
	}
};

const getSuggestedDueDate = (date: Date): string => {
	const dueDate = new Date(date);
	dueDate.setDate(dueDate.getDate() + 14);
	return dueDate.toISOString().split('T')[0];
};

const getSystemMatchScore = (
	system: Device,
	definition: SeasonalTaskDefinition,
): number => {
	const baseline = getBaselineDefinitionForAsset(system);
	const assetType = getDeviceAssetType(system) || baseline?.assetType || '';
	const assetText = normalizeText([
		assetType,
		baseline?.assetType,
		system.type,
		system.assetType,
		system.assetVariant,
		system.brand,
		system.model,
	].filter(Boolean).join(' '));
	const hintScore = (definition.assetTypeHints || []).some((hint) =>
		normalizeText(hint) === normalizeText(assetType) ||
		assetText.includes(normalizeText(hint)),
	)
		? 2
		: 0;
	const termScore = definition.matchTerms.some((term) =>
		assetText.includes(normalizeText(term)),
	)
		? 1
		: 0;
	return hintScore + termScore;
};

const findBestSystemForSeasonalTask = (
	systems: Device[],
	definition: SeasonalTaskDefinition,
): Device | null => {
	const matches = systems
		.map((system) => ({
			system,
			score: getSystemMatchScore(system, definition),
		}))
		.filter((candidate) => candidate.score > 0)
		.sort((left, right) => right.score - left.score);

	return matches[0]?.system || null;
};

export const seasonalContextGuidanceRule: MaintleyIntelligenceRule = {
	id: 'seasonal-context-guidance',
	evaluate: (context) => {
		const season = getCurrentSeason(context.currentDate);
		const seasonStart = getSeasonStart(context.currentDate, season);
		const seasonLabel = SEASON_LABELS[season];

		return SEASONAL_TASKS
			.filter((definition) => definition.season === season)
			.flatMap((definition) => {
				const system = findBestSystemForSeasonalTask(context.systems, definition);
				if (
					hasRecentSeasonalHistory(
						system,
						context.maintenanceHistory,
						seasonStart,
						definition,
					)
				) {
					return [];
				}
				if (hasOpenSeasonalTask(system, context.tasks, definition)) {
					return [];
				}

				const systemName = system ? getAssetDisplayName(system) : '';
				const title = definition.title;
				const affectedSystemIds = system ? [system.id] : [];

				return [
					makeFinding(context, {
						id: `maintley-intelligence:${context.property.id}:seasonal-context:${season}:${definition.id}`,
						ruleId: 'seasonal-context-guidance',
						affectedSystemIds,
						category: 'Maintenance Opportunities',
						severity: definition.severity,
						priority: definition.priority === 'High'
							? 'high'
							: definition.priority === 'Medium'
								? 'medium'
								: 'low',
						source: 'context',
						title,
						description: systemName
							? `${definition.description} Maintley matched this to ${systemName}.`
							: definition.description,
						whyItMatters: definition.whyItMatters,
						suggestedActionLabel: 'Create seasonal task',
						suggestedActionType: 'create_task',
						metadata: {
							systemId: system?.id || '',
							systemName,
							baselineAssetType: system
								? getBaselineDefinitionForAsset(system)?.assetType || getDeviceAssetType(system)
								: '',
							season,
							seasonLabel,
							seasonalTaskId: definition.id,
							seasonalTaskTitle: title,
							seasonalTaskDescription: definition.description,
							seasonalTaskCategory: definition.category,
							seasonalTaskPriority: definition.priority,
							seasonalTaskDueDate: getSuggestedDueDate(context.currentDate),
							seasonalTaskRank: definition.rank,
						},
					}),
				];
			});
	},
};
