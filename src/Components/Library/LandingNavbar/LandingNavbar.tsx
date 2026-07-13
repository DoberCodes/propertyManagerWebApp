import React from 'react';
import {
	ButtonWrapper,
	NavAnchor,
	NavButton,
	NavExternalLink,
	NavTitle,
	NavWrapper,
} from './LandingNavbar.styles';
import TitleName from '../../../Assets/TitleName.png';

export const LandingNavbar = () => {
	return (
		<NavWrapper>
			<NavTitle>
				<img src={TitleName} alt='Maintley App Logo' />
			</NavTitle>
			<ButtonWrapper>
				<NavAnchor
					to='#About'
					scroll={(el) =>
						el.scrollIntoView({
							behavior: 'auto',
							block: 'start',
						})
					}>
					About
				</NavAnchor>
				<NavAnchor
					to='#MaintleyLoop'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					How It Works
				</NavAnchor>
				<NavAnchor
					to='#Features'
					className='secondary-nav-link'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Feature Highlights
				</NavAnchor>
				<NavExternalLink href='/features/' className='secondary-nav-link'>
					Feature Catalog
				</NavExternalLink>
				<NavExternalLink href='/homeowners/' className='secondary-nav-link'>
					Homeowners
				</NavExternalLink>
				<NavExternalLink href='/pricing/' className='secondary-nav-link'>
					Pricing
				</NavExternalLink>
				<NavExternalLink href='/resources/' className='secondary-nav-link'>
					Resources
				</NavExternalLink>
				<NavAnchor
					to='#Pricing'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Pricing
				</NavAnchor>
				<NavAnchor
					to='#Contact'
					className='secondary-nav-link'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Contact
				</NavAnchor>
				<NavButton to='/login'>Login</NavButton>
			</ButtonWrapper>
		</NavWrapper>
	);
};
