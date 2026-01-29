import React from 'react';
import { Wrapper } from './LandingPage.styles';
import { LandingNavbar } from '../../Components/Library/LandingNavbar';
import { HeroImage } from '../../Components/Library/HeroImage';
import { Section } from '../../Components/Library/Section';

export const LandingPage = () => {
	return (
		<>
			<LandingNavbar />
			<Wrapper>
				<HeroImage />
				<Section id='About' style={{ height: '100vh' }} background='orange'>
					This is about me part of the page
				</Section>
				<Section id='Mission' style={{ height: '100vh' }} background='yellow'>
					This is Mission part of the page
				</Section>
				<Section id='Contact' style={{ height: '100vh' }} background='red'>
					This is Contact part of the page
				</Section>
			</Wrapper>
		</>
	);
};
