import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBookOpen,
	faBuilding,
	faShieldHalved,
	faMobileScreenButton,
	faScrewdriverWrench,
} from '@fortawesome/free-solid-svg-icons';
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
			<MissionTitle>Built for Real Ownership</MissionTitle>
			<MissionContent>
				<MissionCard>
					<MissionCardIcon className='history'>
						<FontAwesomeIcon icon={faBookOpen} />
					</MissionCardIcon>
					<MissionCardTitle>Property History</MissionCardTitle>
					<MissionCardDescription>
						Keep repairs, replacements, service records, reports, and documents
						connected to the home itself.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon className='unit'>
						<FontAwesomeIcon icon={faBuilding} />
					</MissionCardIcon>
					<MissionCardTitle>Appliances & Systems</MissionCardTitle>
					<MissionCardDescription>
						Track HVAC, appliances, filters, linked parts, and equipment history
						with the context that keeps them useful.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon className='security'>
						<FontAwesomeIcon icon={faScrewdriverWrench} />
					</MissionCardIcon>
					<MissionCardTitle>Recurring Care</MissionCardTitle>
					<MissionCardDescription>
						Keep seasonal upkeep, reminders, recurring service, and follow-up work
						attached to the property timeline.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon className='mobile'>
						<FontAwesomeIcon icon={faMobileScreenButton} />
					</MissionCardIcon>
					<MissionCardTitle>Team Coordination</MissionCardTitle>
					<MissionCardDescription>
						Keep tenants, contractors, and maintenance partners aligned around
						the same living record.
					</MissionCardDescription>
				</MissionCard>
			</MissionContent>
		</MissionSection>
	);
};

export default MissionSectionComponent;
