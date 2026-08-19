import * as admin from 'firebase-admin';

if (!admin.apps.length) {
	admin.initializeApp();
}

const db = admin.firestore();

type DeviceRecord = {
	type?: string;
	name?: string;
	brand?: string;
	model?: string;
	assetType?: string;
	assetVariant?: string;
	updatedAt?: unknown;
};

type AssetTypeDefinition = {
	value: string;
	matchTerms: string[];
	variants: string[];
	knowledgePack: string;
};

const APPLY_CHANGES = process.argv.includes('--apply');

const UNKNOWN_ASSET_TYPE = 'Unknown';

const ASSET_TYPE_DEFINITIONS: AssetTypeDefinition[] = [
	{
		value: 'HVAC',
		matchTerms: [
			'hvac',
			'air conditioner',
			'air conditioning',
			'central air',
			'central ac',
			'cooling',
			'condenser',
			'furnace',
			'heat pump',
			'mini split',
			'air handler',
			'boiler',
			'radiator',
			'geothermal',
		],
		variants: [
			'Furnace',
			'Heat Pump',
			'Central AC',
			'Mini Split',
			'Air Handler',
			'Boiler',
			'Radiator',
			'Geothermal',
		],
		knowledgePack: 'hvac',
	},
	{
		value: 'Water Heater',
		matchTerms: [
			'water heater',
			'hot water heater',
			'tankless',
			'heat pump water heater',
			'solar water heater',
		],
		variants: [
			'Tank Gas',
			'Tank Electric',
			'Tankless Gas',
			'Tankless Electric',
			'Heat Pump',
			'Solar',
		],
		knowledgePack: 'water_heater',
	},
	{
		value: 'Refrigerator',
		matchTerms: ['refrigerator', 'fridge'],
		variants: [
			'Standard',
			'French Door',
			'Side-by-Side',
			'Bottom Freezer',
			'Top Freezer',
			'Built-In',
		],
		knowledgePack: 'refrigerator',
	},
	{
		value: 'Safety Device',
		matchTerms: [
			'smoke detector',
			'smoke alarm',
			'carbon monoxide detector',
			'carbon monoxide',
			'co detector',
			'combo detector',
			'fire alarm',
		],
		variants: ['Smoke Detector', 'Carbon Monoxide Detector', 'Combo Detector'],
		knowledgePack: 'safety_device',
	},
	{ value: 'Roof', matchTerms: ['roof', 'roofing'], variants: [], knowledgePack: 'roof' },
	{ value: 'Deck', matchTerms: ['deck'], variants: [], knowledgePack: 'deck' },
	{ value: 'Patio', matchTerms: ['patio'], variants: [], knowledgePack: 'patio' },
	{ value: 'Porch', matchTerms: ['porch'], variants: [], knowledgePack: 'porch' },
	{ value: 'Fence', matchTerms: ['fence', 'fencing'], variants: [], knowledgePack: 'fence' },
	{ value: 'Driveway', matchTerms: ['driveway'], variants: [], knowledgePack: 'driveway' },
	{ value: 'Gutter System', matchTerms: ['gutter system', 'gutters', 'gutter'], variants: [], knowledgePack: 'gutter_system' },
	{ value: 'Windows', matchTerms: ['window', 'windows'], variants: [], knowledgePack: 'windows' },
	{ value: 'Doors', matchTerms: ['door', 'doors'], variants: [], knowledgePack: 'doors' },
	{ value: 'Garage Door', matchTerms: ['garage door', 'garage opener'], variants: [], knowledgePack: 'garage_door' },
	{ value: 'Electrical Panel', matchTerms: ['electrical panel', 'breaker panel', 'main panel'], variants: [], knowledgePack: 'electrical_panel' },
	{ value: 'Sump Pump', matchTerms: ['sump pump'], variants: [], knowledgePack: 'sump_pump' },
	{ value: 'Foundation', matchTerms: ['foundation', 'slab'], variants: [], knowledgePack: 'foundation' },
	{ value: 'Water Softener', matchTerms: ['water softener', 'softener'], variants: [], knowledgePack: 'water_softener' },
	{ value: 'Irrigation', matchTerms: ['irrigation', 'sprinkler'], variants: [], knowledgePack: 'irrigation' },
	{ value: 'Well Pump', matchTerms: ['well pump', 'well'], variants: [], knowledgePack: 'well_pump' },
	{ value: 'Septic', matchTerms: ['septic', 'septic tank'], variants: ['Septic Tank', 'Lift Station'], knowledgePack: 'septic' },
	{ value: 'Solar', matchTerms: ['solar', 'pv', 'inverter'], variants: ['PV', 'Battery', 'Inverter'], knowledgePack: 'solar' },
	{ value: 'Security System', matchTerms: ['security system', 'alarm system'], variants: [], knowledgePack: 'security_system' },
	{ value: 'Outdoor Equipment', matchTerms: ['outdoor equipment', 'generator', 'pressure washer', 'chainsaw', 'leaf blower', 'lawn mower', 'mower'], variants: ['Generator', 'Pressure Washer', 'Chainsaw', 'String Trimmer', 'Leaf Blower', 'Snow Blower', 'Lawn Mower'], knowledgePack: 'outdoor_equipment' },
	{ value: 'Pool', matchTerms: ['pool', 'spa', 'hot tub'], variants: ['Pool', 'Spa', 'Hot Tub'], knowledgePack: 'pool_spa' },
	{ value: 'Range / Oven', matchTerms: ['range', 'oven', 'stove'], variants: [], knowledgePack: 'range_oven' },
	{ value: 'Cooktop', matchTerms: ['cooktop'], variants: [], knowledgePack: 'cooktop' },
	{ value: 'Microwave', matchTerms: ['microwave'], variants: [], knowledgePack: 'microwave' },
	{ value: 'Freezer', matchTerms: ['freezer'], variants: [], knowledgePack: 'freezer' },
	{ value: 'Range Hood', matchTerms: ['range hood', 'hood vent'], variants: [], knowledgePack: 'range_hood' },
	{ value: 'Disposal', matchTerms: ['disposal', 'garbage disposal'], variants: [], knowledgePack: 'disposal' },
	{ value: 'Washer', matchTerms: ['washer', 'washing machine'], variants: [], knowledgePack: 'washer' },
	{ value: 'Dryer', matchTerms: ['dryer', 'clothes dryer'], variants: [], knowledgePack: 'dryer' },
	{ value: 'Fireplace', matchTerms: ['fireplace'], variants: [], knowledgePack: 'fireplace' },
	{ value: 'Chimney', matchTerms: ['chimney', 'flue'], variants: [], knowledgePack: 'chimney' },
];

const normalize = (value: unknown): string =>
	String(value || '')
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();

const normalizeAssetType = (value?: string): string => {
	const normalizedValue = normalize(value);
	if (!normalizedValue) return UNKNOWN_ASSET_TYPE;

	const exactMatch = ASSET_TYPE_DEFINITIONS.find(
		(definition) => normalize(definition.value) === normalizedValue,
	);
	if (exactMatch) return exactMatch.value;

	const inferredMatch = ASSET_TYPE_DEFINITIONS.find((definition) =>
		definition.matchTerms.some((term) => normalizedValue.includes(normalize(term))),
	);
	return inferredMatch?.value || value?.trim() || UNKNOWN_ASSET_TYPE;
};

const getAssetVariantOptions = (assetType?: string): string[] => {
	const normalizedType = normalize(assetType);
	return (
		ASSET_TYPE_DEFINITIONS.find(
			(definition) => normalize(definition.value) === normalizedType,
		)?.variants || []
	);
};

const inferAssetVariantFromText = (
	assetType: string | undefined,
	text: string,
): string => {
	const variantOptions = getAssetVariantOptions(assetType);
	const normalizedText = normalize(text);
	if (!normalizedText) return '';

	const directMatch = [...variantOptions]
		.sort((left, right) => normalize(right).length - normalize(left).length)
		.find((option) => normalizedText.includes(normalize(option)));
	if (directMatch) return directMatch;

	if (normalize(assetType) === normalize('HVAC')) {
		if (
			normalizedText.includes('central air') ||
			normalizedText.includes('ac unit') ||
			normalizedText.includes('air conditioner')
		) {
			return 'Central AC';
		}
		if (normalizedText.includes('boiler')) return 'Boiler';
		if (normalizedText.includes('radiator')) return 'Radiator';
		if (normalizedText.includes('geothermal') || normalizedText.includes('geo')) {
			return 'Geothermal';
		}
		if (normalizedText.includes('air handler')) return 'Air Handler';
	}

	if (normalize(assetType) === normalize('Water Heater')) {
		if (normalizedText.includes('tankless') && normalizedText.includes('gas')) {
			return 'Tankless Gas';
		}
		if (
			normalizedText.includes('tankless') &&
			(normalizedText.includes('electric') || normalizedText.includes('electrical'))
		) {
			return 'Tankless Electric';
		}
		if (normalizedText.includes('tankless')) return 'Tankless Gas';
		if (normalizedText.includes('heat pump')) return 'Heat Pump';
		if (normalizedText.includes('solar')) return 'Solar';
		if (normalizedText.includes('electric') || normalizedText.includes('electrical')) {
			return 'Tank Electric';
		}
		if (normalizedText.includes('gas')) return 'Tank Gas';
	}

	if (normalize(assetType) === normalize('Refrigerator')) {
		if (normalizedText.includes('french door')) return 'French Door';
		if (normalizedText.includes('side by side')) return 'Side-by-Side';
		if (normalizedText.includes('bottom freezer')) return 'Bottom Freezer';
		if (normalizedText.includes('top freezer')) return 'Top Freezer';
		if (normalizedText.includes('built in')) return 'Built-In';
	}

	if (normalize(assetType) === normalize('Safety Device')) {
		if (
			normalizedText.includes('combo') ||
			(normalizedText.includes('smoke') && normalizedText.includes('carbon monoxide'))
		) {
			return 'Combo Detector';
		}
		if (normalizedText.includes('smoke')) return 'Smoke Detector';
		if (
			normalizedText.includes('carbon monoxide') ||
			normalizedText.includes('co detector')
		) {
			return 'Carbon Monoxide Detector';
		}
	}

	return '';
};

const deriveAssetFields = (device: DeviceRecord): {
	assetType?: string;
	assetVariant?: string;
} => {
	const candidateText = [device.type, device.name, device.brand, device.model]
		.filter(Boolean)
		.join(' ')
		.trim();

	const assetType = normalizeAssetType(device.assetType || device.type || candidateText);
	const assetVariant =
		String(device.assetVariant || '').trim() ||
		inferAssetVariantFromText(assetType, candidateText);

	return {
		assetType: assetType || undefined,
		assetVariant: assetVariant || undefined,
	};
};

const run = async (): Promise<void> => {
	console.log(
		`Starting device asset backfill in ${APPLY_CHANGES ? 'apply' : 'dry-run'} mode...`,
	);

	const snapshot = await db.collection('devices').get();
	let inspected = 0;
	let changed = 0;
	let skipped = 0;
	let writes = 0;
	let batch = db.batch();

	for (const docSnapshot of snapshot.docs) {
		inspected += 1;
		const data = (docSnapshot.data() || {}) as DeviceRecord;
		const nextFields = deriveAssetFields(data);

		const updates: Partial<DeviceRecord> = {};
		if (nextFields.assetType && nextFields.assetType !== String(data.assetType || '').trim()) {
			updates.assetType = nextFields.assetType;
		}
		if (
			nextFields.assetVariant !== undefined &&
			nextFields.assetVariant !== String(data.assetVariant || '').trim()
		) {
			updates.assetVariant = nextFields.assetVariant;
		}

		if (Object.keys(updates).length === 0) {
			skipped += 1;
			continue;
		}

		changed += 1;
		console.log(`Backfill candidate ${docSnapshot.id}:`, {
			fromType: data.type || '',
			previousAssetType: data.assetType || '',
			nextAssetType: updates.assetType || data.assetType || '',
			previousAssetVariant: data.assetVariant || '',
			nextAssetVariant: updates.assetVariant || data.assetVariant || '',
		});

		if (!APPLY_CHANGES) {
			continue;
		}

		batch.set(
			docSnapshot.ref,
			{
				...updates,
				updatedAt: admin.firestore.FieldValue.serverTimestamp(),
			},
			{ merge: true },
		);
		writes += 1;

		if (writes % 400 === 0) {
			await batch.commit();
			batch = db.batch();
		}
	}

	if (APPLY_CHANGES && writes % 400 !== 0) {
		await batch.commit();
	}

	console.log(
		`Device asset backfill completed. inspected=${inspected}, changed=${changed}, skipped=${skipped}, mode=${APPLY_CHANGES ? 'apply' : 'dry-run'}`,
	);
};

run()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('Device asset backfill failed:', error);
		process.exit(1);
	});