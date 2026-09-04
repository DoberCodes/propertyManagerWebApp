import mammoth from 'mammoth';

export type ServiceReportTaskCandidate = {
	id: string;
	title: string;
	description: string;
	priority: 'Low' | 'Medium' | 'High' | 'Urgent';
	scheduleMode?: 'scheduled' | 'asap' | 'unscheduled';
	relatedAssetType?: string;
	relatedAssetVariant?: string;
	relatedEquipmentSuggestionIds?: string[];
	reportedTiming?: string;
	sourceText: string;
	confidence: number;
	confidenceLevel: 'high' | 'medium';
	confidenceReason: string;
};

export type ServiceReportEquipmentCandidate = {
	id: string;
	label: string;
	assetType: string;
	assetVariant?: string;
	details?: {
		brand?: string;
		model?: string;
		serialNumber?: string;
		installDate?: string;
		locationName?: string;
		filterSize?: string;
		specNotes?: string;
	};
	sourceText: string;
	confidence: number;
	confidenceLevel: 'high' | 'medium';
	confidenceReason: string;
};

export type ServiceReportObservation = {
	id: string;
	area: string;
	status: string;
	statusLevel?: number;
	notes?: string;
	actionable: boolean;
};

export type ParsedServiceReport = {
	title?: string;
	technicianName?: string;
	visitDate?: string;
	visitTime?: string;
	propertyAddress?: string;
	completedWork: string[];
	observations: ServiceReportObservation[];
	suggestedTasks: ServiceReportTaskCandidate[];
	suggestedEquipment: ServiceReportEquipmentCandidate[];
	rawText: string;
};

export type ParsedDocxServiceReport = ParsedServiceReport;

const decodeHtml = (value: string) =>
	value
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));

const textFromHtml = (value: string) =>
	decodeHtml(
		value
			.replace(/<br\s*\/?\s*>/gi, '\n')
			.replace(/<\/p>/gi, '\n')
			.replace(/<[^>]+>/g, ''),
	)
		.replace(/\u00a0/g, ' ')
		.replace(/[ \t]+/g, ' ')
		.replace(/\n\s*\n+/g, '\n')
		.trim();

const slug = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 48) || 'item';

const normalizeExtractedText = (value: string) =>
	value
		.replace(/\bfi\s+lter\b/gi, 'filter')
		.replace(/([a-z])\s+fi\s+([a-z])/gi, '$1fi$2')
		.replace(/\bfi\s+([a-z])/gi, 'fi$1')
		.replace(/[ \t]+/g, ' ')
		.trim();

const expandRepeatedStatusRow = (row: string[], areaColumn: number, statusColumn: number) => {
	const statuses = String(row[statusColumn] || '')
		.split('\n')
		.map((value) => value.trim())
		.filter(Boolean);
	if (statuses.length <= 1) return [row];
	const areas = String(row[areaColumn] || '')
		.split('\n')
		.map((value) => value.trim())
		.filter(Boolean);
	return statuses.map((status, index) => {
		const next = [...row];
		next[statusColumn] = status;
		next[areaColumn] = index === 0
			? areas[0] || ''
			: areas.slice(index).join(' ');
		return next;
	});
};

const extractTables = (html: string) =>
	Array.from(html.matchAll(/<table>([\s\S]*?)<\/table>/gi)).map((tableMatch) =>
		Array.from(tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)).map((rowMatch) =>
			Array.from(rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(
				(cellMatch) => textFromHtml(cellMatch[1]),
			),
		),
	);

const getLabeledValue = (tables: string[][][], label: string) => {
	const normalizedLabel = label.toLowerCase();
	for (const table of tables) {
		for (const row of table) {
			if (row[0]?.toLowerCase().replace(/:$/, '') === normalizedLabel) {
				return row[1] || '';
			}
		}
	}
	return '';
};

const getRawLabeledValue = (rawText: string, label: string) =>
	rawText
		.match(new RegExp(`(?:^|\\n)${label.replace(/\s+/g, '\\s+')}\\s*:\\s*([^\\n]*)`, 'i'))?.[1]
		?.trim() || '';

const EQUIPMENT_RULES: Array<{
	pattern: RegExp;
	assetType: string;
	assetVariant?: string;
}> = [
	{ pattern: /water heater/i, assetType: 'Water Heater', assetVariant: 'Tankless Gas' },
	{ pattern: /hvac/i, assetType: 'HVAC' },
	{ pattern: /sump pump|macerating pump/i, assetType: 'Sump Pump' },
	{ pattern: /garbage disposal/i, assetType: 'Disposal' },
	{ pattern: /dishwasher/i, assetType: 'Dishwasher' },
	{ pattern: /range hood/i, assetType: 'Range Hood' },
	{ pattern: /refrigerator|in-fridge|water\/ice filter/i, assetType: 'Refrigerator' },
	{
		pattern: /smoke.*carbon monoxide|smoke.*detector/i,
		assetType: 'Safety Device',
		assetVariant: 'Combo Detector',
	},
];

const findAssetType = (value: string) =>
	EQUIPMENT_RULES.find((rule) => rule.pattern.test(value));

const priorityFromStatus = (statusLevel?: number): ServiceReportTaskCandidate['priority'] => {
	if ((statusLevel || 0) >= 5) return 'Urgent';
	if ((statusLevel || 0) >= 4) return 'High';
	return 'Medium';
};

export const parseServiceReportLayout = ({
	tables,
	rawText,
}: {
	tables: string[][][];
	rawText: string;
}): ParsedServiceReport => {
	const title = rawText.match(/(?:^|\n)([^\n]*MAINTENANCE REPORT)(?:\n|$)/i)?.[1]?.trim();
	const completedWork: string[] = [];
	const observations: ServiceReportObservation[] = [];

	for (const table of tables) {
		const header = (table[0] || []).map((cell) => cell.toLowerCase());
		const taskColumn = header.findIndex((cell) => cell === 'task');
		const areaColumn = header.findIndex((cell) => cell === 'area of home');
		const statusColumn = header.findIndex((cell) => cell === 'status');
		const notesColumn = header.findIndex((cell) => cell.includes('notes'));

		if (taskColumn >= 0 && statusColumn >= 0) {
			for (const row of table.slice(1)) {
				const statusText = row[statusColumn] || '';
				if (/complete/i.test(statusText) && row[taskColumn]) {
					const misplacedTaskText = statusText.replace(/\s*complete\b.*$/i, '').trim();
					completedWork.push(normalizeExtractedText(
						[row[taskColumn], misplacedTaskText].filter(Boolean).join(' '),
					));
				}
			}
		}

		if (areaColumn >= 0 && statusColumn >= 0) {
			for (const row of table.slice(1).flatMap((item) => expandRepeatedStatusRow(item, areaColumn, statusColumn))) {
				const area = normalizeExtractedText(row[areaColumn] || '');
				if (!area) continue;
				const status = normalizeExtractedText(row[statusColumn] || '') || 'Status not recorded';
				const notes = normalizeExtractedText(row[notesColumn] || '');
				const statusLevel = Number(status.match(/^[1-5]/)?.[0] || 0) || undefined;
				observations.push({
					id: `observation-${slug(area)}`,
					area,
					status,
					...(statusLevel ? { statusLevel } : {}),
					...(notes ? { notes } : {}),
					actionable: Boolean((statusLevel || 0) > 1 || /next step|recommend|replace|service/i.test(notes || '')),
				});
			}
		}
	}

	const taskByTitle = new Map<string, ServiceReportTaskCandidate>();
	for (const observation of observations.filter((item) => item.actionable)) {
		const nextStep = observation.notes
			?.match(/Next Step:\s*([^\n]+)/i)?.[1]
			?.trim()
			.replace(/\s*\([^)]*\)\s*$/, '')
			.replace(/[.:]+$/, '');
		const titleText = nextStep || `Review ${observation.area} finding`;
		const asset = findAssetType(`${observation.area} ${observation.notes || ''}`);
		taskByTitle.set(titleText.toLowerCase(), {
			id: `task-${slug(titleText)}`,
			title: titleText,
			description: [observation.status, observation.notes].filter(Boolean).join('\n'),
			priority: priorityFromStatus(observation.statusLevel),
			...(asset ? { relatedAssetType: asset.assetType } : {}),
			sourceText: `${observation.area}: ${observation.status}${observation.notes ? ` - ${observation.notes}` : ''}`,
			confidence: nextStep ? 0.94 : 0.75,
			confidenceLevel: nextStep ? 'high' : 'medium',
			confidenceReason: nextStep
				? 'The service report explicitly labels this as the next step.'
				: 'The service report records an issue that may require follow-up.',
		});
	}

	const futureFollowUps = [
		...tables.flatMap((table) =>
			table.flatMap((row) => row.filter((cell) => /service|replace|repair/i.test(cell))),
		),
		...rawText.split('\n').filter((line) => /service|replace|repair/i.test(line)),
	];
	for (const followUp of futureFollowUps) {
		const match = followUp.match(/(?:^|:\s*)(Service|Replace|Repair)\s+([^\n(.]+)/i);
		if (!match) continue;
		const titleText = `${match[1]} ${match[2]}`.trim().replace(/[.:]+$/, '');
		if (taskByTitle.has(titleText.toLowerCase())) continue;
		const asset = findAssetType(followUp);
		taskByTitle.set(titleText.toLowerCase(), {
			id: `task-${slug(titleText)}`,
			title: titleText,
			description: followUp,
			priority: 'Medium',
			...(asset ? { relatedAssetType: asset.assetType } : {}),
			sourceText: followUp,
			confidence: 0.86,
			confidenceLevel: 'high',
			confidenceReason: 'The report lists this as a future homeowner follow-up.',
		});
	}

	const equipmentByType = new Map<string, ServiceReportEquipmentCandidate>();
	const equipmentSources = [
		...completedWork,
		...observations.map((item) => `${item.area} ${item.notes || ''}`),
	];
	for (const sourceText of equipmentSources) {
		const rule = findAssetType(sourceText);
		if (!rule || equipmentByType.has(rule.assetType)) continue;
		equipmentByType.set(rule.assetType, {
			id: `equipment-${slug(rule.assetType)}`,
			label: rule.assetType,
			assetType: rule.assetType,
			...(rule.assetVariant &&
			(rule.assetType !== 'Water Heater' || /on demand|tankless/i.test(sourceText))
				? { assetVariant: rule.assetVariant }
				: {}),
			sourceText,
			confidence: 0.9,
			confidenceLevel: 'high',
			confidenceReason: 'The report explicitly names this maintainable equipment or system.',
		});
	}

	return {
		...(title ? { title } : {}),
		technicianName: getLabeledValue(tables, 'technician name') || getRawLabeledValue(rawText, 'technician name') || undefined,
		visitDate: getLabeledValue(tables, 'visit date') || getRawLabeledValue(rawText, 'visit date') || undefined,
		visitTime: getLabeledValue(tables, 'visit time') || getRawLabeledValue(rawText, 'visit time') || undefined,
		propertyAddress: getLabeledValue(tables, 'home address') || getRawLabeledValue(rawText, 'home address') || undefined,
		completedWork: Array.from(new Set(completedWork)),
		observations,
		suggestedTasks: Array.from(taskByTitle.values()),
		suggestedEquipment: Array.from(equipmentByType.values()),
		rawText,
	};
};

export const parseDocxServiceReportHtml = (html: string): ParsedDocxServiceReport =>
	parseServiceReportLayout({
		tables: extractTables(html),
		rawText: textFromHtml(html.replace(/<img[^>]*>/gi, '')),
	});

export const extractDocxServiceReport = async (buffer: Buffer) => {
	const result = await mammoth.convertToHtml(
		{ buffer },
		{ convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' })) },
	);
	return parseDocxServiceReportHtml(result.value);
};
