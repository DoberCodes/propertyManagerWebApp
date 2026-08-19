import { render, screen } from '@testing-library/react';
import { AppZeroState } from './AppZeroState';

describe('AppZeroState', () => {
	it('uses homeowner language consistently for the first-home state', () => {
		render(<AppZeroState kind='noProperties' context='homeowner' />);

		expect(screen.getByText('Home Setup')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'No homes yet' })).toBeInTheDocument();
		expect(
			screen.getByText(
				'Add your first home to start organizing tasks, equipment, maintenance history, and reminders.',
			),
		).toBeInTheDocument();
		expect(screen.queryByText('No properties yet')).not.toBeInTheDocument();
	});

	it('preserves property language for business contexts', () => {
		render(<AppZeroState kind='noProperties' context='property' />);

		expect(screen.getByText('Property Setup')).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'No properties yet' })).toBeInTheDocument();
	});
});
