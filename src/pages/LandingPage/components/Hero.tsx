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
				<HeroTitle>
					The home maintenance tracker that remembers every repair, appliance,
					and document
				</HeroTitle>
				<HeroSubtitle>
					Track home maintenance tasks, equipment records, service history,
					warranties, manuals, invoices, photos, and recurring reminders in one
					place.
				</HeroSubtitle>
				<HeroCTA onClick={() => navigate('/register')}>
					Start tracking your home
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
