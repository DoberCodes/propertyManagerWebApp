import React from 'react';
import { Property } from '../../../types/Property.types';
import { RoleCapabilities } from '../../../utils/permissions';
import { SuppliesSection } from '../SuppliesSection';

interface SuppliesTabProps {
	property: Property;
	permissions?: RoleCapabilities;
}

export const SuppliesTab: React.FC<SuppliesTabProps> = ({
	property,
	permissions,
}) => <SuppliesSection property={property} permissions={permissions} />;
