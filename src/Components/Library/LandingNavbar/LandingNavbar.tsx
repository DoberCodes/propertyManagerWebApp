import { useEffect, useRef, useState } from 'react';
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
import publicNavigation from '../../../config/publicNavigation.json';

type NavigationItem = {
	id: string;
	label: string;
	type: 'page' | 'application' | 'section' | 'group';
	href?: string;
	publicHref?: string;
	style?: 'login' | 'cta';
	enabled?: boolean;
	children?: NavigationItem[];
};

const navigationItems = publicNavigation.items as NavigationItem[];

export const LandingNavbar = () => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const navRef = useRef<HTMLDivElement>(null);

	const closeNavigation = () => {
		setIsMenuOpen(false);
		setOpenDropdown(null);
	};

	useEffect(() => {
		if (!isMenuOpen && !openDropdown) return undefined;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return;
			setIsMenuOpen(false);
			setOpenDropdown(null);
		};
		const handlePointerDown = (event: PointerEvent) => {
			if (navRef.current?.contains(event.target as Node)) return;
			setIsMenuOpen(false);
			setOpenDropdown(null);
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('pointerdown', handlePointerDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('pointerdown', handlePointerDown);
		};
	}, [isMenuOpen, openDropdown]);

	const renderDestination = (item: NavigationItem, dropdown = false) => {
		if (item.enabled === false || !item.href) return null;

		if (item.type === 'section') {
			return (
				<NavAnchor
					key={item.id}
					to={item.href}
					onClick={closeNavigation}
					scroll={(element) => element.scrollIntoView({ behavior: 'auto', block: 'start' })}>
					{item.label}
				</NavAnchor>
			);
		}

		if (item.type === 'application') {
			if (item.style === 'cta') {
				return <NavButton key={item.id} to={item.href} onClick={closeNavigation}>{item.label}</NavButton>;
			}
			return <NavLoginLink key={item.id} to={item.href} onClick={closeNavigation}>{item.label}</NavLoginLink>;
		}

		if (dropdown) {
			return <NavDropdownLink key={item.id} href={item.href} onClick={closeNavigation}>{item.label}</NavDropdownLink>;
		}

		return <NavExternalLink key={item.id} href={item.href} onClick={closeNavigation}>{item.label}</NavExternalLink>;
	};

	return (
		<NavWrapper
			ref={navRef}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					setOpenDropdown(null);
				}
			}}>
			<NavTitle>
				<img src={TitleName} alt='Maintley App Logo' />
			</NavTitle>
			<MobileMenuButton
				type='button'
				aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
				aria-expanded={isMenuOpen}
				aria-controls='landing-navigation-links'
				onClick={() => {
					if (isMenuOpen) setOpenDropdown(null);
					setIsMenuOpen((open) => !open);
				}}>
				<FontAwesomeIcon icon={isMenuOpen ? faXmark : faBars} />
			</MobileMenuButton>
			<ButtonWrapper id='landing-navigation-links' $isOpen={isMenuOpen}>
				{navigationItems
					.filter((item) => item.enabled !== false)
					.map((item) => {
						if (item.type !== 'group') return renderDestination(item);

						const children = (item.children || []).filter((child) => child.enabled !== false);
						if (children.length === 0) return null;
						const panelId = `landing-nav-${item.id}`;
						const isOpen = openDropdown === item.id;

						return (
							<NavDropdown key={item.id} open={isOpen}>
								<summary
									aria-controls={panelId}
									aria-expanded={isOpen}
									onClick={(event) => {
										event.preventDefault();
										setOpenDropdown((current) => current === item.id ? null : item.id);
									}}>
									{item.label}
								</summary>
								<div id={panelId}>
									{children.map((child) => renderDestination(child, true))}
								</div>
							</NavDropdown>
						);
					})}
			</ButtonWrapper>
		</NavWrapper>
	);
};
