import { MaintleyIntelligenceRule } from '../types';
import { baselineMaintenanceCadenceRule } from './baselineMaintenanceCadence';
import { missingIdentificationDetailsRule } from './missingIdentificationDetails';
import { missingInstallDatesRule } from './missingInstallDates';
import { missingInspectionDocumentationRule } from './missingInspectionDocumentation';
import { missingKnowledgePackDetailsRule } from './missingKnowledgePackDetails';
import { missingMaintenanceCoverageRule } from './missingMaintenanceCoverage';
import { missingMaintenanceHistoryRule } from './missingMaintenanceHistory';
import { overdueTasksRule } from './overdueTasks';
import { seasonalContextGuidanceRule } from './seasonalContextGuidance';

export const maintleyIntelligenceRules: MaintleyIntelligenceRule[] = [
	overdueTasksRule,
	missingInstallDatesRule,
	missingIdentificationDetailsRule,
	missingInspectionDocumentationRule,
	missingKnowledgePackDetailsRule,
	missingMaintenanceHistoryRule,
	missingMaintenanceCoverageRule,
	baselineMaintenanceCadenceRule,
	seasonalContextGuidanceRule,
];

export {
	baselineMaintenanceCadenceRule,
	missingIdentificationDetailsRule,
	missingInstallDatesRule,
	missingInspectionDocumentationRule,
	missingKnowledgePackDetailsRule,
	missingMaintenanceCoverageRule,
	missingMaintenanceHistoryRule,
	overdueTasksRule,
	seasonalContextGuidanceRule,
};
