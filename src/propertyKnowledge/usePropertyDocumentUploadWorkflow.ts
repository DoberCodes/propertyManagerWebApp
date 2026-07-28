import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiSlice } from '../Redux/API/apiSlice';
import { useUpdatePropertyMutation } from '../Redux/API/propertySlice';
import type { AppDispatch, RootState } from '../Redux/store/store';
import { useAppFeedback } from '../Components/Library/AppFeedback/AppFeedbackProvider';
import type {
	Device,
	Property,
	PropertyDocument,
	PropertyDocumentCategory,
} from '../types/Property.types';
import type { PropertyKnowledgeSuggestion } from '../types/PropertyKnowledge.types';
import { canUsePropertyKnowledgeAcquisition } from '../utils/subscriptionUtils';
import {
	preparePropertyMemoryDocumentUploads,
	startPropertyDocumentKnowledgeProcessing,
	type PropertyMemoryDocumentUploadContext,
} from './propertyDocumentUploads';
import type { ProcessPropertyDocumentAcquisitionResponse } from './propertyKnowledgeProcessing';

type PropertyDocumentUploadBatch = {
	files: File[];
	category: PropertyDocumentCategory;
	customNameForSingleFile?: string;
	systems?: Device[];
	uploadContext?: PropertyMemoryDocumentUploadContext;
};

type UploadPropertyDocumentsInput = {
	property: Property | any;
	propertyId?: string;
	batches: PropertyDocumentUploadBatch[];
	notify?: boolean;
	onProcessed?: (
		result: ProcessPropertyDocumentAcquisitionResponse,
		document: PropertyDocument,
	) => void;
	onError?: (error: unknown, document: PropertyDocument) => void;
};

type UploadPropertyDocumentsResult = {
	documents: PropertyDocument[];
	knowledgeSuggestions: PropertyKnowledgeSuggestion[];
	processableDocuments: PropertyDocument[];
	totalSuggestedDetails: number;
	canUseDocumentReview: boolean;
};

const getExistingDocuments = (property: any): PropertyDocument[] =>
	Array.isArray(property?.documents) ? property.documents : [];

const getExistingKnowledgeSuggestions = (
	property: any,
): PropertyKnowledgeSuggestion[] =>
	Array.isArray(property?.knowledgeSuggestions)
		? property.knowledgeSuggestions
		: [];

const getKnowledgeSuggestionCount = (
	suggestion?: PropertyKnowledgeSuggestion,
): number =>
	(Array.isArray(suggestion?.extractedFields)
		? suggestion.extractedFields.length
		: 0) +
	(Array.isArray(suggestion?.suggestedParts)
		? suggestion.suggestedParts.length
		: 0) +
	(Array.isArray(suggestion?.suggestedTasks)
		? suggestion.suggestedTasks.length
		: 0) +
	(Array.isArray(suggestion?.suggestedEquipment)
		? suggestion.suggestedEquipment.length
		: 0);

const getUploadFeedbackMessage = ({
	totalSuggestedDetails,
	processableDocumentCount,
	canUseDocumentReview,
}: {
	totalSuggestedDetails: number;
	processableDocumentCount: number;
	canUseDocumentReview: boolean;
}): string => {
	if (!canUseDocumentReview) {
		return 'Documents uploaded. Suggested details from documents unlock with Homeowner+.';
	}

	if (totalSuggestedDetails > 0) {
		return `Documents uploaded. Maintley found ${totalSuggestedDetails} suggested detail${totalSuggestedDetails === 1 ? '' : 's'} to review.`;
	}

	if (processableDocumentCount > 0) {
		return 'Documents uploaded. Maintley is reviewing document details in the background.';
	}

	return 'Documents uploaded to property documents.';
};

export const usePropertyDocumentUploadWorkflow = () => {
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const feedback = useAppFeedback();
	const [updateProperty] = useUpdatePropertyMutation();
	const canUseDocumentReview = canUsePropertyKnowledgeAcquisition(
		currentUser?.subscription,
	);

	const uploadPropertyDocuments = useCallback(
		async ({
			property,
			propertyId,
			batches,
			notify = true,
			onProcessed,
			onError,
		}: UploadPropertyDocumentsInput): Promise<UploadPropertyDocumentsResult> => {
			const resolvedPropertyId = String(propertyId || property?.id || '').trim();
			if (!resolvedPropertyId) {
				throw new Error('Property details are required before uploading documents.');
			}
			if (!property) {
				throw new Error('Property details are still loading. Please try again.');
			}

			const uploadBatches = batches.filter((batch) => batch.files.length > 0);
			if (uploadBatches.length === 0) {
				return {
					documents: [],
					knowledgeSuggestions: [],
					processableDocuments: [],
					totalSuggestedDetails: 0,
					canUseDocumentReview,
				};
			}

			const existingDocuments = getExistingDocuments(property);
			const existingKnowledgeSuggestions =
				getExistingKnowledgeSuggestions(property);
			const savedDocuments: PropertyDocument[] = [];
			const knowledgeSuggestions: PropertyKnowledgeSuggestion[] = [];
			const processableDocuments: PropertyDocument[] = [];

			for (const batch of uploadBatches) {
				const result = await preparePropertyMemoryDocumentUploads({
					files: batch.files,
					propertyId: resolvedPropertyId,
					category: batch.category,
					customNameForSingleFile: batch.customNameForSingleFile,
					property,
					systems: batch.systems || [],
					uploadContext: batch.uploadContext,
					enableKnowledgeAcquisition: canUseDocumentReview,
				});
				savedDocuments.push(...result.documents);
				knowledgeSuggestions.push(...result.knowledgeSuggestions);
				processableDocuments.push(...result.processableDocuments);
			}

			await updateProperty({
				id: resolvedPropertyId,
				updates: {
					documents: [...existingDocuments, ...savedDocuments],
					knowledgeSuggestions: [
						...existingKnowledgeSuggestions,
						...knowledgeSuggestions,
					],
				},
			}).unwrap();

			startPropertyDocumentKnowledgeProcessing({
				propertyId: resolvedPropertyId,
				documents: canUseDocumentReview ? processableDocuments : [],
				onProcessed: (result, document) => {
					dispatch(apiSlice.util.invalidateTags(['Properties']));
					onProcessed?.(result, document);
				},
				onError: (error, document) => {
					dispatch(apiSlice.util.invalidateTags(['Properties']));
					onError?.(error, document);
				},
			});

			const totalSuggestedDetails = knowledgeSuggestions.reduce(
				(total, suggestion) => total + getKnowledgeSuggestionCount(suggestion),
				0,
			);

			if (notify) {
				feedback.notify(
					getUploadFeedbackMessage({
						totalSuggestedDetails,
						processableDocumentCount: processableDocuments.length,
						canUseDocumentReview,
					}),
				);
			}

			return {
				documents: savedDocuments,
				knowledgeSuggestions,
				processableDocuments,
				totalSuggestedDetails,
				canUseDocumentReview,
			};
		},
		[canUseDocumentReview, dispatch, feedback, updateProperty],
	);

	return {
		canUseDocumentReview,
		uploadPropertyDocuments,
	};
};
