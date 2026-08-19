const normalizeVariant = (value: string) => value.trim().toLowerCase();

export const TANK_WATER_HEATER_VARIANTS = [
	'Tank Gas',
	'Tank Electric',
	'Heat Pump',
] as const;

export const TANKLESS_WATER_HEATER_VARIANTS = [
	'Tankless Gas',
	'Tankless Electric',
] as const;

export const isAssetVariantApplicable = ({
	assetVariant,
	applicableVariants = [],
	showWhenVariantUnknown = true,
}: {
	assetVariant?: string;
	applicableVariants?: readonly string[];
	showWhenVariantUnknown?: boolean;
}): boolean => {
	const normalizedVariant = normalizeVariant(assetVariant || '');
	if (!normalizedVariant) return showWhenVariantUnknown;
	if (applicableVariants.length === 0) return true;
	return applicableVariants.some(
		(variant) => normalizeVariant(variant) === normalizedVariant,
	);
};
