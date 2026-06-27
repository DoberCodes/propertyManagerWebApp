import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { FileUploader } from 'Components/Library/FileUploader';
import {
	useGetPropertiesQuery,
	useUpdatePropertyMutation,
} from 'Redux/API/propertySlice';
import { PropertyDocument, PropertyDocumentCategory } from 'types/Property.types';
import {
	uploadPropertyDocument,
	withPropertyDocumentLinks,
} from 'utils/propertyDocumentUpload';
import {
	createPendingKnowledgeSuggestionFromFile,
	markDocumentWithKnowledgeSuggestion,
} from 'propertyKnowledge/propertyKnowledgeAcquisition';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';

type TaskDocumentsPanelProps = {
	property?: any;
	propertyId?: string;
	taskId?: string;
	taskStatus?: string;
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

export const TaskDocumentsPanel: React.FC<TaskDocumentsPanelProps> = ({
	property,
	propertyId,
	taskId,
	taskStatus,
	canUpload = true,
	pendingFiles,
	onPendingFilesChange,
	pendingCategory = 'other',
	onPendingCategoryChange,
}) => {
	const feedback = useAppFeedback();
	const [updateProperty] = useUpdatePropertyMutation();
	const { data: allProperties = [] } = useGetPropertiesQuery();
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [selectedCategory, setSelectedCategory] =
		useState<PropertyDocumentCategory>('other');
	const [isUploading, setIsUploading] = useState(false);
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
			taskId
				? propertyDocuments.filter(
						(document) =>
							String(document.assignedTaskId || '') === String(taskId) ||
							(document.links?.taskIds || []).some(
								(linkedTaskId) => String(linkedTaskId) === String(taskId),
							),
				  )
				: [],
		[propertyDocuments, taskId],
	);
	const isPendingMode = Boolean(onPendingFilesChange && !taskId);
	const displayedPendingFiles = pendingFiles || [];

	const handleUploadNow = async () => {
		if (!resolvedPropertyId || !taskId || selectedFiles.length === 0 || isUploading) {
			return;
		}
		if (!resolvedProperty) {
			feedback.notify('Property details are still loading. Please try again.');
			return;
		}

		setIsUploading(true);
		try {
			const uploadedDocuments = await Promise.all(
				selectedFiles.map((file) =>
					uploadPropertyDocument(file, resolvedPropertyId, selectedCategory),
				),
			);
			const linkedDocuments = uploadedDocuments.map((document) =>
				withPropertyDocumentLinks(
					{
						...document,
						assignedTaskId: taskId,
						assignedTaskStatus:
							taskStatus === 'Completed' ? 'Completed' : 'Pending',
					},
					{ taskIds: [taskId] },
				),
			);
			const knowledgeSuggestions = await Promise.all(
				linkedDocuments.map((document, index) =>
					createPendingKnowledgeSuggestionFromFile({
						file: selectedFiles[index],
						document,
						propertyId: resolvedPropertyId,
						property: resolvedProperty,
					}),
				),
			);
			const savedDocuments = linkedDocuments.map((document) => {
				const suggestion = knowledgeSuggestions.find(
					(candidate) => candidate.sourceDocumentId === document.id,
				);
				return suggestion
					? markDocumentWithKnowledgeSuggestion(document, suggestion)
					: document;
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
			feedback.notify('Task documents uploaded.');
		} catch (error: any) {
			console.error('Error uploading task documents:', error);
			feedback.notify(error?.message || 'Could not upload task documents.');
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Panel>
			<PanelHeader>
				<PanelTitle>Task Documents</PanelTitle>
				<PanelText>
					Attach manuals, warranties, photos, or files that belong with this task.
				</PanelText>
			</PanelHeader>

			{assignedDocuments.length > 0 ? (
				<DocumentList>
					{assignedDocuments.map((document) => (
						<DocumentItem key={document.id}>
							<DocumentLink
								href={document.fileUrl || document.url}
								target='_blank'
								rel='noreferrer'>
								{document.fileName || document.name}
							</DocumentLink>
							<DocumentMeta>{getCategoryLabel(document.category)}</DocumentMeta>
						</DocumentItem>
					))}
				</DocumentList>
			) : (
				<EmptyText>No task documents attached yet.</EmptyText>
			)}

			{isPendingMode && displayedPendingFiles.length > 0 && (
				<DocumentList>
					{displayedPendingFiles.map((file) => (
						<DocumentItem key={`${file.name}-${file.size}`}>
							<DocumentName>{file.name}</DocumentName>
							<DocumentMeta>Uploads when the task is saved.</DocumentMeta>
						</DocumentItem>
					))}
				</DocumentList>
			)}

			{canUpload && resolvedPropertyId && (!taskId || resolvedProperty) && (
				<UploadArea>
					<FieldLabel htmlFor='task-document-category'>Document type</FieldLabel>
					<FieldSelect
						id='task-document-category'
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
						label='Upload task documents'
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
							{isUploading ? 'Uploading...' : 'Upload to task'}
						</UploadButton>
					)}
				</UploadArea>
			)}
		</Panel>
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
	gap: 3px;
	padding: 9px 10px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
`;

const DocumentLink = styled.a`
	color: #0f766e;
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
	background: #10b981;
	color: #ffffff;
	font-weight: 800;
	padding: 10px 12px;
	cursor: pointer;

	&:disabled {
		background: #cbd5e1;
		cursor: not-allowed;
	}
`;
