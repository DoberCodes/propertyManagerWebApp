import { runMaintleyIntelligence } from '../engine';
import {
	filterFindingsForPlanAndCapabilities,
} from '../planFilter';
import { prioritizeMaintleyFindings } from '../prioritization';
import {
	MaintleyCapability,
	MaintleyFinding,
	MaintleyIntelligenceInput,
} from '../types';

export const QUICK_SCAN_FINDING_LIMIT = 5;
const QUICK_SCAN_PROPERTY_MEMORY_LIMIT = 3;

interface QuickScanOptions {
	planId?: string;
	capabilities?: Partial<Record<MaintleyCapability, boolean>>;
	limit?: number;
}

const PROPERTY_MEMORY_RULE_IDS = new Set([
	'overdue-tasks-exist',
	'safety-systems-missing-maintenance-history',
	'systems-missing-maintenance-history',
	'systems-missing-important-identification',
	'major-systems-missing-install-dates',
	'systems-missing-actionable-maintenance-coverage',
]);

interface QuickScanSelectionState {
	selectedIds: Set<string>;
	ruleIds: Set<string>;
	assetKeys: Set<string>;
}

const isPropertyMemoryQuickScanFinding = (finding: MaintleyFinding): boolean =>
	finding.source === 'property_memory' || PROPERTY_MEMORY_RULE_IDS.has(finding.ruleId);

const getFindingAssetKeys = (finding: MaintleyFinding): string[] => {
	const assetIds = finding.affectedAssetIds?.length
		? finding.affectedAssetIds
		: finding.affectedSystemIds;
	if (assetIds.length > 0) {
		return assetIds.map((assetId) => `asset:${assetId}`);
	}
	const taskId = String(finding.metadata.taskId || '').trim();
	if (taskId) return [`task:${taskId}`];
	return [`property:${finding.propertyId}`];
};

const hasAssetOverlap = (
	finding: MaintleyFinding,
	assetKeys: Set<string>,
): boolean => getFindingAssetKeys(finding).some((key) => assetKeys.has(key));

const rememberFinding = (
	state: QuickScanSelectionState,
	finding: MaintleyFinding,
) => {
	state.selectedIds.add(finding.id);
	state.ruleIds.add(finding.ruleId);
	getFindingAssetKeys(finding).forEach((key) => state.assetKeys.add(key));
};

const selectDiverseFindings = (
	candidates: MaintleyFinding[],
	count: number,
	state: QuickScanSelectionState,
): MaintleyFinding[] => {
	const selected: MaintleyFinding[] = [];

	const tryPass = (predicate: (finding: MaintleyFinding) => boolean) => {
		for (const finding of candidates) {
			if (selected.length >= count) return;
			if (state.selectedIds.has(finding.id)) continue;
			if (!predicate(finding)) continue;
			selected.push(finding);
			rememberFinding(state, finding);
		}
	};

	tryPass(
		(finding) =>
			!state.ruleIds.has(finding.ruleId) &&
			!hasAssetOverlap(finding, state.assetKeys),
	);
	tryPass((finding) => !state.ruleIds.has(finding.ruleId));

	return selected;
};

export const selectQuickScanFindings = (
	findings: MaintleyFinding[],
	options: QuickScanOptions = {},
): MaintleyFinding[] => {
	const limit = options.limit || QUICK_SCAN_FINDING_LIMIT;
	const candidateFindings = filterFindingsForPlanAndCapabilities(
		findings.filter((finding) => finding.priority !== 'low'),
		options.planId,
		options.capabilities,
	);
	const prioritizedFindings = prioritizeMaintleyFindings(candidateFindings);
	const selectionState: QuickScanSelectionState = {
		selectedIds: new Set(),
		ruleIds: new Set(),
		assetKeys: new Set(),
	};
	const propertyMemoryLimit = Math.min(
		QUICK_SCAN_PROPERTY_MEMORY_LIMIT,
		limit,
	);
	const expandedLimit = Math.max(0, limit - propertyMemoryLimit);
	const propertyMemoryFindings = prioritizedFindings.filter(
		isPropertyMemoryQuickScanFinding,
	);
	const expandedFindings = prioritizedFindings.filter(
		(finding) => !isPropertyMemoryQuickScanFinding(finding),
	);
	const selectedFindings = [
		...selectDiverseFindings(
			propertyMemoryFindings,
			propertyMemoryLimit,
			selectionState,
		),
		...selectDiverseFindings(expandedFindings, expandedLimit, selectionState),
	];
	const remainingSlots = limit - selectedFindings.length;
	if (remainingSlots <= 0) return prioritizeMaintleyFindings(selectedFindings);

	return prioritizeMaintleyFindings([
		...selectedFindings,
		...selectDiverseFindings(
			prioritizedFindings,
			remainingSlots,
			selectionState,
		),
	]);
};

export const runQuickPropertyScan = (
	input: MaintleyIntelligenceInput,
	options: QuickScanOptions = {},
): MaintleyFinding[] =>
	selectQuickScanFindings(
		runMaintleyIntelligence({
			...input,
			planId: undefined,
			capabilities: undefined,
		}).findings,
		options,
	);
