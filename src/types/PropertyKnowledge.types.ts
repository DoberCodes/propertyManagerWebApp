export type PropertyKnowledgeDocumentType =
	| 'manual'
	| 'invoice'
	| 'warranty'
	| 'receipt'
	| 'inspection_report'
	| 'contractor_document'
	| 'unknown';

export type PropertyKnowledgeSuggestionStatus =
	| 'pending'
	| 'accepted'
	| 'rejected'
	| 'applied';

export type PropertyKnowledgeExtractionMethod =
	| 'manual_placeholder'
	| 'metadata_placeholder'
	| 'image_ocr';

export type PropertyKnowledgeTargetEntity =
	| 'property'
	| 'system'
	| 'task'
	| 'maintenanceHistory'
	| 'part'
	| 'contractor'
	| 'warranty';

export type PartKnowledgeCategory =
	| 'part'
	| 'supply'
	| 'consumable'
	| 'accessory'
	| 'material';

export type PropertyKnowledgeReviewStatus = 'accepted' | 'rejected';

export type PropertyKnowledgeFieldKey =
	| 'manufacturer'
	| 'brand'
	| 'model'
	| 'serialNumber'
	| 'assetType'
	| 'assetVariant'
	| 'installDate'
	| 'installer'
	| 'contractorName'
	| 'contractorPhone'
	| 'contractorWebsite'
	| 'warrantyStartDate'
	| 'warrantyEndDate'
	| 'warrantyLength'
	| 'registrationRequired'
	| 'invoiceNumber'
	| 'invoiceDate'
	| 'paidDate'
	| 'totalCost'
	| 'laborCost'
	| 'partsCost'
	| 'taxAmount'
	| 'currency'
	| 'maintenanceEventDate'
	| 'maintenanceEventDescription'
	| 'maintenanceType'
	| 'servicePerformed'
	| 'recommendedMaintenanceInterval'
	| 'partsReplaced'
	| 'partName'
	| 'partNumber'
	| 'filterSize'
	| 'consumables'
	| 'lubricantType'
	| 'fluidType'
	| 'manualVersion'
	| 'publicationDate'
	| 'manufacturerSupportUrl';

export interface PropertyKnowledgeProvenance {
	sourceDocumentId: string;
	sourceDocumentType: PropertyKnowledgeDocumentType;
	extractionMethod: PropertyKnowledgeExtractionMethod;
	confidence?: number;
	acceptedByUser: string;
	acceptedAt: string;
	suggestionId?: string;
	fieldKey?: PropertyKnowledgeFieldKey;
	sourceText?: string;
}

export interface ExtractedKnowledgeField {
	id: string;
	fieldKey: PropertyKnowledgeFieldKey;
	label: string;
	value: string;
	confidence?: number;
	targetEntity: PropertyKnowledgeTargetEntity;
	targetField: string;
	sourceText?: string;
	userEditableValue?: string;
	provenance?: PropertyKnowledgeProvenance;
}

export interface ExtractedPartSuggestion {
	id: string;
	partKnowledgeId: string;
	label: string;
	name: string;
	category: PartKnowledgeCategory;
	relatedAssetTypes: string[];
	targetEntity: 'part';
	sourceText: string;
	confidence?: number;
	userEditableName?: string;
	userEditableCategory?: PartKnowledgeCategory;
	reviewStatus?: PropertyKnowledgeReviewStatus;
	provenance?: PropertyKnowledgeProvenance;
}

export interface PropertyKnowledgeSuggestion {
	id: string;
	sourceDocumentId: string;
	propertyId: string;
	relatedSystemId?: string;
	documentType: PropertyKnowledgeDocumentType;
	extractionMethod: PropertyKnowledgeExtractionMethod;
	extractedFields: ExtractedKnowledgeField[];
	suggestedParts?: ExtractedPartSuggestion[];
	confidence?: number;
	status: PropertyKnowledgeSuggestionStatus;
	createdAt: string;
	reviewedAt?: string;
	appliedAt?: string;
	rejectedAt?: string;
	acceptedByUser?: string;
	sourceDocumentName?: string;
}
