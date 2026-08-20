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
	| 'image_ocr'
	| 'pdf_text'
	| 'pdf_rendered_ocr'
	| 'docx_text';

export type PropertyKnowledgeConfidenceLevel = 'high' | 'medium' | 'low';

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
	| 'performedByName'
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
	confidenceLevel?: PropertyKnowledgeConfidenceLevel;
	confidenceReason?: string;
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
	confidenceLevel?: PropertyKnowledgeConfidenceLevel;
	confidenceReason?: string;
	targetEntity: PropertyKnowledgeTargetEntity;
	targetField: string;
	sourceText?: string;
	userEditableValue?: string;
	reviewStatus?: PropertyKnowledgeReviewStatus;
	provenance?: PropertyKnowledgeProvenance;
}

export interface ExtractedPartSuggestion {
	id: string;
	partKnowledgeId: string;
	label: string;
	name: string;
	category: PartKnowledgeCategory;
	relatedAssetTypes: string[];
	relatedAssetVariant?: string;
	relatedEquipmentSuggestionIds?: string[];
	matchedDeviceIds?: string[];
	targetEntity: 'part';
	sourceText: string;
	confidence?: number;
	confidenceLevel?: PropertyKnowledgeConfidenceLevel;
	confidenceReason?: string;
	userEditableName?: string;
	userEditableCategory?: PartKnowledgeCategory;
	reviewStatus?: PropertyKnowledgeReviewStatus;
	provenance?: PropertyKnowledgeProvenance;
}

export interface PropertyKnowledgeTaskSuggestion {
	id: string;
	title: string;
	description: string;
	priority: 'Low' | 'Medium' | 'High' | 'Urgent';
	scheduleMode?: 'scheduled' | 'asap' | 'unscheduled';
	dueDate?: string;
	relatedAssetType?: string;
	relatedAssetVariant?: string;
	relatedEquipmentSuggestionIds?: string[];
	matchedDeviceId?: string;
	matchedDeviceIds?: string[];
	reportedTiming?: string;
	sourceText: string;
	confidence?: number;
	confidenceLevel?: PropertyKnowledgeConfidenceLevel;
	confidenceReason?: string;
	userEditableTitle?: string;
	userEditableDescription?: string;
	reviewStatus?: PropertyKnowledgeReviewStatus;
}

export interface PropertyKnowledgeEquipmentSuggestion {
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
	matchedDeviceId?: string;
	sourceText: string;
	confidence?: number;
	confidenceLevel?: PropertyKnowledgeConfidenceLevel;
	confidenceReason?: string;
	skipReason?: string;
	reviewStatus?: PropertyKnowledgeReviewStatus;
}

export interface PropertyKnowledgeAcquisitionDiagnostics {
	parserVersion: string;
	interpreter: 'inspection-v1' | 'inspection-v2' | 'inspection-v3' | 'inspection-v4' | 'structured-service-v1' | 'generic-v1';
	pageCount?: number;
	extractedCharacterCount: number;
	tableCount?: number;
	sectionCount?: number;
	observationCount?: number;
	recommendationCount?: number;
	equipmentCount?: number;
	supplyCount?: number;
	specificationCount?: number;
}

export interface PropertyKnowledgeVisitObservation {
	id: string;
	area: string;
	status: string;
	statusLevel?: number;
	notes?: string;
	actionable: boolean;
}

export type PropertyKnowledgePropertyConfirmationStatus =
	| 'needs_confirmation'
	| 'confirmed';

export interface PropertyKnowledgePropertyConfirmation {
	status: PropertyKnowledgePropertyConfirmationStatus;
	documentAddress: string;
	propertyAddress: string;
	sourceLabel: string;
	reason: string;
	confirmedAt?: string;
	confirmedByUser?: string;
}

export interface PropertyKnowledgeSuggestion {
	id: string;
	accountId?: string;
	sourceDocumentId: string;
	propertyId: string;
	relatedSystemId?: string;
	targetMaintenanceEventId?: string;
	targetContractorId?: string;
	documentType: PropertyKnowledgeDocumentType;
	extractionMethod: PropertyKnowledgeExtractionMethod;
	extractedFields: ExtractedKnowledgeField[];
	suggestedParts?: ExtractedPartSuggestion[];
	suggestedTasks?: PropertyKnowledgeTaskSuggestion[];
	suggestedEquipment?: PropertyKnowledgeEquipmentSuggestion[];
	visitObservations?: PropertyKnowledgeVisitObservation[];
	acquisitionDiagnostics?: PropertyKnowledgeAcquisitionDiagnostics;
	confidence?: number;
	status: PropertyKnowledgeSuggestionStatus;
	createdAt: string;
	reviewedAt?: string;
	appliedAt?: string;
	rejectedAt?: string;
	acceptedByUser?: string;
	sourceDocumentName?: string;
	propertyConfirmation?: PropertyKnowledgePropertyConfirmation;
	updatedAt?: string;
}
