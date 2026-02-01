import React from 'react';
import { UnitsTabProps } from '../../../types/PropertyDetailPage.types';
import { useNavigate } from 'react-router-dom';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { EmptyState } from '../PropertyDetailPage.styles';

export const UnitsTab: React.FC<UnitsTabProps> = ({ property }) => {
	const navigate = useNavigate();

	return (
		<SectionContainer>
			<SectionHeader>Units</SectionHeader>
			{property?.units && property.units.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
						gap: '16px',
					}}>
					{property.units.map((unit: any) => (
						<div
							key={unit.name}
							style={{
								padding: '16px',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								backgroundColor: '#f9fafb',
								cursor: 'pointer',
								transition: 'all 0.2s ease',
							}}
							onClick={() =>
								navigate(
									`/property/${property.slug}/unit/${unit.name
										.replace(/\s+/g, '-')
										.toLowerCase()}`,
								)
							}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = '#22c55e';
								e.currentTarget.style.backgroundColor = '#f0fdf4';
								e.currentTarget.style.transform = 'translateY(-2px)';
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = '#e5e7eb';
								e.currentTarget.style.backgroundColor = '#f9fafb';
								e.currentTarget.style.transform = 'translateY(0)';
							}}>
							<h3
								style={{
									margin: '0 0 8px 0',
									color: '#1f2937',
									fontSize: '16px',
									fontWeight: '600',
								}}>
								{unit.name}
							</h3>
							<p
								style={{
									margin: '0 0 4px 0',
									color: '#6b7280',
									fontSize: '14px',
								}}>
								Occupants: {(unit.occupants || []).length}
							</p>
							<p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
								Devices: {(unit.deviceIds || []).length}
							</p>
						</div>
					))}
				</div>
			) : (
				<EmptyState>
					<p>No units added to this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
