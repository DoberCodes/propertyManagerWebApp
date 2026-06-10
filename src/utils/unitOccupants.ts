type AnyRecord = Record<string, any>;

const normalize = (value: unknown) => String(value || '').trim().toLowerCase();

export const normalizeUnitLabel = (value: unknown): string =>
	normalize(value)
		.replace(/^(unit|apt|apartment|suite)\s+/, '')
		.replace(/[^a-z0-9]/g, '');

const getUnitMatchKey = (unit: AnyRecord) => {
	const unitId = String(unit?.id || '').trim();
	const unitLabel = normalizeUnitLabel(unit?.name);
	return { unitId, unitLabel };
};

const tenantMatchesUnit = (
	tenant: AnyRecord,
	unitId: string,
	unitLabel: string,
): boolean => {
	const tenantUnitId = String(tenant?.unitId || '').trim();
	const tenantUnitLabel = normalizeUnitLabel(
		tenant?.unit || tenant?.unitName || tenant?.unitDisplay,
	);

	if (unitId.length > 0 && tenantUnitId === unitId) {
		return true;
	}

	if (!unitLabel || !tenantUnitLabel) {
		return false;
	}

	if (tenantUnitLabel === unitLabel) {
		return true;
	}

	// Be tolerant of labels like "buildingb" vs "b".
	return tenantUnitLabel.endsWith(unitLabel) || unitLabel.endsWith(tenantUnitLabel);
};

const occupantMergeKey = (occupant: AnyRecord): string => {
	return (
		String(occupant?.id || '').trim() ||
		normalize(occupant?.email) ||
		`${normalize(occupant?.firstName)}_${normalize(occupant?.lastName)}`
	);
};

export const resolveUnitOccupants = (params: {
	unit: AnyRecord;
	propertyTenants?: AnyRecord[];
}): AnyRecord[] => {
	const { unit, propertyTenants = [] } = params;
	if (!unit) {
		return [];
	}

	const directOccupants = Array.isArray(unit.occupants) ? unit.occupants : [];
	const { unitId, unitLabel } = getUnitMatchKey(unit);

	const derivedOccupants = (propertyTenants || [])
		.filter((tenant) => tenantMatchesUnit(tenant, unitId, unitLabel))
		.map((tenant) => ({
			id: tenant.id,
			firstName: tenant.firstName,
			lastName: tenant.lastName,
			email: tenant.email,
			phone: tenant.phone,
			leaseStart: tenant.leaseStart,
			leaseEnd: tenant.leaseEnd,
		}));

	const mergedByKey = new Map<string, AnyRecord>();
	for (const occupant of [...directOccupants, ...derivedOccupants]) {
		const key = occupantMergeKey(occupant);
		if (key) {
			mergedByKey.set(key, occupant);
		}
	}

	return Array.from(mergedByKey.values());
};
