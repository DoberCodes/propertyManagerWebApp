import { callFirebaseFunction } from '../config/firebaseFunctions';

export type ComplimentaryAccessCodePreview = {
	programId: string;
	label: string;
	bundleId: 'homeowner_plus' | 'property' | 'portfolio';
	durationDays: number;
	transitionMode: 'none' | 'checkout_required';
	fallbackPlanId: 'homeowner';
	limitOverrides: Record<string, number>;
	automaticBilling: false;
	recipientRestricted?: boolean;
};

const requestId = (prefix: string): string => {
	const random =
		typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
			? crypto.randomUUID()
			: `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	return `${prefix}:${random}`.replace(/[^a-zA-Z0-9:_-]/g, '-').slice(0, 120);
};

export const previewComplimentaryAccessCode = async (
	code: string,
): Promise<ComplimentaryAccessCodePreview> => {
	const result = await callFirebaseFunction<
		{ code: string; requestId: string },
		{ success: true; preview: ComplimentaryAccessCodePreview }
	>('previewComplimentaryAccessCode', {
		code,
		requestId: requestId('access-code-preview'),
	});
	return result.data.preview;
};

export const redeemComplimentaryAccessCode = async (
	code: string,
): Promise<{
	grantId: string;
	replayed: boolean;
	preview: ComplimentaryAccessCodePreview;
}> => {
	const result = await callFirebaseFunction<
		{ code: string; requestId: string },
		{
			success: true;
			grantId: string;
			replayed: boolean;
			preview: ComplimentaryAccessCodePreview;
		}
	>('redeemComplimentaryAccessCode', {
		code,
		requestId: requestId('access-code-redeem'),
	});
	return result.data;
};

export const complimentaryAccessCodesEnabled =
	process.env.REACT_APP_ENABLE_COMPLIMENTARY_ACCESS_CODES === 'true';
