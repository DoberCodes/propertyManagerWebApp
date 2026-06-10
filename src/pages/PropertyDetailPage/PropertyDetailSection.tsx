import React from 'react';
import { PropertyDetailSectionProps } from '../../types/PropertyDetailPage.types';
import {
	InfoCard,
	InfoGrid,
	InfoLabel,
	InfoValue,
	SectionContainer,
} from './PropertyDetailPage.styles';

export const PropertyDetailSection = (props: PropertyDetailSectionProps) => {
	// Helper function to get user name from ID
	const getUserName = (userId: string) => {
		const user = props.teamMembers.find((member) => member.id === userId);
		return user ? `${user.firstName} ${user.lastName}` : userId;
	};

	const getResolvedNames = (userIds: string[] = []) =>
		userIds.map((userId) => getUserName(userId));

	// Get all owners (main owner + co-owners)
	const getAllOwners = () => {
		const owners: string[] = [];
		const mainOwner = props.property?.owner;
		if (mainOwner) owners.push(mainOwner);

		const coOwners = props.property?.coOwners || [];
		coOwners.forEach((coOwnerId) => {
			const coOwnerName = getUserName(coOwnerId);
			owners.push(coOwnerName);
		});

		return owners;
	};

	return (
		<SectionContainer>
			<InfoGrid>
				<InfoCard>
					<InfoLabel>Property Type</InfoLabel>

					<InfoValue>
						{props.property?.propertyType || 'Single Family'}
					</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Owner{getAllOwners().length > 1 ? 's' : ''}</InfoLabel>

					<InfoValue>
						{getAllOwners().length > 0
							? getAllOwners().join(', ')
							: 'No owner specified'}
					</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Address</InfoLabel>

					<InfoValue>{props.property?.address}</InfoValue>
				</InfoCard>
				{/* Units are temporarily hidden from the app flow.
				{props.property?.propertyType === 'Multi-Family' && (
					<InfoCard>
						<InfoLabel>Units</InfoLabel>

						<InfoValue>
							{(props.property?.units || []).map((u: any) => u.name).join(', ')}
						</InfoValue>
					</InfoCard>
				)}
				*/}
				{/* Suites are temporarily hidden from the app flow.
				{props.property?.propertyType === 'Commercial' &&
					props.property?.hasSuites && (
						<InfoCard>
							<InfoLabel>Suites</InfoLabel>
							<InfoValue>
								{(props.property?.suites || [])
									.map((s: any) => s.name)
									.join(', ')}
							</InfoValue>
						</InfoCard>
					)}
				*/}
				{props.property?.propertyType !== 'Commercial' &&
					props.property?.propertyType !== 'Multi-Family' && (
						<>
							<InfoCard>
								<InfoLabel>Bedrooms</InfoLabel>

								<InfoValue>{props.property?.bedrooms}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Bathrooms</InfoLabel>

								<InfoValue>{props.property?.bathrooms}</InfoValue>
							</InfoCard>
						</>
					)}
				<InfoCard>
					<InfoLabel>Administrators</InfoLabel>

					<InfoValue>
						{(props.property?.administrators?.length || 0) > 0
							? getResolvedNames(props.property?.administrators).join(', ')
							: 'None'}
					</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Viewers</InfoLabel>

					<InfoValue>
						{(props.property?.viewers?.length || 0) > 0
							? getResolvedNames(props.property?.viewers).join(', ')
							: 'None'}
					</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Rental Property</InfoLabel>
					<InfoValue>{props.property?.isRental ? 'Yes' : 'No'}</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Notes</InfoLabel>

					<InfoValue>{props.property?.notes || 'No notes'}</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Created</InfoLabel>
					<InfoValue>
						{props.property?.createdAt
							? new Date(props.property.createdAt).toLocaleDateString()
							: 'N/A'}
					</InfoValue>
				</InfoCard>
				<InfoCard>
					<InfoLabel>Last Updated</InfoLabel>
					<InfoValue>
						{props.property?.updatedAt
							? new Date(props.property.updatedAt).toLocaleDateString()
							: 'N/A'}
					</InfoValue>
				</InfoCard>
			</InfoGrid>
		</SectionContainer>
	);
};
