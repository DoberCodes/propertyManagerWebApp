// mock axios early to prevent Jest trying to parse the ESM axios package
import React from 'react';
import { act, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './Redux/store/store';
import App from 'App';
import { setCurrentUser } from './Redux/Slices/userSlice';

const mockAccountSnapshotSubscribe = jest.fn();

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

jest.mock('./Components/Library/UpdateNotification/UpdateNotification', () => ({
	__esModule: true,
	default: () => null,
	UpdateNotification: () => null,
}));

jest.mock('./services/authSession', () => ({
	onAuthStateChange: () => () => {},
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

	act(() => {
		render(
			<Provider store={store}>
				<App />
			</Provider>,
		);
	});

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

	act(() => {
		render(
			<Provider store={store}>
				<App />
			</Provider>,
		);
	});

	expect(
		store.getState().user.currentUser?.subscription?.entitlementGrants,
	).toEqual([]);
	act(() => {
		store.dispatch(setCurrentUser(null));
	});
});
