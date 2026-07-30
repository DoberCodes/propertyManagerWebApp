import {
	MaintleyCapability,
	MaintleyPlanId,
} from './types';
import { getPlanPreset, hasCapability } from '@maintley/entitlements';

export const getCapabilitiesForPlan = (
	planId: MaintleyPlanId,
): Record<MaintleyCapability, boolean> => ({
	recurring_tasks: hasCapability(getPlanPreset(planId), 'recurring_tasks.use'),
});
