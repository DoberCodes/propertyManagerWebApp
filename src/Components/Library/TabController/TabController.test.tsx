import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { TabController } from './TabController';

const makeProps = (overrides: any = {}) => ({
	property: overrides.property || {},
	currentUser: overrides.currentUser || {
		subscription: { plan: 'property' },
		role: 'manager',
	},
	propertyMaintenanceRequests: overrides.propertyMaintenanceRequests || [],
	canApproveMaintenanceRequest: overrides.canApprove || (() => true),
	permissions: overrides.permissions,
	activeTab: overrides.activeTab || 'details',
	setActiveTab: overrides.setActiveTab || (() => { }),
});

// Minimal mock store provider for tests
const createMockStore = (
	preloadedState: any = {
		app: { isMobile: false },
		user: { currentUser: null },
	},
) =>
	configureStore({
		reducer: {
			app: (state = preloadedState.app) => state,
			user: (state = preloadedState.user) => state,
		},
		preloadedState,
	});

const renderWithStore = (ui: React.ReactElement, store?: any) =>
	render(
		<Provider store={store || createMockStore()}>
			<MemoryRouter>{ui}</MemoryRouter>
		</Provider>,
	);

describe('Tabs component', () => {
	test('does not show Units for Multi-Family properties while Units are deprioritized', () => {
		renderWithStore(
			<TabController
				{...makeProps({ property: { propertyType: 'Multi-Family' } })}
			/>,
			createMockStore({
				app: { isMobile: false },
				user: { currentUser: null },
			}),
		);
		expect(screen.queryByText('Units')).not.toBeInTheDocument();
	});

	test('does not show Suites for Commercial properties (temporarily hidden)', () => {
		renderWithStore(
			<TabController
				{...makeProps({
					property: { propertyType: 'Commercial' },
				})}
			/>,
			createMockStore(),
		);
		expect(screen.queryByText('Suites')).not.toBeInTheDocument();
	});

	test('shows Tenants and Requests for rental properties when permissions allow', () => {
		renderWithStore(
			<TabController
				{...makeProps({
					property: { isRental: true, propertyType: 'Single Family' },
					propertyMaintenanceRequests: [{ id: 'r1', status: 'pending' }],
					permissions: { canManageTenants: true },
				})}
			/>,
			createMockStore(),
		);

		expect(screen.getByText('Tenants')).toBeInTheDocument();
		expect(screen.getByText('Requests')).toBeInTheDocument();
	});

	test('does not show Tenants/Requests for homeowner plan even if isRental is true', () => {
		renderWithStore(
			<TabController
				{...makeProps({
					property: { isRental: true },
					currentUser: {
						subscription: { plan: 'homeowner' },
						role: 'homeowner',
					},
				})}
			/>,
			createMockStore({
				app: { isMobile: false },
				user: { currentUser: { subscription: { plan: 'homeowner' } } },
			}),
		);

		expect(screen.queryByText('Tenants')).not.toBeInTheDocument();
		expect(screen.queryByText('Requests')).not.toBeInTheDocument();
	});
});
