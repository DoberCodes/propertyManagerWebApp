import { createRef, useEffect, useRef, useState } from 'react';
import {
	ButtonWrapper,
	IconWrapper,
	NavButton,
	NavTitle,
	NavWrapper,
} from './LandingNavbar.styles';

export const LandingNavbar = () => {
	const wrapperRef = createRef();
	const [stickyClass, setStickyClass] = useState('');
	console.log(wrapperRef.current);
	useEffect(() => {
		window.addEventListener('scroll', stickNavbar);

		return () => {
			window.removeEventListener('scroll', stickNavbar);
		};
	}, [stickyClass]);
	useEffect(() => {}, [stickyClass]);

	const stickNavbar = () => {
		if (window !== undefined) {
			let windowHeight = window.scrollY;
			windowHeight >= 550 ? setStickyClass('fixed') : setStickyClass('');
		}
	};
	return (
		<NavWrapper position={stickyClass}>
			<IconWrapper></IconWrapper>
			<NavTitle>My Property Manager</NavTitle>
			<ButtonWrapper>
				<NavButton href='#About'>Our Story</NavButton>
				<NavButton href='#Mission'>Our Mission</NavButton>
				<NavButton href='#Contact'>Contact Us</NavButton>
				<NavButton href='/login'>Login</NavButton>
			</ButtonWrapper>
		</NavWrapper>
	);
};
