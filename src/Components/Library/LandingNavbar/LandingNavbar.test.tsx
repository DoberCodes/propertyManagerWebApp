import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingNavbar } from './LandingNavbar';

describe('LandingNavbar', () => {
	it('exposes enabled destinations and keeps dropdowns mutually exclusive', () => {
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
		const [solutionsDetails, resourcesDetails] = screen.getAllByRole('group');
		const solutionsSummary = screen.getByText('Solutions', { selector: 'summary' });
		const resourcesSummary = screen.getByText('Resources', { selector: 'summary' });
		fireEvent.click(solutionsSummary);
		expect(solutionsDetails).toHaveAttribute('open');
		expect(screen.getByRole('link', { name: 'Homeowners' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Property Owners & Managers' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Service Businesses' })).not.toBeInTheDocument();

		fireEvent.click(resourcesSummary);
		expect(resourcesDetails).toHaveAttribute('open');
		expect(solutionsDetails).not.toHaveAttribute('open');
		expect(screen.getByRole('link', { name: 'Home Maintenance Checklist' })).toHaveAttribute('href', '/resources/home-maintenance-checklist/');
		expect(screen.getByRole('link', { name: 'Seasonal Maintenance Schedule' })).toHaveAttribute('href', '/resources/seasonal-home-maintenance-schedule/');
		expect(screen.getByRole('link', { name: 'Home Service History' })).toHaveAttribute('href', '/resources/home-service-history/');
		expect(screen.getByRole('link', { name: 'All Articles' })).toHaveAttribute('href', '/resources/');
		expect(screen.queryByRole('link', { name: 'Help Center' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing/');
		expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Start Free' })).toBeInTheDocument();
	});

	it('closes the menu and an open dropdown with Escape', () => {
		render(
			<MemoryRouter>
				<LandingNavbar />
			</MemoryRouter>,
		);

		fireEvent.click(screen.getByLabelText('Open navigation menu'));
		const [solutionsDetails] = screen.getAllByRole('group');
		const solutionsSummary = screen.getByText('Solutions', { selector: 'summary' });
		fireEvent.click(solutionsSummary);
		fireEvent.keyDown(window, { key: 'Escape' });

		expect(
			screen.getByLabelText('Open navigation menu'),
		).toHaveAttribute('aria-expanded', 'false');
		expect(solutionsDetails).not.toHaveAttribute('open');
	});
});
