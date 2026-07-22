import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { RootState } from '../../Redux/store/store';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { PageHeaderSection, PageTitle } from '../../Components/Library/PageHeaders';
import { COLORS } from '../../constants/colors';

const Wrapper = styled.div`min-height: 100vh; background: ${COLORS.bgLight};`;
const Content = styled.div`display: grid; gap: 1rem; padding: 1rem;`;
const Card = styled.section`
	background: ${COLORS.bgWhite}; border: 1px solid ${COLORS.gray100};
	border-radius: 12px; padding: 1rem;
`;
const Label = styled.div`color: ${COLORS.textSecondary}; font-size: 0.85rem;`;
const Value = styled.div`
	color: ${COLORS.textPrimary}; font-weight: 600; margin: 0.2rem 0 0.8rem;
`;
const ActionButton = styled.button`
	border: 0; border-radius: 8px; padding: 0.75rem 1rem; cursor: pointer;
	background: ${COLORS.primary}; color: white; font-weight: 600;
`;

export const TenantProfilePage: React.FC = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const { data: properties = [], isLoading } = useGetPropertiesQuery();
	const email = String(currentUser?.email || '').trim().toLowerCase();
	const assignments = useMemo(() => properties.flatMap((property: any) => {
		const tenant = (property.tenants || []).find((candidate: any) =>
			String(candidate?.email || '').trim().toLowerCase() === email);
		return tenant ? [{ property, tenant }] : [];
	}), [properties, email]);

	return <Wrapper>
		<PageHeaderSection><PageTitle>My resident access</PageTitle></PageHeaderSection>
		<Content>
			<Card>
				<Label>Name</Label>
				<Value>{`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Resident'}</Value>
				<Label>Email</Label><Value>{currentUser?.email || 'Not available'}</Value>
			</Card>
			{isLoading && <Card>Loading your property access...</Card>}
			{!isLoading && assignments.length === 0 && <Card>
				No property relationship was found. Ask the property manager to review your resident invitation.
			</Card>}
			{assignments.map(({ property, tenant }: any) => <Card key={property.id}>
				<Label>Property</Label><Value>{property.title || property.address || 'Assigned property'}</Value>
				<Label>Lease end</Label><Value>{tenant.leaseEnd || 'Not provided'}</Value>
				<ActionButton onClick={() => navigate(`/property/${property.slug || property.id}`)}>
					Open property and maintenance requests
				</ActionButton>
			</Card>)}
		</Content>
	</Wrapper>;
};
