"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDocxServiceReport = exports.parseDocxServiceReportHtml = void 0;
const mammoth_1 = __importDefault(require("mammoth"));
const decodeHtml = (value) => value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)));
const textFromHtml = (value) => decodeHtml(value
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ''))
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
const slug = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'item';
const extractTables = (html) => Array.from(html.matchAll(/<table>([\s\S]*?)<\/table>/gi)).map((tableMatch) => Array.from(tableMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)).map((rowMatch) => Array.from(rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cellMatch) => textFromHtml(cellMatch[1]))));
const getLabeledValue = (tables, label) => {
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
const EQUIPMENT_RULES = [
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
const findAssetType = (value) => EQUIPMENT_RULES.find((rule) => rule.pattern.test(value));
const priorityFromStatus = (statusLevel) => {
    if ((statusLevel || 0) >= 5)
        return 'Urgent';
    if ((statusLevel || 0) >= 4)
        return 'High';
    return 'Medium';
};
const parseDocxServiceReportHtml = (html) => {
    const tables = extractTables(html);
    const rawText = textFromHtml(html.replace(/<img[^>]*>/gi, ''));
    const title = rawText.match(/(?:^|\n)([^\n]*MAINTENANCE REPORT)(?:\n|$)/i)?.[1]?.trim();
    const completedWork = [];
    const observations = [];
    for (const table of tables) {
        const header = (table[0] || []).map((cell) => cell.toLowerCase());
        const taskColumn = header.findIndex((cell) => cell === 'task');
        const areaColumn = header.findIndex((cell) => cell === 'area of home');
        const statusColumn = header.findIndex((cell) => cell === 'status');
        const notesColumn = header.findIndex((cell) => cell.includes('notes'));
        if (taskColumn >= 0 && statusColumn >= 0) {
            for (const row of table.slice(1)) {
                if (/complete/i.test(row[statusColumn] || '') && row[taskColumn]) {
                    completedWork.push(row[taskColumn].trim());
                }
            }
        }
        if (areaColumn >= 0 && statusColumn >= 0) {
            for (const row of table.slice(1)) {
                const area = row[areaColumn]?.trim();
                if (!area)
                    continue;
                const status = row[statusColumn]?.trim() || 'Status not recorded';
                const notes = row[notesColumn]?.trim();
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
    const taskByTitle = new Map();
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
    const futureFollowUps = tables.flatMap((table) => table.flatMap((row) => row.filter((cell) => /service|replace|repair/i.test(cell))));
    for (const followUp of futureFollowUps) {
        const match = followUp.match(/(?:^|:\s*)(Service|Replace|Repair)\s+([^\n(.]+)/i);
        if (!match)
            continue;
        const titleText = `${match[1]} ${match[2]}`.trim().replace(/[.:]+$/, '');
        if (taskByTitle.has(titleText.toLowerCase()))
            continue;
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
    const equipmentByType = new Map();
    const equipmentSources = [
        ...completedWork,
        ...observations.map((item) => `${item.area} ${item.notes || ''}`),
    ];
    for (const sourceText of equipmentSources) {
        const rule = findAssetType(sourceText);
        if (!rule || equipmentByType.has(rule.assetType))
            continue;
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
        technicianName: getLabeledValue(tables, 'technician name') || undefined,
        visitDate: getLabeledValue(tables, 'visit date') || undefined,
        visitTime: getLabeledValue(tables, 'visit time') || undefined,
        propertyAddress: getLabeledValue(tables, 'home address') || undefined,
        completedWork: Array.from(new Set(completedWork)),
        observations,
        suggestedTasks: Array.from(taskByTitle.values()),
        suggestedEquipment: Array.from(equipmentByType.values()),
        rawText,
    };
};
exports.parseDocxServiceReportHtml = parseDocxServiceReportHtml;
const extractDocxServiceReport = async (buffer) => {
    const result = await mammoth_1.default.convertToHtml({ buffer }, { convertImage: mammoth_1.default.images.imgElement(() => Promise.resolve({ src: '' })) });
    return (0, exports.parseDocxServiceReportHtml)(result.value);
};
exports.extractDocxServiceReport = extractDocxServiceReport;
