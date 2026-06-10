import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faClipboardList,
	faBuilding,
	faScrewdriverWrench,
	faCamera,
	faMagnifyingGlass,
	faMobileScreenButton,
	faFileLines,
} from '@fortawesome/free-solid-svg-icons';
import {
	FeaturesSection,
	FeaturesTitle,
	FeatureGrid,
	FeatureCard,
	FeatureIcon,
	FeatureTitle,
	FeatureDescription,
} from '../LandingPage.styles';

const FeaturesSectionComponent = () => {
	return (
		<FeaturesSection id='Features'>
			<FeaturesTitle>What Maintley Keeps Connected</FeaturesTitle>
			<FeatureGrid>
				<FeatureCard $flagship>
					<FeatureIcon className='history' $flagship>
						<FontAwesomeIcon icon={faClipboardList} />
					</FeatureIcon>
					<FeatureTitle $flagship>Property Records</FeatureTitle>
					<FeatureDescription>
						Keep repairs, replacements, service notes, and reports tied to the
						home instead of buried in separate folders.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='unit'>
						<FontAwesomeIcon icon={faBuilding} />
					</FeatureIcon>
					<FeatureTitle>Appliances & Systems</FeatureTitle>
					<FeatureDescription>
						Follow HVAC, appliances, filters, linked parts, and appliance history in
						one connected place.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='contractor'>
						<FontAwesomeIcon icon={faScrewdriverWrench} />
					</FeatureIcon>
					<FeatureTitle>Recurring Care</FeatureTitle>
					<FeatureDescription>
						Store reminders, seasonal upkeep, and recurring service so future
						you knows what needs to happen next.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='analytics'>
						<FontAwesomeIcon icon={faFileLines} />
					</FeatureIcon>
					<FeatureTitle>Team Coordination</FeatureTitle>
					<FeatureDescription>
						Keep tenants, contractors, and managers aligned around the same
						maintenance memory.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='documentation'>
						<FontAwesomeIcon icon={faCamera} />
					</FeatureIcon>
					<FeatureTitle>Documents & Photos</FeatureTitle>
					<FeatureDescription>
						Attach receipts, warranties, photos, and notes directly to the
						service history.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='search'>
						<FontAwesomeIcon icon={faMagnifyingGlass} />
					</FeatureIcon>
					<FeatureTitle>Find Anything Fast</FeatureTitle>
					<FeatureDescription>
						Search the history later without digging through texts, folders, or
						emails.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='mobile'>
						<FontAwesomeIcon icon={faMobileScreenButton} />
					</FeatureIcon>
					<FeatureTitle>Mobile History Access</FeatureTitle>
					<FeatureDescription>
						Keep the full property story close at hand from any device.
					</FeatureDescription>
				</FeatureCard>
			</FeatureGrid>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
