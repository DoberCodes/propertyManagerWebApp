#!/usr/bin/env node

/**
 * Seed a Maintley demo account with rich, account-scoped property data.
 *
 * Dry-run by default:
 *   yarn seed:demo-account -- --email demo@example.com --plan homeowner_plus
 *
 * Apply writes:
 *   yarn seed:demo-account -- --email demo@example.com --plan portfolio --apply
 *
 * Refresh records from a previous demo seed:
 *   yarn seed:demo-account -- --email demo@example.com --plan portfolio --replace --apply
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

const DEMO_SCHEMA_VERSION = 2;
const DEFAULT_HISTORY_YEARS = 4;
const VALID_PLANS = new Set(['homeowner_plus', 'portfolio']);
const PERFORMANCE_FIXTURE_PROPERTY_COUNTS = [1, 5, 15, 100];

const COLLECTIONS_TO_REPLACE = [
	'propertyScanLatest',
	'propertyScanSnapshots',
	'notifications',
	'tenantProfiles',
	'teamMembers',
	'teamGroups',
	'contractors',
	'propertyKnowledgeLinks',
	'propertyDocuments',
	'propertySupplies',
	'propertySpaces',
	'maintenanceEvents',
	'tasks',
	'devices',
	'propertyGroupMemberships',
	'propertyGroups',
	'properties',
];

const TEAM_MEMBERS = [
	{
		key: 'mason',
		firstName: 'Mason',
		lastName: 'Cole',
		title: 'Maintenance Lead',
		role: 'maintenance_lead',
		email: 'mason.cole@example.com',
		phone: '(555) 014-1001',
	},
	{
		key: 'riley',
		firstName: 'Riley',
		lastName: 'Nash',
		title: 'Maintenance Technician',
		role: 'maintenance',
		email: 'riley.nash@example.com',
		phone: '(555) 014-1002',
	},
	{
		key: 'taylor',
		firstName: 'Taylor',
		lastName: 'Kim',
		title: 'Leasing Coordinator',
		role: 'leasing',
		email: 'taylor.kim@example.com',
		phone: '(555) 014-1003',
	},
	{
		key: 'avery',
		firstName: 'Avery',
		lastName: 'Brooks',
		title: 'Accounting Coordinator',
		role: 'accounting',
		email: 'avery.brooks@example.com',
		phone: '(555) 014-1004',
	},
];

const VENDOR_LIBRARY = [
	{
		key: 'hvac',
		company: 'Pioneer Heating & Air',
		category: 'HVAC',
		name: 'Nina Patel',
		email: 'service@pioneerhvac.example',
		phone: '(555) 018-1100',
		website: 'https://pioneerhvac.example',
		portalUrl: 'https://pioneerhvac.example/portal',
	},
	{
		key: 'plumbing',
		company: 'Clearline Plumbing',
		category: 'Plumber',
		name: 'Owen Price',
		email: 'dispatch@clearline.example',
		phone: '(555) 018-1200',
		website: 'https://clearline.example',
		portalUrl: 'https://clearline.example/customers',
	},
	{
		key: 'roofing',
		company: 'Pinecrest Roofing & Exterior',
		category: 'Roofer',
		name: 'Marcus Reed',
		email: 'office@pinecrestroofing.example',
		phone: '(555) 018-1300',
		website: 'https://pinecrestroofing.example',
		portalUrl: '',
	},
	{
		key: 'electrical',
		company: 'BrightPath Electric',
		category: 'Electrician',
		name: 'Dana Lewis',
		email: 'service@brightpath.example',
		phone: '(555) 018-1400',
		website: 'https://brightpath.example',
		portalUrl: 'https://brightpath.example/login',
	},
	{
		key: 'landscaping',
		company: 'Evergreen Grounds',
		category: 'Landscaper',
		name: 'Sam Rivera',
		email: 'care@evergreengrounds.example',
		phone: '(555) 018-1500',
		website: 'https://evergreengrounds.example',
		portalUrl: '',
	},
	{
		key: 'pest',
		company: 'Guardian Pest Control',
		category: 'Pest Control',
		name: 'Jordan Ellis',
		email: 'support@guardianpest.example',
		phone: '(555) 018-1600',
		website: 'https://guardianpest.example',
		portalUrl: 'https://guardianpest.example/account',
	},
];

const HOMEOWNER_PROPERTY = [
	{
		key: 'home',
		title: 'Cedar Hollow Residence',
		address: '418 Cedar Hollow Lane, Franklin, TN 37064',
		propertyType: 'Single Family',
		owner: 'Demo Homeowner',
		bedrooms: 4,
		bathrooms: 3,
		yearBuilt: 2017,
		squareFootage: 2860,
		isRental: false,
		groupKey: null,
		notes:
			'Primary residence used to demonstrate Homeowner+ maintenance history, appliances, documents, recurring reminders, and Maintley Intelligence.',
	},
];

const PORTFOLIO_PROPERTIES = [
	{
		key: 'sand-oak-a',
		title: 'Sand Oak Duplex - Apt A',
		address: '123 Sand Oak Drive, Apt A, Austin, TX 78704',
		propertyType: 'Multi-Family',
		owner: 'DFV Portfolio',
		bedrooms: 3,
		bathrooms: 2,
		yearBuilt: 2019,
		squareFootage: 1480,
		isRental: true,
		groupKey: 'austin',
	},
	{
		key: 'sand-oak-b',
		title: 'Sand Oak Duplex - Apt B',
		address: '123 Sand Oak Drive, Apt B, Austin, TX 78704',
		propertyType: 'Multi-Family',
		owner: 'DFV Portfolio',
		bedrooms: 2,
		bathrooms: 2,
		yearBuilt: 2019,
		squareFootage: 1320,
		isRental: true,
		groupKey: 'austin',
	},
	{
		key: 'maple-ridge',
		title: 'Maple Ridge Townhome',
		address: '742 Maple Ridge Circle, Round Rock, TX 78664',
		propertyType: 'Single Family',
		owner: 'DFV Portfolio',
		bedrooms: 3,
		bathrooms: 2,
		yearBuilt: 2012,
		squareFootage: 1925,
		isRental: true,
		groupKey: 'austin',
	},
	{
		key: 'lakeside-cottage',
		title: 'Lakeside Cottage',
		address: '88 Lakeview Bend, Lago Vista, TX 78645',
		propertyType: 'Single Family',
		owner: 'DFV Portfolio',
		bedrooms: 2,
		bathrooms: 1,
		yearBuilt: 2008,
		squareFootage: 1180,
		isRental: true,
		groupKey: 'vacation',
	},
	{
		key: 'westgate-retail',
		title: 'Westgate Retail Suite',
		address: '900 Westgate Boulevard, Suite 210, Austin, TX 78745',
		propertyType: 'Commercial',
		owner: 'DFV Portfolio',
		yearBuilt: 2001,
		squareFootage: 3600,
		hasSuites: true,
		isRental: true,
		groupKey: 'commercial',
	},
	{
		key: 'oak-market',
		title: 'Oak Market Building',
		address: '52 Oak Market Road, San Marcos, TX 78666',
		propertyType: 'Commercial',
		owner: 'DFV Portfolio',
		yearBuilt: 1998,
		squareFootage: 5400,
		hasSuites: true,
		isRental: true,
		groupKey: 'commercial',
	},
	{
		key: 'cedar-park',
		title: 'Cedar Park Rental',
		address: '311 Cottonwood Trail, Cedar Park, TX 78613',
		propertyType: 'Single Family',
		owner: 'DFV Portfolio',
		bedrooms: 4,
		bathrooms: 3,
		yearBuilt: 2015,
		squareFootage: 2440,
		isRental: true,
		groupKey: 'austin',
	},
	{
		key: 'canyon-view',
		title: 'Canyon View Retreat',
		address: '19 Canyon View Road, Wimberley, TX 78676',
		propertyType: 'Single Family',
		owner: 'DFV Portfolio',
		bedrooms: 3,
		bathrooms: 2,
		yearBuilt: 2006,
		squareFootage: 2105,
		isRental: true,
		groupKey: 'vacation',
	},
];

const PORTFOLIO_GROUPS = [
	{
		key: 'austin',
		name: 'Austin Area Rentals',
		description: 'Long-term residential properties around Austin.',
		groupIconKey: 'house',
		groupIconColor: '#1f6f50',
		groupIconBgColor: '#e7f6ef',
		sortOrder: 10,
	},
	{
		key: 'vacation',
		name: 'Vacation Homes',
		description: 'Short-stay and seasonal properties with higher turnover.',
		groupIconKey: 'hotel',
		groupIconColor: '#2457a6',
		groupIconBgColor: '#e8f0ff',
		sortOrder: 20,
	},
	{
		key: 'commercial',
		name: 'Commercial Spaces',
		description: 'Retail and small commercial buildings.',
		groupIconKey: 'store',
		groupIconColor: '#7a4b16',
		groupIconBgColor: '#fff3df',
		sortOrder: 30,
	},
];

const DEVICE_TEMPLATES = [
	{
		key: 'hvac',
		name: 'Main HVAC System',
		type: 'HVAC',
		assetType: 'hvac',
		assetVariant: 'Heat Pump',
		assetCategory: 'hvac',
		brand: 'Carrier',
		model: 'Infinity 24ANB6',
		filterSize: '20x25x1',
		serviceItems: [
			{
				id: 'filter',
				category: 'Filter',
				name: 'Return air filter',
				size: '20x25x1',
				mervRating: 'MERV 11',
				replacementInterval: 'Every 3 months',
			},
		],
		cadenceMonths: 6,
		baseCost: 165,
		contractorKey: 'hvac',
	},
	{
		key: 'water-heater',
		name: 'Water Heater',
		type: 'Water Heater',
		assetType: 'water_heater',
		assetVariant: 'Tank Gas',
		assetCategory: 'plumbing',
		brand: 'Rheem',
		model: 'PROG50-40N',
		cadenceMonths: 12,
		baseCost: 140,
		contractorKey: 'plumbing',
	},
	{
		key: 'roof',
		name: 'Roof',
		type: 'Roof',
		assetType: 'roof',
		assetVariant: 'Architectural Asphalt Shingles',
		assetCategory: 'structural',
		brand: 'GAF',
		model: 'Timberline HDZ',
		cadenceMonths: 12,
		baseCost: 225,
		contractorKey: 'roofing',
	},
	{
		key: 'electrical-panel',
		name: 'Electrical Panel',
		type: 'Electrical',
		assetType: 'electrical_panel',
		assetVariant: 'Main Breaker Panel',
		assetCategory: 'utility',
		brand: 'Square D',
		model: 'QO Load Center',
		cadenceMonths: 24,
		baseCost: 185,
		contractorKey: 'electrical',
	},
	{
		key: 'smoke-co',
		name: 'Smoke and CO Detectors',
		type: 'Safety Device',
		assetType: 'safety_device',
		assetVariant: 'Smoke and Carbon Monoxide Detector',
		assetCategory: 'safety',
		brand: 'Kidde',
		model: 'P4010ACSCO-W',
		cadenceMonths: 6,
		baseCost: 60,
		contractorKey: 'electrical',
	},
	{
		key: 'refrigerator',
		name: 'Kitchen Refrigerator',
		type: 'Refrigerator',
		assetType: 'refrigerator',
		assetVariant: 'French Door',
		assetCategory: 'kitchen',
		brand: 'Whirlpool',
		model: 'WRX735SDHZ',
		serviceItems: [
			{
				id: 'water-filter',
				category: 'Filter',
				name: 'Refrigerator water filter',
				partNumber: 'EDR4RXD1',
				replacementInterval: 'Every 6 months',
			},
		],
		cadenceMonths: 12,
		baseCost: 95,
		contractorKey: 'plumbing',
	},
];

function parseArgs(argv) {
	const args = {
		apply: false,
		replace: false,
		validateFixture: false,
		historyYears: DEFAULT_HISTORY_YEARS,
		asOf: new Date().toISOString().slice(0, 10),
	};

	for (let index = 0; index < argv.length; index += 1) {
		const token = argv[index];
		if (token === '--apply') {
			args.apply = true;
		} else if (token === '--validate-fixture') {
			args.validateFixture = true;
		} else if (token === '--replace') {
			args.replace = true;
		} else if (token === '--email') {
			args.email = argv[++index];
		} else if (token === '--uid') {
			args.uid = argv[++index];
		} else if (token === '--account-id') {
			args.accountId = argv[++index];
		} else if (token === '--plan') {
			args.plan = normalizePlan(argv[++index]);
		} else if (token === '--history-years') {
			args.historyYears = Number(argv[++index]);
		} else if (token === '--property-count') {
			args.propertyCount = Number(argv[++index]);
		} else if (token === '--as-of') {
			args.asOf = argv[++index];
		} else if (token === '--service-account') {
			args.serviceAccount = argv[++index];
		} else if (token === '--help' || token === '-h') {
			args.help = true;
		} else {
			throw new Error(`Unknown argument: ${token}`);
		}
	}

	return args;
}

function normalizePlan(plan) {
	const normalized = String(plan || '')
		.trim()
		.toLowerCase()
		.replace(/[\s-]+/g, '_');
	if (normalized === 'homeownerplus') return 'homeowner_plus';
	if (normalized === 'homeowner_plus' || normalized === 'portfolio') {
		return normalized;
	}
	return normalized;
}

function printHelp() {
	console.log(`
Seed a rich demo account.

Usage:
  yarn seed:demo-account -- --email user@example.com --plan homeowner_plus
  yarn seed:demo-account -- --email user@example.com --plan portfolio --apply

Options:
  --email <email>             Firebase Auth user email to populate
  --uid <uid>                 Firebase Auth uid to populate
  --account-id <accountId>    Override account id; defaults to user accountId or uid
  --plan <plan>               homeowner_plus or portfolio
  --history-years <years>     Number of years of maintenance history, default 4
  --property-count <count>    Portfolio fixture size from 1 to 100
  --as-of <YYYY-MM-DD>        Anchor date for generated history and active tasks
  --replace                   Remove prior demo records for this account and plan
  --apply                     Write to Firebase; omitted means dry-run
  --service-account <path>    Service account JSON path; defaults to serviceAccountKey.json
  --validate-fixture          Validate both deterministic demo plans without Firebase access
`);
}

function assertValidArgs(args) {
	if (args.help || args.validateFixture) return;
	if (!args.email && !args.uid) {
		throw new Error('Provide --email or --uid.');
	}
	if (!VALID_PLANS.has(args.plan)) {
		throw new Error('Provide --plan homeowner_plus or --plan portfolio.');
	}
	if (!Number.isInteger(args.historyYears) || args.historyYears < 1) {
		throw new Error('--history-years must be a positive integer.');
	}
	if (
		args.propertyCount !== undefined &&
		(!Number.isInteger(args.propertyCount) ||
			args.propertyCount < 1 ||
			args.propertyCount > 100)
	) {
		throw new Error('--property-count must be an integer from 1 to 100.');
	}
	if (args.propertyCount !== undefined && args.plan !== 'portfolio') {
		throw new Error('--property-count is available only for the portfolio fixture.');
	}
	if (Number.isNaN(new Date(`${args.asOf}T00:00:00.000Z`).getTime())) {
		throw new Error('--as-of must be a valid YYYY-MM-DD date.');
	}
}

function loadAdmin(args) {
	const admin = require('firebase-admin');
	if (admin.apps.length > 0) {
		return admin;
	}

	if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
		admin.initializeApp({
			credential: admin.credential.cert(
				JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
			),
		});
		return admin;
	}

	const serviceAccountPath = path.resolve(
		process.cwd(),
		args.serviceAccount || process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json',
	);
	if (fs.existsSync(serviceAccountPath)) {
		admin.initializeApp({
			credential: admin.credential.cert(require(serviceAccountPath)),
		});
		return admin;
	}

	admin.initializeApp({
		credential: admin.credential.applicationDefault(),
	});
	return admin;
}

function sanitizeId(value) {
	return String(value || '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

function slugify(value) {
	return sanitizeId(value);
}

function makeId(seedId, ...parts) {
	return [seedId, ...parts.map(sanitizeId)].filter(Boolean).join('-');
}

function makeKnowledgeLinkId({
	propertyId,
	fromType,
	fromId,
	relationshipType,
	toType,
	toId,
}) {
	const canonical = [
		propertyId,
		fromType,
		fromId,
		relationshipType,
		toType,
		toId,
	].join('|');
	return `pkl_${createHash('sha256').update(canonical).digest('hex')}`;
}

function toDate(value) {
	return new Date(`${value}T12:00:00.000Z`);
}

function isoDate(date) {
	return date.toISOString().slice(0, 10);
}

function isoDateTime(date) {
	return date.toISOString();
}

function addDays(date, days) {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function addMonths(date, months) {
	const next = new Date(date);
	next.setUTCMonth(next.getUTCMonth() + months);
	return next;
}

function addYears(date, years) {
	const next = new Date(date);
	next.setUTCFullYear(next.getUTCFullYear() + years);
	return next;
}

function monthDiff(start, end) {
	return (
		(end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
		(end.getUTCMonth() - start.getUTCMonth())
	);
}

function currencyAmount(amount) {
	return Math.round(amount * 100) / 100;
}

function removeUndefinedValues(value) {
	if (value === undefined) return undefined;
	if (Array.isArray(value)) {
		return value
			.map((item) => removeUndefinedValues(item))
			.filter((item) => item !== undefined);
	}
	if (value && typeof value === 'object' && !(value instanceof Date)) {
		const cleaned = {};
		Object.entries(value).forEach(([key, item]) => {
			const cleanedValue = removeUndefinedValues(item);
			if (cleanedValue !== undefined) {
				cleaned[key] = cleanedValue;
			}
		});
		return cleaned;
	}
	return value;
}

function findUndefinedPaths(value, basePath = 'data') {
	if (value === undefined) return [basePath];
	if (Array.isArray(value)) {
		return value.flatMap((item, index) =>
			findUndefinedPaths(item, `${basePath}[${index}]`),
		);
	}
	if (value && typeof value === 'object' && !(value instanceof Date)) {
		return Object.entries(value).flatMap(([key, item]) =>
			findUndefinedPaths(item, `${basePath}.${key}`),
		);
	}
	return [];
}

function assertRecordsDoNotContainUndefined(records) {
	const invalidRecords = records
		.map((record) => ({
			record,
			paths: findUndefinedPaths(record.data),
		}))
		.filter(({ paths }) => paths.length > 0);

	if (invalidRecords.length === 0) return;

	const details = invalidRecords
		.slice(0, 5)
		.map(
			({ record, paths }) =>
				`${record.collection}/${record.id}: ${paths.join(', ')}`,
		)
		.join('\n');
	throw new Error(
		`Generated demo records contain undefined Firestore values:\n${details}`,
	);
}

function assertDemoKnowledgeCoverage(plan) {
	const collectionCount = (collection) =>
		plan.records.filter((record) => record.collection === collection).length;
	const knowledgeLinks = plan.records.filter(
		(record) => record.collection === 'propertyKnowledgeLinks',
	);
	const relationshipCount = (fromType, relationshipType, toType) =>
		knowledgeLinks.filter(
			(record) =>
				record.data.fromType === fromType &&
				record.data.relationshipType === relationshipType &&
				record.data.toType === toType,
		).length;

	const requirements = [
		['propertySpaces', collectionCount('propertySpaces'), 4],
		['propertySupplies', collectionCount('propertySupplies'), 3],
		['propertyDocuments', collectionCount('propertyDocuments'), 2],
		[
			'equipment located_in Space links',
			relationshipCount('equipment', 'located_in', 'space'),
			2,
		],
		['equipment uses Supply links', relationshipCount('equipment', 'uses', 'supply'), 1],
		['task occurs_in Space links', relationshipCount('task', 'occurs_in', 'space'), 1],
		['task uses Supply links', relationshipCount('task', 'uses', 'supply'), 1],
		['Document relationship links', relationshipCount('document', 'documents', 'space') + relationshipCount('document', 'documents', 'equipment') + relationshipCount('document', 'documents', 'supply'), 3],
	];
	const missing = requirements.filter(([, actual, minimum]) => actual < minimum);

	if (missing.length === 0) return;

	throw new Error(
		`Generated demo plan is missing required connected-property coverage:\n${missing
			.map(([label, actual, minimum]) => `  ${label}: ${actual}/${minimum}`)
			.join('\n')}`,
	);
}

function subscriptionForPlan(plan, asOfDate) {
	const start = Math.floor(addDays(asOfDate, -30).getTime() / 1000);
	const end = Math.floor(addYears(asOfDate, 1).getTime() / 1000);
	return {
		status: 'active',
		plan,
		currentPeriodStart: start,
		currentPeriodEnd: end,
		trialEndsAt: null,
		updatedAt: isoDateTime(asOfDate),
	};
}

function buildPortfolioPropertyTemplates(requestedCount) {
	const count = requestedCount || PORTFOLIO_PROPERTIES.length;
	return Array.from({ length: count }, (_, index) => {
		const source = PORTFOLIO_PROPERTIES[index % PORTFOLIO_PROPERTIES.length];
		if (index < PORTFOLIO_PROPERTIES.length) return source;

		const sequence = index + 1;
		return {
			...source,
			key: `${source.key}-fixture-${sequence}`,
			title: `${source.title} ${sequence}`,
			address: `${1000 + sequence} Performance Fixture Road, Austin, TX 78701`,
		};
	});
}

async function resolveTarget(admin, args) {
	const db = admin.firestore();
	const auth = admin.auth();
	let userRecord = null;
	let uid = args.uid;

	if (!uid && args.email) {
		try {
			userRecord = await auth.getUserByEmail(args.email);
		} catch (error) {
			if (error?.code === 'auth/user-not-found') {
				throw new Error(
					`No Firebase Auth user found for --email "${args.email}". Check the spelling, create the user first, or run with --uid <uid>.`,
				);
			}
			throw error;
		}
		uid = userRecord.uid;
	} else if (uid) {
		try {
			userRecord = await auth.getUser(uid);
		} catch (error) {
			if (args.apply) {
				if (error?.code === 'auth/user-not-found') {
					throw new Error(
						`No Firebase Auth user found for --uid "${uid}". Check the uid or create the user first.`,
					);
				}
				throw error;
			}
		}
	}

	const userSnapshot = uid ? await db.collection('users').doc(uid).get() : null;
	const userData = userSnapshot?.data() || {};
	const accountId = String(args.accountId || userData.accountId || uid).trim();
	const email = String(args.email || userRecord?.email || userData.email || '').trim();

	if (!uid || !accountId) {
		throw new Error('Could not resolve uid/accountId for target user.');
	}

	return {
		uid,
		accountId,
		email,
		existingUserData: userData,
	};
}

function buildDemoData(target, args) {
	const asOfDate = toDate(args.asOf);
	const historyStart = addYears(asOfDate, -args.historyYears);
	const seedId = makeId('demo', args.plan, target.accountId);
	const nowIso = isoDateTime(asOfDate);
	const subscription = subscriptionForPlan(args.plan, asOfDate);
	const propertyTemplates =
		args.plan === 'portfolio'
			? buildPortfolioPropertyTemplates(args.propertyCount)
			: HOMEOWNER_PROPERTY;
	const groups = args.plan === 'portfolio' ? PORTFOLIO_GROUPS : [];
	const records = [];
	const summary = {};

	const addRecord = (collection, id, data) => {
		records.push({
			collection,
			id,
			data: removeUndefinedValues({
				...data,
				demoData: true,
				demoSeedId: seedId,
				demoSchemaVersion: DEMO_SCHEMA_VERSION,
			}),
		});
		summary[collection] = (summary[collection] || 0) + 1;
	};

	const addUntaggedRecord = (collection, id, data) => {
		records.push({ collection, id, data: removeUndefinedValues(data) });
		summary[collection] = (summary[collection] || 0) + 1;
	};

	const addKnowledgeLink = ({
		propertyId,
		fromType,
		fromId,
		relationshipType,
		toType,
		toId,
	}) => {
		const id = makeKnowledgeLinkId({
			propertyId,
			fromType,
			fromId,
			relationshipType,
			toType,
			toId,
		});
		addRecord('propertyKnowledgeLinks', id, {
			id,
			accountId: target.accountId,
			propertyId,
			fromType,
			fromId,
			relationshipType,
			toType,
			toId,
			source: 'migration',
			createdAt: nowIso,
			createdBy: target.uid,
			updatedAt: nowIso,
			updatedBy: target.uid,
		});
	};

	addUntaggedRecord('users', target.uid, {
		...target.existingUserData,
		id: target.uid,
		email: target.email || target.existingUserData.email || '',
		role: target.existingUserData.role || 'admin',
		firstName: target.existingUserData.firstName || 'Demo',
		lastName:
			target.existingUserData.lastName ||
			(args.plan === 'portfolio' ? 'Portfolio' : 'Homeowner'),
		accountId: target.accountId,
		isAccountOwner: true,
		isTeamMemberAccount: false,
		subscription,
		dashboardPreferences: {
			scope:
				args.plan === 'portfolio'
					? 'all_visible_properties'
					: 'my_focus',
		},
		updatedAt: nowIso,
		createdAt: target.existingUserData.createdAt || nowIso,
	});

	addUntaggedRecord('familyAccounts', target.accountId, {
		id: target.accountId,
		name:
			args.plan === 'portfolio'
				? 'Demo Portfolio Account'
				: 'Demo Homeowner+ Account',
		ownerId: target.uid,
		memberIds: [target.uid],
		subscription,
		subscriptionStatus: subscription.status,
		subscriptionPlan: subscription.plan,
		updatedAt: nowIso,
		createdAt: nowIso,
	});

	addUntaggedRecord('accountMemberships', `${target.accountId}_${target.uid}`, {
		id: `${target.accountId}_${target.uid}`,
		accountId: target.accountId,
		userId: target.uid,
		roles: ['owner', 'admin'],
		status: 'active',
		createdAt: nowIso,
		updatedAt: nowIso,
	});

	const groupIdByKey = new Map();
	groups.forEach((group) => {
		const groupId = makeId(seedId, 'group', group.key);
		groupIdByKey.set(group.key, groupId);
		addRecord('propertyGroups', groupId, {
			id: groupId,
			accountId: target.accountId,
			userId: target.accountId,
			name: group.name,
			description: group.description,
			sortOrder: group.sortOrder,
			defaultCollapsed: false,
			groupIconKey: group.groupIconKey,
			groupIconColor: group.groupIconColor,
			groupIconBgColor: group.groupIconBgColor,
			createdAt: nowIso,
			updatedAt: nowIso,
		});
	});

	const propertyIds = [];
	const propertySummaries = [];
	const contractorIdsByPropertyAndKey = new Map();
	const teamMemberIds = [];

	if (args.plan === 'portfolio') {
		const teamGroupId = makeId(seedId, 'team-group', 'operations');
		addRecord('teamGroups', teamGroupId, {
			id: teamGroupId,
			accountId: target.accountId,
			userId: target.accountId,
			name: 'Portfolio Operations',
			linkedProperties: [],
			createdAt: nowIso,
			updatedAt: nowIso,
		});

		TEAM_MEMBERS.forEach((member, index) => {
			const memberId = makeId(seedId, 'team', member.key);
			teamMemberIds.push(memberId);
			addRecord('teamMembers', memberId, {
				id: memberId,
				accountId: target.accountId,
				userId: target.accountId,
				firstName: member.firstName,
				lastName: member.lastName,
				title: member.title,
				email: member.email,
				phone: member.phone,
				role: member.role,
				groupId: teamGroupId,
				teamGroupIds: [teamGroupId],
				linkedProperties: [],
				assignedPropertyIds: [],
				status: 'active',
				notes:
					index === 0
						? 'Primary maintenance lead for the demo portfolio.'
						: 'Demo team member used for task assignment examples.',
				createdAt: nowIso,
				updatedAt: nowIso,
			});
		});
	}

	propertyTemplates.forEach((property, index) => {
		const propertyId = makeId(seedId, 'property', property.key);
		const groupId = property.groupKey ? groupIdByKey.get(property.groupKey) : '';
		const propertyCreated = addMonths(historyStart, index);
		const documents = [
			{
				id: makeId(propertyId, 'doc', 'home-summary'),
				propertyId,
				name: `${property.title} home facts.pdf`,
				fileName: `${slugify(property.title)}-home-facts.pdf`,
				url: `https://example.com/demo/${propertyId}/home-facts.pdf`,
				fileUrl: `https://example.com/demo/${propertyId}/home-facts.pdf`,
				size: 142000,
				type: 'application/pdf',
				category: 'other',
				documentType: 'inspection_report',
				uploadedBy: target.uid,
				acquisitionStatus: 'reviewed',
				uploadedAt: isoDateTime(addMonths(propertyCreated, 1)),
			},
			{
				id: makeId(propertyId, 'doc', 'warranty-folder'),
				propertyId,
				name: `${property.title} warranty packet.pdf`,
				fileName: `${slugify(property.title)}-warranty-packet.pdf`,
				url: `https://example.com/demo/${propertyId}/warranty-packet.pdf`,
				fileUrl: `https://example.com/demo/${propertyId}/warranty-packet.pdf`,
				size: 98000,
				type: 'application/pdf',
				category: 'warranty',
				documentType: 'warranty',
				uploadedBy: target.uid,
				acquisitionStatus: 'reviewed',
				uploadedAt: isoDateTime(addMonths(propertyCreated, 2)),
			},
		];

		propertyIds.push(propertyId);
		propertySummaries.push({ id: propertyId, title: property.title });

		addRecord('properties', propertyId, {
			id: propertyId,
			accountId: target.accountId,
			userId: target.accountId,
			...(groupId ? { groupId } : {}),
			title: property.title,
			slug: slugify(property.title),
			image: `https://images.unsplash.com/photo-${index % 2 === 0 ? '1560518883-ce09059eeffa' : '1600585154340-be6161a56a0c'}?w=1200&h=800&fit=crop`,
			owner: property.owner,
			address: property.address,
			propertyType: property.propertyType,
			bedrooms: property.bedrooms,
			bathrooms: property.bathrooms,
			yearBuilt: property.yearBuilt,
			squareFootage: property.squareFootage,
			hasSuites: Boolean(property.hasSuites),
			isRental: Boolean(property.isRental),
			isFavorite: index < 2,
			administrators: [target.uid],
			coOwners: [],
			viewers: [],
			deviceIds: DEVICE_TEMPLATES.map((device) =>
				makeId(seedId, 'device', property.key, device.key),
			),
			notes:
				property.notes ||
				'Demo property with rich appliance records, maintenance history, active tasks, vendors, and documents.',
			documents,
			setupAssistant: {
				completedAt: isoDateTime(addMonths(propertyCreated, 1)),
				updatedAt: nowIso,
				items: {
					hvac: {
						status: 'present',
						deviceId: makeId(seedId, 'device', property.key, 'hvac'),
						reviewedAt: isoDateTime(addMonths(propertyCreated, 1)),
					},
					water_heater: {
						status: 'present',
						deviceId: makeId(seedId, 'device', property.key, 'water-heater'),
						reviewedAt: isoDateTime(addMonths(propertyCreated, 1)),
					},
				},
			},
			createdAt: isoDateTime(propertyCreated),
			updatedAt: nowIso,
		});

		if (index === 0) {
			const spaces = [
				{ key: 'kitchen', name: 'Kitchen', type: 'interior', sortOrder: 10 },
				{
					key: 'mechanical-room',
					name: 'Mechanical Room',
					type: 'utility',
					sortOrder: 20,
				},
				{ key: 'garage', name: 'Garage', type: 'storage', sortOrder: 30 },
				{ key: 'exterior', name: 'Exterior', type: 'exterior', sortOrder: 40 },
			];
			spaces.forEach((space) => {
				const spaceId = makeId(seedId, 'space', property.key, space.key);
				addRecord('propertySpaces', spaceId, {
					id: spaceId,
					accountId: target.accountId,
					propertyId,
					name: space.name,
					type: space.type,
					sortOrder: space.sortOrder,
					isArchived: false,
					source: 'migration',
					createdBy: target.uid,
					updatedBy: target.uid,
					createdAt: isoDateTime(propertyCreated),
					updatedAt: nowIso,
				});
			});

			const supplies = [
				{
					key: 'hvac-filter',
					name: 'HVAC Filter 20x25x1',
					type: 'filter',
					manufacturer: 'Filtrete',
					modelOrSku: 'MPR-1000-20X25X1',
					size: '20x25x1',
					mervRating: '11',
					replacementInterval: 'Every 3 months',
				},
				{
					key: 'detector-battery',
					name: 'Smoke and CO Detector Batteries',
					type: 'electrical',
					manufacturer: 'Energizer',
					modelOrSku: '9V-MAX',
					size: '9V',
					replacementInterval: 'Yearly',
				},
				{
					key: 'exterior-paint',
					name: 'Exterior Trim Paint',
					type: 'paint_and_finish',
					manufacturer: 'Sherwin-Williams',
					modelOrSku: 'Duration Exterior',
					details: 'Satin finish, warm white demo color.',
				},
			];
			supplies.forEach((supply) => {
				const supplyId = makeId(seedId, 'supply', property.key, supply.key);
				addRecord('propertySupplies', supplyId, {
					id: supplyId,
					accountId: target.accountId,
					propertyId,
					...supply,
					key: undefined,
					isArchived: false,
					source: 'migration',
					createdBy: target.uid,
					updatedBy: target.uid,
					createdAt: isoDateTime(propertyCreated),
					updatedAt: nowIso,
				});
			});

			documents.forEach((document) => {
				addRecord('propertyDocuments', document.id, {
					...document,
					accountId: target.accountId,
					updatedAt: nowIso,
				});
			});

			const hvacId = makeId(seedId, 'device', property.key, 'hvac');
			const roofId = makeId(seedId, 'device', property.key, 'roof');
			const mechanicalSpaceId = makeId(
				seedId,
				'space',
				property.key,
				'mechanical-room',
			);
			const exteriorSpaceId = makeId(
				seedId,
				'space',
				property.key,
				'exterior',
			);
			const filterSupplyId = makeId(
				seedId,
				'supply',
				property.key,
				'hvac-filter',
			);
			const paintSupplyId = makeId(
				seedId,
				'supply',
				property.key,
				'exterior-paint',
			);
			addKnowledgeLink({
				propertyId,
				fromType: 'equipment',
				fromId: hvacId,
				relationshipType: 'located_in',
				toType: 'space',
				toId: mechanicalSpaceId,
			});
			addKnowledgeLink({
				propertyId,
				fromType: 'equipment',
				fromId: roofId,
				relationshipType: 'located_in',
				toType: 'space',
				toId: exteriorSpaceId,
			});
			addKnowledgeLink({
				propertyId,
				fromType: 'equipment',
				fromId: hvacId,
				relationshipType: 'uses',
				toType: 'supply',
				toId: filterSupplyId,
			});
			addKnowledgeLink({
				propertyId,
				fromType: 'space',
				fromId: exteriorSpaceId,
				relationshipType: 'uses',
				toType: 'supply',
				toId: paintSupplyId,
			});
			addKnowledgeLink({
				propertyId,
				fromType: 'document',
				fromId: documents[0].id,
				relationshipType: 'documents',
				toType: 'space',
				toId: mechanicalSpaceId,
			});
			addKnowledgeLink({
				propertyId,
				fromType: 'document',
				fromId: documents[1].id,
				relationshipType: 'documents',
				toType: 'equipment',
				toId: hvacId,
			});
			addKnowledgeLink({
				propertyId,
				fromType: 'document',
				fromId: documents[1].id,
				relationshipType: 'documents',
				toType: 'supply',
				toId: filterSupplyId,
			});
		}

		if (groupId) {
			addRecord('propertyGroupMemberships', `${groupId}_${propertyId}`, {
				id: `${groupId}_${propertyId}`,
				accountId: target.accountId,
				groupId,
				propertyId,
				sortOrder: index + 1,
				createdAt: nowIso,
				updatedAt: nowIso,
			});
		}

		VENDOR_LIBRARY.forEach((vendor) => {
			const contractorId = makeId(seedId, 'contractor', property.key, vendor.key);
			contractorIdsByPropertyAndKey.set(`${propertyId}:${vendor.key}`, contractorId);
			addRecord('contractors', contractorId, {
				id: contractorId,
				accountId: target.accountId,
				userId: target.accountId,
				propertyId,
				name: vendor.name,
				company: vendor.company,
				category: vendor.category,
				email: vendor.email,
				phone: vendor.phone,
				website: vendor.website,
				portalUrl: vendor.portalUrl,
				address: `${100 + index} Service Parkway, Austin, TX 7870${index}`,
				notes: `Demo ${vendor.category.toLowerCase()} vendor for ${property.title}.`,
				createdAt: isoDateTime(addMonths(propertyCreated, 1)),
				updatedAt: nowIso,
			});
		});

		DEVICE_TEMPLATES.forEach((device, deviceIndex) => {
			const deviceId = makeId(seedId, 'device', property.key, device.key);
			const installDate = addYears(
				addMonths(historyStart, -(deviceIndex + index) * 3),
				-1,
			);
			addRecord('devices', deviceId, {
				id: deviceId,
				accountId: target.accountId,
				userId: target.accountId,
				propertyId,
				name: device.name,
				type: device.type,
				assetType: device.assetType,
				assetVariant: device.assetVariant,
				assetCategory: device.assetCategory,
				knowledgePack: device.assetType,
				brand: device.brand,
				model: `${device.model}-${1000 + index}${deviceIndex}`,
				serialNumber: `${property.key.toUpperCase().replace(/[^A-Z0-9]/g, '')}-${deviceIndex + 1}26`,
				filterSize: device.filterSize,
				serviceItems: device.serviceItems || [],
				installationDate: isoDate(installDate),
				warrantyExpiration: isoDate(addYears(installDate, 10)),
				location: {
					propertyId,
				},
				status: 'Active',
				notes: `${device.name} for ${property.title}. Demo record includes history and linked tasks.`,
				maintenanceHistory: [],
				createdAt: isoDateTime(propertyCreated),
				updatedAt: nowIso,
			});
		});

		if (args.plan === 'portfolio') {
			for (let tenantIndex = 0; tenantIndex < 2; tenantIndex += 1) {
				const tenantId = makeId(seedId, 'tenant', property.key, tenantIndex + 1);
				addRecord('tenantProfiles', tenantId, {
					id: tenantId,
					accountId: target.accountId,
					userId: target.accountId,
					propertyId,
					name:
						tenantIndex === 0
							? `Resident ${index + 1}A`
							: `Resident ${index + 1}B`,
					email: `resident.${property.key}.${tenantIndex + 1}@example.com`,
					phone: `(555) 019-${index}${tenantIndex}00`,
					status: tenantIndex === 0 ? 'active' : 'active',
					moveInDate: isoDate(addMonths(historyStart, index + tenantIndex)),
					emergencyContact: 'Demo emergency contact',
					notes: 'Demo resident profile for maintenance request workflows.',
					createdAt: isoDateTime(addMonths(propertyCreated, tenantIndex + 1)),
					updatedAt: nowIso,
				});
			}
		}
	});

	const maintenanceEvents = [];
	propertyTemplates.forEach((property, propertyIndex) => {
		const propertyId = makeId(seedId, 'property', property.key);
		DEVICE_TEMPLATES.forEach((device, deviceIndex) => {
			const deviceId = makeId(seedId, 'device', property.key, device.key);
			const contractorId = contractorIdsByPropertyAndKey.get(
				`${propertyId}:${device.contractorKey}`,
			);
			const cadence = device.cadenceMonths;
			const months = monthDiff(historyStart, asOfDate);
			for (let offset = deviceIndex; offset <= months; offset += cadence) {
				const completed = addMonths(historyStart, offset);
				if (completed > asOfDate) continue;
				const eventId = makeId(
					seedId,
					'event',
					property.key,
					device.key,
					isoDate(completed),
				);
				const variableCost =
					device.baseCost + ((propertyIndex + deviceIndex + offset) % 5) * 22;
				const taxAmount = currencyAmount(variableCost * 0.0825);
				const event = {
					id: eventId,
					accountId: target.accountId,
					userId: target.accountId,
					propertyId,
					propertyTitle: property.title,
					deviceIds: [deviceId],
					contractorId,
					title: `${device.name} service`,
					description: `Completed scheduled ${device.type.toLowerCase()} service at ${property.title}.`,
					completionDate: isoDate(completed),
					completedDate: isoDate(completed),
					completionNotes: `Checked operation, documented condition, and updated ${device.name.toLowerCase()} maintenance record.`,
					completedBy: target.uid,
					completedByName: 'Demo Account Owner',
					financials: {
						currency: 'USD',
						actual: {
							laborCost: currencyAmount(variableCost * 0.62),
							materialsCost: currencyAmount(variableCost * 0.23),
							contractorCost: currencyAmount(variableCost),
							otherCost: taxAmount,
						},
						notes: `Invoice total ${currencyAmount(variableCost + taxAmount).toFixed(2)} including tax.`,
					},
					cost: currencyAmount(variableCost + taxAmount),
					maintenanceType:
						device.key === 'roof' ? 'Inspection' : 'Preventive Maintenance',
					eventType:
						device.key === 'roof'
							? 'inspection_completed'
							: 'recurring_maintenance_completed',
					eventSource: 'manual_entry',
					createdAt: isoDateTime(addDays(completed, 1)),
					updatedAt: isoDateTime(addDays(completed, 1)),
				};
				maintenanceEvents.push(event);
				addRecord('maintenanceEvents', eventId, event);
			}
		});
	});

	const activeTaskTemplates = [
		{
			key: 'hvac-filter',
			title: 'Replace HVAC filter',
			deviceKey: 'hvac',
			days: 7,
			priority: 'High',
			category: 'HVAC',
			recurrenceFrequency: 'quarterly',
		},
		{
			key: 'water-heater-flush',
			title: 'Flush water heater',
			deviceKey: 'water-heater',
			days: 21,
			priority: 'Medium',
			category: 'Plumbing',
			recurrenceFrequency: 'yearly',
		},
		{
			key: 'roof-check',
			title: 'Inspect roof after storm season',
			deviceKey: 'roof',
			days: 35,
			priority: 'Medium',
			category: 'Exterior',
			recurrenceFrequency: 'yearly',
		},
		{
			key: 'co-test',
			title: 'Test smoke and carbon monoxide detectors',
			deviceKey: 'smoke-co',
			days: -5,
			priority: 'Urgent',
			category: 'Safety',
			recurrenceFrequency: 'monthly',
		},
	];

	propertyTemplates.forEach((property, propertyIndex) => {
		const propertyId = makeId(seedId, 'property', property.key);
		activeTaskTemplates.forEach((task, taskIndex) => {
			if (args.plan === 'homeowner_plus' || propertyIndex < 5 || taskIndex < 2) {
				const deviceId = makeId(seedId, 'device', property.key, task.deviceKey);
				const taskId = makeId(seedId, 'task', property.key, task.key);
				const assigneeId =
					args.plan === 'portfolio'
						? teamMemberIds[taskIndex % teamMemberIds.length]
						: undefined;
				addRecord('tasks', taskId, {
					id: taskId,
					accountId: target.accountId,
					userId: target.accountId,
					propertyId,
					title: task.title,
					description: `${task.title} for ${property.title}.`,
					dueDate: isoDate(addDays(asOfDate, task.days + propertyIndex * 2)),
					status: 'Initiated',
					property: property.title,
					propertyTitle: property.title,
					notes: 'Demo active task generated by the account seed script.',
					priority: task.priority,
					category: task.category,
					devices: [deviceId],
					assignee: assigneeId,
					assignedTo: assigneeId
						? {
								id: assigneeId,
								name: TEAM_MEMBERS[taskIndex % TEAM_MEMBERS.length].firstName +
									' ' +
									TEAM_MEMBERS[taskIndex % TEAM_MEMBERS.length].lastName,
								email: TEAM_MEMBERS[taskIndex % TEAM_MEMBERS.length].email,
						  }
						: null,
					isRecurring: true,
					recurrenceFrequency: task.recurrenceFrequency,
					recurrenceInterval: 1,
					enableNotifications: true,
					notifications: [
						{
							id: 'due-soon',
							type: 'reminder',
							daysBeforeDue: 3,
							enabled: true,
						},
					],
					createdAt: isoDateTime(addDays(asOfDate, -45)),
					updatedAt: nowIso,
				});

				if (propertyIndex === 0 && task.key === 'hvac-filter') {
					addKnowledgeLink({
						propertyId,
						fromType: 'task',
						fromId: taskId,
						relationshipType: 'occurs_in',
						toType: 'space',
						toId: makeId(
							seedId,
							'space',
							property.key,
							'mechanical-room',
						),
					});
					addKnowledgeLink({
						propertyId,
						fromType: 'task',
						fromId: taskId,
						relationshipType: 'uses',
						toType: 'supply',
						toId: makeId(
							seedId,
							'supply',
							property.key,
							'hvac-filter',
						),
					});
				}
			}
		});
	});

	propertySummaries.forEach((property, index) => {
		const latestId = property.id;
		const scanDate = addDays(asOfDate, -index);
		const recommendations = [
			{
				id: makeId(seedId, 'rec', property.id, 'warranty'),
				title: 'Confirm warranty documents are attached',
				priority: 'medium',
				category: 'documentation',
				status: 'open',
				source: 'property_memory',
				explanation:
					'Demo recommendation based on warranty and document coverage.',
				propertyId: property.id,
			},
			{
				id: makeId(seedId, 'rec', property.id, 'recurring'),
				title: 'Review recurring reminders for safety equipment',
				priority: index % 3 === 0 ? 'high' : 'medium',
				category: 'maintenance',
				status: 'open',
				source: 'history_inference',
				explanation:
					'Demo recommendation based on recent task and maintenance history.',
				propertyId: property.id,
			},
		];
		addRecord('propertyScanLatest', latestId, {
			id: latestId,
			accountId: target.accountId,
			propertyId: property.id,
			scanType: 'quick_scan',
			schemaVersion: 1,
			planId: args.plan,
			createdBy: target.uid,
			createdAt: isoDateTime(scanDate),
			updatedAt: isoDateTime(scanDate),
			systemsReviewed: DEVICE_TEMPLATES.length,
			summary: {
				headline: 'Demo property scan ready',
				openRecommendations: recommendations.length,
				highPriorityCount: recommendations.filter(
					(recommendation) => recommendation.priority === 'high',
				).length,
			},
			recommendations,
		});
		addRecord('propertyScanSnapshots', makeId(seedId, 'scan', property.id), {
			id: makeId(seedId, 'scan', property.id),
			accountId: target.accountId,
			propertyId: property.id,
			scanType: 'quick_scan',
			schemaVersion: 1,
			planId: args.plan,
			createdBy: target.uid,
			createdAt: isoDateTime(scanDate),
			summary: {
				headline: 'Demo historical scan snapshot',
				openRecommendations: recommendations.length,
			},
			recommendations,
		});
	});

	for (let index = 0; index < Math.min(12, propertySummaries.length * 2); index += 1) {
		const property = propertySummaries[index % propertySummaries.length];
		addRecord('notifications', makeId(seedId, 'notification', index + 1), {
			id: makeId(seedId, 'notification', index + 1),
			accountId: target.accountId,
			userId: target.uid,
			type: index % 2 === 0 ? 'task_due_today' : 'document_scan_completed',
			title:
				index % 2 === 0
					? 'Demo task needs attention'
					: 'Demo document review is ready',
			message:
				index % 2 === 0
					? `${property.title} has a maintenance task due soon.`
					: `${property.title} has reviewed property information ready.`,
			propertyId: property.id,
			readAt: index < 4 ? isoDateTime(addDays(asOfDate, -1)) : null,
			createdAt: isoDateTime(addDays(asOfDate, -index - 1)),
			updatedAt: isoDateTime(addDays(asOfDate, -index - 1)),
			actionUrl: `/property/${slugify(property.title)}`,
		});
	}

	if (args.plan === 'portfolio') {
		const linkedProperties = propertyIds.slice(0, 4);
		TEAM_MEMBERS.forEach((member, index) => {
			const memberId = makeId(seedId, 'team', member.key);
			const operation = records.find(
				(record) => record.collection === 'teamMembers' && record.id === memberId,
			);
			if (operation) {
				operation.data.linkedProperties =
					index === 0 ? propertyIds : linkedProperties;
				operation.data.assignedPropertyIds =
					index === 0 ? propertyIds : linkedProperties;
			}
		});
		const teamGroup = records.find((record) => record.collection === 'teamGroups');
		if (teamGroup) {
			teamGroup.data.linkedProperties = propertyIds;
		}
	}

	return {
		seedId,
		records,
		summary,
		maintenanceEventCount: maintenanceEvents.length,
		propertyCount: propertyTemplates.length,
	};
}

async function deletePriorDemoRecords(admin, db, accountId, seedId) {
	let deleted = 0;
	for (const collectionName of COLLECTIONS_TO_REPLACE) {
		const snapshot = await db
			.collection(collectionName)
			.where('accountId', '==', accountId)
			.where('demoSeedId', '==', seedId)
			.get();

		if (snapshot.empty) continue;

		for (let index = 0; index < snapshot.docs.length; index += 450) {
			const batch = db.batch();
			snapshot.docs.slice(index, index + 450).forEach((document) => {
				batch.delete(document.ref);
				deleted += 1;
			});
			await batch.commit();
		}
	}
	return deleted;
}

async function commitRecords(db, records) {
	let written = 0;
	for (let index = 0; index < records.length; index += 450) {
		const batch = db.batch();
		records.slice(index, index + 450).forEach((record) => {
			const ref = db.collection(record.collection).doc(record.id);
			batch.set(ref, removeUndefinedValues(record.data), { merge: true });
			written += 1;
		});
		await batch.commit();
	}
	return written;
}

function printSummary({ args, target, plan }) {
	const entries = Object.entries(plan.summary).sort(([left], [right]) =>
		left.localeCompare(right),
	);
	console.log(`Mode: ${args.apply ? 'apply' : 'dry-run'}`);
	console.log(`Plan: ${args.plan}`);
	console.log(`Target user: ${target.email || target.uid}`);
	console.log(`UID: ${target.uid}`);
	console.log(`Account ID: ${target.accountId}`);
	console.log(`Seed ID: ${plan.seedId}`);
	console.log(`Properties: ${plan.propertyCount}`);
	console.log(`Maintenance events: ${plan.maintenanceEventCount}`);
	console.log('Records by collection:');
	entries.forEach(([collection, count]) => {
		console.log(`  ${collection}: ${count}`);
	});
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	if (args.help) {
		printHelp();
		return;
	}

	assertValidArgs(args);
	if (args.validateFixture) {
		for (const planName of VALID_PLANS) {
			const propertyCounts =
				planName === 'portfolio'
					? PERFORMANCE_FIXTURE_PROPERTY_COUNTS
					: [undefined];
			for (const propertyCount of propertyCounts) {
				const fixtureArgs = {
					...args,
					plan: planName,
					propertyCount,
				};
				const plan = buildDemoData(
					{
						uid: `demo-${planName}-owner`,
						accountId: `demo-${planName}-account`,
						email: `${planName}@example.com`,
						existingUserData: {},
					},
					fixtureArgs,
				);
				assertRecordsDoNotContainUndefined(plan.records);
				assertDemoKnowledgeCoverage(plan);
				console.log(
					`Validated ${planName} (${plan.propertyCount} properties): ${plan.records.length} records across ${Object.keys(plan.summary).length} collections.`,
				);
			}
		}
		return;
	}
	const admin = loadAdmin(args);
	const db = admin.firestore();
	const target = await resolveTarget(admin, args);
	const plan = buildDemoData(target, args);
	assertRecordsDoNotContainUndefined(plan.records);
	assertDemoKnowledgeCoverage(plan);
	printSummary({ args, target, plan });

	if (!args.apply) {
		console.log('\nDry run only. Re-run with --apply to write these records.');
		return;
	}

	if (args.replace) {
		const deleted = await deletePriorDemoRecords(
			admin,
			db,
			target.accountId,
			plan.seedId,
		);
		console.log(`Deleted ${deleted} prior demo records for this seed.`);
	}

	const written = await commitRecords(db, plan.records);
	console.log(`Wrote ${written} records.`);
	console.log('Demo account seed complete.');
}

main().catch((error) => {
	console.error('Demo account seed failed:', error.message);
	console.error(error);
	process.exit(1);
});
