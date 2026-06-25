import {
	MaintleyFinding,
	MaintleyFindingPriority,
	MaintleyFindingSeverity,
} from './types';

const PRIORITY_RANK: Record<MaintleyFindingPriority, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

const SEVERITY_RANK: Record<MaintleyFindingSeverity, number> = {
	high: 0,
	medium: 1,
	low: 2,
};

export const compareMaintleyFindings = (
	left: MaintleyFinding,
	right: MaintleyFinding,
): number => {
	const priorityDelta =
		PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority];
	if (priorityDelta !== 0) return priorityDelta;

	const severityDelta =
		SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
	if (severityDelta !== 0) return severityDelta;

	return left.title.localeCompare(right.title);
};

export const prioritizeMaintleyFindings = (
	findings: MaintleyFinding[],
): MaintleyFinding[] => [...findings].sort(compareMaintleyFindings);
