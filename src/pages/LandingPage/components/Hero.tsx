import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Hero,
	HeroContent,
	HeroTitle,
	HeroSubtitle,
	HeroCTA,
	HeroImage,
} from '../LandingPage.styles';

const HeroSection = () => {
	const navigate = useNavigate();

	return (
		<Hero>
			<HeroContent>
				<HeroTitle>Your Maintenance, Simplified</HeroTitle>
				<HeroSubtitle>
					Whether you own one rental or manage a small portfolio, keeping track
					of maintenance shouldn't feel like a second job. We help homeowners
					and small landlords stay on top of it all—the simple way.
				</HeroSubtitle>
				<HeroCTA onClick={() => navigate('/register')}>
					Get Started Free
				</HeroCTA>
			</HeroContent>
			<HeroImage>
				<img
					src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop'
					alt='Property management dashboard'
				/>
			</HeroImage>
		</Hero>
	);
};

export default HeroSection;
