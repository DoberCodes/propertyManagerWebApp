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
			<FeaturesTitle>What Maintley Helps You Preserve</FeaturesTitle>
			<FeatureGrid>
				<FeatureCard $flagship>
					<FeatureIcon className='history' $flagship>
						<FontAwesomeIcon icon={faClipboardList} />
					</FeatureIcon>
					<FeatureTitle $flagship>Property Records</FeatureTitle>
					<FeatureDescription>
						Preserve repairs, replacements, service notes, and reports in the
						property history instead of scattered folders.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='unit'>
						<FontAwesomeIcon icon={faBuilding} />
					</FeatureIcon>
					<FeatureTitle>Appliances & Systems</FeatureTitle>
					<FeatureDescription>
						Keep HVAC, appliances, filters, parts, and service history with the
						systems they belong to.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='contractor'>
						<FontAwesomeIcon icon={faScrewdriverWrench} />
					</FeatureIcon>
					<FeatureTitle>Recurring Care</FeatureTitle>
					<FeatureDescription>
						Remember seasonal upkeep and recurring service so future you knows
						what needs attention next.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='analytics'>
						<FontAwesomeIcon icon={faFileLines} />
					</FeatureIcon>
					<FeatureTitle>Shared Property Knowledge</FeatureTitle>
					<FeatureDescription>
						Help tenants, contractors, and managers work from the same property
						history.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='documentation'>
						<FontAwesomeIcon icon={faCamera} />
					</FeatureIcon>
					<FeatureTitle>Documents & Photos</FeatureTitle>
					<FeatureDescription>
						Attach receipts, warranties, photos, and notes where future
						decisions will need them.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='search'>
						<FontAwesomeIcon icon={faMagnifyingGlass} />
					</FeatureIcon>
					<FeatureTitle>Find Anything Fast</FeatureTitle>
					<FeatureDescription>
						Find the answer later without digging through texts, folders, or
						emails.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='mobile'>
						<FontAwesomeIcon icon={faMobileScreenButton} />
					</FeatureIcon>
					<FeatureTitle>Mobile Recordkeeping</FeatureTitle>
					<FeatureDescription>
						Capture maintenance while the details are still fresh, from any
						device.
					</FeatureDescription>
				</FeatureCard>
			</FeatureGrid>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
