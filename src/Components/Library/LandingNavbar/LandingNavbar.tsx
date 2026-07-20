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
					className='optional-nav-link'
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
					className='optional-nav-link'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					How It Works
				</NavAnchor>
				<NavExternalLink href='/features/' className='secondary-nav-link'>
					Features
				</NavExternalLink>
				<NavExternalLink href='/homeowners/' className='secondary-nav-link'>
					Homeowners
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
				<NavButton to='/login'>Login</NavButton>
			</ButtonWrapper>
		</NavWrapper>
	);
};
