import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { OnboardingFlow } from './OnboardingFlow';

jest.mock('react-redux', () => ({
	useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
	useNavigate: jest.fn(),
}));

jest.mock('../../Redux/API/propertySlice', () => ({
	useGetPropertiesQuery: jest.fn(),
}));

jest.mock('../../Redux/selectors/permissionSelectors', () => ({
	selectIsHomeowner: (state: any) => state.testPermissions.isHomeowner,
	selectCanAccessProperties: (state: any) => state.testPermissions.canAccessProperties,
}));

const mockedUseSelector = useSelector as unknown as jest.Mock;
const mockedUseNavigate = useNavigate as jest.Mock;
const mockedUseGetPropertiesQuery = useGetPropertiesQuery as jest.Mock;

describe('OnboardingFlow', () => {
	const navigate = jest.fn();
	let properties: Array<Record<string, unknown>> = [];

	beforeEach(() => {
		jest.clearAllMocks();
		properties = [];
		mockedUseNavigate.mockReturnValue(navigate);
		mockedUseSelector.mockImplementation((selector: (state: any) => unknown) =>
			selector({
				user: { currentUser: { id: 'user-1' } },
				testPermissions: {
					isHomeowner: true,
					canAccessProperties: true,
				},
			}),
		);
		mockedUseGetPropertiesQuery.mockImplementation(() => ({
			data: properties,
			isLoading: false,
		}));
	});

	test('moves from a concise welcome to first-property confirmation', async () => {
		const user = userEvent.setup();
		const onComplete = jest.fn();
		const view = render(
			<OnboardingFlow onComplete={onComplete} onSkip={jest.fn()} />,
		);

		expect(screen.getByText('Stay ahead of home maintenance.')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Add My Home' }));
		expect(navigate).toHaveBeenCalledWith('/properties?openCreate=onboarding');
		expect(screen.getByText(/Create your home when you are ready/i)).toBeInTheDocument();

		properties = [{ id: 'property-1', slug: 'willow-house' }];
		view.rerender(<OnboardingFlow onComplete={onComplete} onSkip={jest.fn()} />);

		expect(await screen.findByText('Your maintenance record is ready.')).toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Continue setup' }));
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith('/property/willow-house?setup=1');
	});

	test('does not repeat property-creation education for an existing property', async () => {
		const user = userEvent.setup();
		const onComplete = jest.fn();
		properties = [{ id: 'property-1', slug: 'willow-house' }];

		render(<OnboardingFlow onComplete={onComplete} onSkip={jest.fn()} />);

		expect(screen.queryByRole('button', { name: 'Add My Home' })).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: 'Go to Today' }));
		expect(onComplete).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith('/dashboard');
	});
});
