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
	specifications: InspectionSpecification[];
	diagnostics: {
		parserVersion: 'inspection-v1';
		sectionCount: number;
		observationCount: number;
		recommendationCount: number;
		equipmentCount: number;
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
	kind: InspectionSectionKind;
}> = [
	{ pattern: /^property address$/i, kind: 'property' },
	{ pattern: /^general information$/i, kind: 'general' },
	{ pattern: /^exterior$/i, kind: 'exterior' },
	{ pattern: /^(foundation(?:\s*&\s*structure)?|structure)$/i, kind: 'structural' },
	{ pattern: /^electrical$/i, kind: 'electrical' },
	{ pattern: /^(hvac|heating(?:\s*&\s*cooling)?)$/i, kind: 'hvac' },
	{ pattern: /^(plumbing|water heating)$/i, kind: 'plumbing' },
	{ pattern: /^kitchen(?: appliances)?$/i, kind: 'kitchen' },
	{ pattern: /^interior$/i, kind: 'interior' },
	{ pattern: /^safety(?: recommendations)?$/i, kind: 'safety' },
	{ pattern: /^(maintenance summary|recommendations?|recommended (?:actions|maintenance))$/i, kind: 'recommendations' },
];

const getSectionKind = (line: string): InspectionSectionKind | undefined =>
	SECTION_RULES.find((rule) => rule.pattern.test(line))?.kind;

const isLikelyInspection = (rawText: string) => {
	const lines = rawText.split(/\r?\n/).map(normalizeLine).filter(Boolean);
	const sectionCount = lines.filter((line) => Boolean(getSectionKind(line))).length;
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
		const kind = getSectionKind(line);
		if (kind) {
			current = {
				id: `section-${slug(line)}-${sections.length + 1}`,
				title: line,
				kind,
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
					new RegExp(`^${labelPattern}\\s*:\\s*(.+)$`, 'i'),
				);
				if (match?.[1]) return match[1].trim();
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
		.filter((section) => !['property', 'general', 'recommendations'].includes(section.kind))
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

const EQUIPMENT_RULES: EquipmentRule[] = [
	{
		assetType: 'HVAC',
		pattern: /\b(?:hvac|heat pump|furnace|air conditioner|air handler|mini[ -]?split)\b/i,
		sectionKinds: ['hvac'],
		getVariant: getHvacVariant,
		getDetails: (sourceText) => {
			const filterSize = getMatch(sourceText, /\b\d{1,2}\s*x\s*\d{1,2}\s*x\s*\d{1,2}\b/i);
			return filterSize ? { filterSize: filterSize.replace(/\s/g, '') } : {};
		},
	},
	{
		assetType: 'Water Heater',
		pattern: /\bwater heater\b/i,
		sectionKinds: ['plumbing'],
		getVariant: getWaterHeaterVariant,
		getDetails: (sourceText) => {
			const capacity = getMatch(sourceText, /\b\d{1,3}[ -]?gallon\b/i);
			const reportedYear = getMatch(sourceText, /\b(?:19|20)\d{2}\b/);
			const details = [capacity, reportedYear && `reported year ${reportedYear}`]
				.filter(Boolean)
				.join('; ');
			return details ? { specNotes: details } : {};
		},
	},
	{
		assetType: 'Electrical Panel',
		pattern: /\b(?:\d{2,3}\s*amp service panel|electrical panel|breaker panel|main panel)\b/i,
		sectionKinds: ['electrical'],
		getDetails: (sourceText) => {
			const amperage = getMatch(sourceText, /\b\d{2,3}\s*amp\b/i);
			return amperage ? { specNotes: `${amperage} service` } : {};
		},
	},
	{ assetType: 'Roof', pattern: /\broof\b/i, sectionKinds: ['exterior'] },
	{ assetType: 'Gutter System', pattern: /\bgutters?\b/i, sectionKinds: ['exterior'] },
	{ assetType: 'Foundation', pattern: /\bfoundation|\bslab\b/i, sectionKinds: ['structural'] },
	{ assetType: 'Refrigerator', pattern: /\brefrigerator|\bfridge\b/i, sectionKinds: ['kitchen'] },
];

const buildEquipment = (sections: InspectionDocumentSection[]) => {
	const equipment: ServiceReportEquipmentCandidate[] = [];
	for (const rule of EQUIPMENT_RULES) {
		const section = sections.find((candidate) => {
			const sourceText = `${candidate.title}\n${candidate.sourceText}`;
			return rule.sectionKinds.includes(candidate.kind) && rule.pattern.test(sourceText);
		});
		if (!section) continue;
		const sourceText = `${section.title}: ${joinWrappedLines(section.lines).join(' ')}`;
		const variant = rule.getVariant?.(sourceText);
		const details = rule.getDetails?.(sourceText);
		equipment.push({
			id: `equipment-${slug(rule.assetType)}`,
			label: rule.assetType,
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
	sourceText.match(/every\s+\d+\s+days?|twice\s+(?:a\s+year|yearly)|annually|annual(?:ly)?|monthly|each month/i)?.[0] || '';

const classifyRecommendation = (sourceText: string, contextText: string) => {
	if (/professional service|service.*hvac|hvac.*service/i.test(sourceText)) {
		return { title: 'Schedule annual HVAC service', relatedAssetType: 'HVAC' };
	}
	if (/(?:replace|change).*(?:hvac )?filter|(?:hvac )?filter.*(?:replace|change)/i.test(sourceText)) {
		return { title: 'Replace HVAC filter', relatedAssetType: 'HVAC' };
	}
	if (
		/flush.*water heater|water heater.*flush/i.test(sourceText) ||
		(/\bflush\b/i.test(sourceText) && /\b(?:plumbing|water heater)\b/i.test(contextText))
	) {
		return { title: 'Flush water heater', relatedAssetType: 'Water Heater' };
	}
	if (/clean.*gutter|gutter.*clean/i.test(sourceText)) {
		return { title: 'Clean gutters', relatedAssetType: 'Gutter System' };
	}
	if (/test.*(?:smoke|co\b|carbon monoxide)|(?:smoke|carbon monoxide).*test/i.test(sourceText)) {
		return { title: 'Test smoke/CO detectors', relatedAssetType: 'Safety Device' };
	}
	if (/(?:replace|check|verify).*(?:detector|batter)|(?:detector|batter).*(?:replace|check|verify)/i.test(sourceText)) {
		return { title: 'Verify smoke/CO detectors and batteries', relatedAssetType: 'Safety Device' };
	}
	if (/label.*water shutoff|water shutoff.*label/i.test(sourceText)) {
		return { title: 'Label main water shutoff' };
	}
	if (!/recommend|replace|repair|flush|clean|test|verify|label|schedule|^service\b/i.test(sourceText)) {
		return undefined;
	}
	const action = normalizeLine(sourceText)
		.replace(/^.*?recommend(?:ed)?\s+/i, '')
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
		for (const sourceText of getSentences(section)) {
			if (!/recommend|replace|repair|flush|clean|test|verify|label|schedule|^service\b/i.test(sourceText)) {
				continue;
			}
			const classified = classifyRecommendation(sourceText, contextText);
			if (!classified) continue;
			const key = classified.title.toLowerCase();
			const cadence = getCadence(sourceText);
			const existing = taskByTitle.get(key);
			if (existing) {
				if (cadence && !/Reported cadence:/i.test(existing.description)) {
					existing.description = `${existing.description}\nReported cadence: ${cadence}.`;
				}
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
				...(classified.relatedAssetType
					? { relatedAssetType: classified.relatedAssetType }
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
	const recommendations = buildRecommendations(sections);
	const equipment = buildEquipment(sections);
	const specifications = buildSpecifications(equipment);
	const visitDate = getLabeledValue(sections, ['Inspection Date', 'Visit Date', 'Date']);
	const providerName = getLabeledValue(sections, ['Inspector', 'Inspector Name', 'Technician Name']);
	const propertyAddress = getPropertyAddress(sections);

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
		specifications,
		diagnostics: {
			parserVersion: 'inspection-v1',
			sectionCount: sections.length,
			observationCount: observations.length,
			recommendationCount: recommendations.length,
			equipmentCount: equipment.length,
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
