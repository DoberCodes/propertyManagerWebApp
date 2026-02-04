// Subscription plans and trial settings
export const TRIAL_DURATION_DAYS = 14; // 14-day free trial

export const SUBSCRIPTION_PLANS = {
	FREE: {
		id: 'free',
		name: 'Free',
		priceMonthly: 0,
		features: ['Limited to 1 home', 'Basic features only'],
	},
	HOMEOWNER: {
		id: 'homeowner',
		name: 'Homeowner',
		priceMonthly: 2,
		features: ['1 home', 'Basic maintenance tracking'],
	},
	BASIC: {
		id: 'basic',
		name: 'Basic',
		priceMonthly: 9,
		features: [
			'Up to 5 homes',
			'Maintenance tracking',
			'Team collaboration',
			'Mobile app access',
		],
	},
	PROFESSIONAL: {
		id: 'professional',
		name: 'Professional',
		priceMonthly: 16,
		features: [
			'Up to 10 homes',
			'Maintenance tracking',
			'Team collaboration',
			'Mobile app access',
			'Custom reporting',
			'Priority support',
		],
	},
};

export const SUBSCRIPTION_STATUS = {
	ACTIVE: 'active',
	TRIAL: 'trial',
	CANCELLED: 'cancelled',
	EXPIRED: 'expired',
	PAST_DUE: 'past_due',
} as const;

export type SubscriptionStatus =
	(typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];
