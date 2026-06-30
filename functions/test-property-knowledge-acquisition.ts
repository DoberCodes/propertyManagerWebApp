import { __test } from './propertyKnowledgeAcquisition';

const assert = (condition: unknown, message: string) => {
	if (!condition) {
		throw new Error(message);
	}
};

const getFieldValue = (
	fields: ReturnType<typeof __test.extractFieldsFromPdfText>,
	fieldKey: string,
) => fields.find((field) => field.fieldKey === fieldKey)?.value || '';

const pinecrestText = `
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
Schedule a roof check after major storms and clear gutters each fall. Sealant repair workmanship warranty: 1 year.
`;

const fields = __test.extractFieldsFromPdfText(pinecrestText);

assert(
	getFieldValue(fields, 'contractorName') === 'Pinecrest Roofing & Exterior',
	'Expected Pinecrest contractor name.',
);
assert(getFieldValue(fields, 'invoiceNumber') === 'PRX-26077', 'Expected report invoice number.');
assert(getFieldValue(fields, 'invoiceDate') === 'June 2, 2026', 'Expected invoice date.');
assert(getFieldValue(fields, 'totalCost') === '$325.00', 'Expected invoice total.');
assert(getFieldValue(fields, 'taxAmount') === '$0.00', 'Expected invoice tax.');
assert(
	getFieldValue(fields, 'warrantyLength') ===
		'Sealant repair workmanship warranty: 1 year.',
	'Expected workmanship warranty and not missing-paperwork text.',
);

const confirmation = __test.buildPropertyConfirmationFromPdfText(
	pinecrestText,
	'123 Sand Oak Drive, Apt B',
);

assert(confirmation?.status === 'needs_confirmation', 'Expected property confirmation warning.');
assert(
	confirmation?.reason.includes('apartment/unit'),
	'Expected apartment/unit mismatch reason.',
);

console.log('Property knowledge acquisition backend regression passed.');
