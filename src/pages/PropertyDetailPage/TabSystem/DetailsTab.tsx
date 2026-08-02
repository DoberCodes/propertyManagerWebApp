import React from 'react';
import { DetailsTabProps } from '../../../types/PropertyDetailPage.types';
import { SectionHeader } from '../../../Components/Library/InfoCards/InfoCardStyles';
import { DetailsEditHeader } from '../PropertyDetailPage.styles';
import { PropertyDetailSection } from '../PropertyDetailSection';
import { SpacesSection } from '../SpacesSection';

export const DetailsTab: React.FC<DetailsTabProps> = ({
	property,
	teamMembers,
	familyMembers = [],
	homeownerMode = false,
	permissions,
}) => {
	return (
		<>
			<DetailsEditHeader>
				<SectionHeader>Property Details</SectionHeader>
			</DetailsEditHeader>

			<PropertyDetailSection
				property={property}
				teamMembers={teamMembers}
				familyMembers={familyMembers}
				homeownerMode={homeownerMode}
			/>
			<SpacesSection property={property} permissions={permissions} />
		</>
	);
};
