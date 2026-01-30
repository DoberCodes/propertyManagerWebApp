import React from 'react';
import {
	FeaturesSection,
	FeaturesTitle,
	FeaturesGrid,
	FeatureCard,
	FeatureIcon,
	FeatureTitle,
	FeatureDescription,
} from '../LandingPage.styles';

const FeaturesSectionComponent = () => {
	return (
		<FeaturesSection id='Features'>
			<FeaturesTitle>Everything You Need</FeaturesTitle>
			<FeaturesGrid>
				<FeatureCard>
					<FeatureIcon>🔧</FeatureIcon>
					<FeatureTitle>Simple Maintenance Tracking</FeatureTitle>
					<FeatureDescription>
						Log repairs and maintenance issues in seconds. See what needs to be
						done at a glance.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>📸</FeatureIcon>
					<FeatureTitle>Photo Documentation</FeatureTitle>
					<FeatureDescription>
						Attach photos to maintenance requests. Keep a visual history of
						repairs and updates.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>👥</FeatureIcon>
					<FeatureTitle>Invite Tenants & Contractors</FeatureTitle>
					<FeatureDescription>
						Let tenants report issues. Contractors can update progress. Everyone
						stays in sync.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>📋</FeatureIcon>
					<FeatureTitle>Request Priority & Status</FeatureTitle>
					<FeatureDescription>
						Mark urgent vs. routine. Track what's pending, in progress, or
						complete.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>📱</FeatureIcon>
					<FeatureTitle>Works Everywhere</FeatureTitle>
					<FeatureDescription>
						Desktop, tablet, or phone. Manage your property from anywhere,
						anytime.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon>💬</FeatureIcon>
					<FeatureTitle>Built-in Messaging</FeatureTitle>
					<FeatureDescription>
						No more scattered texts and emails. Communicate right where the work
						happens.
					</FeatureDescription>
				</FeatureCard>
			</FeaturesGrid>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
