import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faBookOpen,
	faBuilding,
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
						Preserve repairs, replacements, service records, reports, and
						documents as part of the home itself.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon className='unit'>
						<FontAwesomeIcon icon={faBuilding} />
					</MissionCardIcon>
					<MissionCardTitle>Appliances & Systems</MissionCardTitle>
					<MissionCardDescription>
						Track HVAC, appliances, filters, parts, and equipment history with
						the context that makes each record useful later.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon className='security'>
						<FontAwesomeIcon icon={faScrewdriverWrench} />
					</MissionCardIcon>
					<MissionCardTitle>Recurring Care</MissionCardTitle>
					<MissionCardDescription>
						Turn seasonal upkeep, reminders, recurring service, and follow-up
						work into a timeline future you can rely on.
					</MissionCardDescription>
				</MissionCard>
				<MissionCard>
					<MissionCardIcon className='mobile'>
						<FontAwesomeIcon icon={faMobileScreenButton} />
					</MissionCardIcon>
					<MissionCardTitle>Team Coordination</MissionCardTitle>
					<MissionCardDescription>
						Help tenants, contractors, and maintenance partners make decisions
						from the same property history.
					</MissionCardDescription>
				</MissionCard>
			</MissionContent>
		</MissionSection>
	);
};

export default MissionSectionComponent;
