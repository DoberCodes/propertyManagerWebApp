import { callFirebaseFunction } from '../config/firebaseFunctions';

export type PropertySetupTaskProposal = {
	proposalId: string;
	title: string;
	dueDate: string;
	priority?: string;
	notes?: string;
	deviceId?: string;
	deviceIds?: string[];
	recurrenceFrequency?: string;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: string;
};

export type ActivatePropertySetupMaintenancePlanResult = {
	success: true;
	requestId: string;
	propertyId: string;
	accountId: string;
	createdTaskIds: string[];
	taskIds: string[];
	replayedTaskIds: string[];
	recurringAccessApplied: boolean;
};

export const activatePropertySetupMaintenancePlan = async (params: {
	propertyId: string;
	requestId: string;
	proposals: PropertySetupTaskProposal[];
}): Promise<ActivatePropertySetupMaintenancePlanResult> => {
	const result = await callFirebaseFunction<
		typeof params,
		ActivatePropertySetupMaintenancePlanResult
	>('activatePropertySetupMaintenancePlan', params);
	return result.data;
};
