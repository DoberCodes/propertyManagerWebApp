import {
	acceptKnowledgeSuggestion,
	applyAcceptedKnowledgeSuggestion,
	buildPropertyConfirmationFromDocumentText,
	createPendingKnowledgeSuggestion,
	extractFieldsFromDocumentText,
	extractPartSuggestionsFromDocumentText,
	rejectKnowledgeSuggestion,
} from './propertyKnowledgeAcquisition';
import type { Device, Property, PropertyDocument } from '../types/Property.types';

const baseDocument: PropertyDocument = {
	id: 'doc-1',
	name: 'Water Heater model WH-200 serial SN7788 install 2024-03-12.pdf',
	url: 'https://example.com/water-heater.pdf',
	size: 1234,
	type: 'application/pdf',
	category: 'manual',
	assignedDeviceId: 'system-1',
	uploadedAt: '2026-06-26T12:00:00.000Z',
};

const baseProperty: Property = {
	id: 'property-1',
	userId: 'user-1',
	title: 'Home',
	slug: 'home',
};

const baseSystem: Device = {
	id: 'system-1',
	userId: 'user-1',
	type: 'Water Heater',
	location: {
		propertyId: 'property-1',
	},
};

describe('property knowledge acquisition', () => {
	it('creates a pending knowledge suggestion from document metadata', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
			createdAt: '2026-06-26T12:30:00.000Z',
		});

		expect(suggestion.status).toBe('pending');
		expect(suggestion.propertyId).toBe('property-1');
		expect(suggestion.sourceDocumentId).toBe('doc-1');
		expect(suggestion.documentType).toBe('manual');
		expect(suggestion.relatedSystemId).toBe('system-1');
		expect(suggestion.extractedFields.map((field) => field.fieldKey)).toEqual(
			expect.arrayContaining([
				'assetType',
				'model',
				'serialNumber',
				'installDate',
			]),
		);
		expect(
			suggestion.extractedFields.find((field) => field.fieldKey === 'assetType')
				?.value,
		).toBe('Water Heater');
	});

	it('uses document asset links when legacy assigned device fields are missing', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: {
				...baseDocument,
				assignedDeviceId: undefined,
				links: {
					assetIds: ['system-1'],
				},
			},
			propertyId: 'property-1',
			createdAt: '2026-06-26T12:30:00.000Z',
		});

		expect(suggestion.relatedSystemId).toBe('system-1');
	});

	it('does not suggest existing system details again', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
			property: baseProperty,
			systems: [
				{
					...baseSystem,
					assetType: 'Water Heater',
					model: 'WH-200',
					serialNumber: 'SN7788',
					installationDate: '2024-03-12',
				},
			],
		});

		const fieldKeys = suggestion.extractedFields.map((field) => field.fieldKey);

		expect(fieldKeys).not.toContain('assetType');
		expect(fieldKeys).not.toContain('model');
		expect(fieldKeys).not.toContain('serialNumber');
		expect(fieldKeys).not.toContain('installDate');
	});

	it('accepts a suggestion and preserves reviewed values', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
		});
		const modelField = suggestion.extractedFields.find(
			(field) => field.fieldKey === 'model',
		);

		const accepted = acceptKnowledgeSuggestion(suggestion, {
			reviewedAt: '2026-06-26T13:00:00.000Z',
			acceptedByUser: 'user-1',
			fieldValues: modelField ? { [modelField.id]: 'WH-250' } : {},
		});

		expect(accepted.status).toBe('accepted');
		expect(accepted.reviewedAt).toBe('2026-06-26T13:00:00.000Z');
		expect(accepted.acceptedByUser).toBe('user-1');
		expect(
			accepted.extractedFields.find((field) => field.fieldKey === 'model')
				?.userEditableValue,
		).toBe('WH-250');
	});

	it('rejects a suggestion without deleting it', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
		});

		const rejected = rejectKnowledgeSuggestion(suggestion, {
			reviewedAt: '2026-06-26T13:15:00.000Z',
		});

		expect(rejected.status).toBe('rejected');
		expect(rejected.sourceDocumentId).toBe('doc-1');
		expect(rejected.rejectedAt).toBe('2026-06-26T13:15:00.000Z');
	});

	it('applies accepted fields to the correct system target', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
		});
		const accepted = acceptKnowledgeSuggestion(suggestion, {
			reviewedAt: '2026-06-26T13:30:00.000Z',
			acceptedByUser: 'user-1',
		});

		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: accepted,
			property: baseProperty,
			systems: [baseSystem],
			acceptedByUser: 'user-1',
			acceptedAt: '2026-06-26T13:45:00.000Z',
		});

		expect(result.systemUpdates).toHaveLength(1);
		expect(result.systemUpdates[0].id).toBe('system-1');
		expect(result.systemUpdates[0].updates.model).toBe('WH-200');
		expect(result.systemUpdates[0].updates.serialNumber).toBe('SN7788');
		expect(result.systemUpdates[0].updates.installationDate).toBe('2024-03-12');
		expect(result.appliedSuggestion.status).toBe('applied');
	});

	it('does not update records for rejected suggestions', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
		});
		const rejected = rejectKnowledgeSuggestion(suggestion);

		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: rejected,
			property: baseProperty,
			systems: [baseSystem],
			acceptedByUser: 'user-1',
		});

		expect(result.propertyUpdates).toEqual({});
		expect(result.systemUpdates).toEqual([]);
		expect(result.appliedSuggestion.status).toBe('rejected');
	});

	it('does not apply individually rejected fields', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
		});
		const modelField = suggestion.extractedFields.find(
			(field) => field.fieldKey === 'model',
		);
		const serialField = suggestion.extractedFields.find(
			(field) => field.fieldKey === 'serialNumber',
		);
		const accepted = acceptKnowledgeSuggestion(suggestion, {
			reviewedAt: '2026-06-26T13:30:00.000Z',
			acceptedByUser: 'user-1',
			fieldReviewStatuses: modelField
				? { [modelField.id]: { accepted: false } }
				: {},
		});

		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: accepted,
			property: baseProperty,
			systems: [baseSystem],
			acceptedByUser: 'user-1',
			acceptedAt: '2026-06-26T13:45:00.000Z',
		});

		expect(
			accepted.extractedFields.find((field) => field.id === modelField?.id)
				?.reviewStatus,
		).toBe('rejected');
		expect(result.systemUpdates[0].updates.model).toBeUndefined();
		expect(result.systemUpdates[0].updates.serialNumber).toBe(
			serialField?.value,
		);
	});

	it('keeps accepted fields traceable to the source document', () => {
		const suggestion = createPendingKnowledgeSuggestion({
			document: baseDocument,
			propertyId: 'property-1',
		});
		const accepted = acceptKnowledgeSuggestion(suggestion, {
			reviewedAt: '2026-06-26T14:00:00.000Z',
			acceptedByUser: 'user-1',
		});

		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: accepted,
			property: baseProperty,
			systems: [baseSystem],
			acceptedByUser: 'user-1',
			acceptedAt: '2026-06-26T14:10:00.000Z',
		});

		const modelProvenance =
			result.systemUpdates[0].updates.propertyKnowledgeProvenance?.model?.[0];

		expect(modelProvenance).toMatchObject({
			sourceDocumentId: 'doc-1',
			sourceDocumentType: 'manual',
			extractionMethod: 'metadata_placeholder',
			acceptedByUser: 'user-1',
			fieldKey: 'model',
		});
	});

	it('extracts structured suggestions from invoice image text', () => {
		const invoiceText = `
			Carolina Comfort HVAC, LLC
			(704) 555-0198
			www.carolinacomforthvac.com
			INVOICE
			Invoice Number: INV-2025-04158
			Invoice Date: June 14, 2025
			Service Date: June 14, 2025
			Equipment Type: Split System Heat Pump
			Brand: Trane
			Model: 4TTR4036L1000A
			Serial Number (Outdoor): 2315X4V2F
			Serial Number (Indoor): 2315X4V2F
			Installation Date: June 14, 2025
			Warranty: 10 Year Parts / 10 Year Compressor
			DESCRIPTION QTY UNIT PRICE AMOUNT
			Trane 3 Ton 16 SEER2 Heat Pump Condenser
			Model: 4TTR4036L1000A
			Trane Air Handler with Multi-Position Coil
			Model: TEM4A0C36H41SAA
			Honeywell T6 Pro Smart Thermostat
			Disconnect Box
			Drain Pan with Safety Switch
			R-410A Refrigerant (per lb)
			Labor - Installation & Startup $950.00
			Tax (7.25%) $495.18
			TOTAL DUE $7,325.18
			WARRANTY INFORMATION
			To maintain warranty coverage, system must be registered within 60 days of installation and maintenance performed annually.
		`;

		const fields = extractFieldsFromDocumentText(
			invoiceText,
			'system-1',
		);
		const valuesByKey = new Map(fields.map((field) => [field.fieldKey, field.value]));

		expect(valuesByKey.get('invoiceNumber')).toBe('INV-2025-04158');
		expect(valuesByKey.get('contractorName')).toBe('Carolina Comfort HVAC, LLC');
		expect(valuesByKey.get('assetType')).toBe('HVAC');
		expect(valuesByKey.get('assetVariant')).toBe('Heat Pump');
		expect(valuesByKey.get('brand')).toBe('Trane');
		expect(valuesByKey.get('model')).toBe('4TTR4036L1000A');
		expect(valuesByKey.get('serialNumber')).toContain('Outdoor: 2315X4V2F');
		expect(valuesByKey.get('installDate')).toBe('June 14, 2025');
		expect(valuesByKey.get('warrantyLength')).toBe(
			'10 Year Parts / 10 Year Compressor',
		);
		expect(valuesByKey.get('laborCost')).toBe('$950.00');
		expect(valuesByKey.get('taxAmount')).toBe('$495.18');
		expect(valuesByKey.get('totalCost')).toBe('$7325.18');
		expect(valuesByKey.has('recommendedMaintenanceInterval')).toBe(false);
		expect(valuesByKey.has('manufacturerSupportUrl')).toBe(false);
		expect(valuesByKey.get('partsReplaced')).toContain('Heat Pump Condenser');
		expect(valuesByKey.get('partsReplaced')).toContain('Multi-Position Coil');
		expect(valuesByKey.get('partsReplaced')).toContain('Smart Thermostat');
		expect(valuesByKey.get('partsReplaced')).toContain('4TTR4036L1000A');
		expect(valuesByKey.get('partsReplaced')).toContain('TEM4A0C36H41SAA');
		expect(valuesByKey.get('fluidType')).toBe('R-410A');
		expect(
			fields.find((field) => field.fieldKey === 'invoiceNumber')?.confidenceLevel,
		).toBe('high');
		expect(
			fields.find((field) => field.fieldKey === 'partsReplaced')?.confidenceLevel,
		).toBe('medium');
		expect(fields[0].confidenceLevel).toBe('high');
	});

	it('does not require property confirmation when a labeled service address matches', () => {
		const confirmation = buildPropertyConfirmationFromDocumentText(
			`
				INVOICE
				Service Address:
				123 Main Street
				Charlotte, NC 28202
				Invoice Number: INV-1
			`,
			'123 Main St, Charlotte, NC 28202',
		);

		expect(confirmation).toBeUndefined();
	});

	it('does not require property confirmation for a partial address match', () => {
		const confirmation = buildPropertyConfirmationFromDocumentText(
			`
				INVOICE
				Job Address: 123 Main Street
				Invoice Number: INV-1
			`,
			'123 Main St, Charlotte, NC 28202',
		);

		expect(confirmation).toBeUndefined();
	});

	it('requires property confirmation when a labeled service address conflicts', () => {
		const confirmation = buildPropertyConfirmationFromDocumentText(
			`
				INVOICE
				Service Address:
				456 Oak Avenue
				Charlotte, NC 28202
				Invoice Number: INV-1
			`,
			'123 Main St, Charlotte, NC 28202',
		);

		expect(confirmation).toMatchObject({
			status: 'needs_confirmation',
			documentAddress: '456 Oak Avenue, Charlotte, NC 28202',
			propertyAddress: '123 Main St, Charlotte, NC 28202',
			sourceLabel: 'Service Address',
		});
		expect(confirmation?.reason).toContain('street number');
	});

	it('requires property confirmation when a labeled property apartment conflicts', () => {
		const confirmation = buildPropertyConfirmationFromDocumentText(
			`
				Pinecrest Roofing & Exterior
				Inspection Report and Invoice
				Property
				123 Sand Oak Drive, Apt A
				Report / Invoice #
				PRX-26077
			`,
			'123 Sand Oak Drive, Apt B',
		);

		expect(confirmation).toMatchObject({
			status: 'needs_confirmation',
			documentAddress: '123 Sand Oak Drive, Apt A',
			propertyAddress: '123 Sand Oak Drive, Apt B',
			sourceLabel: 'Property',
		});
		expect(confirmation?.reason).toContain('apartment/unit');
	});

	it('ignores contractor mailing addresses without a property-location label', () => {
		const confirmation = buildPropertyConfirmationFromDocumentText(
			`
				Carolina Comfort HVAC, LLC
				456 Oak Avenue
				Charlotte, NC 28202
				INVOICE
				Invoice Number: INV-1
			`,
			'123 Main St, Charlotte, NC 28202',
		);

		expect(confirmation).toBeUndefined();
	});

	it('does not require property confirmation when no document address is found', () => {
		const confirmation = buildPropertyConfirmationFromDocumentText(
			`
				INVOICE
				Invoice Number: INV-1
				Total Due $100.00
			`,
			'123 Main St, Charlotte, NC 28202',
		);

		expect(confirmation).toBeUndefined();
	});

	it('stops labeled OCR values before the next label on flattened invoice rows', () => {
		const flattenedSystemText = `
			SYSTEM INFORMATION: Equipment Type: Split System Heat Pump Brand: Trane Model: 4TTR4036L1000A Serial Number (Outdoor): 2315X4V2F Serial Number (Indoor): 2315X4V2F System Capacity: 3 Ton / 36,000 BTU Refrigerant: R-410A Installation Date: June 14, 2025 Warranty: 10 Year Parts / 10 Year Compressor DESCRIPTION QTY UNIT PRICE AMOUNT
		`;

		const fields = extractFieldsFromDocumentText(
			flattenedSystemText,
			'system-1',
		);
		const valuesByKey = new Map(fields.map((field) => [field.fieldKey, field.value]));

		expect(valuesByKey.get('brand')).toBe('Trane');
		expect(valuesByKey.get('model')).toBe('4TTR4036L1000A');
		expect(valuesByKey.get('serialNumber')).toBe(
			'Outdoor: 2315X4V2F; Indoor: 2315X4V2F',
		);
		expect(valuesByKey.get('warrantyLength')).toBe(
			'10 Year Parts / 10 Year Compressor',
		);
		expect(valuesByKey.get('warrantyLength')).not.toContain('DESCRIPTION');
	});

	it('does not treat payment links as contractor names', () => {
		const fields = extractFieldsFromDocumentText(
			`
				Carolina Comfort HVAC, LLC
				4512 Weddington Road, Suite 102
				Matthews, NC 28105
				(704) 555-0198
				INVOICE
				Invoice Number: INV-2025-04158
				Payment Options
				ES Pay online: carolinacomforthvac.com/pay DnizkolV
				ACH / Bank Transfer: Routing 053100300 | Account 987654321
			`,
			'system-1',
		);
		const valuesByKey = new Map(fields.map((field) => [field.fieldKey, field.value]));

		expect(valuesByKey.get('contractorName')).toBe('Carolina Comfort HVAC, LLC');
		expect(valuesByKey.get('contractorName')).not.toContain('Pay online');
		expect(valuesByKey.get('contractorName')).not.toContain('.com/pay');
	});

	it('does not treat maintenance guidance or warranty prose as a contractor name', () => {
		const fields = extractFieldsFromDocumentText(
			`
				ROOF INSPECTION NOTES
				Schedule a roof check after major storms and clear gutters each fall.
				Sealant repair workmanship warranty: 1 year.
			`,
			'system-1',
		);
		const valuesByKey = new Map(fields.map((field) => [field.fieldKey, field.value]));

		expect(valuesByKey.has('contractorName')).toBe(false);
		expect(valuesByKey.get('warrantyLength')).toBe(
			'Sealant repair workmanship warranty: 1 year',
		);
	});

	it('extracts roof inspection invoice totals and workmanship warranty from image text', () => {
		const invoiceText = `
			Pinecrest Roofing & Exterior
			Inspection Report and Invoice
			Report / Invoice #
			PRX-26077
			Date
			June 2, 2026
			Property
			123 Sand Oak Drive, Apt A
			Inspector
			Marcus Reed

			Roof Details
			Asset type: Roof
			Material: Architectural asphalt shingles
			Estimated install year: 2019
			Warranty paperwork: Not provided at visit
			Observed condition: Normal wear for age; no active leak observed during visual inspection.

			Finding Action Cost
			Loose pipe boot flashing at rear slope Resealed pipe boot with roofing sealant $85.00
			Debris in front gutter run Cleared accessible debris $65.00
			General roof inspection with photos Inspection report attached $175.00

			Invoice Total: $325.00
			Tax: $0.00
			Paid: $325.00

			Recommended Follow-Up
			Schedule a roof check after major storms and clear gutters each fall.
			Sealant repair workmanship warranty: 1 year.
		`;

		const fields = extractFieldsFromDocumentText(invoiceText, 'roof-1');
		const valuesByKey = new Map(fields.map((field) => [field.fieldKey, field.value]));

		expect(valuesByKey.get('contractorName')).toBe('Pinecrest Roofing & Exterior');
		expect(valuesByKey.get('assetType')).toBe('Roof');
		expect(valuesByKey.get('invoiceNumber')).toBe('PRX-26077');
		expect(valuesByKey.get('invoiceDate')).toBe('June 2, 2026');
		expect(valuesByKey.get('totalCost')).toBe('$325.00');
		expect(valuesByKey.get('taxAmount')).toBe('$0.00');
		expect(valuesByKey.get('warrantyLength')).toBe(
			'Sealant repair workmanship warranty: 1 year',
		);
		expect(valuesByKey.get('warrantyLength')).not.toContain('Not provided');
	});

	it('turns an accepted roof invoice review into maintenance history with cost and warranty context', () => {
		const fields = extractFieldsFromDocumentText(
			`
				Pinecrest Roofing & Exterior
				Inspection Report and Invoice
				Report / Invoice #
				PRX-26077
				Date
				June 2, 2026
				Property
				123 Sand Oak Drive, Apt A
				Roof Details
				Asset type: Roof
				Finding Action Cost
				Loose pipe boot flashing at rear slope Resealed pipe boot with roofing sealant $85.00
				Debris in front gutter run Cleared accessible debris $65.00
				General roof inspection with photos Inspection report attached $175.00
				Invoice Total: $325.00
				Tax: $0.00
				Paid: $325.00
				Recommended Follow-Up
				Schedule a roof check after major storms and clear gutters each fall.
				Sealant repair workmanship warranty: 1 year.
			`,
			'roof-1',
		);
		const accepted = acceptKnowledgeSuggestion(
			{
				id: 'suggestion-roof-1',
				sourceDocumentId: 'doc-roof-1',
				propertyId: 'property-1',
				relatedSystemId: 'roof-1',
				documentType: 'invoice',
				extractionMethod: 'image_ocr',
				extractedFields: fields,
				status: 'pending',
				createdAt: '2026-06-26T12:00:00.000Z',
				sourceDocumentName: 'Pinecrest Roofing Invoice.png',
			},
			{
				reviewedAt: '2026-06-26T13:00:00.000Z',
				acceptedByUser: 'user-1',
			},
		);

		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: accepted,
			property: baseProperty,
			systems: [
				{
					...baseSystem,
					id: 'roof-1',
					type: 'Roof',
					assetType: 'Roof',
				},
			],
			acceptedByUser: 'user-1',
			acceptedAt: '2026-06-26T13:10:00.000Z',
		});

		expect(result.maintenanceHistorySuggestion).toMatchObject({
			eventType: 'invoice_uploaded',
			eventSource: 'document_upload',
			completionDate: '2026-06-02',
			deviceIds: ['roof-1'],
			financials: {
				actual: {
					contractorCost: 325,
				},
			},
		});
		expect(result.maintenanceHistorySuggestion?.completionNotes).toContain(
			'Total: USD 325.00',
		);
		expect(result.maintenanceHistorySuggestion?.completionNotes).toContain(
			'Warranty information: Sealant repair workmanship warranty: 1 year',
		);
		expect(result.contractorSuggestion?.name).toBe('Pinecrest Roofing & Exterior');
	});

	it('prepares contractor and maintenance history records when invoice details are applied', () => {
		const fields = extractFieldsFromDocumentText(
			`
				Carolina Comfort HVAC, LLC
				(704) 555-0198
				www.carolinacomforthvac.com
				Invoice Number: INV-2025-04158
				Invoice Date: June 14, 2025
				Service Date: June 14, 2025
				Equipment Type: Split System Heat Pump
				DESCRIPTION
				Honeywell T6 Pro Smart Thermostat
				Labor - Installation & Startup $950.00
				Tax (7.25%) $495.18
				TOTAL DUE $7,325.18
			`,
			'system-1',
		);
		const accepted = acceptKnowledgeSuggestion(
			{
				id: 'suggestion-1',
				sourceDocumentId: 'doc-1',
				propertyId: 'property-1',
				relatedSystemId: 'system-1',
				documentType: 'invoice',
				extractionMethod: 'image_ocr',
				extractedFields: fields,
				status: 'pending',
				createdAt: '2026-06-26T12:00:00.000Z',
				sourceDocumentName: 'HVAC Invoice.png',
			},
			{
				reviewedAt: '2026-06-26T13:00:00.000Z',
				acceptedByUser: 'user-1',
			},
		);

		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: accepted,
			property: baseProperty,
			systems: [baseSystem],
			acceptedByUser: 'user-1',
			acceptedAt: '2026-06-26T13:10:00.000Z',
		});

		expect(result.contractorSuggestion).toMatchObject({
			name: 'Carolina Comfort HVAC, LLC',
			category: 'HVAC',
			phone: '(704) 555-0198',
			website: 'www.carolinacomforthvac.com',
		});
		expect(result.maintenanceHistorySuggestion).toMatchObject({
			eventType: 'invoice_uploaded',
			eventSource: 'document_upload',
			completionDate: '2025-06-14',
			deviceIds: ['system-1'],
		});
		expect(result.maintenanceHistorySuggestion?.financials?.actual).toEqual({
			contractorCost: 7325.18,
		});
		expect(result.maintenanceHistorySuggestion?.completionNotes).toContain(
			'Honeywell T6 Pro Smart Thermostat',
		);
	});

	it('matches possible HVAC parts and supplies from document text', () => {
		const suggestions = extractPartSuggestionsFromDocumentText(`
			DESCRIPTION
			Trane 3 Ton 16 SEER2 Heat Pump Condenser Model: 4TTR4036L1000A
			Trane Air Handler with Multi-Position Coil Model: TEM4A0C36H41SAA
			Honeywell T6 Pro Smart Thermostat
			Drain Pan with Safety Switch
			R-410A Refrigerant (per lb)
			TOTAL DUE $700.00
		`);

		expect(suggestions.map((part) => part.partKnowledgeId)).toEqual(
			expect.arrayContaining([
				'condenser',
				'coil',
				'thermostat',
				'drain_pan',
				'refrigerant',
			]),
		);
		expect(suggestions.find((part) => part.partKnowledgeId === 'thermostat')).toMatchObject({
			name: 'Honeywell T6 Pro Smart Thermostat',
			category: 'accessory',
			confidenceLevel: 'medium',
		});
	});

	it('applies accepted part suggestions to the related system service items', () => {
		const accepted = acceptKnowledgeSuggestion(
			{
				id: 'suggestion-parts-1',
				sourceDocumentId: 'doc-1',
				propertyId: 'property-1',
				relatedSystemId: 'system-1',
				documentType: 'invoice',
				extractionMethod: 'image_ocr',
				extractedFields: [],
				suggestedParts: [
					{
						id: 'part-thermostat-1',
						partKnowledgeId: 'thermostat',
						label: 'Thermostat',
						name: 'Honeywell T6 Pro Smart Thermostat',
						category: 'accessory',
						relatedAssetTypes: ['hvac'],
						targetEntity: 'part',
						sourceText: 'Honeywell T6 Pro Smart Thermostat',
						confidence: 0.65,
					},
					{
						id: 'part-refrigerant-1',
						partKnowledgeId: 'refrigerant',
						label: 'Refrigerant',
						name: 'R-410A Refrigerant',
						category: 'consumable',
						relatedAssetTypes: ['hvac'],
						targetEntity: 'part',
						sourceText: 'R-410A Refrigerant',
						confidence: 0.65,
					},
				],
				status: 'pending',
				createdAt: '2026-06-26T12:00:00.000Z',
				sourceDocumentName: 'HVAC Invoice.png',
			},
			{
				reviewedAt: '2026-06-26T13:00:00.000Z',
				acceptedByUser: 'user-1',
				partValues: {
					'part-refrigerant-1': {
						accepted: false,
					},
				},
			},
		);

		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: accepted,
			property: baseProperty,
			systems: [baseSystem],
			acceptedByUser: 'user-1',
			acceptedAt: '2026-06-26T13:10:00.000Z',
		});

		expect(result.systemUpdates).toHaveLength(1);
		expect(result.systemUpdates[0].updates.serviceItems?.[0]).toMatchObject({
			name: 'Honeywell T6 Pro Smart Thermostat',
			category: 'accessory',
			manufacturer: 'Honeywell',
		});
		expect(result.systemUpdates[0].updates.serviceItems?.[0].notes).toContain(
			'Source text: Honeywell T6 Pro Smart Thermostat',
		);
		expect(result.systemUpdates[0].updates.serviceItems).toHaveLength(1);
		expect(accepted.suggestedParts?.[1].reviewStatus).toBe('rejected');
	});
});
