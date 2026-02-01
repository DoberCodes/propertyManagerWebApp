import React from 'react';
import { DetailsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	InfoCard,
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import {
	EditableFieldInput,
	DetailsEditHeader,
	MinimalEditButton,
} from '../PropertyDetailPage.styles';
import { PropertyDetailSection } from '../PropertyDetailSection';

export const DetailsTab: React.FC<DetailsTabProps> = ({
	isEditMode,
	setIsEditMode,
	property,
	getPropertyFieldValue,
	handlePropertyFieldChange,
}) => {
	return (
		<>
			{/* Edit Mode Header */}
			<DetailsEditHeader>
				<SectionHeader>Property Information</SectionHeader>
				<MinimalEditButton
					onClick={() => setIsEditMode(!isEditMode)}
					title={isEditMode ? 'Exit edit mode' : 'Enter edit mode'}>
					✎
				</MinimalEditButton>
			</DetailsEditHeader>

			<PropertyDetailSection
				isEditMode={isEditMode}
				property={property}
				getPropertyFieldValue={getPropertyFieldValue}
				handlePropertyFieldChange={handlePropertyFieldChange}
			/>

			{/* Notes */}
			{property.notes && (
				<SectionContainer>
					<SectionHeader>Notes</SectionHeader>
					<InfoCard style={{ padding: '16px' }}>
						{isEditMode ? (
							<EditableFieldInput
								type='text'
								value={getPropertyFieldValue('notes')}
								onChange={(e) =>
									handlePropertyFieldChange('notes', e.target.value)
								}
								placeholder='Edit property notes'
								style={{ minHeight: '80px', padding: '12px' }}
								as='textarea'
							/>
						) : (
							<p style={{ margin: 0, lineHeight: '1.6', color: '#333' }}>
								{getPropertyFieldValue('notes')}
							</p>
						)}
					</InfoCard>
				</SectionContainer>
			)}
		</>
	);
};
