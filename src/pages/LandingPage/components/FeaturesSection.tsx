import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faClipboardList,
	faBuilding,
	faScrewdriverWrench,
	faChartLine,
	faCamera,
	faBell,
	faMagnifyingGlass,
	faMobileScreenButton,
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
			<FeaturesTitle>Comprehensive Maintenance History Tools</FeaturesTitle>
			<FeatureGrid>
				<FeatureCard $flagship>
					<FeatureIcon className='history' $flagship>
						<FontAwesomeIcon icon={faClipboardList} />
					</FeatureIcon>
					<FeatureTitle $flagship>Detailed Maintenance Records</FeatureTitle>
					<FeatureDescription>
						Create and maintain comprehensive maintenance history for every
						property, unit, device, and component. Build records you can
						reference and organize — the foundation everything else is built on.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='unit'>
						<FontAwesomeIcon icon={faBuilding} />
					</FeatureIcon>
					<FeatureTitle>Individual Unit History</FeatureTitle>
					<FeatureDescription>
						Track maintenance history for each individual unit and device
						separately. Know the complete service history of every component.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='contractor'>
						<FontAwesomeIcon icon={faScrewdriverWrench} />
					</FeatureIcon>
					<FeatureTitle>Contractor History Tracking</FeatureTitle>
					<FeatureDescription>
						Maintain detailed records of all contractor work and services. Build
						a complete history of who did what, when, and how.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='analytics'>
						<FontAwesomeIcon icon={faChartLine} />
					</FeatureIcon>
					<FeatureTitle>History Analytics & Reporting</FeatureTitle>
					<FeatureDescription>
						Generate detailed reports on maintenance history, patterns, and
						trends. Export your complete maintenance records as
						reference/supporting documentation.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='documentation'>
						<FontAwesomeIcon icon={faCamera} />
					</FeatureIcon>
					<FeatureTitle>Visual Documentation</FeatureTitle>
					<FeatureDescription>
						Attach photos, notes, and details to every maintenance entry. Build
						a visual history that tells the complete story of your property's
						care.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='reminders'>
						<FontAwesomeIcon icon={faBell} />
					</FeatureIcon>
					<FeatureTitle>Personalized Reminders</FeatureTitle>
					<FeatureDescription>
						Set custom reminders based on your own maintenance history patterns.
						Stay proactive with notifications tied to the schedules you
						establish through your documented service records.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='search'>
						<FontAwesomeIcon icon={faMagnifyingGlass} />
					</FeatureIcon>
					<FeatureTitle>Searchable History</FeatureTitle>
					<FeatureDescription>
						Quickly find any maintenance record with powerful search and
						filtering. Access your complete history instantly when you need it.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='mobile'>
						<FontAwesomeIcon icon={faMobileScreenButton} />
					</FeatureIcon>
					<FeatureTitle>Mobile History Access</FeatureTitle>
					<FeatureDescription>
						Access your complete maintenance history on any device. Your records
						are always available when you need to reference past work.
					</FeatureDescription>
				</FeatureCard>
			</FeatureGrid>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
