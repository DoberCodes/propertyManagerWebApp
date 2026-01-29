import React from 'react';
import {
	ButtonWrapper,
	IconWrapper,
	NavAnchor,
	NavButton,
	NavTitle,
	NavWrapper,
} from './LandingNavbar.styles';

export const LandingNavbar = () => {
	return (
		<NavWrapper>
			<IconWrapper></IconWrapper>
			<NavTitle>My Property Manager</NavTitle>
			<ButtonWrapper>
				<NavAnchor
					to='#About'
					scroll={(el) =>
						el.scrollIntoView({
							behavior: 'auto',
							block: 'start',
						})
					}>
					Our Story
				</NavAnchor>
				<NavAnchor
					to='#Mission'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Our Mission
				</NavAnchor>
				<NavAnchor
					to='#Contact'
					scroll={(el) =>
						el.scrollIntoView({ behavior: 'auto', block: 'start' })
					}>
					Contact Us
				</NavAnchor>
				<NavButton to='/login'>Login</NavButton>
			</ButtonWrapper>
		</NavWrapper>
	);
};
