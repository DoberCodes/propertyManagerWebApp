import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
	SectionContainer,
	SectionHeader,
} from 'Components/Library/InfoCards/InfoCardStyles';
import {
	FormGroup,
	FormInput,
	FormLabel,
	FormSelect,
	GenericModal,
	MultiSelect,
} from 'Components/Library';
import { FileUploader } from 'Components/Library/FileUploader';
import { useUpdatePropertyMutation } from 'Redux/API/propertySlice';
import { apiSlice } from 'Redux/API/apiSlice';
import {
	useGetPropertyKnowledgeLinksQuery,
	useSetDocumentLinksMutation,
} from 'Redux/API/propertyKnowledgeLinkSlice';
import { useGetPropertySpacesQuery } from 'Redux/API/spaceSlice';
import { useGetPropertySuppliesQuery } from 'Redux/API/supplySlice';
import type { AppDispatch, RootState } from 'Redux/store/store';
import {
	Device,
	PropertyDocument,
	PropertyDocumentCategory,
} from 'types/Property.types';
import type { PropertyKnowledgeSuggestion } from 'types/PropertyKnowledge.types';
import { Task } from 'types/Task.types';
import {
	createPendingKnowledgeSuggestion,
	markDocumentWithKnowledgeSuggestion,
	mergeKnowledgeSuggestion,
} from 'propertyKnowledge/propertyKnowledgeAcquisition';
import { usePropertyDocumentUploadWorkflow } from 'propertyKnowledge/usePropertyDocumentUploadWorkflow';
import { getDocumentEditFailureMessage } from 'propertyKnowledge/documentConnectionReliability';
import {
	deletePropertyDocumentFromCollection,
	updatePropertyDocumentInCollection,
	updatePropertyKnowledgeSuggestionInCollection,
} from 'propertyKnowledge/propertyMemoryRecordService';
import { usePropertyMemoryRecords } from 'propertyKnowledge/usePropertyMemoryRecords';
import {
	getPropertyDocumentScanAction,
	isProcessablePropertyDocument,
	isPropertyDocumentKnowledgeScanEligible,
	processPropertyDocumentAcquisition,
} from 'propertyKnowledge/propertyKnowledgeProcessing';
import {
	getPropertyKnowledgeSuggestionCount,
} from 'propertyKnowledge/propertyKnowledgeSuggestionSummary';
import { RoleCapabilities } from 'utils/permissions';
import { hasMaintleyAdminAccess } from 'utils/maintleyRole';
import { getPropertyDocumentConnections } from 'utils/propertyDocumentRelationships';
import { getPropertySupplyTypeLabel } from 'utils/propertySupplies';
import {
	deletePropertyDocumentFile,
} from 'utils/propertyDocumentUpload';
import { useAppFeedback } from '../../../Components/Library/AppFeedback/AppFeedbackProvider';
import { COLORS } from '../../../constants/colors';
import {
	TabSummaryBar,
	TabSummaryPill,
	SectionLead,
	EmptyState,
} from './index.styles';

type PropertyFileRecord = {
	id?: string;
	name: string;
	url?: string;
	size?: number;
	type?: string;
	category?: PropertyDocumentCategory;
	storagePath?: string;
	source: 'property' | 'appliance' | 'maintenance';
	sourceLabel: string;
	assignmentLabel?: string;
	connectionCount?: number;
	date?: string;
};

type DocumentConnections = {
	equipmentIds: string[];
	spaceIds: string[];
	taskIds: string[];
	supplyIds: string[];
};

const EMPTY_DOCUMENT_CONNECTIONS: DocumentConnections = {
	equipmentIds: [],
	spaceIds: [],
	taskIds: [],
	supplyIds: [],
};

interface DocumentsTabProps {
	property: any;
	propertyDevices?: any[];
	propertyTasks?: Task[];
	maintenanceHistoryRecords?: any[];
	permissions?: RoleCapabilities;
	openUploadToken?: number;
	onReviewSuggestedDetails?: (suggestionId: string) => void;
}

const DOCUMENT_ACCEPT =
	'image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const DOCUMENT_ALLOWED_TYPES = [
	'image/*',
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'text/plain',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const PDF_PROCESSING_STALE_MINUTES = 30;

const getRecordDateValue = (record: any): string => {
	if (!record) return '';
	if (typeof record.uploadedAt === 'string') return record.uploadedAt;
	if (typeof record.completionDate === 'string') return record.completionDate;
	if (typeof record.date === 'string') return record.date;
	if (typeof record.completedAt === 'string') return record.completedAt;
	if (typeof record.createdAt === 'string') return record.createdAt;
	return '';
};

const getMaintenanceAttachments = (record: any): Array<{ name: string; url?: string }> => {
	const files: Array<{ name: string; url?: string }> = [];

	if (record?.completionFile?.name) {
		files.push({
			name: record.completionFile.name,
			url: record.completionFile.url,
		});
	}

	if (record?.completionFileData?.name) {
		files.push({
			name: record.completionFileData.name,
			url: record.completionFileData.url,
		});
	}

	if (Array.isArray(record?.attachments)) {
		record.attachments.forEach((attachment: any) => {
			const name = attachment?.fileName || attachment?.name;
			if (!name) return;
			files.push({ name, url: attachment?.url });
		});
	}

	if (Array.isArray(record?.files)) {
		record.files.forEach((file: any) => {
			if (!file?.name) return;
			files.push({ name: file.name, url: file.url });
		});
	}

	const deduped = new Map<string, { name: string; url?: string }>();
	files.forEach((file) => {
		const key = `${file.name}::${file.url || ''}`;
		if (!deduped.has(key)) deduped.set(key, file);
	});

	return Array.from(deduped.values());
};

const formatDate = (value?: string) => {
	if (!value) return 'Date unknown';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Date unknown';
	return date.toLocaleDateString();
};

const getCategoryLabel = (category?: PropertyDocumentCategory) => {
	if (category === 'manual') return 'Manual';
	if (category === 'warranty') return 'Warranty';
	return 'Other document';
};

const getAddedKnowledgeCount = (
	suggestion?: PropertyKnowledgeSuggestion,
) => {
	if (!suggestion || suggestion.status !== 'applied') return 0;
	const addedFields = (suggestion.extractedFields || []).filter(
		(field) => field.reviewStatus !== 'rejected',
	).length;
	const addedParts = (suggestion.suggestedParts || []).filter(
		(part) => part.reviewStatus !== 'rejected',
	).length;
	return addedFields + addedParts;
};

const getDocumentKnowledgeStatusText = (
	suggestion?: PropertyKnowledgeSuggestion,
) => {
	if (!suggestion) return '';
	if (suggestion.status === 'applied') {
		const addedCount = getAddedKnowledgeCount(suggestion);
		return addedCount > 0
			? `${addedCount} detail${addedCount === 1 ? '' : 's'} added to Property Memory`
			: 'Document reviewed';
	}
	if (suggestion.status === 'rejected') {
		return 'Document reviewed. No details added.';
	}
	if (suggestion.status === 'accepted') {
		return 'Document reviewed';
	}
	return '';
};

const getDocumentAcquisitionStatusText = (document?: PropertyDocument) => {
	if (document?.acquisitionStatus === 'processing') {
		if (isDocumentAcquisitionStale(document)) {
			return 'Maintley could not finish reviewing this document. You can try again.';
		}
		return 'Maintley is reviewing this document for suggested details.';
	}
	if (document?.acquisitionStatus === 'failed') {
		return document.acquisitionError || 'Maintley could not review this document yet.';
	}
	return '';
};

const isDocumentAcquisitionStale = (document?: PropertyDocument) => {
	if (document?.acquisitionStatus !== 'processing') return false;
	if (!document.acquisitionStartedAt) return true;
	const startedAt = new Date(document.acquisitionStartedAt).getTime();
	if (Number.isNaN(startedAt)) return true;
	const staleAfterMs = PDF_PROCESSING_STALE_MINUTES * 60 * 1000;
	return Date.now() - startedAt > staleAfterMs;
};

const getTaskAssignmentStatus = (task?: Task, fallbackStatus?: string) => {
	const status = task?.status || fallbackStatus || '';
	return status === 'Completed' ? 'Completed' : 'Pending';
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
	property,
	propertyDevices = [],
	propertyTasks = [],
	maintenanceHistoryRecords = [],
	permissions,
	openUploadToken = 0,
	onReviewSuggestedDetails,
}) => {
	const feedback = useAppFeedback();
	const dispatch = useDispatch<AppDispatch>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const navigate = useNavigate();
	const [updateProperty] = useUpdatePropertyMutation();
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [uploadName, setUploadName] = useState('');
	const [documentCategory, setDocumentCategory] =
		useState<PropertyDocumentCategory>('manual');
	const [editingDocument, setEditingDocument] = useState<PropertyDocument | null>(
		null,
	);
	const [editName, setEditName] = useState('');
	const [editCategory, setEditCategory] =
		useState<PropertyDocumentCategory>('manual');
	const [editConnections, setEditConnections] =
		useState<DocumentConnections>(EMPTY_DOCUMENT_CONNECTIONS);
	const [isSaving, setIsSaving] = useState(false);
	const lastOpenUploadTokenRef = useRef(0);
	const canManageDocuments =
		permissions?.canManageDocuments ?? permissions?.canManageProperties ?? false;
	const canTestRestrictedDocumentScan = hasMaintleyAdminAccess(
		currentUser?.maintley_role,
	);
	const { canUseDocumentReview, uploadPropertyDocuments } =
		usePropertyDocumentUploadWorkflow();
	const {
		documents: propertyDocuments,
		knowledgeSuggestions: propertyKnowledgeSuggestions,
	} = usePropertyMemoryRecords(property);
	const accountId = String(property?.accountId || property?.userId || '').trim();
	const { data: propertySpaces = [] } = useGetPropertySpacesQuery(
		{ accountId, propertyId: property?.id, includeArchived: true },
		{ skip: !accountId || !property?.id },
	);
	const { data: propertySupplies = [] } = useGetPropertySuppliesQuery(
		{ accountId, propertyId: property?.id, includeArchived: true },
		{ skip: !accountId || !property?.id },
	);
	const { data: propertyKnowledgeLinks = [] } =
		useGetPropertyKnowledgeLinksQuery(
			{ accountId, propertyId: property?.id },
			{ skip: !accountId || !property?.id },
		);
	const [setDocumentLinks] = useSetDocumentLinksMutation();

	const deviceById = useMemo(() => {
		const map = new Map<string, any>();
		propertyDevices.forEach((device) => {
			if (device?.id) map.set(String(device.id), device);
		});
		return map;
	}, [propertyDevices]);

	const taskById = useMemo(() => {
		const map = new Map<string, Task>();
		propertyTasks.forEach((task) => {
			if (task?.id) map.set(String(task.id), task);
		});
		return map;
	}, [propertyTasks]);

	const getAssignmentLabel = useCallback((document: PropertyDocument) => {
		const connections = getPropertyDocumentConnections(
			document,
			propertyKnowledgeLinks,
		);
		const assetId = connections.equipmentIds[0];
		if (assetId) {
			const device = deviceById.get(String(assetId));
			return `Equipment: ${
				device?.type || device?.name || 'Unknown equipment'
			}`;
		}
		const taskId = connections.taskIds[0];
		if (taskId) {
			const task = taskById.get(String(taskId));
			const status = getTaskAssignmentStatus(task, document.assignedTaskStatus);
			return `Task: ${task?.title || 'Unknown task'} (${status})`;
		}
		if (connections.spaceIds.length > 0) return 'Connected to a Space';
		if (connections.supplyIds.length > 0) return 'Connected to a Supply';
		return 'Property document';
	}, [deviceById, propertyKnowledgeLinks, taskById]);

	useEffect(() => {
		if (
			!openUploadToken ||
			lastOpenUploadTokenRef.current === openUploadToken
		) {
			return;
		}

		lastOpenUploadTokenRef.current = openUploadToken;
		if (canManageDocuments) {
			setIsUploadOpen(true);
		}
	}, [openUploadToken, canManageDocuments]);

	const propertyFileDocuments = useMemo<PropertyFileRecord[]>(
		() =>
			propertyDocuments.map((document) => {
				const connections = getPropertyDocumentConnections(
					document,
					propertyKnowledgeLinks,
				);
				return {
					id: document.id,
					name: document.fileName || document.name,
					url: document.fileUrl || document.url,
					size: document.size,
					type: document.type,
					category: document.category,
					storagePath: document.storagePath,
					source: 'property' as const,
					sourceLabel: getCategoryLabel(document.category),
					assignmentLabel: getAssignmentLabel(document),
					connectionCount: Object.values(connections).reduce(
						(total, ids) => total + ids.length,
						0,
					),
					date: document.uploadedAt,
				};
			}),
		[propertyDocuments, getAssignmentLabel, propertyKnowledgeLinks],
	);

	const applianceDocuments = useMemo<PropertyFileRecord[]>(() => {
		const records: PropertyFileRecord[] = [];

		propertyDevices.forEach((device: any) => {
			const files = Array.isArray(device?.files) ? device.files : [];
			files.forEach((file: any) => {
				if (!file?.name) return;
				records.push({
					name: file.name,
					url: file.url,
					source: 'appliance',
					sourceLabel: device?.type || device?.name || 'Equipment',
					date: getRecordDateValue(file),
				});
			});
		});

		return records;
	}, [propertyDevices]);

	const maintenanceDocuments = useMemo<PropertyFileRecord[]>(() => {
		const records: PropertyFileRecord[] = [];

		maintenanceHistoryRecords.forEach((record: any) => {
			const title =
				record?.title || record?.taskTitle || record?.description || 'Maintenance record';
			const date = getRecordDateValue(record);
			getMaintenanceAttachments(record).forEach((file) => {
				records.push({
					name: file.name,
					url: file.url,
					source: 'maintenance',
					sourceLabel: title,
					date,
				});
			});
		});

		return records;
	}, [maintenanceHistoryRecords]);

	const allDocuments = useMemo(() => {
		const deduped = new Map<string, PropertyFileRecord>();
		[...propertyFileDocuments, ...applianceDocuments, ...maintenanceDocuments].forEach(
			(record) => {
				const key = `${record.source}::${record.id || record.name}::${record.url || ''}`;
				if (!deduped.has(key)) {
					deduped.set(key, record);
				}
			},
		);

		return Array.from(deduped.values()).sort((a, b) => {
			const aTime = new Date(a.date || 0).getTime() || 0;
			const bTime = new Date(b.date || 0).getTime() || 0;
			return bTime - aTime;
		});
	}, [propertyFileDocuments, applianceDocuments, maintenanceDocuments]);

	const closeUploadModal = () => {
		setIsUploadOpen(false);
		setSelectedFiles([]);
		setUploadName('');
		setDocumentCategory('manual');
	};

	const getLatestKnowledgeSuggestionForDocument = (documentId?: string) => {
		if (!documentId) return undefined;
		return [...propertyKnowledgeSuggestions]
			.reverse()
			.find((suggestion) => suggestion.sourceDocumentId === documentId);
	};

	const markPdfReviewFailed = async (
		documentId: string,
		message = 'Maintley could not finish reviewing this document. You can try again.',
		documentsToUpdate = propertyDocuments,
	) => {
		if (!property?.id) return;
		const completedAt = new Date().toISOString();
		const documentUpdates = {
			acquisitionStatus: 'failed' as const,
			acquisitionCompletedAt: completedAt,
			acquisitionError: message,
		};
		await updatePropertyDocumentInCollection(property, documentId, {
			...documentUpdates,
			acquisitionWorkerCompletedAt: completedAt,
		} as Partial<PropertyDocument>);
		await updateProperty({
			id: property.id,
			updates: {
				documents: documentsToUpdate.map((item) =>
					item.id === documentId
						? {
								...item,
								...documentUpdates,
						  }
						: item,
				),
			},
		}).unwrap();
	};

	const handleReviewDocumentKnowledge = async (
		documentId?: string,
		allowRestrictedDocumentType = false,
	) => {
		if (!property?.id || !documentId || isSaving) return;
		if (!canUseDocumentReview) {
			feedback.notify('Suggested details from documents are available with Homeowner+.');
			navigate('/paywall');
			return;
		}
		const document = propertyDocuments.find((item) => item.id === documentId);
		if (!document) return;

		const existingPending = [...propertyKnowledgeSuggestions]
			.reverse()
			.find(
				(suggestion) =>
					suggestion.sourceDocumentId === documentId &&
					suggestion.status === 'pending',
			);
		if (existingPending) {
			onReviewSuggestedDetails?.(existingPending.id);
			return;
		}
		if (
			!isPropertyDocumentKnowledgeScanEligible(document) &&
			!allowRestrictedDocumentType
		) return;
		if (
			allowRestrictedDocumentType &&
			!window.confirm(
				'Test scanning this manual or warranty? This internal feature is experimental and may produce inaccurate suggestions. Nothing will be saved without review.',
			)
		) return;

		if (isProcessablePropertyDocument(document)) {
			setIsSaving(true);
			try {
				feedback.notify('Maintley is reviewing this document for suggested details.');
				const result = await processPropertyDocumentAcquisition({
					propertyId: property.id,
					documentId: document.id,
					allowRestrictedDocumentType,
				});
				dispatch(apiSlice.util.invalidateTags(['Properties']));
				if (result.success && result.suggestionId) {
					onReviewSuggestedDetails?.(result.suggestionId);
				} else if (!result.success && result.message) {
					feedback.notify(result.message);
				}
			} catch (error) {
				console.error('Error processing document:', error);
				const message =
					error instanceof Error
						? error.message
						: 'Could not review this document.';
				feedback.notify(message);
				dispatch(apiSlice.util.invalidateTags(['Properties']));
			} finally {
				setIsSaving(false);
			}
			return;
		}

		const suggestion = createPendingKnowledgeSuggestion({
			document,
			propertyId: property.id,
			relatedSystemId: document.assignedDeviceId || document.links?.assetIds?.[0],
			property,
			systems: propertyDevices as Device[],
		});

		setIsSaving(true);
		try {
			const reviewedDocument = markDocumentWithKnowledgeSuggestion(
				document,
				suggestion,
			);
			await Promise.all([
				updatePropertyDocumentInCollection(property, document.id, reviewedDocument),
				updatePropertyKnowledgeSuggestionInCollection(property, suggestion),
			]);
			await updateProperty({
				id: property.id,
				updates: {
					documents: propertyDocuments.map((item) =>
						item.id === document.id
							? markDocumentWithKnowledgeSuggestion(item, suggestion)
							: item,
					),
					knowledgeSuggestions: mergeKnowledgeSuggestion(
						propertyKnowledgeSuggestions,
						suggestion,
					),
				},
			}).unwrap();
			onReviewSuggestedDetails?.(suggestion.id);
		} catch (error) {
			console.error('Error creating knowledge suggestion:', error);
			feedback.notify('Could not review suggested details for this document.');
		} finally {
			setIsSaving(false);
		}
	};

	useEffect(() => {
		if (selectedFiles.length === 1) {
			setUploadName(selectedFiles[0].name || '');
			return;
		}

		setUploadName('');
	}, [selectedFiles]);

	const handleUploadDocuments = async () => {
		if (!property?.id || selectedFiles.length === 0 || isSaving) return;
		setIsSaving(true);
		try {
			const customNameForSingleFile =
				selectedFiles.length === 1 ? uploadName.trim() : '';
			const { documents: savedDocuments } = await uploadPropertyDocuments({
				property,
				propertyId: property.id,
				batches: [
					{
						files: selectedFiles,
						category: documentCategory,
						customNameForSingleFile,
						systems: propertyDevices as Device[],
					},
				],
				onProcessed: (result) => {
					if (result.success && result.suggestionId) {
						onReviewSuggestedDetails?.(result.suggestionId);
					}
				},
				onError: async (error, document) => {
					try {
						await markPdfReviewFailed(
							document.id,
							error instanceof Error
								? error.message
								: 'Maintley could not finish reviewing this document. You can try again.',
							[...propertyDocuments, ...savedDocuments],
						);
					} catch (statusError) {
						console.error('Error marking document review as failed:', statusError);
					}
				},
			});
			closeUploadModal();
		} catch (error: any) {
			console.error('Error uploading property documents:', error);
			feedback.notify(error?.message || 'Could not upload documents. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const openEditModal = (documentId?: string) => {
		const document = propertyDocuments.find((item) => item.id === documentId);
		if (!document) return;
		setEditingDocument(document);
		setEditName(document.name);
		setEditCategory(document.category || 'other');
		setEditConnections(
			getPropertyDocumentConnections(document, propertyKnowledgeLinks),
		);
		setIsEditOpen(true);
	};

	const closeEditModal = () => {
		setIsEditOpen(false);
		setEditingDocument(null);
		setEditName('');
		setEditCategory('manual');
		setEditConnections(EMPTY_DOCUMENT_CONNECTIONS);
	};

	const handleSaveEdit = async () => {
		if (!property?.id || !editingDocument || isSaving) return;
		const trimmedName = editName.trim();
		if (!trimmedName) {
			feedback.notify('Document name is required.');
			return;
		}

		setIsSaving(true);
		let documentDetailsSaved = false;
		try {
			await updateProperty({
				id: property.id,
				updates: {
					documents: propertyDocuments.map((document) =>
						document.id === editingDocument.id
							? {
									...document,
									name: trimmedName,
									fileName: trimmedName,
									category: editCategory,
							  }
							: document,
					),
				},
			}).unwrap();
			await updatePropertyDocumentInCollection(property, editingDocument.id, {
				name: trimmedName,
				fileName: trimmedName,
				category: editCategory,
			});
			documentDetailsSaved = true;
			await setDocumentLinks({
				propertyId: property.id,
				documentId: editingDocument.id,
				...editConnections,
			}).unwrap();
			feedback.notify('Document updated.');
			closeEditModal();
		} catch (error) {
			console.error('Error updating property document:', error);
			feedback.notify(
				getDocumentEditFailureMessage(documentDetailsSaved),
				'error',
			);
		} finally {
			setIsSaving(false);
		}
	};

	const handleDeleteDocument = async (documentId?: string) => {
		if (!property?.id || !documentId || isSaving) return;
		const document = propertyDocuments.find((item) => item.id === documentId);
		if (!document) return;
		if (!window.confirm(`Delete ${document.name}?`)) return;

		setIsSaving(true);
		try {
			try {
				await deletePropertyDocumentFile(document.storagePath);
			} catch (storageError) {
				console.warn('Could not delete property document file:', storageError);
			}
			await deletePropertyDocumentFromCollection(document.id);
			await updateProperty({
				id: property.id,
				updates: {
					documents: propertyDocuments.filter((item) => item.id !== document.id),
				},
			}).unwrap();
			feedback.notify('Document deleted.');
		} catch (error) {
			console.error('Error deleting property document:', error);
			feedback.notify('Could not delete document. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<SectionContainer>
			<HeaderRow>
				<div>
					<SectionHeader>Files & Documents ({allDocuments.length})</SectionHeader>
					<SectionLead>
						Keep manuals, warranties, invoices, inspection reports, and service documents organized with this property.
					</SectionLead>
				</div>
				{canManageDocuments && (
					<UploadButton type='button' onClick={() => setIsUploadOpen(true)}>
						Upload documents
					</UploadButton>
				)}
			</HeaderRow>
			<TabSummaryBar>
				<TabSummaryPill>
					{propertyFileDocuments.length} manual/warranty file{propertyFileDocuments.length === 1 ? '' : 's'}
				</TabSummaryPill>
				<TabSummaryPill>
					{applianceDocuments.length} equipment file{applianceDocuments.length === 1 ? '' : 's'}
				</TabSummaryPill>
				<TabSummaryPill>
					{maintenanceDocuments.length} maintenance file{maintenanceDocuments.length === 1 ? '' : 's'}
				</TabSummaryPill>
			</TabSummaryBar>
			{allDocuments.length === 0 ? (
				<EmptyState>
					<h3>No files or documents yet</h3>
					<p>
						Upload manuals, warranty documents, equipment files, or task completion records to build the property record.
					</p>
					{canManageDocuments && (
						<UploadButton type='button' onClick={() => setIsUploadOpen(true)}>
							Upload documents
						</UploadButton>
					)}
				</EmptyState>
			) : (
				<DocumentGrid>
					{allDocuments.map((file, index) => {
						const key = `${file.source}-${file.id || file.name}-${file.url || 'no-url'}-${index}`;
						const isPropertyDocument = file.source === 'property';
						const latestKnowledgeSuggestion =
							isPropertyDocument && file.id
								? getLatestKnowledgeSuggestionForDocument(file.id)
								: undefined;
						const suggestionCount = getPropertyKnowledgeSuggestionCount(
							latestKnowledgeSuggestion,
						);
						const reviewedKnowledgeStatus =
							getDocumentKnowledgeStatusText(latestKnowledgeSuggestion);
						const sourcePropertyDocument =
							isPropertyDocument && file.id
								? propertyDocuments.find((item) => item.id === file.id)
								: undefined;
						const isKnowledgeScanEligible =
							isPropertyDocumentKnowledgeScanEligible(sourcePropertyDocument);
						const canOfferInternalTestScan =
							!isKnowledgeScanEligible &&
							canTestRestrictedDocumentScan &&
							canUseDocumentReview &&
							isProcessablePropertyDocument(sourcePropertyDocument) &&
							latestKnowledgeSuggestion?.status !== 'pending';
						const acquisitionStatusText = isKnowledgeScanEligible
							? getDocumentAcquisitionStatusText(sourcePropertyDocument)
							: '';
						const isAcquisitionRetryable =
							sourcePropertyDocument?.acquisitionStatus === 'failed' ||
							isDocumentAcquisitionStale(sourcePropertyDocument);
						const isAcquisitionProcessing =
							sourcePropertyDocument?.acquisitionStatus === 'processing' &&
							!isAcquisitionRetryable;
						const hasCompletedEmptyReview =
							sourcePropertyDocument?.acquisitionStatus === 'pending_review' &&
							latestKnowledgeSuggestion?.status === 'pending' &&
							suggestionCount === 0;
						const documentStatusBadge = isAcquisitionProcessing
							? { label: 'Checking', tone: 'processing' as const }
							: isAcquisitionRetryable
								? { label: 'Needs attention', tone: 'error' as const }
								: latestKnowledgeSuggestion?.status === 'pending' && suggestionCount > 0
									? { label: 'Needs review', tone: 'review' as const }
									: hasCompletedEmptyReview || Boolean(reviewedKnowledgeStatus)
										? { label: 'Checked', tone: 'complete' as const }
										: null;
						const documentScanAction = getPropertyDocumentScanAction({
							document: sourcePropertyDocument,
							hasSuggestion: Boolean(latestKnowledgeSuggestion),
							suggestionCount,
							suggestionStatus: latestKnowledgeSuggestion?.status,
							isRetryable: isAcquisitionRetryable,
						});
						return (
							<DocumentCard key={key}>
								<DocumentTitleRow>
									{file.url ? (
										<DocumentLink
											href={file.url}
											target='_blank'
											rel='noopener noreferrer'>
											{file.name}
										</DocumentLink>
									) : (
										<DocumentName>{file.name}</DocumentName>
									)}
									<DocumentBadgeGroup>
										<DocumentBadge>
											{isPropertyDocument
												? getCategoryLabel(file.category)
												: file.source === 'appliance'
													? 'Equipment'
													: 'Maintenance'}
										</DocumentBadge>
										{documentStatusBadge && (
											<DocumentStatusBadge $tone={documentStatusBadge.tone}>
												{documentStatusBadge.label}
											</DocumentStatusBadge>
										)}
									</DocumentBadgeGroup>
								</DocumentTitleRow>
								<DocumentMeta>
									{isPropertyDocument ? 'Type' : 'Source'}: {file.sourceLabel}
								</DocumentMeta>
								{isPropertyDocument && file.assignmentLabel && (
									<DocumentMeta>Context: {file.assignmentLabel}</DocumentMeta>
								)}
								{isPropertyDocument && Boolean(file.connectionCount) && (
									<DocumentMeta>
										{file.connectionCount} connected record
										{file.connectionCount === 1 ? '' : 's'}
									</DocumentMeta>
								)}
								<DocumentMeta>{formatDate(file.date)}</DocumentMeta>
								{isPropertyDocument && isAcquisitionProcessing && (
									<DocumentKnowledgePrompt role='status' aria-live='polite'>
										<DocumentProcessingRow>
											<DocumentStatusSpinner aria-hidden='true' />
											<DocumentProcessingCopy>
												<strong>Maintley is checking this document.</strong>
												<span>
													You can leave this page. We will notify you when suggested details are ready.
												</span>
											</DocumentProcessingCopy>
										</DocumentProcessingRow>
									</DocumentKnowledgePrompt>
								)}
								{isPropertyDocument &&
									acquisitionStatusText &&
									!isAcquisitionProcessing && (
										<DocumentKnowledgePrompt
											$error={
												sourcePropertyDocument?.acquisitionStatus === 'failed' ||
												isDocumentAcquisitionStale(sourcePropertyDocument)
											}>
											{acquisitionStatusText}{' '}
											{isKnowledgeScanEligible &&
												isAcquisitionRetryable &&
												canManageDocuments &&
												canUseDocumentReview && (
													<DocumentInlineAction
														type='button'
														onClick={() => handleReviewDocumentKnowledge(file.id)}
														disabled={isSaving}>
														Try again
													</DocumentInlineAction>
												)}
										</DocumentKnowledgePrompt>
									)}
								{isPropertyDocument &&
									canManageDocuments &&
									!isAcquisitionProcessing &&
									!isAcquisitionRetryable &&
									latestKnowledgeSuggestion?.status === 'pending' &&
									suggestionCount > 0 && (
										<DocumentKnowledgePrompt>
											Maintley found {suggestionCount} suggested detail{suggestionCount === 1 ? '' : 's'} for this property.{' '}
											{canUseDocumentReview ? (
												<DocumentInlineAction
													type='button'
													onClick={() =>
														onReviewSuggestedDetails?.(latestKnowledgeSuggestion.id)
													}
													disabled={isSaving}>
													Review now
												</DocumentInlineAction>
											) : (
												<DocumentInlineAction
													type='button'
													onClick={() => navigate('/paywall')}
													disabled={isSaving}>
													Available with Homeowner+
												</DocumentInlineAction>
											)}
										</DocumentKnowledgePrompt>
									)}
								{isPropertyDocument &&
									!isAcquisitionProcessing &&
									!isAcquisitionRetryable &&
									hasCompletedEmptyReview && (
										<DocumentKnowledgeSummary>
											Maintley checked this document and did not find suggested details. You can keep the file as-is or scan it again.
										</DocumentKnowledgeSummary>
									)}
								{isPropertyDocument &&
									latestKnowledgeSuggestion?.status !== 'pending' &&
									reviewedKnowledgeStatus && (
										<DocumentKnowledgeSummary>
											{reviewedKnowledgeStatus}
										</DocumentKnowledgeSummary>
									)}
								{isPropertyDocument && canManageDocuments && (
									<DocumentActions>
										{canOfferInternalTestScan && (
											<DocumentActionButton
												type='button'
												title='Maintley Owner and Admin only. Results may be inaccurate.'
												onClick={() =>
													handleReviewDocumentKnowledge(file.id, true)
												}
												disabled={isSaving}>
												Test scan (Maintley only)
											</DocumentActionButton>
										)}
										{documentScanAction && !isAcquisitionProcessing ? (
											<DocumentActionButton
												type='button'
												onClick={() =>
													canUseDocumentReview
														? handleReviewDocumentKnowledge(file.id)
														: navigate('/paywall')
												}
												disabled={
													isSaving ||
													(sourcePropertyDocument?.acquisitionStatus === 'processing' &&
														!isDocumentAcquisitionStale(sourcePropertyDocument))
												}>
												{canUseDocumentReview
													? documentScanAction === 'rescan'
														? 'Scan again'
														: 'Check for suggested details'
													: 'Review with Homeowner+'}
											</DocumentActionButton>
										) : null}
										{latestKnowledgeSuggestion?.status === 'applied' &&
											getAddedKnowledgeCount(latestKnowledgeSuggestion) > 0 && (
											<DocumentKnowledgeStatus>
												Knowledge saved
											</DocumentKnowledgeStatus>
										)}
										<DocumentActionButton
											type='button'
											onClick={() => openEditModal(file.id)}
											disabled={isSaving}>
											Edit
										</DocumentActionButton>
										<DocumentActionButton
											type='button'
											$danger
											onClick={() => handleDeleteDocument(file.id)}
											disabled={isSaving}>
											Delete
										</DocumentActionButton>
									</DocumentActions>
								)}
							</DocumentCard>
						);
					})}
				</DocumentGrid>
			)}

			<GenericModal
				isOpen={isUploadOpen}
				title='Upload Manuals or Warranties'
				onClose={closeUploadModal}
				primaryButtonLabel={isSaving ? 'Uploading...' : 'Upload'}
				primaryButtonAction={handleUploadDocuments}
				primaryButtonDisabled={selectedFiles.length === 0 || isSaving}
				isLoading={isSaving}
				showActions
				compact>
				<FormGroup>
					<FormLabel htmlFor='property-document-category'>Document type</FormLabel>
					<FormSelect
						id='property-document-category'
						value={documentCategory}
						onChange={(event) =>
							setDocumentCategory(event.target.value as PropertyDocumentCategory)
						}>
						<option value='manual'>Manual</option>
						<option value='warranty'>Warranty</option>
						<option value='other'>Other document</option>
					</FormSelect>
				</FormGroup>
				<FileUploader
					label='Choose documents'
					helperText='PDF, image, Word, Excel, or text files under 10MB'
					accept={DOCUMENT_ACCEPT}
					allowedTypes={DOCUMENT_ALLOWED_TYPES}
					maxSizeBytes={10 * 1024 * 1024}
					multiple
					setFiles={setSelectedFiles}
					disabled={isSaving}
				/>
				{selectedFiles.length === 1 && (
					<FormGroup>
						<FormLabel htmlFor='property-document-upload-name'>Document name</FormLabel>
						<FormInput
							id='property-document-upload-name'
							value={uploadName}
							onChange={(event) => setUploadName(event.target.value)}
						/>
					</FormGroup>
				)}
			</GenericModal>

			<GenericModal
				isOpen={isEditOpen}
				title='Edit Document'
				onClose={closeEditModal}
				primaryButtonLabel={isSaving ? 'Saving...' : 'Save'}
				primaryButtonAction={handleSaveEdit}
				primaryButtonDisabled={!editName.trim() || isSaving}
				isLoading={isSaving}
				showActions
				compact>
				<FormGroup>
					<FormLabel htmlFor='property-document-name'>Document name</FormLabel>
					<FormInput
						id='property-document-name'
						value={editName}
						onChange={(event) => setEditName(event.target.value)}
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel htmlFor='property-document-edit-category'>Document type</FormLabel>
					<FormSelect
						id='property-document-edit-category'
						value={editCategory}
						onChange={(event) =>
							setEditCategory(event.target.value as PropertyDocumentCategory)
						}>
						<option value='manual'>Manual</option>
						<option value='warranty'>Warranty</option>
						<option value='other'>Other document</option>
					</FormSelect>
				</FormGroup>
				<p>
					Connect this document to the property records it explains. Existing
					connections remain visible wherever those records are shown.
				</p>
				<FormGroup>
					<FormLabel>Equipment (optional)</FormLabel>
					<MultiSelect
						options={propertyDevices.map((device) => ({
							value: String(device.id),
							label: [device.type || device.name || 'Equipment', device.brand, device.model]
								.filter(Boolean)
								.join(' · '),
						}))}
						value={editConnections.equipmentIds}
						onChange={(equipmentIds) =>
							setEditConnections((current) => ({ ...current, equipmentIds }))
						}
						placeholder='Select equipment'
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel>Spaces (optional)</FormLabel>
					<MultiSelect
						options={propertySpaces
							.filter(
								(space) =>
									!space.isArchived || editConnections.spaceIds.includes(space.id),
							)
							.map((space) => ({
								value: space.id,
								label: `${space.name}${space.isArchived ? ' (Archived)' : ''}`,
							}))}
						value={editConnections.spaceIds}
						onChange={(spaceIds) =>
							setEditConnections((current) => ({ ...current, spaceIds }))
						}
						placeholder='Select Spaces'
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel>Tasks (optional)</FormLabel>
					<MultiSelect
						options={propertyTasks.map((task) => ({
							value: String(task.id),
							label: task.title || 'Task',
						}))}
						value={editConnections.taskIds}
						onChange={(taskIds) =>
							setEditConnections((current) => ({ ...current, taskIds }))
						}
						placeholder='Select tasks'
					/>
				</FormGroup>
				<FormGroup>
					<FormLabel>Supplies (optional)</FormLabel>
					<MultiSelect
						options={propertySupplies
							.filter(
								(supply) =>
									!supply.isArchived || editConnections.supplyIds.includes(supply.id),
							)
							.map((supply) => ({
								value: supply.id,
								label: `${supply.name} · ${getPropertySupplyTypeLabel(supply.type)}${
									supply.isArchived ? ' (Archived)' : ''
								}`,
							}))}
						value={editConnections.supplyIds}
						onChange={(supplyIds) =>
							setEditConnections((current) => ({ ...current, supplyIds }))
						}
						placeholder='Select Supplies'
					/>
				</FormGroup>
			</GenericModal>

		</SectionContainer>
	);
};

const HeaderRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;

	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const UploadButton = styled.button`
	border: none;
	border-radius: 10px;
	background: ${COLORS.primary};
	color: ${COLORS.white};
	font-size: 14px;
	font-weight: 800;
	padding: 11px 14px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: ${COLORS.primaryHover};
	}

	@media (max-width: 640px) {
		display: none;
	}

	@media (min-width: 641px) and (max-width: 1024px) {
		display: none;
	}
`;

const DocumentGrid = styled.div`
	display: grid;
	gap: 10px;
`;

const DocumentCard = styled.div`
	display: grid;
	gap: 7px;
	padding: 12px 14px;
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	background: ${COLORS.white};
`;

const DocumentTitleRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const DocumentLink = styled.a`
	min-width: 0;
	color: ${COLORS.primaryDark};
	font-size: 14px;
	font-weight: 800;
	line-height: 1.35;
	text-decoration: underline;
	text-underline-offset: 2px;
	overflow-wrap: anywhere;
`;

const DocumentName = styled.div`
	min-width: 0;
	color: ${COLORS.textPrimary};
	font-size: 14px;
	font-weight: 800;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const DocumentBadge = styled.span`
	width: fit-content;
	border: 1px solid ${COLORS.infoLight};
	border-radius: 999px;
	background: ${COLORS.infoLight};
	color: ${COLORS.infoDark};
	font-size: 11px;
	font-weight: 800;
	line-height: 1.2;
	padding: 5px 8px;
	white-space: nowrap;
`;

const DocumentBadgeGroup = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 6px;
	flex-wrap: wrap;
`;

const documentStatusSpin = keyframes`
	to {
		transform: rotate(360deg);
	}
`;

const DocumentStatusBadge = styled.span<{
	$tone: 'processing' | 'review' | 'complete' | 'error';
}>`
	width: fit-content;
	border: 1px solid
		${({ $tone }) =>
			$tone === 'error'
				? COLORS.errorLight
				: $tone === 'review'
					? COLORS.warningLight
					: COLORS.primaryLight};
	border-radius: 999px;
	background: ${({ $tone }) =>
		$tone === 'error'
			? COLORS.errorLight
			: $tone === 'review'
				? COLORS.warningLight
				: $tone === 'complete'
					? COLORS.successLight
					: COLORS.primaryLight};
	color: ${({ $tone }) =>
		$tone === 'error'
			? COLORS.errorDark
			: $tone === 'review'
				? COLORS.warningDark
				: COLORS.primaryDark};
	font-size: 11px;
	font-weight: 800;
	line-height: 1.2;
	padding: 5px 8px;
	white-space: nowrap;
`;

const DocumentMeta = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 12px;
	line-height: 1.35;
`;

const DocumentKnowledgePrompt = styled.div<{ $error?: boolean }>`
	border: 1px solid ${({ $error }) => ($error ? COLORS.errorLight : COLORS.primaryLight)};
	border-radius: 8px;
	background: ${({ $error }) => ($error ? COLORS.errorLight : COLORS.primaryLight)};
	color: ${({ $error }) => ($error ? COLORS.alertError : COLORS.primaryDark)};
	font-size: 13px;
	font-weight: 700;
	line-height: 1.45;
	padding: 9px 10px;
`;

const DocumentProcessingRow = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 10px;
`;

const DocumentStatusSpinner = styled.span`
	width: 17px;
	height: 17px;
	flex: 0 0 17px;
	border: 2px solid ${COLORS.primaryLight};
	border-top-color: ${COLORS.primaryDark};
	border-radius: 50%;
	animation: ${documentStatusSpin} 0.85s linear infinite;
	margin-top: 1px;

	@media (prefers-reduced-motion: reduce) {
		animation-duration: 1.8s;
	}
`;

const DocumentProcessingCopy = styled.div`
	display: grid;
	gap: 2px;

	strong {
		color: ${COLORS.primaryDark};
	}

	span {
		color: ${COLORS.textSecondary};
		font-size: 12px;
		font-weight: 600;
	}
`;

const DocumentKnowledgeSummary = styled.div`
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 8px;
	background: ${COLORS.successLight};
	color: ${COLORS.successDark};
	font-size: 13px;
	font-weight: 700;
	line-height: 1.45;
	padding: 8px 10px;
`;

const DocumentInlineAction = styled.button`
	border: none;
	background: transparent;
	color: ${COLORS.primaryDark};
	cursor: pointer;
	font: inherit;
	font-weight: 900;
	padding: 0;
	text-decoration: underline;
	text-underline-offset: 3px;

	&:disabled {
		color: ${COLORS.textMuted};
		cursor: not-allowed;
	}
`;

const DocumentActions = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	margin-top: 4px;
`;

const DocumentActionButton = styled.button<{ $danger?: boolean }>`
	border: none;
	background: transparent;
	color: ${({ $danger }) => ($danger ? COLORS.errorDark : COLORS.primaryDark)};
	font-size: 13px;
	font-weight: 800;
	padding: 4px 0;
	cursor: pointer;
	text-decoration: underline;
	text-underline-offset: 3px;

	&:disabled {
		color: ${COLORS.textMuted};
		cursor: not-allowed;
	}
`;

const DocumentKnowledgeStatus = styled.span`
	align-self: center;
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 999px;
	background: ${COLORS.successLight};
	color: ${COLORS.successDark};
	font-size: 11px;
	font-weight: 800;
	line-height: 1.2;
	padding: 4px 7px;
`;
