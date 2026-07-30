export type PdfTextItem = {
	text: string;
	x: number;
	y: number;
	width: number;
};

export type ExtractedPdfDocument = {
	rawText: string;
	tables: string[][][];
	pages: Array<{
		pageNumber: number;
		lines: string[];
		items: PdfTextItem[];
	}>;
	hasUsableText: boolean;
};

const loadPdfJs = () => {
	const importModule = new Function(
		'specifier',
		'return import(specifier)',
	) as (specifier: string) => Promise<any>;
	return importModule('pdfjs-dist/legacy/build/pdf.mjs');
};

const groupItemsIntoRows = (items: PdfTextItem[]) => {
	const rows: Array<{ y: number; items: PdfTextItem[] }> = [];
	for (const item of items) {
		const row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.5);
		if (row) {
			row.items.push(item);
		} else {
			rows.push({ y: item.y, items: [item] });
		}
	}

	return rows.sort((a, b) => b.y - a.y).map((row) => ({
		...row,
		items: row.items.sort((a, b) => a.x - b.x),
	}));
};

const rowText = (items: PdfTextItem[]) =>
	items
		.map((item) => item.text.trim())
		.filter(Boolean)
		.join(' ')
		.replace(/\s+/g, ' ')
		.replace(/\bfi\s+lter\b/gi, 'filter')
		.replace(/([a-z])\s+fi\s+([a-z])/gi, '$1fi$2')
		.replace(/\bfi\s+([a-z])/gi, 'fi$1')
		.trim();

const groupItemsIntoLines = (items: PdfTextItem[]): string[] =>
	groupItemsIntoRows(items)
		.map((row) =>
			rowText(row.items),
		)
		.filter(Boolean);

const extractKnownTables = (items: PdfTextItem[]): string[][][] => {
	const rows = groupItemsIntoRows(items);
	const tables: string[][][] = [];
	for (let headerIndex = 0; headerIndex < rows.length; headerIndex += 1) {
		const header = rows[headerIndex];
		const headerText = rowText(header.items).toLowerCase();
		const isTaskTable = headerText.includes('task') && headerText.includes('status') && headerText.includes('notes');
		const isStatusTable = headerText.includes('area of home') && headerText.includes('status');
		if (!isTaskTable && !isStatusTable) continue;

		const labels = isTaskTable
			? ['task', 'status', 'notes & observations']
			: ['area of home', 'status', 'notes & observations'];
		const starts = labels.map((label, index) => {
			const exact = header.items.find((item) => item.text.toLowerCase().includes(label));
			if (exact) return exact.x;
			return index === 0 ? 0 : index === 1 ? 190 : 310;
		});
		const boundaries = [(starts[0] + starts[1]) / 2, (starts[1] + starts[2]) / 2];
		const table: string[][] = [labels.map((label) => label.replace(/\b\w/g, (char) => char.toUpperCase()))];
		let current: string[] | null = null;
		let leadingNotes: string[] = [];

		const finishCurrent = () => {
			if (current && current.some(Boolean)) table.push(current.map((cell) => cell.trim()));
			current = null;
		};

		for (let rowIndex = headerIndex + 1; rowIndex < rows.length; rowIndex += 1) {
			const row = rows[rowIndex];
			const text = rowText(row.items);
			if (/^(photos from visit|it is our mission|summary of|maintenance tasks|status checks|description photo)/i.test(text)) break;
			if (rows[headerIndex].y - row.y > 610) break;
			const cells = ['', '', ''];
			for (const item of row.items) {
				const column = item.x < boundaries[0] ? 0 : item.x < boundaries[1] ? 1 : 2;
				cells[column] = `${cells[column]} ${item.text}`.trim();
			}
			const hasFirst = Boolean(cells[0]);
			const hasStatus = /\b(?:complete|[1-5]\s*-)/i.test(cells[1]);
			if (hasFirst && (hasStatus || !current)) {
				finishCurrent();
				current = [cells[0], cells[1], [...leadingNotes, cells[2]].filter(Boolean).join('\n')];
				leadingNotes = [];
				continue;
			}
			if (!current) {
				if (cells[2]) leadingNotes.push(cells[2]);
				continue;
			}
			cells.forEach((cell, column) => {
				if (cell) current![column] = [current![column], cell].filter(Boolean).join('\n');
			});
		}
		finishCurrent();
		if (table.length > 1) tables.push(table);
	}
	return tables;
};

export const extractPdfDocument = async (buffer: Buffer): Promise<ExtractedPdfDocument> => {
	const pdfjs = await loadPdfJs();
	const loadingTask = pdfjs.getDocument({
		data: new Uint8Array(buffer),
		disableWorker: true,
		useSystemFonts: true,
	});
	const document = await loadingTask.promise;
	const pages: ExtractedPdfDocument['pages'] = [];
	const tables: string[][][] = [];

	try {
		for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
			const page = await document.getPage(pageNumber);
			const content = await page.getTextContent();
			const items: PdfTextItem[] = (content.items || [])
				.filter((item: any) => typeof item?.str === 'string' && item.str.trim())
				.map((item: any) => ({
					text: item.str,
					x: Number(item.transform?.[4] || 0),
					y: Number(item.transform?.[5] || 0),
					width: Number(item.width || 0),
				}));
			pages.push({ pageNumber, items, lines: groupItemsIntoLines(items) });
			tables.push(...extractKnownTables(items));
			page.cleanup();
		}
	} finally {
		await document.destroy();
	}

	const rawText = pages.map((page) => page.lines.join('\n')).join('\n\n').trim();
	return {
		rawText,
		tables,
		pages,
		hasUsableText: rawText.replace(/\s/g, '').length >= 40,
	};
};
