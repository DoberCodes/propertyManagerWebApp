import { callFirebaseFunction } from '../config/firebaseFunctions';

export const recordCurrentUserActivity = async (): Promise<boolean> => {
	const result = await callFirebaseFunction<
		Record<string, never>,
		{ success: true; recorded: boolean }
	>('recordUserActivity', {});
	return result.data.recorded;
};
