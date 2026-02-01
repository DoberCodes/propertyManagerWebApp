import React from 'react';
import { TenantsTabProps } from '../../../types/PropertyDetailPage.types';
import {
	SectionContainer,
	SectionHeader,
} from '../../../Components/Library/InfoCards/InfoCardStyles';
import { SmallButton as AddButton } from '../../../Components/Library/Buttons/ButtonStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../PropertyDetailPage.styles';
import { UserRole } from '../../../constants/roles';
import { isTenant } from '../../../utils/permissions';

export const TenantsTab: React.FC<TenantsTabProps> = ({
	property,
	currentUser,
	setShowAddTenantModal,
}) => {
	return (
		<SectionContainer>
			<SectionHeader>
				Property Tenants
				{currentUser && !isTenant(currentUser.role as UserRole) && (
					<AddButton onClick={() => setShowAddTenantModal(true)}>
						+ Add Tenant
					</AddButton>
				)}
			</SectionHeader>

			{property.tenants && property.tenants.length > 0 ? (
				<GridContainer>
					<GridTable>
						<thead>
							<tr>
								<th>Name</th>
								<th>Unit</th>
								<th>Email</th>
								<th>Phone</th>
								<th>Lease Start</th>
								<th>Lease End</th>
							</tr>
						</thead>
						<tbody>
							{property.tenants.map((tenant: any) => (
								<tr key={tenant.id}>
									<td>
										{tenant.firstName} {tenant.lastName}
									</td>
									<td>{tenant.unit || 'N/A'}</td>
									<td>{tenant.email}</td>
									<td>{tenant.phone}</td>
									<td>{tenant.leaseStart || 'N/A'}</td>
									<td>{tenant.leaseEnd || 'N/A'}</td>
								</tr>
							))}
						</tbody>
					</GridTable>
				</GridContainer>
			) : (
				<EmptyState>
					<p>No tenants assigned to this property</p>
				</EmptyState>
			)}
		</SectionContainer>
	);
};
