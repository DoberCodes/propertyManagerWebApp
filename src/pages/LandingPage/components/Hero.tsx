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
				<HeroTitle>Your Home Builds History. Maintley Makes Sure It Never Gets Lost.</HeroTitle>
				<HeroSubtitle>
					Keep systems, maintenance, documents, warranties, and replacements
					together in one place, so every repair becomes part of your property's long-term history, helping future you make better maintenance decisions.
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
