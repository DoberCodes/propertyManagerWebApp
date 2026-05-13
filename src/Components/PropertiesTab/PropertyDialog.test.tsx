import React from 'react';
import { render, screen } from '@testing-library/react';
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

		await user.click(screen.getByRole('button', { name: /property profile/i }));

		await user.type(screen.getByLabelText(/property name/i), 'Test Property');
		await user.type(screen.getByLabelText(/address/i), '123 Main Street');

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
});
