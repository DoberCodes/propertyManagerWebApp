import {
	MaintleyCapability,
	MaintleyPlanId,
} from './types';

const PLAN_CAPABILITIES: Record<MaintleyPlanId, Record<MaintleyCapability, boolean>> = {
	guest: {
		recurring_tasks: false,
	},
	tenant: {
		recurring_tasks: false,
	},
	homeowner: {
		recurring_tasks: false,
	},
	homeowner_plus: {
		recurring_tasks: true,
	},
	property: {
		recurring_tasks: true,
	},
	team: {
		recurring_tasks: true,
	},
	portfolio: {
		recurring_tasks: true,
	},
};

export const getCapabilitiesForPlan = (
	planId: MaintleyPlanId,
): Record<MaintleyCapability, boolean> => PLAN_CAPABILITIES[planId];
