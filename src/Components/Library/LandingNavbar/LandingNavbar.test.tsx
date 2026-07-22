import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingNavbar } from './LandingNavbar';

describe('LandingNavbar', () => {
	it('exposes every landing destination through the mobile menu', () => {
		render(
			<MemoryRouter>
				<LandingNavbar />
			</MemoryRouter>,
		);

		const menuButton = screen.getByLabelText('Open navigation menu');
		expect(menuButton).toHaveAttribute('aria-expanded', 'false');

		fireEvent.click(menuButton);

		expect(menuButton).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument();
		fireEvent.click(screen.getByText('Solutions'));
		expect(screen.getByRole('link', { name: 'Homeowners' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Property Managers' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Businesses' })).toBeInTheDocument();
		fireEvent.click(screen.getByText('Resources', { selector: 'summary' }));
		expect(screen.getByRole('link', { name: 'Resources' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Help Center' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Pricing' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Start Free' })).toBeInTheDocument();
	});

	it('closes the menu with Escape', () => {
		render(
			<MemoryRouter>
				<LandingNavbar />
			</MemoryRouter>,
		);

		fireEvent.click(screen.getByLabelText('Open navigation menu'));
		fireEvent.keyDown(window, { key: 'Escape' });

		expect(
			screen.getByLabelText('Open navigation menu'),
		).toHaveAttribute('aria-expanded', 'false');
	});
});
