import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PricingSectionComponent from './PricingSection';

describe('PricingSection', () => {
	it('switches cards, comparison columns, and supporting copy by audience', () => {
		render(
			<MemoryRouter>
				<PricingSectionComponent />
			</MemoryRouter>,
		);

		const homeownerButton = screen.getByRole('button', { name: 'Homeowner' });
		const businessButton = screen.getByRole('button', { name: 'Business' });

		expect(homeownerButton).toHaveAttribute('aria-pressed', 'true');
		expect(businessButton).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Homeowner+' })).toBeInTheDocument();
		expect(screen.queryByRole('heading', { name: 'Portfolio' })).not.toBeInTheDocument();
		expect(screen.getByText(/Start free, then add reminders/)).toBeInTheDocument();

		fireEvent.click(businessButton);

		expect(homeownerButton).toHaveAttribute('aria-pressed', 'false');
		expect(businessButton).toHaveAttribute('aria-pressed', 'true');
		expect(screen.queryByRole('heading', { name: 'Free' })).not.toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Property' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeInTheDocument();
		expect(screen.getByText(/For landlords, property owners/)).toBeInTheDocument();
		expect(screen.getByText('7 properties')).toBeInTheDocument();
		expect(screen.getByText('15 properties')).toBeInTheDocument();
		expect(screen.queryByText('Resident profiles')).not.toBeInTheDocument();
	});
});
