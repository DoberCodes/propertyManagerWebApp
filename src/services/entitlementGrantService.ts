import { callFirebaseFunction } from '../config/firebaseFunctions';

export type FirstPropertyTrialFinalization = {
	result: 'created' | 'already_exists' | 'ineligible' | 'disabled';
	accountId: string;
	effectiveEntitlementProjection: Record<string, unknown> | null;
};

export const finalizeFirstPropertyTrial = async (
	propertyId: string,
): Promise<FirstPropertyTrialFinalization> => {
	const response = await callFirebaseFunction<
		{ propertyId: string },
		FirstPropertyTrialFinalization
	>('finalizeFirstPropertyTrial', { propertyId });
	return response.data;
};
