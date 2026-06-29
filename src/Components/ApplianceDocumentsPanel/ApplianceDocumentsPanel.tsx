import React, { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import {
	FormGroup,
	FormInput,
	FormLabel,
	FormSelect,
	GenericModal,
} from 'Components/Library';
import { FileUploader } from 'Components/Library/FileUploader';
import {
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
} from 'Redux/API/propertySlice';
import { apiSlice } from 'Redux/API/apiSlice';
import { useCreateNotificationMutation } from 'Redux/API/notificationSlice';
import type { AppDispatch } from 'Redux/store/store';
import { PropertyDocument, PropertyDocumentCategory } from 'types/Property.types';
import {
	deletePropertyDocumentFile,
	toPropertyDocumentType,
} from 'utils/propertyDocumentUpload';
import {
	preparePropertyMemoryDocumentUploads,
	startPdfDocumentKnowledgeProcessing,
} from 'propertyKnowledge/propertyDocumentUploads';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';
import { auth } from '../../config/firebase';
import { COLORS } from '../../constants/colors';

type ApplianceDocumentsPanelProps = {
	property?: any;
	propertyId?: string;
	deviceId?: string;
	canUpload?: boolean;
	pendingFiles?: File[];
	onPendingFilesChange?: (files: File[]) => void;
	pendingCategory?: PropertyDocumentCategory;
	onPendingCategoryChange?: (category: PropertyDocumentCategory) => void;
};

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

const getCategoryLabel = (category?: PropertyDocumentCategory) => {
	if (category === 'manual') return 'Manual';
	if (category === 'warranty') return 'Warranty';
	return 'Other document';
};

export const ApplianceDocumentsPanel: React.FC<ApplianceDocumentsPanelProps> = ({
	property,
	propertyId,
	deviceId,
	canUpload = true,
	pendingFiles,
	onPendingFilesChange,
	pendingCategory = 'other',
	onPendingCategoryChange,
}) => {
	const feedback = useAppFeedback();
	const dispatch = useDispatch<AppDispatch>();
	const [updateProperty] = useUpdatePropertyMutation();
	const [createNotification] = useCreateNotificationMutation();
	const { data: allProperties = [] } = useGetPropertiesQuery();
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [selectedCategory, setSelectedCategory] =
		useState<PropertyDocumentCategory>('other');
	const [isUploading, setIsUploading] = useState(false);
	const [editingDocument, setEditingDocument] = useState<PropertyDocument | null>(null);
	const [editName, setEditName] = useState('');
	const [editCategory, setEditCategory] =
		useState<PropertyDocumentCategory>('other');
	const resolvedPropertyId = property?.id || propertyId || '';
	const resolvedProperty =
		property ||
		allProperties.find(
			(item: any) => String(item.id || '') === String(resolvedPropertyId),
		);
	const propertyDocuments = useMemo<PropertyDocument[]>(
		() =>
			Array.isArray(resolvedProperty?.documents) ? resolvedProperty.documents : [],
		[resolvedProperty?.documents],
	);
	const propertyKnowledgeSuggestions = useMemo(
		() =>
			Array.isArray(resolvedProperty?.knowledgeSuggestions)
				? resolvedProperty.knowledgeSuggestions
				: [],
		[resolvedProperty?.knowledgeSuggestions],
	);
	const assignedDocuments = useMemo(
		() =>
			deviceId
				? propertyDocuments.filter(
						(document) =>
							String(document.assignedDeviceId || '') === String(deviceId) ||
							(document.links?.assetIds || []).some(
								(assetId) => String(assetId) === String(deviceId),
							),
				  )
				: [],
		[propertyDocuments, deviceId],
	);
	const isPendingMode = Boolean(onPendingFilesChange && !deviceId);
	const displayedPendingFiles = pendingFiles || [];
	const canManageAssignedDocuments = Boolean(canUpload && resolvedPropertyId && deviceId);
	const notificationUserId =
		auth.currentUser?.uid || resolvedProperty?.userId || '';

	const openEditModal = (documentId?: string) => {
		const document = assignedDocuments.find((item) => item.id === documentId);
		if (!document) return;
		setEditingDocument(document);
		setEditName(document.fileName || document.name);
		setEditCategory(document.category || 'other');
	};

	const closeEditModal = () => {
		setEditingDocument(null);
		setEditName('');
		setEditCategory('other');
	};

	const handleUploadNow = async () => {
		if (!resolvedPropertyId || selectedFiles.length === 0 || isUploading) {
			return;
		}
		if (!resolvedProperty) {
			feedback.notify('Property details are still loading. Please try again.');
			return;
		}

		setIsUploading(true);
		try {
			const {
				documents: savedDocuments,
				knowledgeSuggestions,
				pdfDocuments,
			} = await preparePropertyMemoryDocumentUploads({
				files: selectedFiles,
				propertyId: resolvedPropertyId,
				category: selectedCategory,
				property: resolvedProperty,
			});
			await updateProperty({
				id: resolvedPropertyId,
				updates: {
					documents: [...propertyDocuments, ...savedDocuments],
					knowledgeSuggestions: [
						...propertyKnowledgeSuggestions,
						...knowledgeSuggestions,
					],
				},
			}).unwrap();
			setSelectedFiles([]);
			setSelectedCategory('other');
			startPdfDocumentKnowledgeProcessing({
				propertyId: resolvedPropertyId,
				documents: pdfDocuments,
				notifyScanStarted: (document) => {
					if (!notificationUserId) return undefined;
					return createNotification({
						userId: notificationUserId,
						type: 'document_scan_started',
						title: 'Document Review Started',
						message: `Maintley is reviewing ${document.fileName || document.name} for suggested details.`,
						data: {
							propertyId: resolvedPropertyId,
							propertyTitle: resolvedProperty?.title || resolvedProperty?.name,
							documentId: document.id,
							documentName: document.fileName || document.name,
						},
						status: 'unread',
						actionUrl: `/properties/${resolvedPropertyId}`,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					}).unwrap();
				},
				onProcessed: () => {
					dispatch(apiSlice.util.invalidateTags(['Properties']));
				},
				onError: () => {
					dispatch(apiSlice.util.invalidateTags(['Properties']));
				},
			});
			feedback.notify(
				pdfDocuments.length > 0
					? 'Documents uploaded. Maintley is reviewing PDF details in the background.'
					: 'Documents uploaded to property documents.',
			);
		} catch (error: any) {
			console.error('Error uploading appliance documents:', error);
			feedback.notify(error?.message || 'Could not upload appliance documents.');
		} finally {
			setIsUploading(false);
		}
	};

	const handleSaveEdit = async () => {
		if (!resolvedPropertyId || !editingDocument || isUploading) return;
		const trimmedName = editName.trim();
		if (!trimmedName) {
			feedback.notify('Document name is required.');
			return;
		}

		setIsUploading(true);
		try {
			await updateProperty({
				id: resolvedPropertyId,
				updates: {
					documents: propertyDocuments.map((document) =>
						document.id === editingDocument.id
							? {
								...document,
								name: trimmedName,
								fileName: trimmedName,
								category: editCategory,
								documentType: toPropertyDocumentType(
									editCategory,
									trimmedName,
								),
							}
							: document,
					),
				},
			}).unwrap();
			feedback.notify('Document updated.');
			closeEditModal();
		} catch (error) {
			console.error('Error updating appliance document:', error);
			feedback.notify('Could not update document. Please try again.');
		} finally {
			setIsUploading(false);
		}
	};

	const handleDeleteDocument = async (documentId?: string) => {
		if (!resolvedPropertyId || !documentId || isUploading) return;
		const document = assignedDocuments.find((item) => item.id === documentId);
		if (!document) return;
		if (!window.confirm(`Delete ${document.name}?`)) return;

		setIsUploading(true);
		try {
			try {
				await deletePropertyDocumentFile(document.storagePath);
			} catch (storageError) {
				console.warn('Could not delete appliance document file:', storageError);
			}
			await updateProperty({
				id: resolvedPropertyId,
				updates: {
					documents: propertyDocuments.filter((item) => item.id !== document.id),
				},
			}).unwrap();
			feedback.notify('Document deleted.');
		} catch (error) {
			console.error('Error deleting appliance document:', error);
			feedback.notify('Could not delete document. Please try again.');
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<>
		<Panel>
			<PanelHeader>
				<PanelTitle>Assigned Appliance Documents</PanelTitle>
				<PanelText>
					Attach manuals, warranties, invoices, or photos that belong with this appliance.
				</PanelText>
			</PanelHeader>

			{assignedDocuments.length > 0 ? (
				<DocumentList>
					{assignedDocuments.map((document) => (
						<DocumentItem key={document.id}>
							<DocumentTitleRow>
								<DocumentLink
									href={document.fileUrl || document.url}
									target='_blank'
									rel='noreferrer'>
									{document.fileName || document.name}
								</DocumentLink>
								<DocumentMeta>{getCategoryLabel(document.category)}</DocumentMeta>
							</DocumentTitleRow>
							<DocumentMeta>{getCategoryLabel(document.category)}</DocumentMeta>
							{canManageAssignedDocuments && (
								<DocumentActions>
									<DocumentActionButton
										type='button'
										onClick={() => openEditModal(document.id)}
										disabled={isUploading}>
										Edit
									</DocumentActionButton>
									<DocumentActionButton
										type='button'
										$danger
										onClick={() => handleDeleteDocument(document.id)}
										disabled={isUploading}>
										Delete
									</DocumentActionButton>
								</DocumentActions>
							)}
						</DocumentItem>
					))}
				</DocumentList>
			) : (
				<EmptyText>No property documents assigned to this appliance yet.</EmptyText>
			)}

			{isPendingMode && displayedPendingFiles.length > 0 && (
				<DocumentList>
					{displayedPendingFiles.map((file) => (
						<DocumentItem key={`${file.name}-${file.size}`}>
							<DocumentName>{file.name}</DocumentName>
							<DocumentMeta>Uploads when the appliance is saved.</DocumentMeta>
							<DocumentActions>
								<DocumentActionButton
									type='button'
									$danger
									onClick={() =>
										onPendingFilesChange?.(
											displayedPendingFiles.filter(
												(candidate) =>
													!(
														candidate.name === file.name &&
														candidate.size === file.size &&
														candidate.type === file.type
													),
											),
										)
									}>
									Remove
								</DocumentActionButton>
							</DocumentActions>
						</DocumentItem>
					))}
				</DocumentList>
			)}

			{canUpload && resolvedPropertyId && (!deviceId || resolvedProperty) && (
				<UploadArea>
					<FieldLabel htmlFor='appliance-document-category'>Document type</FieldLabel>
					<FieldSelect
						id='appliance-document-category'
						value={isPendingMode ? pendingCategory : selectedCategory}
						onChange={(event) => {
							const nextCategory = event.target.value as PropertyDocumentCategory;
							if (isPendingMode) {
								onPendingCategoryChange?.(nextCategory);
							} else {
								setSelectedCategory(nextCategory);
							}
						}}>
						<option value='manual'>Manual</option>
						<option value='warranty'>Warranty</option>
						<option value='other'>Other document</option>
					</FieldSelect>
					<FileUploader
						label='Upload property documents'
						helperText='PDF, image, Word, Excel, or text files under 10MB'
						accept={DOCUMENT_ACCEPT}
						allowedTypes={DOCUMENT_ALLOWED_TYPES}
						maxSizeBytes={10 * 1024 * 1024}
						multiple
						setFiles={isPendingMode ? onPendingFilesChange : setSelectedFiles}
						disabled={isUploading}
					/>
					{!isPendingMode && (
						<UploadButton
							type='button'
							onClick={handleUploadNow}
							disabled={selectedFiles.length === 0 || isUploading}>
							{isUploading ? 'Uploading...' : 'Upload to property documents'}
						</UploadButton>
					)}
				</UploadArea>
			)}
		</Panel>
		<GenericModal
			isOpen={Boolean(editingDocument)}
			title='Edit Document'
			onClose={closeEditModal}
			primaryButtonLabel={isUploading ? 'Saving...' : 'Save'}
			primaryButtonAction={handleSaveEdit}
			primaryButtonDisabled={!editName.trim() || isUploading}
			isLoading={isUploading}
			showActions
			compact>
			<FormGroup>
				<FormLabel htmlFor='appliance-document-name'>Document name</FormLabel>
				<FormInput
					id='appliance-document-name'
					value={editName}
					onChange={(event) => setEditName(event.target.value)}
				/>
			</FormGroup>
			<FormGroup>
				<FormLabel htmlFor='appliance-document-category-edit'>Document type</FormLabel>
				<FormSelect
					id='appliance-document-category-edit'
					value={editCategory}
					onChange={(event) =>
						setEditCategory(event.target.value as PropertyDocumentCategory)
					}>
					<option value='manual'>Manual</option>
					<option value='warranty'>Warranty</option>
					<option value='other'>Other document</option>
				</FormSelect>
			</FormGroup>
		</GenericModal>
		</>
	);
};

const Panel = styled.div`
	display: grid;
	gap: 12px;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	background: #ffffff;
`;

const PanelHeader = styled.div`
	display: grid;
	gap: 4px;
`;

const PanelTitle = styled.h4`
	margin: 0;
	color: #0f172a;
	font-size: 1rem;
	font-weight: 800;
`;

const PanelText = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 0.86rem;
	line-height: 1.45;
`;

const DocumentList = styled.div`
	display: grid;
	gap: 8px;
`;

const DocumentItem = styled.div`
	display: grid;
	gap: 6px;
	padding: 9px 10px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
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
	color: ${COLORS.primary};
	font-size: 0.9rem;
	font-weight: 800;
	text-decoration: underline;
	text-underline-offset: 2px;
	overflow-wrap: anywhere;
`;

const DocumentName = styled.div`
	color: #0f172a;
	font-size: 0.9rem;
	font-weight: 800;
	overflow-wrap: anywhere;
`;

const DocumentMeta = styled.div`
	color: #64748b;
	font-size: 0.78rem;
	line-height: 1.35;
`;

const DocumentActions = styled.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
	margin-top: 2px;
`;

const DocumentActionButton = styled.button<{ $danger?: boolean }>`
	border: none;
	background: transparent;
	padding: 0;
	color: ${({ $danger }) => ($danger ? COLORS.errorDark : COLORS.primary)};
	font-size: 0.82rem;
	font-weight: 800;
	text-decoration: underline;
	text-underline-offset: 3px;
	cursor: pointer;

	&:disabled {
		color: #94a3b8;
		cursor: not-allowed;
	}
`;

const EmptyText = styled.div`
	color: #94a3b8;
	font-size: 0.88rem;
`;

const UploadArea = styled.div`
	display: grid;
	gap: 10px;
`;

const FieldLabel = styled.label`
	color: #334155;
	font-size: 0.86rem;
	font-weight: 800;
`;

const FieldSelect = styled.select`
	width: 100%;
	min-height: 42px;
	border: 1px solid #d1d5db;
	border-radius: 8px;
	padding: 0.65rem 0.75rem;
	background: #ffffff;
	font-size: 0.95rem;
`;

const UploadButton = styled.button`
	border: none;
	border-radius: 9px;
	background: ${COLORS.primary};
	color: ${COLORS.textInverse};
	font-weight: 800;
	padding: 10px 12px;
	cursor: pointer;

	&:disabled {
		background: #cbd5e1;
		cursor: not-allowed;
	}
`;
