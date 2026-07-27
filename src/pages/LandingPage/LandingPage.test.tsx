import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPageComponent from './LandingPage';

describe('LandingPage public hierarchy', () => {
	it('shows product proof and audience fit without repeating the feature catalog', () => {
		render(
			<MemoryRouter>
				<LandingPageComponent />
			</MemoryRouter>,
		);

		// Structural order has no accessible-query equivalent because these sections are intentionally unnamed.
		// eslint-disable-next-line testing-library/no-node-access
		const sectionIds = Array.from(document.querySelectorAll('section'))
			.map((section) => section.id)
			.filter(Boolean);

		expect(sectionIds).toEqual([
			'ProductProof',
			'HowItWorks',
			'Solutions',
			'Security',
			'Resources',
			'Pricing',
			'FAQ',
		]);
		expect(
			screen.getByRole('heading', {
				name: 'See your home’s maintenance story in one place',
			}),
		).toBeInTheDocument();
		expect(
			screen
				.getAllByRole('img')
				.filter((image) => image.getAttribute('src')?.startsWith('/screenshots/maintley')),
		).toHaveLength(2);
		expect(
			screen.getByRole('img', {
				name: 'Maintley Maintenance History tab showing completed work and record details',
			}),
		).toHaveAttribute('src', '/screenshots/desktop_taskhistory.png');
		expect(
			screen.getByRole('img', {
				name: 'Maintley Intelligence property scan results showing explainable maintenance findings',
			}),
		).toHaveAttribute('src', '/screenshots/desktop_quickscan2.png');
		expect(screen.getByText('For Homeowners')).toBeInTheDocument();
		expect(
			screen.getByText('For Property Owners & Managers'),
		).toBeInTheDocument();
		expect(screen.queryByText('Service Businesses')).not.toBeInTheDocument();
		expect(
			screen.queryByRole('heading', { name: 'Core Features' }),
		).not.toBeInTheDocument();
		expect(
			screen
				.getAllByRole('link', { name: 'Home Maintenance Checklist' })
				.some(
					(link) =>
						link.getAttribute('href') ===
						'/resources/home-maintenance-checklist/',
				),
		).toBe(true);
		expect(
			screen.getByRole('link', { name: 'Review security and privacy' }),
		).toHaveAttribute('href', '/security-and-privacy/');
		expect(
			screen.getByRole('img', {
				name: 'Illustrated home connected to maintenance, document, schedule, and warranty records',
			}),
		).toHaveAttribute('src', '/screenshots/maintleyHomeHeroV2.webp');
	});

	it('shows stable FAQ answers and matching FAQ structured data', () => {
		render(
			<MemoryRouter>
				<LandingPageComponent />
			</MemoryRouter>,
		);

		expect(
			screen.getByText('Does Maintley verify maintenance work?'),
		).toBeInTheDocument();
		expect(
			screen.getByText(/it does not certify that work was performed/i),
		).toBeInTheDocument();

		// JSON-LD is non-interactive metadata and cannot be selected by an accessible role.
		/* eslint-disable testing-library/no-node-access */
		const faqSchema = Array.from(
			document.head.querySelectorAll('script[type="application/ld+json"]'),
		)
			.map((script) => JSON.parse(script.textContent || '{}'))
			.find((schema) => schema['@type'] === 'FAQPage');
		/* eslint-enable testing-library/no-node-access */

		expect(faqSchema).toBeDefined();
		expect(faqSchema.mainEntity).toHaveLength(8);
		expect(faqSchema.mainEntity[4].name).toBe(
			'Does Maintley verify maintenance work?',
		);
	});

	it('keeps pricing compact while preserving every current public plan', () => {
		render(
			<MemoryRouter>
				<LandingPageComponent />
			</MemoryRouter>,
		);

		expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Homeowner+' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Property' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('heading', { name: 'Portfolio' }),
		).toBeInTheDocument();
		expect(
			screen.getByRole('link', { name: 'Compare every plan' }),
		).toHaveAttribute('href', '/pricing/');
		expect(screen.queryByText('How It All Started')).not.toBeInTheDocument();
		expect(screen.queryByText('Get in Touch')).not.toBeInTheDocument();
	});
});
