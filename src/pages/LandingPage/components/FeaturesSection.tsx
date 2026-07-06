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
	faUsers,
} from '@fortawesome/free-solid-svg-icons';
import {
	FeaturesSection,
	FeaturesTitle,
	FeaturesIntro,
	FeatureGrid,
	FeatureCard,
	FeatureIcon,
	FeatureTitle,
	FeatureDescription,
} from '../LandingPage.styles';

const FeaturesSectionComponent = () => {
	return (
		<FeaturesSection id='Features'>
			<FeaturesTitle>Everything Maintley Keeps Together</FeaturesTitle>
			<FeaturesIntro>
				Maintley brings the records, equipment, documents, people, and recurring
				care around your home into one place so every detail has a purpose.
			</FeaturesIntro>
			<FeatureGrid>
				<FeatureCard $flagship>
					<FeatureIcon className='history' $flagship>
						<FontAwesomeIcon icon={faClipboardList} />
					</FeatureIcon>
					<FeatureTitle $flagship>Property History</FeatureTitle>
					<FeatureDescription>
						Preserve repairs, replacements, service records, reports, and
						documents as part of the home itself.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='unit'>
						<FontAwesomeIcon icon={faBuilding} />
					</FeatureIcon>
					<FeatureTitle>Equipment Records</FeatureTitle>
					<FeatureDescription>
						Keep HVAC, appliances, filters, parts, and equipment history with
						the records they belong to.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='contractor'>
						<FontAwesomeIcon icon={faScrewdriverWrench} />
					</FeatureIcon>
					<FeatureTitle>Recurring Care</FeatureTitle>
					<FeatureDescription>
						Turn seasonal upkeep, reminders, recurring service, and follow-up
						work into a timeline future you can rely on.
					</FeatureDescription>
				</FeatureCard>
				<FeatureCard>
					<FeatureIcon className='analytics'>
						<FontAwesomeIcon icon={faFileLines} />
					</FeatureIcon>
					<FeatureTitle>Document Understanding</FeatureTitle>
					<FeatureDescription>
						Upload invoices, manuals, warranties, and inspection reports.
						Maintley can identify useful details for you to review before saving.
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
						Find the answer later without digging through texts, folders,
						calendars, or emails.
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
				<FeatureCard>
					<FeatureIcon className='mobile'>
						<FontAwesomeIcon icon={faUsers} />
					</FeatureIcon>
					<FeatureTitle>Team Coordination</FeatureTitle>
					<FeatureDescription>
						Help tenants, contractors, and maintenance partners work from the
						same property history.
					</FeatureDescription>
				</FeatureCard>
			</FeatureGrid>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
