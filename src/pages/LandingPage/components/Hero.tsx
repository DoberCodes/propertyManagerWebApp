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
				<HeroTitle>Keep the Full Maintenance History of Your Home Organized</HeroTitle>
				<HeroSubtitle>
					Maintley keeps systems, service history, recurring care, documents,
					and replacements connected in one place so nothing gets lost over
					time.
				</HeroSubtitle>
				<HeroCTA onClick={() => navigate('/register')}>
					Get Started Free
				</HeroCTA>
			</HeroContent>
			<HeroImage>
				<img
					src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop'
					alt='Organized home maintenance history view'
				/>
			</HeroImage>
		</Hero>
	);
};

export default HeroSection;
