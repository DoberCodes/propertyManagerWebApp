export interface SeasonalCard {
	id: string;
	title: string;
	image?: string; // emoji or image path
	bullets: string[];
	season?: 'spring' | 'summer' | 'fall' | 'winter';
	riskCategory?: 'water' | 'fire' | 'structural' | 'energy' | 'safety';
	priorityLevel?: 'low' | 'medium' | 'high';
	serviceLevel?: 'basic' | 'moderate' | 'professional';
}

export const tipsDisclaimer = `
Seasonal tips are provided for general informational purposes only. 
Always consult qualified professionals for inspections, repairs, 
or hazardous work.
`;

export const seasonalTipCards: SeasonalCard[] = [
	// --------------------
	// WATER / MOISTURE
	// --------------------
	// Gutters
	{
		id: 'gutters',
		title: 'Inspect Your Gutters',
		image: 'Assets/TipsImages/gutters.jpg',
		bullets: [
			'Clear visible debris to promote proper drainage',
			'Look for signs of leaks or loose sections',
			'Consider gutter guards to reduce clogging and maintenance',
		],
		season: 'fall',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	// Grading
	{
		id: 'grading',
		title: 'Check Exterior Drainage & Grading',
		image: 'Assets/TipsImages/drainage.jpg',
		bullets: [
			'Ensure soil slopes away from the foundation',
			'Extend downspouts away from the home',
			'Look for standing water after rainfall',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	// Water Leaks
	{
		id: 'waterleak',
		title: 'Check for Hidden Water Leaks',
		image: 'Assets/TipsImages/waterleak.jpg',
		bullets: [
			'Monitor water bills for unusual increases',
			'Inspect under sinks and around toilets for moisture',
			'Consider installing leak detection sensors',
		],
		season: 'spring',
		serviceLevel: 'basic',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	// Caulking & Seals
	{
		id: 'caulking',
		title: 'Inspect Caulking & Seals',
		image: 'Assets/TipsImages/caulking.jpg',
		bullets: [
			'Check tubs, showers, and sinks for cracked caulk',
			'Reseal areas showing gaps or discoloration',
			'Address leaks early to reduce moisture damage',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},
	// Sump Pump
	{
		id: 'sump',
		title: 'Sump Pump & Basement Check',
		image: 'Assets/TipsImages/sumppump.jpg',
		bullets: [
			'Test pump operation and backup systems periodically',
			'Look for signs of excess moisture',
			'Seek professional assistance if issues arise',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},

	// --------------------
	// FIRE / SAFETY
	// --------------------
	// Smoke & CO Detectors
	{
		id: 'safety',
		title: 'Test Smoke & CO Detectors',
		image: 'Assets/TipsImages/SmokeDetector.jpg',
		bullets: [
			'Test detectors regularly and replace batteries as needed',
			'Ensure units are installed on each level',
			'Keep installation and replacement records',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},
	// Dryer Vent
	{
		id: 'dryervent',
		title: 'Dryer Vent Inspection',
		image: 'Assets/TipsImages/Dryer.jpg',
		bullets: [
			'Clean lint traps regularly',
			'Inspect exterior vent for blockages',
			'Schedule professional cleaning if airflow is restricted',
		],
		season: 'winter',
		serviceLevel: 'moderate',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},
	// Chimney & Fireplace
	{
		id: 'chimney',
		title: 'Chimney & Fireplace Service',
		image: 'Assets/TipsImages/Fireplace.jpg',
		bullets: [
			'Have chimney professionally cleaned and inspected annually',
			'Ensure dampers operate properly',
			'Install carbon monoxide detectors nearby',
		],
		season: 'winter',
		serviceLevel: 'professional',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},
	// Electrical System
	{
		id: 'electrical',
		title: 'Electrical System Check',
		image: 'Assets/TipsImages/electrical.jpg',
		bullets: [
			'Watch for breaker trips or unusual heat',
			'Replace damaged cords',
			'Consult a licensed electrician for concerns',
		],
		season: 'fall',
		serviceLevel: 'professional',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},

	// --------------------
	// STRUCTURAL
	// --------------------
	// Roof Condition
	{
		id: 'roof',
		title: 'Roof Condition Check',
		image: 'Assets/TipsImages/shingles.jpg',
		bullets: [
			'Visually inspect shingles from the ground',
			'Look for attic moisture or staining',
			'Consult a professional if damage is suspected',
		],
		season: 'winter',
		serviceLevel: 'professional',
		riskCategory: 'structural',
		priorityLevel: 'high',
	},
	// Deck & Porch
	{
		id: 'deck',
		title: 'Deck & Porch Care',
		image: 'Assets/TipsImages/Deck.jpg',
		bullets: [
			'Inspect for rot or loose fasteners',
			'Clean and reseal wood surfaces',
			'Address structural issues with a contractor',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'structural',
		priorityLevel: 'medium',
	},
	// Tree & Branch Inspection
	{
		id: 'trees',
		title: 'Tree & Branch Inspection',
		image: 'Assets/TipsImages/branches.jpg',
		bullets: [
			'Trim weak branches near structures',
			'Remove dead limbs',
			'Consult an arborist for large trees',
		],
		season: 'summer',
		serviceLevel: 'professional',
		riskCategory: 'structural',
		priorityLevel: 'medium',
	},

	// --------------------
	// MECHANICAL SYSTEMS
	// --------------------
	// HVAC System
	{
		id: 'hvac',
		title: 'HVAC System Check',
		image: 'Assets/TipsImages/HVAC.jpg',
		bullets: [
			'Replace or clean air filters',
			'Schedule seasonal professional servicing',
			'Verify thermostat operation',
		],
		season: 'summer',
		serviceLevel: 'professional',
		riskCategory: 'energy',
		priorityLevel: 'high',
	},
	// Water Heater
	{
		id: 'waterheater',
		title: 'Water Heater Maintenance',
		image: 'Assets/TipsImages/waterheater.jpg',
		bullets: [
			'Check for leaks around the unit',
			'Consider professional flushing',
			'Insulate older tanks if needed',
		],
		season: 'winter',
		serviceLevel: 'professional',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},
	// Appliance Performance Check
	{
		id: 'appliances',
		title: 'Appliance Performance Check',
		image: 'Assets/TipsImages/appliances.jpg',
		bullets: [
			'Clean refrigerator coils',
			'Inspect washing machine hoses',
			'Replace worn supply lines if needed',
		],
		season: 'summer',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},

	// --------------------
	// WEATHER PREP
	// --------------------
	// Cold Weather Prep
	{
		id: 'freeze',
		title: 'Cold Weather Preparation',
		image: 'Assets/TipsImages/winter.jpg',
		bullets: [
			'Disconnect outdoor hoses',
			'Shut off exterior water lines if applicable',
			'Seal gaps in unheated areas',
		],
		season: 'fall',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},

	// --------------------
	// DOCUMENTATION / ADMIN
	// --------------------
	// Insurance & Records
	{
		id: 'documentation',
		title: 'Review Insurance & Home Records',
		image: 'Assets/TipsImages/Home.jpg',
		bullets: [
			'Verify insurance coverage limits',
			'Organize maintenance records',
			'Document major repairs and upgrades',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'medium',
	},
	// Emergency Preparedness
	{
		id: 'emergency',
		title: 'Review Emergency Preparedness',
		image: 'Assets/TipsImages/emergency.jpg',
		bullets: [
			'Confirm fire extinguishers are accessible',
			'Review evacuation procedures',
			'Store important documents securely',
		],
		season: 'summer',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'medium',
	},

	// ============================================================
	// ADDITIONAL SPRING TIPS (target: 10+ per season)
	// ============================================================
	{
		id: 'spring-windows',
		title: 'Window & Screen Inspection',
		bullets: [
			'Clean window tracks and frames of winter grime',
			'Replace torn or bent screens before insects arrive',
			'Check glazing and weatherstripping for air gaps',
		],
		season: 'spring',
		serviceLevel: 'basic',
		riskCategory: 'energy',
		priorityLevel: 'low',
	},
	{
		id: 'spring-siding',
		title: 'Exterior Siding & Paint Inspection',
		bullets: [
			'Look for cracks, bubbling, or loose panels caused by winter freeze-thaw cycles',
			'Touch up chipped paint to prevent moisture intrusion',
			'Consult a contractor if large sections show damage',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'structural',
		priorityLevel: 'medium',
	},
	{
		id: 'spring-foundation',
		title: 'Foundation Inspection After Winter',
		bullets: [
			'Walk the perimeter and note any new cracks or shifts',
			'Monitor hairline cracks—mark them with tape to track growth',
			'Consult a structural engineer for cracks wider than 1/4 inch',
		],
		season: 'spring',
		serviceLevel: 'professional',
		riskCategory: 'structural',
		priorityLevel: 'high',
	},
	{
		id: 'spring-irrigation',
		title: 'Lawn & Irrigation System Startup',
		bullets: [
			'Turn on irrigation zone by zone and check for broken heads',
			'Adjust sprinkler coverage to avoid watering structures',
			'Test rain sensors and timers before peak watering season',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},
	{
		id: 'spring-hvac-cooling',
		title: 'Prepare AC for Cooling Season',
		bullets: [
			'Replace or clean air handler filters',
			'Clear debris from around outdoor condenser units',
			'Schedule a professional tune-up before first use',
		],
		season: 'spring',
		serviceLevel: 'professional',
		riskCategory: 'energy',
		priorityLevel: 'high',
	},
	{
		id: 'spring-pest',
		title: 'Spring Pest Prevention',
		bullets: [
			'Seal gaps around pipes, vents, and utility entry points',
			'Schedule a termite inspection if not done in the past year',
			'Trim shrubs and mulch away from the foundation to reduce harborage',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'structural',
		priorityLevel: 'medium',
	},
	{
		id: 'spring-attic',
		title: 'Attic Ventilation & Insulation Check',
		bullets: [
			'Confirm soffit and ridge vents are clear and unobstructed',
			'Look for signs of moisture or mold from winter condensation',
			'Check insulation depth—aim for R-38 or higher in most climates',
		],
		season: 'spring',
		serviceLevel: 'moderate',
		riskCategory: 'energy',
		priorityLevel: 'medium',
	},

	// ============================================================
	// ADDITIONAL SUMMER TIPS (target: 10+ per season)
	// ============================================================
	{
		id: 'summer-weatherstrip',
		title: 'Inspect Weatherstripping & Door Seals',
		bullets: [
			'Run your hand along door frames on a hot day to feel hot air infiltration',
			'Replace compressed or torn weatherstripping',
			'Install door sweeps on exterior doors to improve energy efficiency',
		],
		season: 'summer',
		serviceLevel: 'basic',
		riskCategory: 'energy',
		priorityLevel: 'low',
	},
	{
		id: 'summer-irrigation',
		title: 'Irrigation System Efficiency Check',
		bullets: [
			'Audit sprinkler runtime—water early morning to reduce evaporation',
			'Upgrade to a smart controller that adjusts for rainfall',
			'Check for leaks or misting heads that indicate clogged nozzles',
		],
		season: 'summer',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'medium',
	},
	{
		id: 'summer-pest',
		title: 'Pest & Insect Control',
		bullets: [
			'Eliminate standing water to reduce mosquito breeding sites',
			'Inspect eaves and overhangs for wasp or hornet nests',
			'Keep garage doors closed and seal gaps around utility lines',
		],
		season: 'summer',
		serviceLevel: 'moderate',
		riskCategory: 'safety',
		priorityLevel: 'medium',
	},
	{
		id: 'summer-grill',
		title: 'Outdoor Grill & BBQ Safety',
		bullets: [
			'Inspect gas connections and hoses for cracks or wear',
			'Clean burners and grease traps to prevent flare-ups',
			'Keep a fire extinguisher within reach during use',
		],
		season: 'summer',
		serviceLevel: 'basic',
		riskCategory: 'fire',
		priorityLevel: 'high',
	},
	{
		id: 'summer-exterior-paint',
		title: 'Exterior Caulking & Touch-Up Paint',
		bullets: [
			'Inspect caulk around windows, doors, and trim for gaps',
			'Apply exterior caulk on dry days above 50°F for proper adhesion',
			'Touch up bare wood promptly—exposed wood deteriorates quickly in summer heat',
		],
		season: 'summer',
		serviceLevel: 'basic',
		riskCategory: 'structural',
		priorityLevel: 'medium',
	},
	{
		id: 'summer-attic-heat',
		title: 'Attic Heat Management',
		bullets: [
			'Verify attic ventilation is working—temperatures above 150°F can damage roofing',
			'Consider a powered attic fan if passive ventilation is insufficient',
			'Add or refresh blown-in insulation to reduce cooling loads',
		],
		season: 'summer',
		serviceLevel: 'moderate',
		riskCategory: 'energy',
		priorityLevel: 'medium',
	},
	{
		id: 'summer-plumbing',
		title: 'Outdoor Plumbing & Hose Bib Check',
		bullets: [
			'Inspect hose bibs and outdoor faucets for drips or loose connections',
			'Check hose washers and replace any that are cracked',
			'Flush sediment from water filtration systems if installed',
		],
		season: 'summer',
		serviceLevel: 'basic',
		riskCategory: 'water',
		priorityLevel: 'low',
	},

	// ============================================================
	// ADDITIONAL FALL TIPS (target: 10+ per season)
	// ============================================================
	{
		id: 'fall-heating',
		title: 'Heating System Startup',
		bullets: [
			'Replace furnace filters before the first heating cycle',
			'Schedule professional furnace or boiler servicing',
			'Test thermostat accuracy and consider a smart thermostat upgrade',
		],
		season: 'fall',
		serviceLevel: 'professional',
		riskCategory: 'energy',
		priorityLevel: 'high',
	},
	{
		id: 'fall-weatherstrip',
		title: 'Seal Drafts & Weatherstripping',
		bullets: [
			'Use a candle or incense stick to find drafts around doors and windows',
			'Replace weatherstripping on exterior doors',
			'Apply foam backer rod plus caulk to larger gaps before temperatures drop',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'energy',
		priorityLevel: 'medium',
	},
	{
		id: 'fall-irrigation-winterize',
		title: 'Winterize Irrigation System',
		bullets: [
			'Shut off the main irrigation valve before first freeze',
			'Have a professional blow out lines with compressed air',
			'Insulate backflow preventers if they remain installed',
		],
		season: 'fall',
		serviceLevel: 'professional',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	{
		id: 'fall-attic-insulation',
		title: 'Attic Insulation & Ice Dam Prevention',
		bullets: [
			'Ensure attic floor is well-insulated to keep heat inside the living space',
			'Seal attic bypasses (recessed lights, plumbing chases) to prevent warm air leaks',
			'Adequate insulation reduces ice dam formation on the roof eaves',
		],
		season: 'fall',
		serviceLevel: 'moderate',
		riskCategory: 'structural',
		priorityLevel: 'high',
	},
	{
		id: 'fall-pest-rodent',
		title: 'Rodent & Pest Prevention',
		bullets: [
			'Seal gaps around pipes and cables where they enter the home',
			'Install door sweeps and repair torn screens',
			'Move firewood at least 20 ft from the house to reduce harborage',
		],
		season: 'fall',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'medium',
	},

	// ============================================================
	// ADDITIONAL WINTER TIPS (target: 10+ per season)
	// ============================================================
	{
		id: 'winter-pipes',
		title: 'Protect Pipes from Freezing',
		bullets: [
			'Insulate pipes in unheated spaces like crawl spaces and garages',
			'Keep cabinet doors under sinks open during extreme cold',
			'Know the location of your main water shutoff in case a pipe bursts',
		],
		season: 'winter',
		serviceLevel: 'moderate',
		riskCategory: 'water',
		priorityLevel: 'high',
	},
	{
		id: 'winter-ice-dam',
		title: 'Ice Dam Monitoring',
		bullets: [
			'After heavy snowfall, use a roof rake to remove snow from the lower edge',
			'Look for icicles or water staining on ceilings as early warning signs',
			'Never use a heat gun or open flame to remove ice—consult a professional',
		],
		season: 'winter',
		serviceLevel: 'professional',
		riskCategory: 'structural',
		priorityLevel: 'high',
	},
	{
		id: 'winter-indoor-air',
		title: 'Indoor Air Quality & Humidity',
		bullets: [
			'Target 35–50% relative humidity to prevent dry air issues and mold',
			'Clean or replace whole-house humidifier media pads seasonally',
			'Run bathroom exhaust fans to reduce excess moisture from showers',
		],
		season: 'winter',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'medium',
	},
	{
		id: 'winter-heating-filter',
		title: 'Heating System Filter Maintenance',
		bullets: [
			'Check filters monthly during peak heating months',
			'A clogged filter strains the blower motor and increases energy costs',
			'Use MERV 8–11 rated filters for a balance of filtration and airflow',
		],
		season: 'winter',
		serviceLevel: 'basic',
		riskCategory: 'energy',
		priorityLevel: 'medium',
	},
	{
		id: 'winter-draft',
		title: 'Identify & Seal Cold Drafts',
		bullets: [
			'Check electrical outlets and switch plates on exterior walls for cold air',
			'Install foam gaskets behind outlet covers to block infiltration',
			'Use rope caulk as a temporary fix on drafty window sashes',
		],
		season: 'winter',
		serviceLevel: 'basic',
		riskCategory: 'energy',
		priorityLevel: 'low',
	},
	{
		id: 'winter-co-safety',
		title: 'Carbon Monoxide Safety Check',
		bullets: [
			'Test all CO detectors and replace batteries',
			'Never run a generator, grill, or gas equipment indoors',
			'Have heating equipment inspected annually to prevent flue blockages',
		],
		season: 'winter',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'high',
	},
	{
		id: 'winter-garage-door',
		title: 'Garage Door & Threshold Seal',
		bullets: [
			'Inspect the rubber bottom seal for cracks or gaps that let in cold and pests',
			'Lubricate rollers, hinges, and springs with silicone spray',
			'Test the auto-reverse safety feature by placing a 2x4 flat on the ground',
		],
		season: 'winter',
		serviceLevel: 'basic',
		riskCategory: 'safety',
		priorityLevel: 'low',
	},
];

export default seasonalTipCards;
