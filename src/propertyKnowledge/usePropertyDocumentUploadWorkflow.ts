import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { apiSlice } from '../Redux/API/apiSlice';
import { useUpdatePropertyMutation } from '../Redux/API/propertySlice';
import { useSetDocumentLinksMutation } from '../Redux/API/propertyKnowledgeLinkSlice';
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
import { trackAnalyticsEvent } from '../analytics/analytics';
import {
	preparePropertyMemoryDocumentUploads,
	startPropertyDocumentKnowledgeProcessing,
	type PropertyMemoryDocumentUploadContext,
} from './propertyDocumentUploads';
import type { ProcessPropertyDocumentAcquisitionResponse } from './propertyKnowledgeProcessing';
import {
	getEmbeddedPropertyDocuments,
	getEmbeddedPropertyKnowledgeSuggestions,
} from './propertyMemoryRecordService';

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
	getEmbeddedPropertyDocuments(property);

const getExistingKnowledgeSuggestions = (
	property: any,
): PropertyKnowledgeSuggestion[] =>
	getEmbeddedPropertyKnowledgeSuggestions(property);

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
	const [setDocumentLinks] = useSetDocumentLinksMutation();
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
			const documentConnectionRequests: Array<{
				documentId: string;
				context: PropertyMemoryDocumentUploadContext;
			}> = [];

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
				if (batch.uploadContext) {
					result.documents.forEach((document) => {
						documentConnectionRequests.push({
							documentId: document.id,
							context: batch.uploadContext as PropertyMemoryDocumentUploadContext,
						});
					});
				}
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

			await Promise.all(
				documentConnectionRequests.map(async ({ documentId, context }) => {
					const equipmentIds = context.assetIds || [];
					const spaceIds = context.spaceIds || [];
					const taskIds = context.taskIds || [];
					const supplyIds = context.supplyIds || [];
					if (
						equipmentIds.length === 0 &&
						spaceIds.length === 0 &&
						taskIds.length === 0 &&
						supplyIds.length === 0
					) return;
					try {
						await setDocumentLinks({
							propertyId: resolvedPropertyId,
							documentId,
							equipmentIds,
							spaceIds,
							taskIds,
							supplyIds,
						}).unwrap();
					} catch (error) {
						console.warn(
							'Document uploaded, but its canonical connections could not be saved.',
							error,
						);
					}
				}),
			);

			const uploadedCategories = Array.from(
				new Set(uploadBatches.map((batch) => batch.category)),
			);
			const connectionContexts = documentConnectionRequests.map(
				({ context }) => context,
			);
			void trackAnalyticsEvent('document_uploaded', {
				action_source: 'user',
				document_count: savedDocuments.length,
				document_category:
					uploadedCategories.length === 1 ? uploadedCategories[0] : 'mixed',
				has_equipment_connection: connectionContexts.some(
					(context) => (context.assetIds?.length || 0) > 0,
				),
				has_space_connection: connectionContexts.some(
					(context) => (context.spaceIds?.length || 0) > 0,
				),
				has_task_connection: connectionContexts.some(
					(context) => (context.taskIds?.length || 0) > 0,
				),
				has_supply_connection: connectionContexts.some(
					(context) => (context.supplyIds?.length || 0) > 0,
				),
				review_enabled: canUseDocumentReview,
			});

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
		[
			canUseDocumentReview,
			dispatch,
			feedback,
			setDocumentLinks,
			updateProperty,
		],
	);

	return {
		canUseDocumentReview,
		uploadPropertyDocuments,
	};
};
