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
					Whether you own a single home or manage a small portfolio, keeping up
					with maintenance shouldn’t feel like a second job—or a second
					mortgage. We offer simple, affordable tools that help homeowners,
					small landlords, and DIYers stay on top of it all.
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
