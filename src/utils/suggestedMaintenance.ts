import { RecurrenceFrequency } from '../types/Task.types';

export type SuggestedSystemId =
	| 'hvac'
	| 'water-heater'
	| 'refrigerator'
	| 'dishwasher'
	| 'washer'
	| 'dryer'
	| 'garage-door'
	| 'smoke-detectors'
	| 'gfci-outlets'
	| 'sump-pump'
	| 'garbage-disposal'
	| 'range-oven'
	| 'microwave'
	| 'plumbing-fixtures'
	| 'electrical-panel'
	| 'gutters-downspouts'
	| 'water-softener'
	| 'well-pump'
	| 'septic-system'
	| 'irrigation-system'
	| 'pool-spa'
	| 'fireplace-chimney'
	| 'generator'
	| 'roof'
	| 'windows-doors'
	| 'deck-patio'
	| 'carbon-monoxide-detectors';

export type SuggestedTaskTemplate = {
	id: string;
	systemId: SuggestedSystemId;
	title: string;
	intervalLabel: string;
	recurrenceFrequency: RecurrenceFrequency;
	recurrenceInterval?: number;
	recurrenceCustomUnit?: 'days' | 'weeks' | 'months' | 'years';
	priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
	notes?: string;
};

export type SuggestedSystemTemplate = {
	id: SuggestedSystemId;
	label: string;
	deviceType: string;
	category:
		| 'Comfort'
		| 'Plumbing'
		| 'Kitchen'
		| 'Laundry'
		| 'Exterior'
		| 'Safety'
		| 'Structure'
		| 'Outdoor'
		| 'Power';
	defaultSelected: boolean;
	tier: 'common' | 'more';
};

export const SUGGESTED_MAINTENANCE_DISCLAIMER =
	'These suggestions are provided as a starting point only and may not apply to every property or system. Maintenance needs vary by equipment, age, usage, climate, manufacturer guidance, and local conditions. Consult manufacturer instructions or qualified professionals when appropriate.';

export const SUGGESTED_SYSTEMS: SuggestedSystemTemplate[] = [
	{
		id: 'hvac',
		label: 'HVAC',
		deviceType: 'HVAC',
		category: 'Comfort',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'water-heater',
		label: 'Water Heater',
		deviceType: 'Water Heater',
		category: 'Plumbing',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'refrigerator',
		label: 'Refrigerator',
		deviceType: 'Refrigerator',
		category: 'Kitchen',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'dishwasher',
		label: 'Dishwasher',
		deviceType: 'Dishwasher',
		category: 'Kitchen',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'washer',
		label: 'Washer',
		deviceType: 'Washer',
		category: 'Laundry',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'dryer',
		label: 'Dryer',
		deviceType: 'Dryer',
		category: 'Laundry',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'garage-door',
		label: 'Garage Door',
		deviceType: 'Garage Door',
		category: 'Exterior',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'smoke-detectors',
		label: 'Smoke Detectors',
		deviceType: 'Smoke Detectors',
		category: 'Safety',
		defaultSelected: true,
		tier: 'common',
	},
	{
		id: 'gfci-outlets',
		label: 'GFCI Outlets',
		deviceType: 'GFCI Outlets',
		category: 'Safety',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'carbon-monoxide-detectors',
		label: 'Carbon Monoxide Detectors',
		deviceType: 'Carbon Monoxide Detectors',
		category: 'Safety',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'sump-pump',
		label: 'Sump Pump',
		deviceType: 'Sump Pump',
		category: 'Plumbing',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'garbage-disposal',
		label: 'Garbage Disposal',
		deviceType: 'Garbage Disposal',
		category: 'Kitchen',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'range-oven',
		label: 'Range/Oven',
		deviceType: 'Range/Oven',
		category: 'Kitchen',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'microwave',
		label: 'Microwave',
		deviceType: 'Microwave',
		category: 'Kitchen',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'plumbing-fixtures',
		label: 'Plumbing Fixtures',
		deviceType: 'Plumbing Fixtures',
		category: 'Plumbing',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'electrical-panel',
		label: 'Electrical Panel',
		deviceType: 'Electrical Panel',
		category: 'Power',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'gutters-downspouts',
		label: 'Gutters/Downspouts',
		deviceType: 'Gutters/Downspouts',
		category: 'Exterior',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'water-softener',
		label: 'Water Softener',
		deviceType: 'Water Softener',
		category: 'Plumbing',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'well-pump',
		label: 'Well Pump',
		deviceType: 'Well Pump',
		category: 'Plumbing',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'septic-system',
		label: 'Septic System',
		deviceType: 'Septic System',
		category: 'Plumbing',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'irrigation-system',
		label: 'Irrigation System',
		deviceType: 'Irrigation System',
		category: 'Outdoor',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'pool-spa',
		label: 'Pool/Spa Equipment',
		deviceType: 'Pool/Spa Equipment',
		category: 'Outdoor',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'fireplace-chimney',
		label: 'Fireplace/Chimney',
		deviceType: 'Fireplace/Chimney',
		category: 'Safety',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'generator',
		label: 'Generator',
		deviceType: 'Generator',
		category: 'Power',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'roof',
		label: 'Roof',
		deviceType: 'Roof',
		category: 'Structure',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'windows-doors',
		label: 'Windows/Doors',
		deviceType: 'Windows/Doors',
		category: 'Structure',
		defaultSelected: false,
		tier: 'more',
	},
	{
		id: 'deck-patio',
		label: 'Deck/Patio',
		deviceType: 'Deck/Patio',
		category: 'Exterior',
		defaultSelected: false,
		tier: 'more',
	},
];

export const SUGGESTED_TASKS: SuggestedTaskTemplate[] = [
	{
		id: 'hvac-replace-filter',
		systemId: 'hvac',
		title: 'Replace HVAC Filter',
		intervalLabel: '90 days',
		recurrenceFrequency: 'quarterly',
		priority: 'Medium',
		notes: 'Many homeowners track this every 1-3 months because filter timing can vary by filter type, pets, dust, and system usage.',
	},
	{
		id: 'hvac-clean-outdoor-unit',
		systemId: 'hvac',
		title: 'Clean Outdoor HVAC Unit',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'This can help reduce visible debris around the unit and keep airflow easier to spot during routine checks.',
	},
	{
		id: 'hvac-service-check',
		systemId: 'hvac',
		title: 'Schedule HVAC Service Check',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'Many homeowners do not think about sediment buildup until performance changes, so this can be a useful reminder to review.',
	},
	{
		id: 'water-heater-flush',
		systemId: 'water-heater',
		title: 'Flush Water Heater Tank',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'This is a small safety-related check many owners prefer to keep visible rather than rely on memory.',
	},
	{
		id: 'water-heater-relief-valve',
		systemId: 'water-heater',
		title: 'Test Water Heater Relief Valve',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
	},
	{
		id: 'refrigerator-coils',
		systemId: 'refrigerator',
		title: 'Clean Refrigerator Coils',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
		notes: 'Dust on coils can make the refrigerator work harder, so many homeowners keep this as a simple yearly reminder.',
	},
	{
		id: 'refrigerator-water-filter',
		systemId: 'refrigerator',
		title: 'Replace Refrigerator Water Filter',
		intervalLabel: '6 months',
		recurrenceFrequency: 'custom',
		recurrenceInterval: 6,
		recurrenceCustomUnit: 'months',
		priority: 'Low',
	},
	{
		id: 'dishwasher-filter',
		systemId: 'dishwasher',
		title: 'Clean Dishwasher Filter',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Low',
	},
	{
		id: 'dishwasher-clean-cycle',
		systemId: 'dishwasher',
		title: 'Run Dishwasher Cleaning Cycle',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Low',
	},
	{
		id: 'washer-hoses',
		systemId: 'washer',
		title: 'Inspect Washer Hoses',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'Washer hoses are easy to forget, but periodic checks can help catch visible cracking, bulging, or leaks.',
	},
	{
		id: 'washer-clean-cycle',
		systemId: 'washer',
		title: 'Run Washer Cleaning Cycle',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Low',
	},
	{
		id: 'dryer-lint',
		systemId: 'dryer',
		title: 'Clean Dryer Lint Trap and Area',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Low',
	},
	{
		id: 'dryer-vent',
		systemId: 'dryer',
		title: 'Clean Dryer Vent',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'Dryer vents can collect lint outside the trap, so many homeowners track this separately from cleaning the lint screen.',
	},
	{
		id: 'garage-door-test',
		systemId: 'garage-door',
		title: 'Test Garage Door Safety Reverse',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Medium',
		notes: 'This reminder helps keep the safety reverse feature from becoming an afterthought.',
	},
	{
		id: 'garage-door-lubricate',
		systemId: 'garage-door',
		title: 'Lubricate Garage Door Moving Parts',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
	},
	{
		id: 'smoke-detectors-test',
		systemId: 'smoke-detectors',
		title: 'Test Smoke Detectors',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'High',
		notes: 'A quick recurring reminder can make detector testing part of the property routine instead of an occasional guess.',
	},
	{
		id: 'smoke-detectors-batteries',
		systemId: 'smoke-detectors',
		title: 'Replace Smoke Detector Batteries',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'High',
	},
	{
		id: 'carbon-monoxide-detectors-test',
		systemId: 'carbon-monoxide-detectors',
		title: 'Test Carbon Monoxide Detectors',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'High',
	},
	{
		id: 'carbon-monoxide-detectors-batteries',
		systemId: 'carbon-monoxide-detectors',
		title: 'Replace Carbon Monoxide Detector Batteries',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'High',
	},
	{
		id: 'gfci-test',
		systemId: 'gfci-outlets',
		title: 'Test GFCI Outlets',
		intervalLabel: 'Quarterly',
		recurrenceFrequency: 'quarterly',
		priority: 'Medium',
		notes: 'GFCI outlets are common in wet areas, and many homeowners like a reminder to test them periodically.',
	},
	{
		id: 'sump-pump-test',
		systemId: 'sump-pump',
		title: 'Test Sump Pump',
		intervalLabel: 'Quarterly',
		recurrenceFrequency: 'quarterly',
		priority: 'High',
		notes: 'Sump pumps are often ignored until heavy rain, so a simple test reminder can be especially useful.',
	},
	{
		id: 'sump-pump-discharge-line',
		systemId: 'sump-pump',
		title: 'Inspect Sump Pump Discharge Line',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
	},
	{
		id: 'garbage-disposal-clean',
		systemId: 'garbage-disposal',
		title: 'Clean Garbage Disposal',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Low',
		notes: 'This is a small kitchen task that is easy to miss until odors or slow draining appear.',
	},
	{
		id: 'range-oven-clean-filter',
		systemId: 'range-oven',
		title: 'Clean Range Hood Filter',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Low',
		notes: 'Range hood filters can collect grease over time, so this prompt helps keep the task visible.',
	},
	{
		id: 'range-oven-inspect-burners',
		systemId: 'range-oven',
		title: 'Inspect Range/Oven Burners and Seals',
		intervalLabel: 'Quarterly',
		recurrenceFrequency: 'quarterly',
		priority: 'Low',
	},
	{
		id: 'microwave-clean-vents',
		systemId: 'microwave',
		title: 'Clean Microwave Vents and Filter',
		intervalLabel: 'Quarterly',
		recurrenceFrequency: 'quarterly',
		priority: 'Low',
	},
	{
		id: 'plumbing-fixtures-leaks',
		systemId: 'plumbing-fixtures',
		title: 'Check Visible Plumbing for Leaks',
		intervalLabel: 'Quarterly',
		recurrenceFrequency: 'quarterly',
		priority: 'Medium',
		notes: 'A simple visual leak check can help catch small plumbing issues before they become harder to track.',
	},
	{
		id: 'plumbing-fixtures-caulk',
		systemId: 'plumbing-fixtures',
		title: 'Inspect Caulking Around Sinks, Tubs, and Showers',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
	},
	{
		id: 'electrical-panel-clearance',
		systemId: 'electrical-panel',
		title: 'Check Electrical Panel Access and Labeling',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'Keeping the panel accessible and understandable can make future service visits and urgent situations easier.',
	},
	{
		id: 'gutters-downspouts-clean',
		systemId: 'gutters-downspouts',
		title: 'Clean Gutters and Downspouts',
		intervalLabel: 'Twice yearly',
		recurrenceFrequency: 'custom',
		recurrenceInterval: 6,
		recurrenceCustomUnit: 'months',
		priority: 'Medium',
		notes: 'Gutters are a common out-of-sight task, and clogged drainage can create bigger exterior maintenance issues.',
	},
	{
		id: 'gutters-downspouts-inspect',
		systemId: 'gutters-downspouts',
		title: 'Inspect Gutters and Downspouts for Damage',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
	},
	{
		id: 'water-softener-salt',
		systemId: 'water-softener',
		title: 'Check Water Softener Salt Level',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Low',
	},
	{
		id: 'water-softener-clean',
		systemId: 'water-softener',
		title: 'Clean Water Softener Brine Tank',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
	},
	{
		id: 'well-pump-pressure',
		systemId: 'well-pump',
		title: 'Check Well Pump Pressure',
		intervalLabel: 'Quarterly',
		recurrenceFrequency: 'quarterly',
		priority: 'Medium',
	},
	{
		id: 'well-pump-service',
		systemId: 'well-pump',
		title: 'Schedule Well System Check',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
	},
	{
		id: 'septic-system-inspection',
		systemId: 'septic-system',
		title: 'Schedule Septic System Inspection',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
	},
	{
		id: 'septic-system-pump-review',
		systemId: 'septic-system',
		title: 'Review Septic Pumping Schedule',
		intervalLabel: '3 years',
		recurrenceFrequency: 'custom',
		recurrenceInterval: 3,
		recurrenceCustomUnit: 'years',
		priority: 'Medium',
		notes: 'Septic timelines vary, but a reminder helps homeowners review the schedule before it disappears from memory.',
	},
	{
		id: 'irrigation-system-startup',
		systemId: 'irrigation-system',
		title: 'Start Up Irrigation System',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'This is seasonal for many properties and easy to miss until freezing weather is close.',
	},
	{
		id: 'irrigation-system-winterize',
		systemId: 'irrigation-system',
		title: 'Winterize Irrigation System',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'Fireplace and chimney needs vary by use, but many homeowners track an annual review before heating season.',
	},
	{
		id: 'pool-spa-filter',
		systemId: 'pool-spa',
		title: 'Clean Pool/Spa Filter',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'Medium',
	},
	{
		id: 'pool-spa-equipment',
		systemId: 'pool-spa',
		title: 'Inspect Pool/Spa Equipment',
		intervalLabel: 'Quarterly',
		recurrenceFrequency: 'quarterly',
		priority: 'Medium',
	},
	{
		id: 'fireplace-chimney-inspection',
		systemId: 'fireplace-chimney',
		title: 'Schedule Chimney/Fireplace Inspection',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
	},
	{
		id: 'fireplace-chimney-clean',
		systemId: 'fireplace-chimney',
		title: 'Clean Fireplace Area',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
	},
	{
		id: 'generator-test',
		systemId: 'generator',
		title: 'Test Generator',
		intervalLabel: 'Monthly',
		recurrenceFrequency: 'monthly',
		priority: 'High',
		notes: 'Generators are easiest to trust when they are tested before they are needed.',
	},
	{
		id: 'generator-service',
		systemId: 'generator',
		title: 'Schedule Generator Service',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
		notes: 'A yearly visual check can help homeowners notice missing shingles, storm wear, or other visible changes.',
	},
	{
		id: 'roof-inspect',
		systemId: 'roof',
		title: 'Inspect Roof for Visible Damage',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
	},
	{
		id: 'windows-doors-weatherstripping',
		systemId: 'windows-doors',
		title: 'Inspect Weather Stripping and Seals',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
		notes: 'Small seal issues can affect comfort and drafts, so this is a useful seasonal reminder.',
	},
	{
		id: 'deck-patio-inspect',
		systemId: 'deck-patio',
		title: 'Inspect Deck/Patio Surface and Railings',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Medium',
	},
	{
		id: 'deck-patio-clean',
		systemId: 'deck-patio',
		title: 'Clean Deck/Patio Surface',
		intervalLabel: 'Yearly',
		recurrenceFrequency: 'yearly',
		priority: 'Low',
	},
];

export const getDefaultSuggestedSystemIds = (): SuggestedSystemId[] =>
	SUGGESTED_SYSTEMS.filter((system) => system.defaultSelected).map(
		(system) => system.id,
	);

export const getSuggestedTaskIdsForSystems = (
	systemIds: string[],
): string[] => {
	const selectedSystemIds = new Set(systemIds);
	return SUGGESTED_TASKS.filter((task) =>
		selectedSystemIds.has(task.systemId),
	).map((task) => task.id);
};

export const getSuggestedTasksForSystems = (
	systemIds: string[],
	taskIds: string[],
): SuggestedTaskTemplate[] => {
	const selectedSystemIds = new Set(systemIds);
	const selectedTaskIds = new Set(taskIds);
	return SUGGESTED_TASKS.filter(
		(task) =>
			selectedSystemIds.has(task.systemId) && selectedTaskIds.has(task.id),
	);
};

export const getSuggestedTaskDueDate = (
	task: SuggestedTaskTemplate,
	now = new Date(),
): string => {
	const dueDate = new Date(now);

	switch (task.recurrenceFrequency) {
		case 'monthly':
			dueDate.setMonth(dueDate.getMonth() + 1);
			break;
		case 'quarterly':
			dueDate.setMonth(dueDate.getMonth() + 3);
			break;
		case 'yearly':
			dueDate.setFullYear(dueDate.getFullYear() + 1);
			break;
		case 'custom':
			if (task.recurrenceCustomUnit === 'months') {
				dueDate.setMonth(dueDate.getMonth() + (task.recurrenceInterval || 1));
			} else if (task.recurrenceCustomUnit === 'years') {
				dueDate.setFullYear(
					dueDate.getFullYear() + (task.recurrenceInterval || 1),
				);
			} else if (task.recurrenceCustomUnit === 'weeks') {
				dueDate.setDate(dueDate.getDate() + (task.recurrenceInterval || 1) * 7);
			} else {
				dueDate.setDate(dueDate.getDate() + (task.recurrenceInterval || 1));
			}
			break;
		default:
			dueDate.setMonth(dueDate.getMonth() + 1);
	}

	return dueDate.toISOString().split('T')[0];
};
