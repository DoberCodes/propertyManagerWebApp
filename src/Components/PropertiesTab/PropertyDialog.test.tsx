import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { store } from '../../Redux/store/store';
import { PropertyDialog } from './PropertyDialog';

const enterRequiredAddress = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.type(screen.getByLabelText('Street address'), '100 Review Lane');
	await user.type(screen.getByLabelText('City'), 'Columbus');
	await user.type(screen.getByLabelText('State'), 'OH');
	await user.type(screen.getByLabelText('ZIP code'), '43215');
};

describe('PropertyDialog', () => {
	test('reviews the Spaces generated from bedroom and bathroom counts', async () => {
		const user = userEvent.setup();

		render(
			<Provider store={store}>
				<PropertyDialog
					isOpen
					onClose={jest.fn()}
					onSave={jest.fn()}
					groups={[]}
				/>
			</Provider>,
		);

		await user.type(
			screen.getByPlaceholderText('Enter property name'),
			'Reviewed Home',
		);
		await enterRequiredAddress(user);
		await user.click(screen.getByRole('button', { name: /^next$/i }));

		const bedroomInput = screen.getByLabelText('Bedrooms');
		const bathroomInput = screen.getByLabelText('Bathrooms');
		await user.clear(bedroomInput);
		await user.type(bedroomInput, '2');
		await user.clear(bathroomInput);
		await user.type(bathroomInput, '1.5');
		await user.click(screen.getByRole('button', { name: /^next$/i }));
		await user.click(screen.getByRole('button', { name: /^next$/i }));

		expect(screen.getByText('Spaces Maintley will create')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Bedroom 1, Bedroom 2, Bathroom 1, Half Bathroom 1',
			),
		).toBeInTheDocument();
	});

	test('toggling Is Rental updates formData and onSave receives isRental', async () => {
		const user = userEvent.setup();
		const onSave = jest.fn();
		const onClose = jest.fn();

		render(
			<Provider store={store}>
				<PropertyDialog
					isOpen={true}
					onClose={onClose}
					onSave={onSave}
					groups={[]}
				/>
			</Provider>,
		);

		await user.type(
			screen.getByPlaceholderText('Enter property name'),
			'Test Property',
		);
		await enterRequiredAddress(user);
		await user.click(screen.getByRole('button', { name: /^next$/i }));

		const checkbox = screen.getByRole('checkbox');
		await user.click(checkbox);

		await user.click(screen.getByRole('button', { name: /^next$/i }));
		await user.click(screen.getByRole('button', { name: /^next$/i }));

		const saveButton = screen.getByRole('button', { name: /save property/i });
		await user.click(saveButton);

		expect(onSave).toHaveBeenCalled();
		// onSave receives formData; the last call's first arg should have isRental true
		const savedArg = (onSave as jest.Mock).mock.calls[0][0];
		expect(savedArg.isRental).toBe(true);
		expect(savedArg).not.toHaveProperty('units');
		expect(savedArg).not.toHaveProperty('suites');
		expect(savedArg).not.toHaveProperty('hasSuites');
	});

	test('keeps onboarding home creation to Basics and Profile', async () => {
		const user = userEvent.setup();
		const onSave = jest.fn().mockResolvedValue(undefined);
		const onClose = jest.fn();

		render(
			<Provider store={store}>
				<PropertyDialog
					isOpen={true}
					onClose={onClose}
					onSave={onSave}
					groups={[]}
					forceSingleFamily
					showOnboardingSetupTip
				/>
			</Provider>,
		);

		expect(screen.getByText('Home Basics')).toBeInTheDocument();
		expect(
			screen.getByText(/organize Bedrooms and Bathrooms as Spaces/i),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
		expect(screen.queryByText('Access & Sharing')).not.toBeInTheDocument();

		await user.type(screen.getByPlaceholderText('Enter home name'), 'Willow House');
		await enterRequiredAddress(user);
		await user.click(screen.getByRole('button', { name: /^next$/i }));

		expect(screen.getByText('Home Details')).toBeInTheDocument();
		expect(screen.getByText('Home Type')).toBeInTheDocument();
		expect(screen.queryByText('Rental Settings')).not.toBeInTheDocument();
		const bedroomInput = screen.getByLabelText('Bedrooms');
		const bathroomInput = screen.getByLabelText('Bathrooms');
		await user.clear(bedroomInput);
		await user.type(bedroomInput, '3');
		await user.clear(bathroomInput);
		await user.type(bathroomInput, '2.5');
		await user.click(screen.getByRole('button', { name: /save home/i }));

		await waitFor(() => expect(onSave).toHaveBeenCalled());
		const savedArg = (onSave as jest.Mock).mock.calls[0][0];
		expect(savedArg.propertyType).toBe('residential');
		expect(savedArg.propertyClassification).toBe('single_family');
		expect(savedArg.isRental).toBe(false);
		expect(savedArg.bedrooms).toBe(3);
		expect(savedArg.bathrooms).toBe(2.5);
		expect(savedArg.openSetupAfterCreate).toBe(false);
		expect(savedArg.address).toBe('100 Review Lane, Columbus, OH 43215');
		expect(savedArg.addressDetails).toEqual({
			streetAddress: '100 Review Lane',
			unit: '',
			city: 'Columbus',
			state: 'OH',
			postalCode: '43215',
			countryCode: 'US',
		});
	});

	test('preserves an existing rental marker while hiding homeowner rental controls', async () => {
		const user = userEvent.setup();
		const onSave = jest.fn().mockResolvedValue(undefined);

		render(
			<Provider store={store}>
				<PropertyDialog
					isOpen
					onClose={jest.fn()}
					onSave={onSave}
					groups={[]}
					forceSingleFamily
					initialData={{
						name: 'Existing Home',
						owner: 'Homeowner',
						address: '123 Main Street',
						propertyType: 'residential',
						propertyClassification: 'single_family',
						isRental: true,
						bedrooms: 3,
						bathrooms: 2,
						notes: '',
					}}
				/>
			</Provider>,
		);

		await user.click(screen.getByRole('button', { name: /^next$/i }));
		expect(screen.getByText('Rental Settings')).toBeInTheDocument();
		expect(screen.getByRole('checkbox', { name: /is a rental/i })).toBeDisabled();
		await user.click(screen.getByRole('button', { name: /^next$/i }));
		await user.click(screen.getByRole('button', { name: /^next$/i }));
		expect(screen.queryByText('Rental Home')).not.toBeInTheDocument();
		await user.click(screen.getByRole('button', { name: /save home/i }));

		await waitFor(() => expect(onSave).toHaveBeenCalled());
		const savedLegacyProperty = (onSave as jest.Mock).mock.calls[0][0];
		expect(savedLegacyProperty.isRental).toBe(true);
		expect(savedLegacyProperty.address).toBe('123 Main Street');
		expect(savedLegacyProperty).not.toHaveProperty('addressDetails');
	});

	test('keeps first-property access activation inside the save loading state', async () => {
		const user = userEvent.setup();
		let finishSave: (() => void) | undefined;
		const onSave = jest.fn(async (_data, reportProgress) => {
			reportProgress?.({
				title: 'Activating Homeowner+...',
				text: 'Your home is saved. We are preparing your trial access.',
			});
			await new Promise<void>((resolve) => {
				finishSave = resolve;
			});
		});

		render(
			<Provider store={store}>
				<PropertyDialog
					isOpen
					onClose={jest.fn()}
					onSave={onSave}
					groups={[]}
					forceSingleFamily
					showOnboardingSetupTip
				/>
			</Provider>,
		);

		await user.type(screen.getByPlaceholderText('Enter home name'), 'Willow House');
		await enterRequiredAddress(user);
		await user.click(screen.getByRole('button', { name: /^next$/i }));
		void user.click(screen.getByRole('button', { name: /save home/i }));

		expect(await screen.findByText('Activating Homeowner+...')).toBeInTheDocument();
		expect(
			screen.getByText('Your home is saved. We are preparing your trial access.'),
		).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();

		finishSave?.();
		await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
	});
});
