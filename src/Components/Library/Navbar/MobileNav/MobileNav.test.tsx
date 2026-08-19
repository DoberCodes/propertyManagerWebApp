import React, { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MobileBottomNav } from './MobileNav';

const LocationProbe = () => {
	const location = useLocation();
	return <div data-testid='location'>{`${location.pathname}${location.search}`}</div>;
};

describe('MobileBottomNav equipment quick actions', () => {
	it('opens the property Supply form with the current equipment connected', () => {
		render(
			<MemoryRouter initialEntries={['/property/lakeview/device/fridge-123']}>
				<MobileBottomNav
					isSidebarOpen={false}
					setIsSidebarOpen={jest.fn()}
					isPropertyContext
					pathname='/property/lakeview/device/fridge-123'
					setIsQuickCreateOpen={jest.fn()}
					isQuickCreateOpen
					quickCreateRef={createRef<HTMLDivElement>()}
					activeRoute='/devices'
					isUserTenant={false}
					isHomeowner
					isSingleHomePlan={false}
					primaryHomePropertyPath='/property/lakeview'
					isTeamMemberAccount={false}
					canAccessTeam={false}
					canAccessProperties
					canViewPages
					favorites={[]}
				/>
				<LocationProbe />
			</MemoryRouter>,
		);

		fireEvent.click(
			screen.getByRole('button', { name: 'Add Supply', hidden: true }),
		);

		expect(
			screen.queryByRole('button', { name: 'Add Part', hidden: true }),
		).not.toBeInTheDocument();
		expect(screen.getByTestId('location')).toHaveTextContent(
			'/property/lakeview?tab=supplies&action=add-supply&equipmentId=fridge-123',
		);
	});
});
