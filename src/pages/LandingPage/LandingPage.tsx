import React from 'react';
import { NavWrapper, NavTitle } from './LandingPage.styles';
import { HeroImage } from '../../Components/HeroImage';

export const LandingPage = () => {
	return (
		<>
			<HeroImage></HeroImage>
			<NavWrapper>
				<NavTitle>My Property Manager</NavTitle>
			</NavWrapper>
		</>
	);
};
