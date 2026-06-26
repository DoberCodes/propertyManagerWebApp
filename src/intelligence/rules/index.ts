import { MaintleyIntelligenceRule } from '../types';
import { baselineMaintenanceCadenceRule } from './baselineMaintenanceCadence';
import { missingIdentificationDetailsRule } from './missingIdentificationDetails';
import { missingInstallDatesRule } from './missingInstallDates';
import { missingKnowledgePackDetailsRule } from './missingKnowledgePackDetails';
import { missingMaintenanceCoverageRule } from './missingMaintenanceCoverage';
import { missingMaintenanceHistoryRule } from './missingMaintenanceHistory';
import { overdueTasksRule } from './overdueTasks';

export const maintleyIntelligenceRules: MaintleyIntelligenceRule[] = [
	overdueTasksRule,
	missingInstallDatesRule,
	missingIdentificationDetailsRule,
	missingKnowledgePackDetailsRule,
	missingMaintenanceHistoryRule,
	missingMaintenanceCoverageRule,
	baselineMaintenanceCadenceRule,
];

export {
	baselineMaintenanceCadenceRule,
	missingIdentificationDetailsRule,
	missingInstallDatesRule,
	missingKnowledgePackDetailsRule,
	missingMaintenanceCoverageRule,
	missingMaintenanceHistoryRule,
	overdueTasksRule,
};
