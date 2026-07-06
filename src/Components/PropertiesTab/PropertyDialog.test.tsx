import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { store } from '../../Redux/store/store';
import { PropertyDialog } from './PropertyDialog';

describe('PropertyDialog', () => {
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
		await user.type(
			screen.getByPlaceholderText('Enter address'),
			'123 Main Street',
		);
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
	});

	test('shortens onboarding home creation to basics only', async () => {
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
		expect(screen.getByText('Home Type')).toBeInTheDocument();
		expect(
			screen.getByText(/Maintley will open the Home Setup Assistant/i),
		).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
		expect(screen.queryByText('Access & Sharing')).not.toBeInTheDocument();

		await user.type(screen.getByPlaceholderText('Enter home name'), 'Willow House');
		await user.type(screen.getByPlaceholderText('Enter address'), '123 Willow Lane');
		await user.click(screen.getByRole('button', { name: /save home/i }));

		await waitFor(() => expect(onSave).toHaveBeenCalled());
		const savedArg = (onSave as jest.Mock).mock.calls[0][0];
		expect(savedArg.propertyType).toBe('Single Family');
		expect(savedArg.openSetupAfterCreate).toBe(true);
	});
});
