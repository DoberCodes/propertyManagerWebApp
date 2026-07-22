import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
	ButtonWrapper,
	MobileMenuButton,
	NavAnchor,
	NavButton,
	NavDropdown,
	NavDropdownLink,
	NavExternalLink,
	NavLoginLink,
	NavTitle,
	NavWrapper,
} from './LandingNavbar.styles';
import TitleName from '../../../Assets/TitleName.png';

export const LandingNavbar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const closeMenu = () => setIsMenuOpen(false);

	useEffect(() => {
		if (!isMenuOpen) return undefined;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') closeMenu();
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [isMenuOpen]);

	return (
		<NavWrapper>
			<NavTitle>
				<img src={TitleName} alt='Maintley App Logo' />
			</NavTitle>
			<MobileMenuButton
				type='button'
				aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={isMenuOpen}
				aria-controls='landing-navigation-links'
				onClick={() => setIsMenuOpen((open) => !open)}>
				<FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
			</MobileMenuButton>
			<ButtonWrapper id='landing-navigation-links' $isOpen={isMenuOpen}>
				<NavExternalLink href='/features/' onClick={closeMenu}>
					Features
				</NavExternalLink>
				<NavDropdown>
					<summary>Solutions</summary>
					<div>
						<NavDropdownLink href='/homeowners/' onClick={closeMenu}>Homeowners</NavDropdownLink>
						<NavDropdownLink href='/property-managers/' onClick={closeMenu}>Property Managers</NavDropdownLink>
						<NavAnchor to='#Contact' onClick={closeMenu}>Businesses</NavAnchor>
					</div>
				</NavDropdown>
				<NavDropdown>
					<summary>Resources</summary>
					<div>
						<NavDropdownLink href='/resources/' onClick={closeMenu}>Resources</NavDropdownLink>
						<NavDropdownLink href='/#/help' onClick={closeMenu}>Help Center</NavDropdownLink>
						<NavAnchor to='#Download' onClick={closeMenu}>Download</NavAnchor>
					</div>
				</NavDropdown>
				<NavAnchor
					to='#Pricing'
					onClick={closeMenu}
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Pricing
				</NavAnchor>
				<NavLoginLink to='/login' onClick={closeMenu}>Login</NavLoginLink>
				<NavButton to='/register' onClick={closeMenu}>Start Free</NavButton>
			</ButtonWrapper>
		</NavWrapper>
	);
};
