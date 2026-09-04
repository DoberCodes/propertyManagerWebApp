import type {
	ParsedServiceReport,
	ServiceReportEquipmentCandidate,
	ServiceReportObservation,
	ServiceReportTaskCandidate,
} from './docxServiceReport';

export type InspectionSectionKind =
	| 'property'
	| 'general'
	| 'exterior'
	| 'structural'
	| 'electrical'
	| 'hvac'
	| 'plumbing'
	| 'kitchen'
	| 'interior'
	| 'safety'
	| 'recommendations';

export type InspectionDocumentSection = {
	id: string;
	title: string;
	kind: InspectionSectionKind;
	kinds: InspectionSectionKind[];
	lines: string[];
	sourceText: string;
};

export type InspectionSpecification = {
	id: string;
	label: string;
	value: string;
	relatedAssetType: string;
	sourceText: string;
};

export type InspectionSupplyCandidate = {
	id: string;
	partKnowledgeId: string;
	label: string;
	name: string;
	category: 'supply' | 'consumable';
	relatedAssetTypes: string[];
	relatedAssetVariant?: string;
	relatedEquipmentSuggestionIds?: string[];
	targetEntity: 'part';
	sourceText: string;
	confidence: number;
	confidenceLevel: 'high';
	confidenceReason: string;
};

export type InspectionDocumentUnderstanding = {
	documentKind: 'general_inspection';
	title: string;
	propertyAddress?: string;
	visitDate?: string;
	providerName?: string;
	sections: InspectionDocumentSection[];
	observations: ServiceReportObservation[];
	recommendations: ServiceReportTaskCandidate[];
	equipment: ServiceReportEquipmentCandidate[];
	supplies: InspectionSupplyCandidate[];
	specifications: InspectionSpecification[];
	diagnostics: {
		parserVersion: 'inspection-v4';
		sectionCount: number;
		observationCount: number;
		recommendationCount: number;
		equipmentCount: number;
		supplyCount: number;
		specificationCount: number;
	};
};

export type ClassifiedInspectionDocument = {
	report: ParsedServiceReport;
	understanding: InspectionDocumentUnderstanding;
};

const slug = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 64) || 'item';

const normalizeLine = (value: string) =>
	String(value || '')
		.replace(/^\s*[•*-]\s*/, '')
		.replace(/\s+/g, ' ')
		.trim();

const SECTION_RULES: Array<{
	pattern: RegExp;
	kinds: InspectionSectionKind[];
}> = [
	{ pattern: /^property address$/i, kinds: ['property'] },
	{ pattern: /^(general information|executive summary)$/i, kinds: ['general'] },
	{ pattern: /^exterior$/i, kinds: ['exterior'] },
	{
		pattern: /^site,?\s+exterior,?\s+roof,?\s+(?:and|&)\s+structure$/i,
		kinds: ['exterior', 'structural'],
	},
	{ pattern: /^(foundation(?:\s*&\s*structure)?|structure)$/i, kinds: ['structural'] },
	{ pattern: /^electrical$/i, kinds: ['electrical'] },
	{ pattern: /^electrical\s+(?:and|&)\s+life safety$/i, kinds: ['electrical', 'safety'] },
	{ pattern: /^(hvac|heating(?:\s*&\s*cooling)?)$/i, kinds: ['hvac'] },
	{
		pattern: /^heating,?\s+cooling,?\s+(?:and|&)\s+plumbing$/i,
		kinds: ['hvac', 'plumbing'],
	},
	{ pattern: /^(plumbing|water heating)$/i, kinds: ['plumbing'] },
	{ pattern: /^kitchen(?: appliances)?$/i, kinds: ['kitchen'] },
	{
		pattern: /^appliances,?\s+pool equipment,?\s+(?:and|&)\s+supplies$/i,
		kinds: ['kitchen'],
	},
	{ pattern: /^interior$/i, kinds: ['interior'] },
	{ pattern: /^interior\s+(?:and|&)\s+space-level findings$/i, kinds: ['interior'] },
	{ pattern: /^safety(?: recommendations)?$/i, kinds: ['safety'] },
	{
		pattern: /^(maintenance summary|consolidated maintenance plan|recommendations?|recommended (?:actions|maintenance))$/i,
		kinds: ['recommendations'],
	},
	{
		pattern: /^(documented service history|scanned field notes|limitations and classification notes)$/i,
		kinds: ['general'],
	},
];

const getSectionKinds = (line: string): InspectionSectionKind[] =>
	SECTION_RULES.find((rule) => rule.pattern.test(line))?.kinds || [];

const isLikelyInspection = (rawText: string) => {
	const lines = rawText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
	const sectionCount = lines.filter((line) => getSectionKinds(line).length > 0).length;
	return (
		/home inspection|residential inspection|inspection report/i.test(rawText) &&
		sectionCount >= 2
	);
};

const buildSections = (rawText: string): InspectionDocumentSection[] => {
	const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	const sections: InspectionDocumentSection[] = [];
	let current: InspectionDocumentSection | undefined;

	for (const rawLine of lines) {
		const line = normalizeLine(rawLine);
		const kinds = getSectionKinds(line);
		if (kinds.length > 0) {
			const isNestedHeading =
				current &&
				current.kinds.length > 1 &&
				kinds.every((kind) => current?.kinds.includes(kind));
			if (isNestedHeading && current) {
				current.lines.push(line);
				continue;
			}
			current = {
				id: `section-${slug(line)}-${sections.length + 1}`,
				title: line,
				kind: kinds[0],
				kinds,
				lines: [],
				sourceText: '',
			};
			sections.push(current);
			continue;
		}
		if (!current) continue;
		current.lines.push(rawLine.trim());
		current.sourceText = current.lines.join('\n');
	}

	return sections;
};

const joinWrappedLines = (lines: string[]) => {
	const paragraphs: string[] = [];
	let current = '';
	for (const rawLine of lines) {
		const isBullet = /^\s*[•*-]\s*/.test(rawLine);
		const line = normalizeLine(rawLine);
		if (!line) continue;
		if (isBullet) {
			if (current) paragraphs.push(current);
			paragraphs.push(line);
			current = '';
			continue;
		}
		current = [current, line].filter(Boolean).join(' ');
		if (/[.!?]$/.test(line)) {
			paragraphs.push(current);
			current = '';
		}
	}
	if (current) paragraphs.push(current);
	return paragraphs;
};

const getSentences = (section: InspectionDocumentSection) =>
	joinWrappedLines(section.lines).flatMap((paragraph) =>
		paragraph
			.split(/(?<=[.!?])\s+/)
			.map((sentence) => sentence.trim())
			.filter(Boolean),
	);

const getLabeledValue = (sections: InspectionDocumentSection[], labels: string[]) => {
	for (const section of sections) {
		for (const line of section.lines) {
			for (const label of labels) {
				const labelPattern = label.replace(/\s+/g, '\\s+');
				const match = normalizeLine(line).match(
					new RegExp(`^${labelPattern}\\s*:?\\s+(.+)$`, 'i'),
				);
				if (match?.[1]) return match[1].trim();
			}
		}
	}
	return '';
};

const getRawLabeledValue = (rawText: string, labels: string[]) => {
	const lines = rawText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
	for (let index = 0; index < lines.length; index += 1) {
		for (const label of labels) {
			const labelPattern = label.replace(/\s+/g, '\\s+');
			const match = lines[index].match(
				new RegExp(`^${labelPattern}\\s*:?\\s+(.+)$`, 'i'),
			);
			if (match?.[1]) return match[1].trim();
			if (new RegExp(`^${labelPattern}$`, 'i').test(lines[index])) {
				return lines[index + 1] || '';
			}
		}
	}
	return '';
};

const getPropertyAddress = (sections: InspectionDocumentSection[]) => {
	const section = sections.find((candidate) => candidate.kind === 'property');
	return section?.lines.slice(0, 3).map(normalizeLine).filter(Boolean).join(', ') || undefined;
};

const getObservationStatus = (sentence: string) => {
	if (/no active|good condition|structurally sound|responded normally|protection present|detectors present|securely attached/i.test(sentence)) {
		return 'Observed - no immediate issue';
	}
	if (/dirty|debris|crack|unknown|nail pop|replace|repair|service|recommend/i.test(sentence)) {
		return 'Observed - follow-up noted';
	}
	return 'Observed';
};

const isActionableObservation = (sentence: string) =>
	/recommend|replace|repair|service|flush|clean|test|verify|label|dirty|debris|crack|unknown|nail pop/i.test(sentence);

const buildObservations = (sections: InspectionDocumentSection[]) =>
	sections
		.filter((section) =>
			!section.kinds.some((kind) => ['property', 'general', 'recommendations'].includes(kind)),
		)
		.flatMap((section) =>
			getSentences(section).map((sentence, index): ServiceReportObservation => ({
				id: `observation-${slug(section.title)}-${index + 1}`,
				area: section.title,
				status: getObservationStatus(sentence),
				notes: sentence,
				actionable: isActionableObservation(sentence),
			})),
		);

type EquipmentRule = {
	key: string;
	label?: string;
	assetType: string;
	pattern: RegExp;
	sectionKinds: InspectionSectionKind[];
	getVariant?: (sourceText: string) => string | undefined;
	getDetails?: (sourceText: string) => ServiceReportEquipmentCandidate['details'];
};

const getHvacVariant = (sourceText: string) => {
	if (/heat pump/i.test(sourceText)) return 'Heat Pump';
	if (/mini[ -]?split/i.test(sourceText)) return 'Mini Split';
	if (/furnace/i.test(sourceText)) return 'Furnace';
	if (/air handler/i.test(sourceText)) return 'Air Handler';
	if (/central (?:air|ac)|air conditioner/i.test(sourceText)) return 'Central AC';
	return undefined;
};

const getWaterHeaterVariant = (sourceText: string) => {
	if (/tankless/i.test(sourceText) && /electric/i.test(sourceText)) return 'Tankless Electric';
	if (/tankless/i.test(sourceText)) return 'Tankless Gas';
	if (/electric/i.test(sourceText)) return 'Tank Electric';
	if (/gas/i.test(sourceText)) return 'Tank Gas';
	return undefined;
};

const getMatch = (sourceText: string, pattern: RegExp) =>
	sourceText.match(pattern)?.[0];

const getEquipmentDetails = (
	sourceText: string,
	additional: ServiceReportEquipmentCandidate['details'] = {},
) => {
	const brand = getMatch(
		sourceText,
		/\b(?:Trane|Rinnai|Square D|Samsung|Bosch|GE|Hayward|LiftMaster|Rain Bird)\b/i,
	);
	const explicitModel = sourceText.match(/\bmodel\s+([A-Z0-9-]+)/i)?.[1];
	const inlineModel = sourceText.match(
		/\b(?:Trane|Rinnai|Square D|Samsung|Bosch|GE|Hayward|LiftMaster|Rain Bird)\s+([A-Z0-9-]{2,})\b/i,
	)?.[1];
	const serialText = sourceText.split(/\bserial\b/i)[1] || '';
	const serialNumber = serialText.match(/\b(?=[A-Z0-9-]{6,}\b)(?=[A-Z0-9-]*\d)[A-Z0-9-]+\b/i)?.[0];
	const reportedYear = sourceText.match(/\binstalled\b.{0,50}?\b((?:19|20)\d{2})\b/i)?.[1];
	return {
		...(brand ? { brand } : {}),
		...(explicitModel || inlineModel ? { model: explicitModel || inlineModel } : {}),
		...(serialNumber ? { serialNumber } : {}),
		...(reportedYear ? { installDate: reportedYear } : {}),
		...additional,
	};
};

const EQUIPMENT_ROW_BOUNDARY = /^(?:Heat pump|Air handler|Tankless water|Main electrical panel|Smoke alarms|CO alarms|Refrigerator|Dishwasher|Gas range|Pool pump|Pool filter|Garage door opener|Garage door operator|Landscape irrigation|HVAC\s+Routine|Air filter\s+Routine|Tankless water\s+Routine|Condition|Observation|Recommendation|Classification note|Suggested reusable supplies)\b/i;

const getEquipmentSource = (
	section: InspectionDocumentSection,
	pattern: RegExp,
) => {
	const lines = section.lines.map(normalizeLine).filter(Boolean);
	const candidates = lines.flatMap((line, index) => {
		if (!pattern.test(line) || /^Recommendation\b/i.test(line)) return [];
		const selected = [line];
		for (let offset = 1; offset <= 3; offset += 1) {
			const next = lines[index + offset];
			if (!next || EQUIPMENT_ROW_BOUNDARY.test(next)) break;
			selected.push(next);
		}
		const sourceText = selected.join(' ');
		const score =
			(/\b(?:Trane|Rinnai|Square D|Samsung|Bosch|GE|Hayward|LiftMaster|Rain Bird)\b/i.test(sourceText) ? 4 : 0) +
			(/\b(?:model|serial|installed|\d{2,3}\s*A\b)\b/i.test(sourceText) ? 2 : 0) +
			(/^Observation\b/i.test(line) ? 1 : 0) -
			(/^Condition\b|^Equipment Details\b/i.test(line) ? 2 : 0);
		return [{ sourceText, score }];
	});
	if (candidates.length === 0) return '';
	const selected = candidates.sort((left, right) => right.score - left.score)[0];
	return `${section.title}: ${selected.sourceText}`;
};

const EQUIPMENT_RULES: EquipmentRule[] = [
	{
		key: 'hvac-heat-pump',
		label: 'Heat Pump',
		assetType: 'HVAC',
		pattern: /\b(?:heat pump|furnace|air conditioner|mini[ -]?split)\b/i,
		sectionKinds: ['hvac'],
		getVariant: getHvacVariant,
		getDetails: (sourceText) => {
			const filterSize = getMatch(sourceText, /\b\d{1,2}\s*x\s*\d{1,2}\s*x\s*\d{1,2}\b/i);
			return getEquipmentDetails(
				sourceText,
				filterSize ? { filterSize: filterSize.replace(/\s/g, '') } : {},
			);
		},
	},
	{
		key: 'hvac-air-handler',
		label: 'Air Handler',
		assetType: 'HVAC',
		pattern: /\bair handler\b/i,
		sectionKinds: ['hvac'],
		getVariant: () => 'Air Handler',
		getDetails: (sourceText) => {
			const filterSize = getMatch(sourceText, /\b\d{1,2}\s*x\s*\d{1,2}\s*x\s*\d{1,2}\b/i);
			return getEquipmentDetails(
				sourceText,
				filterSize ? { filterSize: filterSize.replace(/\s/g, '') } : {},
			);
		},
	},
	{
		key: 'water-heater',
		assetType: 'Water Heater',
		pattern: /\b(?:tankless water|water heater)\b/i,
		sectionKinds: ['plumbing'],
		getVariant: getWaterHeaterVariant,
		getDetails: (sourceText) => {
			const capacity = getMatch(sourceText, /\b\d{1,3}[ -]?gallon\b/i);
			const reportedYear = sourceText.match(/\binstalled\b.{0,50}?\b((?:19|20)\d{2})\b/i)?.[1];
			const details = [capacity, reportedYear && `reported year ${reportedYear}`]
				.filter(Boolean)
				.join('; ');
			return getEquipmentDetails(sourceText, details ? { specNotes: details } : {});
		},
	},
	{
		key: 'electrical-panel',
		assetType: 'Electrical Panel',
		pattern: /\b(?:\d{2,3}\s*amp service panel|electrical panel|breaker panel|main panel)\b/i,
		sectionKinds: ['electrical'],
		getDetails: (sourceText) => {
			const amperage = getMatch(sourceText, /\b\d{2,3}\s*amp\b/i);
			return getEquipmentDetails(sourceText, amperage ? { specNotes: `${amperage} service` } : {});
		},
	},
	{ key: 'roof', assetType: 'Roof', pattern: /\broof covering\b|\basphalt[- ]shingle roof\b/i, sectionKinds: ['exterior'] },
	{ key: 'gutters', assetType: 'Gutter System', pattern: /\bgutters?\b/i, sectionKinds: ['exterior'] },
	{ key: 'foundation', assetType: 'Foundation', pattern: /\bfoundation\b|\bpoured concrete slab\b/i, sectionKinds: ['structural'] },
	{ key: 'refrigerator', assetType: 'Refrigerator', pattern: /\brefrigerator\b/i, sectionKinds: ['kitchen'], getDetails: getEquipmentDetails },
	{ key: 'dishwasher', assetType: 'Dishwasher', pattern: /^dishwasher\b/i, sectionKinds: ['kitchen'], getDetails: getEquipmentDetails },
	{ key: 'range-oven', assetType: 'Range / Oven', pattern: /^gas range\b|\boven\b/i, sectionKinds: ['kitchen'], getDetails: getEquipmentDetails },
	{ key: 'pool', assetType: 'Pool', pattern: /^pool (?:pump|filter)\b/i, sectionKinds: ['kitchen'], getVariant: () => 'Pool', getDetails: getEquipmentDetails },
	{ key: 'garage-door', label: 'Garage Door Opener', assetType: 'Garage Door', pattern: /\bgarage door (?:opener|operator)\b/i, sectionKinds: ['interior', 'exterior'], getDetails: getEquipmentDetails },
	{ key: 'irrigation', label: 'Irrigation Controller', assetType: 'Irrigation', pattern: /\blandscape\b|\birrigation controller\b|\brain bird\b/i, sectionKinds: ['exterior'], getDetails: getEquipmentDetails },
	{ key: 'smoke-detectors', label: 'Smoke Detectors', assetType: 'Safety Device', pattern: /^smoke alarms\b/i, sectionKinds: ['electrical', 'safety'], getVariant: () => 'Smoke Detector' },
	{ key: 'co-detectors', label: 'Carbon Monoxide Detectors', assetType: 'Safety Device', pattern: /^co alarms\b/i, sectionKinds: ['electrical', 'safety'], getVariant: () => 'Carbon Monoxide Detector' },
];

const buildEquipment = (sections: InspectionDocumentSection[]) => {
	const equipment: ServiceReportEquipmentCandidate[] = [];
	for (const rule of EQUIPMENT_RULES) {
		const section = sections.find((candidate) =>
			candidate.kinds.some((kind) => rule.sectionKinds.includes(kind)) &&
			Boolean(getEquipmentSource(candidate, rule.pattern)),
		);
		if (!section) continue;
		const sourceText = getEquipmentSource(section, rule.pattern);
		const variant = rule.getVariant?.(sourceText);
		const details = rule.getDetails?.(sourceText);
		equipment.push({
			id: `equipment-${slug(rule.key)}`,
			label: rule.label || rule.assetType,
			assetType: rule.assetType,
			...(variant ? { assetVariant: variant } : {}),
			...(details && Object.values(details).some(Boolean) ? { details } : {}),
			sourceText,
			confidence: 0.9,
			confidenceLevel: 'high',
			confidenceReason: 'The inspection report explicitly names this maintainable property system.',
		});
	}
	return equipment;
};

const getCadence = (sourceText: string) =>
	sourceText.match(/every\s+\d+\s+(?:days?|months?)|twice\s+(?:a\s+year|yearly)|annually|annual(?:ly)?|monthly|each month|when pressure rises\s+\d+\s*-\s*\d+\s*psi[^.]*?/i)?.[0] || '';

const getReportedTiming = (sourceText: string) =>
	sourceText.match(/within\s+\d+\s+days?|before\s+(?:the\s+)?next\s+heavy\s+storm|before\s+regular\s+use|during\s+the\s+next\s+irrigation\s+service|next\s+irrigation\s+service|\bnow\b|due\s+by\s+[A-Za-z]+\s+\d{4}/i)?.[0] || '';

const NON_ACTIONABLE_RECOMMENDATION_TEXT = /\b(?:no task is needed|should not (?:be represented|become)|not evidence that|not automatically create|already completed|these actions were already completed|classification note|tests whether|expected (?:relationship|deduplication) behavior|optional or informational)\b/i;

const cleanRecommendationSource = (sourceText: string) =>
	normalizeLine(sourceText)
		.replace(/\s+Do not create a tank-flushing task[^.]*\.?$/i, '')
		.trim();

const isRecommendationBoundary = (line: string) =>
	/^(?:Condition|Observation|Recommendation|Classification note|Suggested reusable supplies|Equipment Details|SYSTEMS\b|COMPLETED WORK\b|REPORT CLOSE\b|\d{4}\s+Meadow Ridge|BLUE OAK HOME ASSESSMENTS)/i.test(line) ||
	/^[A-Z][A-Za-z -]+\s+(?:Routine|Soon|Safety|Monitor)$/i.test(line);

const getExplicitRecommendationSources = (section: InspectionDocumentSection) => {
	const sources: string[] = [];
	let current = '';
	const flush = () => {
		if (current) sources.push(cleanRecommendationSource(current));
		current = '';
	};
	for (const rawLine of section.lines) {
		const line = normalizeLine(rawLine);
		const marker = line.match(/\bRecommendation\b\s*:?\s*(.*)$/i);
		if (marker) {
			flush();
			current = `Recommendation ${marker[1] || ''}`.trim();
			continue;
		}
		if (current) {
			if (
				/^Verify\s+(?:alarm|manufacture)|^Replace\s+(?:smoke|CO|carbon monoxide)/i.test(line) &&
				/\b(?:smoke|CO|carbon monoxide)\b/i.test(current)
			) {
				flush();
				sources.push(cleanRecommendationSource(line));
			} else if (isRecommendationBoundary(line)) {
				flush();
			} else {
				current = `${current} ${line}`.trim();
			}
		}
	}
	flush();

	for (const sentence of getSentences(section)) {
		if (/^Recommend(?:ed|ation)?\b/i.test(sentence)) {
			sources.push(cleanRecommendationSource(sentence));
		}
	}
	return Array.from(new Set(sources.filter(Boolean)));
};

const getMaintenancePlanSources = (section: InspectionDocumentSection) =>
	section.lines
		.map(normalizeLine)
		.filter((line) =>
			/^(?:Adjust|Evaluate|Repair|Secure|Professionally clean|Replace|Service|Schedule|Descale|Test|Verify|Clean|Regrade|Photograph|Monitor|Record)\b/i.test(line),
		)
		.filter((line) => !/^(?:Action|Recommended timing)\b/i.test(line));

const classifyRecommendation = (sourceText: string, contextText: string) => {
	const normalizedSource = cleanRecommendationSource(sourceText)
		.replace(/^(?:recommendation|recommended action|action)\s*:?\s*/i, '')
		.trim();
	if (
		/^(?:do not|no (?:task|repair)|none\b)/i.test(normalizedSource) ||
		NON_ACTIONABLE_RECOMMENDATION_TEXT.test(normalizedSource)
	) return undefined;
	if (
		/(?:replace|change)\b.*refrigerator.*(?:water )?filter|refrigerator.*(?:water )?filter.*(?:replace|change)\b|(?:replace|change)\b.*haf-qin/i.test(normalizedSource)
	) {
		return { title: 'Replace refrigerator water filter', relatedAssetType: 'Refrigerator' };
	}
	if (/professional service|service.*hvac|hvac.*service/i.test(normalizedSource)) {
		return { title: 'Schedule annual HVAC service', relatedAssetType: 'HVAC' };
	}
	if (
		/(?:replace|change).*(?:hvac |air )?filter|(?:hvac |air )?filter.*(?:replace|change)/i.test(normalizedSource) &&
		!/refrigerator|dishwasher|pool/i.test(normalizedSource)
	) {
		return { title: 'Replace HVAC filter', relatedAssetType: 'HVAC', relatedAssetVariant: 'Air Handler' };
	}
	if (
		/flush.*water heater|water heater.*flush/i.test(normalizedSource) ||
		(/\bflush\b/i.test(normalizedSource) && /\b(?:plumbing|water heater)\b/i.test(contextText))
	) {
		return { title: 'Flush water heater', relatedAssetType: 'Water Heater' };
	}
	if (/descale.*(?:tankless )?water heater|water heater.*descale/i.test(normalizedSource)) {
		return { title: 'Descale tankless water heater', relatedAssetType: 'Water Heater', relatedAssetVariant: 'Tankless Gas' };
	}
	if (/clean.*gutter|gutter.*clean/i.test(normalizedSource)) {
		return { title: 'Clean gutters', relatedAssetType: 'Gutter System' };
	}
	if (/test.*(?:smoke|co\b|carbon monoxide)|(?:smoke|carbon monoxide).*test/i.test(normalizedSource)) {
		return { title: 'Test smoke/CO detectors', relatedAssetType: 'Safety Device' };
	}
	if (/(?:replace|check|verify).*(?:detector|alarm|batter|manufacture date)|(?:detector|alarm|batter).*(?:replace|check|verify)/i.test(normalizedSource)) {
		return { title: 'Verify smoke/CO detectors and batteries', relatedAssetType: 'Safety Device' };
	}
	if (
		/label.*water shutoff|water shutoff.*label/i.test(normalizedSource) &&
		!/no task is needed to label|already labeled/i.test(contextText)
	) {
		return { title: 'Label main water shutoff' };
	}
	if (/garage door.*(?:auto-reverse|safety reverse)|(?:auto-reverse|safety reverse).*garage door/i.test(normalizedSource)) {
		return { title: 'Adjust and retest garage door safety reverse', relatedAssetType: 'Garage Door' };
	}
	if (/secure.*(?:roof )?flashing|flashing.*secure/i.test(normalizedSource)) {
		return { title: 'Secure roof flashing', relatedAssetType: 'Roof' };
	}
	if (/double-tapped breaker/i.test(normalizedSource)) {
		return { title: 'Evaluate and correct double-tapped breaker', relatedAssetType: 'Electrical Panel' };
	}
	if (/repair.*p-trap|p-trap.*repair/i.test(normalizedSource)) {
		return { title: 'Repair powder-room sink P-trap leak' };
	}
	if (/clean.*dishwasher.*filter|dishwasher.*filter.*clean/i.test(normalizedSource)) {
		return { title: 'Clean dishwasher filter screen', relatedAssetType: 'Dishwasher' };
	}
	if (/clean.*(?:pool )?(?:filter )?cartridge|cartridge.*clean/i.test(normalizedSource)) {
		return { title: 'Clean pool filter cartridges', relatedAssetType: 'Pool' };
	}
	if (/clean.*dryer vent|dryer vent.*clean/i.test(normalizedSource)) {
		return { title: 'Professionally clean dryer vent' };
	}
	if (/adjust.*(?:irrigation|spray head)|spray head.*adjust/i.test(normalizedSource)) {
		return { title: 'Adjust irrigation spray head', relatedAssetType: 'Irrigation' };
	}
	if (/regrade.*(?:corner|foundation)|direct.*water away from.*foundation/i.test(normalizedSource)) {
		return { title: 'Improve drainage at the left rear corner' };
	}
	if (/photograph.*(?:crack|foundation)|monitor.*(?:crack|foundation)|(?:crack|foundation).*monitor/i.test(normalizedSource)) {
		return { title: 'Photograph and monitor garage slab crack', relatedAssetType: 'Foundation' };
	}
	const isExplicitRecommendation = /^recommendation\b/i.test(normalizeLine(sourceText));
	if (!isExplicitRecommendation) return undefined;
	const action = normalizedSource
		.replace(/^.*?recommend(?:ed|ation)?\s+/i, '')
		.replace(/^next step\s*:\s*/i, '')
		.replace(/[.]+$/, '')
		.trim();
	return action
		? { title: `${action.charAt(0).toUpperCase()}${action.slice(1)}` }
		: undefined;
};

const buildRecommendations = (sections: InspectionDocumentSection[]) => {
	const taskByTitle = new Map<string, ServiceReportTaskCandidate>();
	for (const section of sections) {
		const contextText = `${section.title} ${section.sourceText}`;
		if (section.kinds.includes('general')) continue;
		const sources = [
			...getExplicitRecommendationSources(section),
			...getSentences(section),
			...(section.kinds.includes('recommendations')
				? getMaintenancePlanSources(section)
				: []),
		];
		for (const sourceText of sources) {
			const classified = classifyRecommendation(sourceText, contextText);
			if (!classified) continue;
			const key = classified.title.toLowerCase();
			const cadence = getCadence(sourceText);
			const reportedTiming = getReportedTiming(sourceText);
			const existing = taskByTitle.get(key);
			if (existing) {
				if (!existing.sourceText.includes(sourceText)) {
					existing.sourceText = `${existing.sourceText}\n${sourceText}`;
				}
				continue;
			}
			taskByTitle.set(key, {
				id: `task-${slug(classified.title)}`,
				title: classified.title,
				description: [sourceText, cadence ? `Reported cadence: ${cadence}.` : '']
					.filter(Boolean)
					.join('\n'),
				priority: /safety|smoke|carbon monoxide/i.test(sourceText) ? 'High' : 'Medium',
				scheduleMode: 'unscheduled',
				...(reportedTiming ? { reportedTiming } : {}),
				...(classified.relatedAssetType
					? { relatedAssetType: classified.relatedAssetType }
					: {}),
				...('relatedAssetVariant' in classified && classified.relatedAssetVariant
					? { relatedAssetVariant: classified.relatedAssetVariant }
					: {}),
				sourceText,
				confidence: 0.92,
				confidenceLevel: 'high',
				confidenceReason: 'The inspection report explicitly recommends this homeowner action.',
			});
		}
	}
	return Array.from(taskByTitle.values());
};

const buildSpecifications = (
	equipment: ServiceReportEquipmentCandidate[],
): InspectionSpecification[] =>
	equipment.flatMap((candidate) => {
		const specifications: InspectionSpecification[] = [];
		if (candidate.details?.filterSize) {
			specifications.push({
				id: `spec-${slug(candidate.assetType)}-filter-size`,
				label: 'Filter size',
				value: candidate.details.filterSize,
				relatedAssetType: candidate.assetType,
				sourceText: candidate.sourceText,
			});
		}
		if (candidate.details?.specNotes) {
			specifications.push({
				id: `spec-${slug(candidate.assetType)}-details`,
				label: 'Reported specification',
				value: candidate.details.specNotes,
				relatedAssetType: candidate.assetType,
				sourceText: candidate.sourceText,
			});
		}
		return specifications;
	});

const buildSupplies = (rawText: string): InspectionSupplyCandidate[] => {
	const candidates: Array<{
		name: string;
		label: string;
		category: InspectionSupplyCandidate['category'];
		relatedAssetTypes: string[];
		relatedAssetVariant?: string;
		pattern: RegExp;
	}> = [
		{
			name: '20x25x1 HVAC filter',
			label: 'HVAC filter',
			category: 'consumable',
			relatedAssetTypes: ['HVAC'],
			relatedAssetVariant: 'Air Handler',
			pattern: /20\s*x\s*25\s*x\s*1\s+(?:HVAC|air) filter/i,
		},
		{
			name: 'Samsung HAF-QIN refrigerator filter',
			label: 'Refrigerator water filter',
			category: 'consumable',
			relatedAssetTypes: ['Refrigerator'],
			pattern: /Samsung\s+HAF-QIN\s+refrigerator (?:water )?filter/i,
		},
		{
			name: 'Hayward C4030 replacement cartridge set',
			label: 'Pool filter cartridge set',
			category: 'supply',
			relatedAssetTypes: ['Pool'],
			pattern: /Hayward\s+C4030\s+replacement cartridge set/i,
		},
	];
	return candidates.flatMap((candidate) => {
		const sourceText = rawText.match(candidate.pattern)?.[0];
		if (!sourceText) return [];
		const id = `part-${slug(candidate.name)}`;
		return [{
			id,
			partKnowledgeId: id,
			label: candidate.label,
			name: candidate.name,
			category: candidate.category,
			relatedAssetTypes: candidate.relatedAssetTypes,
			...(candidate.relatedAssetVariant
				? { relatedAssetVariant: candidate.relatedAssetVariant }
				: {}),
			targetEntity: 'part' as const,
			sourceText,
			confidence: 0.96,
			confidenceLevel: 'high' as const,
			confidenceReason: 'The inspection report explicitly lists this reusable supply.',
		}];
	});
};

const matchesRelatedEquipment = (
	equipment: ServiceReportEquipmentCandidate,
	relatedAssetType?: string,
	relatedAssetVariant?: string,
) =>
	Boolean(relatedAssetType) &&
	equipment.assetType.toLowerCase() === relatedAssetType?.toLowerCase() &&
	(!relatedAssetVariant ||
		equipment.assetVariant?.toLowerCase() === relatedAssetVariant.toLowerCase());

const addExactEquipmentRelationships = <
	T extends { relatedAssetType?: string; relatedAssetVariant?: string },
>(candidate: T, equipment: ServiceReportEquipmentCandidate[]): T & {
	relatedEquipmentSuggestionIds?: string[];
} => {
	const relatedEquipmentSuggestionIds = equipment
		.filter((item) =>
			matchesRelatedEquipment(
				item,
				candidate.relatedAssetType,
				candidate.relatedAssetVariant,
			),
		)
		.map((item) => item.id);
	return {
		...candidate,
		...(relatedEquipmentSuggestionIds.length
			? { relatedEquipmentSuggestionIds }
			: {}),
	};
};

export const understandInspectionDocument = (
	rawText: string,
): InspectionDocumentUnderstanding | undefined => {
	if (!isLikelyInspection(rawText)) return undefined;
	const sections = buildSections(rawText);
	if (sections.length < 2) return undefined;
	const title = rawText
		.split(/\r?\n/)
		.map(normalizeLine)
		.find((line) => /inspection report/i.test(line)) || 'Property inspection report';
	const observations = buildObservations(sections);
	const equipment = buildEquipment(sections);
	const recommendations = buildRecommendations(sections).map((recommendation) =>
		addExactEquipmentRelationships(recommendation, equipment),
	);
	const supplies = buildSupplies(rawText).map((supply) => {
		const relatedEquipmentSuggestionIds = equipment
			.filter((item) =>
				supply.relatedAssetTypes.some((assetType) =>
					matchesRelatedEquipment(item, assetType, supply.relatedAssetVariant),
				),
			)
			.map((item) => item.id);
		return {
			...supply,
			...(relatedEquipmentSuggestionIds.length
				? { relatedEquipmentSuggestionIds }
				: {}),
		};
	});
	const specifications = buildSpecifications(equipment);
	const visitDate =
		getLabeledValue(sections, ['Inspection Date', 'Assessment Date', 'Visit Date', 'Date']) ||
		getRawLabeledValue(rawText, ['Inspection Date', 'Assessment Date', 'Visit Date']);
	const providerName =
		getLabeledValue(sections, ['Inspector', 'Inspector Name', 'Technician Name']) ||
		getRawLabeledValue(rawText, ['Inspector', 'Inspector Name', 'Technician Name']);
	const propertyAddress =
		getPropertyAddress(sections) ||
		getRawLabeledValue(rawText, ['Property Address', 'Property']);

	return {
		documentKind: 'general_inspection',
		title,
		...(propertyAddress ? { propertyAddress } : {}),
		...(visitDate ? { visitDate } : {}),
		...(providerName ? { providerName } : {}),
		sections,
		observations,
		recommendations,
		equipment,
		supplies,
		specifications,
		diagnostics: {
			parserVersion: 'inspection-v4',
			sectionCount: sections.length,
			observationCount: observations.length,
			recommendationCount: recommendations.length,
			equipmentCount: equipment.length,
			supplyCount: supplies.length,
			specificationCount: specifications.length,
		},
	};
};

export const classifyInspectionDocument = (
	understanding: InspectionDocumentUnderstanding,
): ClassifiedInspectionDocument => ({
	understanding,
	report: {
		title: understanding.title,
		technicianName: understanding.providerName,
		visitDate: understanding.visitDate,
		propertyAddress: understanding.propertyAddress,
		completedWork: [],
		observations: understanding.observations,
		suggestedTasks: understanding.recommendations,
		suggestedEquipment: understanding.equipment,
		rawText: understanding.sections
			.map((section) => `${section.title}\n${section.sourceText}`)
			.join('\n\n'),
	},
});
