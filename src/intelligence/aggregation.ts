import { MaintleyFinding } from './types';

export const normalizeMaintleyFindings = (
	findings: MaintleyFinding[],
): MaintleyFinding[] =>
	findings.map((finding) => ({
		...finding,
		affectedSystemIds: Array.from(new Set(finding.affectedSystemIds || [])),
		requiredCapabilities: Array.from(new Set(finding.requiredCapabilities || [])),
		metadata: finding.metadata || {},
	}));

export const aggregateMaintleyFindings = (
	findings: MaintleyFinding[],
): MaintleyFinding[] => normalizeMaintleyFindings(findings);
