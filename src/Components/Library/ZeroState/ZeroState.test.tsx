import React from 'react';
import { render, screen } from '@testing-library/react';
import { ZeroState } from './ZeroState';

describe('ZeroState Component', () => {
	it('should render with title and description', () => {
		render(
			<ZeroState
				title='No Results Found'
				description='Try adjusting your filters'
			/>,
		);
		expect(screen.getByText('No Results Found')).toBeInTheDocument();
		expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
	});

	it('should render with custom icon', () => {
		render(
			<ZeroState icon='📊' title='Empty' description='No data available' />,
		);
		expect(screen.getByText('📊')).toBeInTheDocument();
	});

	it('should render action button when provided', () => {
		const mockAction = jest.fn();
		render(
			<ZeroState
				title='No Items'
				description='Get started'
				actions={[{ label: 'Add Item', onClick: mockAction }]}
			/>,
		);
		expect(screen.getByText('Add Item')).toBeInTheDocument();
	});

	it('should call action onClick when button is clicked', () => {
		const mockAction = jest.fn();
		render(
			<ZeroState
				title='No Items'
				description='Get started'
				actions={[{ label: 'Create New', onClick: mockAction }]}
			/>,
		);

		const button = screen.getByText('Create New');
		button.click();

		expect(mockAction).toHaveBeenCalledTimes(1);
	});

	it('should render all props together', () => {
		const mockAction = jest.fn();

		render(
			<ZeroState
				title='No Properties'
				description='Get started by adding your first property'
				icon='🏠'
				actions={[{ label: 'Add Property', onClick: mockAction }]}
			/>,
		);

		expect(screen.getByText('No Properties')).toBeInTheDocument();
		expect(
			screen.getByText('Get started by adding your first property'),
		).toBeInTheDocument();
		expect(screen.getByText('🏠')).toBeInTheDocument();
		expect(screen.getByText('Add Property')).toBeInTheDocument();
	});

	it('should render with default icon', () => {
		render(<ZeroState title='Empty State' description='No data' />);
		expect(screen.getByText('Empty State')).toBeInTheDocument();
		expect(screen.getByText('📭')).toBeInTheDocument();
	});

	it('should render multiple actions', () => {
		const mockAction1 = jest.fn();
		const mockAction2 = jest.fn();
		render(
			<ZeroState
				title='No Items'
				description='Actions available'
				actions={[
					{ label: 'Primary Action', onClick: mockAction1 },
					{
						label: 'Secondary Action',
						onClick: mockAction2,
						variant: 'secondary',
					},
				]}
			/>,
		);

		expect(screen.getByText('Primary Action')).toBeInTheDocument();
		expect(screen.getByText('Secondary Action')).toBeInTheDocument();
	});
});
