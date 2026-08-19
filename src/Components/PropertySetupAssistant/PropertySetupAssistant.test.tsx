import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from '@testing-library/react';
import { PropertySetupAssistant } from './PropertySetupAssistant';

const mockCreatePropertySpace = jest.fn();
let mockPropertySpaces: any[] = [];

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
		data: mockPropertySpaces,
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
		window.localStorage.clear();
		mockPropertySpaces = [
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
		];
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
						subscription: { planId: 'homeowner_plus', status: 'active' },
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
		expect(screen.getByLabelText('Kitchen')).toBeChecked();
		expect(screen.getByRole('option', { name: 'French Door' })).toBeInTheDocument();

		fireEvent.click(screen.getByRole('button', { name: '+ Add another' }));
		expect(screen.getByDisplayValue('Refrigerator 2')).toBeInTheDocument();
		expect(screen.getAllByLabelText('Kitchen')[1]).toBeChecked();

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

	it('carries a newly added step Space into the next Present equipment record', async () => {
		mockPropertySpaces = mockPropertySpaces.filter(
			(space) => space.id !== 'space-kitchen',
		);
		mockCreatePropertySpace.mockReturnValue({
			unwrap: () =>
				Promise.resolve({
					id: 'space-new-kitchen',
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
				}),
		});
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
		fireEvent.click(screen.getAllByRole('button', { name: 'Present' })[0]);
		fireEvent.click(screen.getByRole('button', { name: '+ Quick add Space' }));
		fireEvent.change(screen.getByPlaceholderText('Space name'), {
			target: { value: 'Kitchen' },
		});
		fireEvent.click(screen.getByRole('button', { name: 'Add Space' }));

		await waitFor(() => {
			expect(screen.getByLabelText('Kitchen')).toBeChecked();
		});
		fireEvent.click(screen.getAllByRole('button', { name: 'Present' })[1]);

		expect(screen.getByDisplayValue('Dishwasher')).toBeInTheDocument();
		expect(screen.getByLabelText('Kitchen')).toBeChecked();
	});

	it('leaves the step Space unselected when more than one match is active', () => {
		mockPropertySpaces = [
			...mockPropertySpaces,
			{
				...mockPropertySpaces[0],
				id: 'space-kitchen-duplicate',
				name: ' kitchen ',
			},
		];
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
		fireEvent.click(screen.getAllByRole('button', { name: 'Present' })[0]);

		screen
			.getAllByLabelText(/Kitchen/i)
			.forEach((checkbox) => expect(checkbox).not.toBeChecked());
	});

	it('uses a compact review summary with collapsed details and separate actions', () => {
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
						subscription: { planId: 'homeowner_plus', status: 'active' },
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
		fireEvent.click(screen.getAllByRole('button', { name: 'Present' })[0]);
		fireEvent.click(screen.getByRole('button', { name: 'Go to Safety' }));
		fireEvent.click(screen.getByRole('button', { name: 'Review' }));

		const reviewDialog = screen.getByRole('dialog', {
			name: 'Ready to save setup?',
		});
		const summary = within(reviewDialog).getByLabelText('Setup change summary');
		expect(within(summary).getByText('Equipment')).toBeInTheDocument();
		expect(within(summary).getByText('Spaces')).toBeInTheDocument();
		expect(within(summary).getByText('Recurring tasks')).toBeInTheDocument();
		expect(within(reviewDialog).getByText(/[1-9]\d* selected/)).toBeInTheDocument();
		expect(
			within(reviewDialog).getByTestId('setup-review-equipment-spaces'),
		).not.toHaveAttribute('open');
		expect(
			within(reviewDialog).getByTestId('setup-review-tasks'),
		).not.toHaveAttribute('open');
		expect(
			within(
				within(reviewDialog).getByTestId('setup-review-scroll-content'),
			).queryByTestId('setup-review-actions'),
		).not.toBeInTheDocument();
		expect(
			within(reviewDialog).getByTestId('setup-review-actions'),
		).toBeInTheDocument();
		expect(
			within(reviewDialog).getByRole('button', { name: 'Save setup' }),
		).toBeInTheDocument();
	});

	it('shows separate saved progress for the guided paths and a quiet report action', () => {
		render(
			<PropertySetupAssistant
				property={
					{
						id: 'property-1',
						title: 'Lakeview',
						accountId: 'owner-1',
						userId: 'owner-1',
						propertyType: 'residential',
						setupAssistant: {
							items: {
								hvac: { status: 'present', reviewedAt: '2026-08-19' },
								roof: { status: 'not_present', reviewedAt: '2026-08-19' },
								refrigerator: {
									status: 'present',
									reviewedAt: '2026-08-19',
								},
							},
						},
					} as any
				}
				currentUser={
					{
						id: 'owner-1',
						workspaceMode: 'homeowner',
						subscription: { planId: 'homeowner_plus', status: 'active' },
					} as any
				}
				devices={[]}
				tasks={[]}
				canUseAssistant
			/>,
		);

		fireEvent.click(screen.getByRole('button', { name: 'Continue Setup' }));

		expect(screen.getByText('2 of 9 reviewed')).toBeInTheDocument();
		expect(screen.getByText('3 of 28 reviewed')).toBeInTheDocument();
		expect(
			screen.getByRole('progressbar', { name: '10-minute essentials progress' }),
		).toHaveAttribute('aria-valuenow', '2');
		expect(
			screen.getByRole('progressbar', { name: 'Room-by-room progress' }),
		).toHaveAttribute('aria-valuenow', '3');
		expect(
			screen.getByRole('button', {
				name: /Already have an inspection or service report/i,
			}),
		).toBeInTheDocument();
	});
});
