import React from 'react';
import {
	MissionSection,
	MissionTitle,
	MissionContent,
	MissionCard,
	MissionCardIcon,
	MissionCardTitle,
	MissionCardDescription,
} from '../LandingPage.styles';

const MissionSectionComponent = () => {
	return (
		<MissionSection id='Mission'>
			<MissionTitle>Why We're Different</MissionTitle>
			<MissionContent>
				<MissionCard>
					<MissionCardIcon>🎯</MissionCardIcon>
					<MissionCardTitle>Built for You</MissionCardTitle>
					<MissionCardDescription>
						We get it. You're managing everything yourself or with a small team.
						No bloat, no overwhelming features.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>⚡</MissionCardIcon>
					<MissionCardTitle>Quick to Set Up</MissionCardTitle>
					<MissionCardDescription>
						Get started in minutes. Invite your tenants or contractors. Done. No
						training needed.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>💰</MissionCardIcon>
					<MissionCardTitle>Affordable</MissionCardTitle>
					<MissionCardDescription>
						No enterprise pricing schemes. Fair rates for individuals and small
						landlords. Tenants and contractors can join for free.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon>🛡️</MissionCardIcon>
					<MissionCardTitle>Secure & Private</MissionCardTitle>
					<MissionCardDescription>
						Your property details stay private. Built on secure, trusted
						infrastructure.
					</MissionCardDescription>
				</MissionCard>
			</MissionContent>
		</MissionSection>
	);
};

export default MissionSectionComponent;
