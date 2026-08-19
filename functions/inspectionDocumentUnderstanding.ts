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
		parserVersion: 'inspection-v2';
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
	{ assetType: 'Dishwasher', pattern: /\bdishwasher\b/i, sectionKinds: ['kitchen'] },
	{ assetType: 'Range / Oven', pattern: /\b(?:gas )?range\b|\boven\b/i, sectionKinds: ['kitchen'] },
	{ assetType: 'Pool', pattern: /\bpool (?:pump|filter|system|equipment)\b/i, sectionKinds: ['kitchen'] },
	{ assetType: 'Garage Door', pattern: /\bgarage door (?:opener|operator)|\bauto-reverse\b/i, sectionKinds: ['interior', 'exterior'] },
	{ assetType: 'Irrigation', pattern: /\birrigation\b|\bspray head\b/i, sectionKinds: ['exterior'] },
];

const buildEquipment = (sections: InspectionDocumentSection[]) => {
	const equipment: ServiceReportEquipmentCandidate[] = [];
	for (const rule of EQUIPMENT_RULES) {
		const section = sections.find((candidate) => {
			const sourceText = `${candidate.title}\n${candidate.sourceText}`;
			return candidate.kinds.some((kind) => rule.sectionKinds.includes(kind)) &&
				rule.pattern.test(sourceText);
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
	const normalizedSource = normalizeLine(sourceText)
		.replace(/^(?:recommendation|recommended action|action)\s*:?\s*/i, '')
		.trim();
	if (/^(?:do not|no task|none\b)/i.test(normalizedSource)) return undefined;
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
		return { title: 'Replace HVAC filter', relatedAssetType: 'HVAC' };
	}
	if (
		/flush.*water heater|water heater.*flush/i.test(normalizedSource) ||
		(/\bflush\b/i.test(normalizedSource) && /\b(?:plumbing|water heater)\b/i.test(contextText))
	) {
		return { title: 'Flush water heater', relatedAssetType: 'Water Heater' };
	}
	if (/descale.*(?:tankless )?water heater|water heater.*descale/i.test(normalizedSource)) {
		return { title: 'Descale tankless water heater', relatedAssetType: 'Water Heater' };
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
	if (/label.*water shutoff|water shutoff.*label/i.test(normalizedSource)) {
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
	if (/adjust.*(?:irrigation|spray head)|spray head.*adjust/i.test(normalizedSource)) {
		return { title: 'Adjust irrigation spray head', relatedAssetType: 'Irrigation' };
	}
	if (/regrade.*(?:corner|foundation)|direct.*water away from.*foundation/i.test(normalizedSource)) {
		return { title: 'Improve drainage at the left rear corner' };
	}
	if (!/^recommendation\b/i.test(normalizeLine(sourceText)) &&
		!/recommend|\breplace\b|\brepair\b|\bflush\b|\bclean\b|\btest\b|\bverify\b|\blabel\b|\bschedule\b|\bsecure\b|\bdescale\b|\badjust\b|\bregrade\b|\bmonitor\b/i.test(normalizedSource)) {
		return undefined;
	}
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
		for (const sourceText of getSentences(section)) {
			if (!/recommend|\breplace\b|\brepair\b|\bflush\b|\bclean\b|\btest\b|\bverify\b|\blabel\b|\bschedule\b|\bsecure\b|\bdescale\b|\badjust\b|\bregrade\b|\bmonitor\b|\bevaluate\b/i.test(sourceText)) {
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
		specifications,
		diagnostics: {
			parserVersion: 'inspection-v2',
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
