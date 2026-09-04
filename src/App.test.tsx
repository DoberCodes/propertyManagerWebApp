// mock axios early to prevent Jest trying to parse the ESM axios package
import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './Redux/store/store';
import App from 'App';
import { setCurrentUser } from './Redux/Slices/userSlice';

const mockAccountSnapshotSubscribe = jest.fn();
const mockStripeSubscriptionSync = jest.fn();

jest.mock('axios', () => ({
	get: jest.fn(),
	post: jest.fn(),
	create: jest.fn(() => ({ get: jest.fn(), post: jest.fn() })),
}));

jest.mock('./router', () => ({
	RouterComponent: () => <div>Router ready</div>,
}));

jest.mock('./Hooks/DataFetchContext', () => ({
	DataFetchProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

jest.mock('./services/authSession', () => ({
	onAuthStateChange: () => () => {},
}));

jest.mock('./services/stripeService', () => ({
	syncSubscriptionFromStripe: (...args: unknown[]) =>
		mockStripeSubscriptionSync(...args),
}));

jest.mock('firebase/firestore', () => ({
	...jest.requireActual('firebase/firestore'),
	doc: jest.fn(() => ({ path: 'familyAccounts/account-1' })),
	onSnapshot: (...args: unknown[]) => mockAccountSnapshotSubscribe(...args),
}));

jest.mock('@capacitor/core', () => ({
	Capacitor: {
		isNativePlatform: () => false,
		Plugins: {},
	},
	registerPlugin: jest.fn(),
}));

test('renders app', () => {
	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);

	expect(document.body).toBeInTheDocument();
});

test('does not start account subscriptions while email verification is pending', async () => {
	mockAccountSnapshotSubscribe.mockClear();
	mockStripeSubscriptionSync.mockClear();
	act(() => {
		store.dispatch(
			setCurrentUser({
				id: 'pending-user',
				email: 'pending@example.com',
				role: 'admin',
				accountId: 'pending-user',
				isAccountOwner: true,
				registrationStatus: 'pending_email_verification',
				subscription: {
					status: 'active',
					plan: 'homeowner',
					currentPeriodStart: 1,
					currentPeriodEnd: 2,
					stripeCustomerId: 'cus_pending',
				},
			} as any),
		);
	});

	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);

	await waitFor(() => {
		expect(mockAccountSnapshotSubscribe).not.toHaveBeenCalled();
	});
	await waitFor(() => {
		expect(mockStripeSubscriptionSync).not.toHaveBeenCalled();
	});
	act(() => {
		store.dispatch(setCurrentUser(null));
	});
});

test('does not erase a resolved grant when an account snapshot omits its projection', () => {
	const grant = {
		grantId: 'portfolio-lifetime',
		programId: 'legacy_portfolio_lifetime_v1',
		accountId: 'account-1',
		kind: 'permanent',
		state: 'active',
		bundleId: 'portfolio',
		bundleVersion: 'v1',
		startsAtMs: 1,
		source: 'migration',
	} as const;
	store.dispatch(
		setCurrentUser({
			id: 'user-1',
			email: 'user@example.com',
			role: 'admin',
			accountId: 'account-1',
			subscription: {
				status: 'active',
				plan: 'homeowner',
				currentPeriodStart: 0,
				currentPeriodEnd: 1,
				entitlementAccountId: 'account-1',
				entitlementGrants: [grant],
			},
			effectiveEntitlementProjection: { activeGrants: [grant] },
		} as any),
	);
	mockAccountSnapshotSubscribe.mockImplementation(
		(_reference, onNext: (snapshot: { data: () => Record<string, unknown> }) => void) => {
			onNext({ data: () => ({}) });
			return () => {};
		},
	);

	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);

	expect(
		store.getState().user.currentUser?.subscription?.entitlementGrants,
	).toEqual([grant]);
	act(() => {
		store.dispatch(setCurrentUser(null));
	});
});

test('clears resolved grants when the account snapshot explicitly reports none', () => {
	const grant = {
		grantId: 'portfolio-lifetime',
		programId: 'legacy_portfolio_lifetime_v1',
		accountId: 'account-1',
		kind: 'permanent',
		state: 'active',
		bundleId: 'portfolio',
		bundleVersion: 'v1',
		startsAtMs: 1,
		source: 'migration',
	} as const;
	store.dispatch(
		setCurrentUser({
			id: 'user-1',
			email: 'user@example.com',
			role: 'admin',
			accountId: 'account-1',
			subscription: {
				status: 'active',
				plan: 'homeowner',
				currentPeriodStart: 0,
				currentPeriodEnd: 1,
				entitlementAccountId: 'account-1',
				entitlementGrants: [grant],
			},
			effectiveEntitlementProjection: { activeGrants: [grant] },
		} as any),
	);
	mockAccountSnapshotSubscribe.mockImplementation(
		(_reference, onNext: (snapshot: { data: () => Record<string, unknown> }) => void) => {
			onNext({
				data: () => ({ effectiveEntitlementProjection: { activeGrants: [] } }),
			});
			return () => {};
		},
	);

	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);

	expect(
		store.getState().user.currentUser?.subscription?.entitlementGrants,
	).toEqual([]);
	act(() => {
		store.dispatch(setCurrentUser(null));
	});
});

test('hydrates Stripe billing disclosure without blocking authenticated rendering', async () => {
	mockStripeSubscriptionSync.mockClear();
	mockAccountSnapshotSubscribe.mockImplementation(() => () => {});
	mockStripeSubscriptionSync.mockResolvedValueOnce({
		success: true,
		subscription: {
			billingDisclosure: {
				source: 'stripe',
				status: 'active',
				priceId: 'price_portfolio',
				productId: 'prod_portfolio',
				currency: 'usd',
				interval: 'month',
				intervalCount: 1,
				quantity: 1,
				listAmountMinor: 2399,
				currentPeriodEnd: 1784952000,
				cancelAtPeriodEnd: false,
				discount: null,
				nextInvoice: {
					amountDueMinor: 2399,
					currency: 'usd',
					dueAt: 1784952000,
				},
				syncedAt: '2026-07-25T00:00:00.000Z',
			},
		},
	});
	act(() => {
		store.dispatch(
			setCurrentUser({
				id: 'paid-user',
				email: 'paid@example.com',
				role: 'admin',
				accountId: 'paid-user',
				isAccountOwner: true,
				subscription: {
					status: 'active',
					plan: 'portfolio',
					currentPeriodStart: 1,
					currentPeriodEnd: 2,
					stripeCustomerId: 'cus_paid',
					stripeSubscriptionId: 'sub_paid',
				},
			} as any),
		);
	});

	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);

	await waitFor(() => {
		expect(
			store.getState().user.currentUser?.subscription?.billingDisclosure
				?.priceId,
		).toBe('price_portfolio');
	});
	expect(mockStripeSubscriptionSync).toHaveBeenCalledTimes(1);
	act(() => {
		store.dispatch(setCurrentUser(null));
	});
});

test('hydrates an explicit Stripe subscription conflict without replacing the plan', async () => {
	mockStripeSubscriptionSync.mockClear();
	mockAccountSnapshotSubscribe.mockImplementation(() => () => {});
	mockStripeSubscriptionSync.mockResolvedValueOnce({
		success: false,
		conflict: true,
		reason: 'Multiple current Stripe subscriptions require review',
		subscription: {
			billingSyncIssue: {
				code: 'multiple_current_subscriptions',
				stripeSubscriptionIds: ['sub_existing', 'sub_portfolio'],
				detectedAt: '2026-07-25T00:00:00.000Z',
			},
		},
	});
	act(() => {
		store.dispatch(
			setCurrentUser({
				id: 'conflicted-user',
				email: 'conflict@example.com',
				role: 'admin',
				accountId: 'conflicted-user',
				isAccountOwner: true,
				subscription: {
					status: 'active',
					plan: 'homeowner_plus',
					currentPeriodStart: 1,
					currentPeriodEnd: 2,
					stripeCustomerId: 'cus_conflict',
					stripeSubscriptionId: 'sub_existing',
				},
			} as any),
		);
	});

	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);

	await waitFor(() => {
		expect(
			store.getState().user.currentUser?.subscription?.billingSyncIssue
				?.code,
		).toBe('multiple_current_subscriptions');
	});
	expect(store.getState().user.currentUser?.subscription?.plan).toBe(
		'homeowner_plus',
	);
	act(() => {
		store.dispatch(setCurrentUser(null));
	});
});
