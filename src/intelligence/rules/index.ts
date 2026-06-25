import { MaintleyIntelligenceRule } from '../types';
import { baselineMaintenanceCadenceRule } from './baselineMaintenanceCadence';
import { missingIdentificationDetailsRule } from './missingIdentificationDetails';
import { missingInstallDatesRule } from './missingInstallDates';
import { missingMaintenanceCoverageRule } from './missingMaintenanceCoverage';
import { missingMaintenanceHistoryRule } from './missingMaintenanceHistory';
import { overdueTasksRule } from './overdueTasks';

export const maintleyIntelligenceRules: MaintleyIntelligenceRule[] = [
	overdueTasksRule,
	missingInstallDatesRule,
	missingIdentificationDetailsRule,
	missingMaintenanceHistoryRule,
	missingMaintenanceCoverageRule,
	baselineMaintenanceCadenceRule,
];

export {
	baselineMaintenanceCadenceRule,
	missingIdentificationDetailsRule,
	missingInstallDatesRule,
	missingMaintenanceCoverageRule,
	missingMaintenanceHistoryRule,
	overdueTasksRule,
};
