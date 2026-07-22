import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPageComponent from './LandingPage';

describe('LandingPage public hierarchy', () => {
	it('shows product proof and audience fit before the core feature overview', () => {
		render(
			<MemoryRouter>
				<LandingPageComponent />
			</MemoryRouter>,
		);

		const sectionIds = Array.from(document.querySelectorAll('section'))
			.map((section) => section.id)
			.filter(Boolean);

		expect(sectionIds).toEqual([
			'ProductProof',
			'HowItWorks',
			'Solutions',
			'Features',
			'Security',
			'Pricing',
		]);
		expect(
			screen.getByRole('heading', {
				name: 'See your home’s maintenance story in one place',
			}),
		).toBeInTheDocument();
		expect(
			document.querySelectorAll('img[src^="/screenshots/maintley"]'),
		).toHaveLength(4);
		expect(screen.getByText('For Homeowners')).toBeInTheDocument();
		expect(screen.getByText('For Property Owners & Managers')).toBeInTheDocument();
		expect(screen.queryByText('Service Businesses')).not.toBeInTheDocument();
	});

	it('keeps pricing compact while preserving every current public plan', () => {
		render(
			<MemoryRouter>
				<LandingPageComponent />
			</MemoryRouter>,
		);

		expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Homeowner+' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Property' })).toBeInTheDocument();
		expect(screen.getByRole('heading', { name: 'Portfolio' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Compare every plan' })).toHaveAttribute(
			'href',
			'/pricing/',
		);
		expect(screen.queryByText('How It All Started')).not.toBeInTheDocument();
		expect(screen.queryByText('Get in Touch')).not.toBeInTheDocument();
	});
});
