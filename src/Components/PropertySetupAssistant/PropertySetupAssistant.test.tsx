import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { PropertySetupAssistant } from './PropertySetupAssistant';

const mockCreatePropertySpace = jest.fn();

jest.mock('react-redux', () => ({
	useDispatch: () => jest.fn(),
}));

jest.mock('../../Redux/API/deviceSlice', () => ({
	useCreateDeviceMutation: () => [jest.fn()],
	useUpdateDeviceMutation: () => [jest.fn()],
}));

jest.mock('../../Redux/API/propertySlice', () => ({
	useUpdatePropertyMutation: () => [jest.fn()],
}));

jest.mock('../../Redux/API/taskSlice', () => ({
	useCreateTaskMutation: () => [jest.fn()],
	useUpdateTaskMutation: () => [jest.fn()],
}));

jest.mock('../../Redux/API/spaceSlice', () => ({
	useCreatePropertySpaceMutation: () => [mockCreatePropertySpace],
	useGetPropertySpacesQuery: () => ({
		data: [
			{
				id: 'space-kitchen',
				accountId: 'owner-1',
				propertyId: 'property-1',
				name: 'Kitchen',
				type: 'interior',
				isArchived: false,
				source: 'manual',
				createdBy: 'owner-1',
				updatedBy: 'owner-1',
				createdAt: '2026-08-19T12:00:00.000Z',
				updatedAt: '2026-08-19T12:00:00.000Z',
			},
			{
				id: 'space-garage',
				accountId: 'owner-1',
				propertyId: 'property-1',
				name: 'Garage',
				type: 'storage',
				isArchived: false,
				source: 'manual',
				createdBy: 'owner-1',
				updatedBy: 'owner-1',
				createdAt: '2026-08-19T12:00:00.000Z',
				updatedAt: '2026-08-19T12:00:00.000Z',
			},
		],
	}),
}));

jest.mock('../../Redux/API/propertyKnowledgeLinkSlice', () => ({
	useGetPropertyKnowledgeLinksQuery: () => ({ data: [] }),
	useSetEquipmentSpaceLinksMutation: () => [jest.fn()],
	useSetTaskSpaceLinksMutation: () => [jest.fn()],
}));

jest.mock('../Library/AppFeedback/AppFeedbackProvider', () => ({
	useAppFeedback: () => ({ notify: jest.fn() }),
}));

jest.mock('../../analytics/analytics', () => ({
	getAnalyticsErrorCode: () => 'test-error',
	trackAnalyticsEvent: jest.fn(() => Promise.resolve()),
}));

describe('PropertySetupAssistant equipment customization', () => {
	beforeEach(() => {
		mockCreatePropertySpace.mockReset();
		mockCreatePropertySpace.mockReturnValue({
			unwrap: () =>
				Promise.resolve({
					id: 'space-pantry',
					accountId: 'owner-1',
					propertyId: 'property-1',
					name: 'Pantry',
					type: 'interior',
					isArchived: false,
					source: 'manual',
					createdBy: 'owner-1',
					updatedBy: 'owner-1',
					createdAt: '2026-08-19T12:00:00.000Z',
					updatedAt: '2026-08-19T12:00:00.000Z',
				}),
		});
	});

	it('expands Present equipment in place and supports repeated Space-specific records', async () => {
		render(
			<PropertySetupAssistant
				property={
					{
						id: 'property-1',
						title: 'Lakeview',
						accountId: 'owner-1',
						userId: 'owner-1',
						propertyType: 'residential',
					} as any
				}
				currentUser={
					{
						id: 'owner-1',
						workspaceMode: 'homeowner',
						subscription: { planId: 'homeowner_plus' },
					} as any
				}
				devices={[]}
				tasks={[]}
				canUseAssistant
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Continue Setup' }));
		fireEvent.click(
			screen.getByRole('button', { name: /Continue room by room/i }),
		);
		const scrollContent = screen.getByTestId('setup-scroll-content');
		const navigation = screen.getByTestId('setup-navigation');
		expect(
			within(scrollContent).queryByTestId('setup-navigation'),
		).not.toBeInTheDocument();
		expect(navigation).toBeInTheDocument();
		fireEvent.click(screen.getAllByRole('button', { name: 'Present' })[0]);

		expect(screen.getByText('Equipment details')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Refrigerator')).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'French Door' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: '+ Add another' }));
		expect(screen.getByDisplayValue('Refrigerator 2')).toBeInTheDocument();

		fireEvent.click(screen.getAllByLabelText('Garage')[1]);
		expect(screen.getAllByLabelText('Garage')[1]).toBeChecked();
		fireEvent.click(screen.getAllByRole('button', { name: '+ Quick add Space' })[1]);
		fireEvent.change(screen.getByPlaceholderText('Space name'), {
			target: { value: 'Pantry' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Add Space' }));

		await waitFor(() => {
			expect(mockCreatePropertySpace).toHaveBeenCalledWith({
				accountId: 'owner-1',
				propertyId: 'property-1',
				name: 'Pantry',
				type: 'interior',
				notes: '',
				source: 'manual',
			});
		});
		expect(mockCreatePropertySpace.mock.calls[0][0]).not.toHaveProperty(
			'generationKey',
		);
		expect(screen.getAllByLabelText('Pantry')[1]).toBeChecked();
	});

	it('replaces tank flushing when a tankless water-heater subtype is selected', () => {
		render(
			<PropertySetupAssistant
				property={
					{
						id: 'property-1',
						title: 'Lakeview',
						accountId: 'owner-1',
						userId: 'owner-1',
						propertyType: 'residential',
					} as any
				}
				currentUser={
					{
						id: 'owner-1',
						workspaceMode: 'homeowner',
						subscription: { planId: 'homeowner_plus' },
					} as any
				}
				devices={[]}
				tasks={[]}
				canUseAssistant
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Continue Setup' }));
		fireEvent.click(
			screen.getByRole('button', { name: /Continue room by room/i }),
		);
		fireEvent.click(
			screen.getByRole('button', { name: 'Go to Utility Systems' }),
		);
		fireEvent.click(screen.getAllByRole('button', { name: 'Present' })[1]);

		expect(screen.getByText('Flush Water Heater Tank')).toBeInTheDocument();
		expect(
			screen.queryByText('Review Tankless Water Heater Descaling'),
		).not.toBeInTheDocument();

		fireEvent.change(
			screen.getByRole('combobox', { name: 'Subtype (optional)' }),
			{ target: { value: 'Tankless Electric' } },
		);

		expect(
			screen.queryByText('Flush Water Heater Tank'),
		).not.toBeInTheDocument();
		expect(
			screen.getByText('Review Tankless Water Heater Descaling'),
		).toBeInTheDocument();
	});
});
