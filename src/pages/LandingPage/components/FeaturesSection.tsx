import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faClipboardList,
	faBuilding,
	faScrewdriverWrench,
	faFileLines,
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
import { CenteredAction, SectionLink } from './HomepageSections.styles';

const FeaturesSectionComponent = () => {
	return (
		<FeaturesSection id='Features'>
			<FeaturesTitle>Core Features</FeaturesTitle>
			<FeaturesIntro>
				The essentials for building useful property history without turning the
				homepage into a full feature catalog.
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
						Keep HVAC, equipment, filters, parts, and service history with
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
			</FeatureGrid>
			<CenteredAction>
				<SectionLink href='/features/'>See the complete feature list →</SectionLink>
			</CenteredAction>
		</FeaturesSection>
	);
};

export default FeaturesSectionComponent;
