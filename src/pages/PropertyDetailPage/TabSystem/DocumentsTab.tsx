import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
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
} from 'Components/Library';
import { FileUploader } from 'Components/Library/FileUploader';
import { useUpdatePropertyMutation } from 'Redux/API/propertySlice';
import {
	PropertyDocument,
	PropertyDocumentCategory,
} from 'types/Property.types';
import { Task } from 'types/Task.types';
import { RoleCapabilities } from 'utils/permissions';
import {
	deletePropertyDocumentFile,
	uploadPropertyDocument,
} from 'utils/propertyDocumentUpload';
import { useAppFeedback } from '../../../Components/Library/AppFeedback/AppFeedbackProvider';
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
	date?: string;
};

interface DocumentsTabProps {
	property: any;
	propertyDevices?: any[];
	propertyTasks?: Task[];
	maintenanceHistoryRecords?: any[];
	permissions?: RoleCapabilities;
	openUploadToken?: number;
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
}) => {
	const feedback = useAppFeedback();
	const [updateProperty] = useUpdatePropertyMutation();
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [uploadName, setUploadName] = useState('');
	const [documentCategory, setDocumentCategory] =
		useState<PropertyDocumentCategory>('manual');
	const [documentAssignment, setDocumentAssignment] = useState('property');
	const [editingDocument, setEditingDocument] = useState<PropertyDocument | null>(
		null,
	);
	const [editName, setEditName] = useState('');
	const [editCategory, setEditCategory] =
		useState<PropertyDocumentCategory>('manual');
	const [editAssignment, setEditAssignment] = useState('property');
	const [isSaving, setIsSaving] = useState(false);
	const lastOpenUploadTokenRef = useRef(0);
	const canManageDocuments = permissions?.canManageProperties ?? true;

	const propertyDocuments = useMemo<PropertyDocument[]>(
		() => (Array.isArray(property?.documents) ? property.documents : []),
		[property?.documents],
	);

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

	const sortedTasks = useMemo(
		() =>
			[...propertyTasks].sort((a, b) => {
				const aCompleted = a.status === 'Completed' ? 1 : 0;
				const bCompleted = b.status === 'Completed' ? 1 : 0;
				if (aCompleted !== bCompleted) return aCompleted - bCompleted;
				const aDate = new Date(a.dueDate || 0).getTime() || 0;
				const bDate = new Date(b.dueDate || 0).getTime() || 0;
				return aDate - bDate;
			}),
		[propertyTasks],
	);

	const getDocumentAssignmentValue = (document?: PropertyDocument | null) => {
		if (document?.assignedDeviceId) return `device:${document.assignedDeviceId}`;
		if (document?.assignedTaskId) return `task:${document.assignedTaskId}`;
		return 'property';
	};

	const getAssignmentFields = (value: string) => {
		if (value.startsWith('device:')) {
			return {
				assignedDeviceId: value.slice('device:'.length),
			};
		}
		if (value.startsWith('task:')) {
			const taskId = value.slice('task:'.length);
			const task = taskById.get(taskId);
			return {
				assignedTaskId: taskId,
				assignedTaskStatus: getTaskAssignmentStatus(task),
			};
		}
		return {};
	};

	const getAssignmentLabel = useCallback((document: PropertyDocument) => {
		if (document.assignedDeviceId) {
			const device = deviceById.get(String(document.assignedDeviceId));
			return `Appliance/System: ${
				device?.type || device?.name || 'Unknown appliance/system'
			}`;
		}
		if (document.assignedTaskId) {
			const task = taskById.get(String(document.assignedTaskId));
			const status = getTaskAssignmentStatus(task, document.assignedTaskStatus);
			return `Task: ${task?.title || 'Unknown task'} (${status})`;
		}
		return 'Property document';
	}, [deviceById, taskById]);

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
			propertyDocuments.map((document) => ({
				id: document.id,
				name: document.name,
				url: document.url,
				size: document.size,
				type: document.type,
				category: document.category,
				storagePath: document.storagePath,
				source: 'property',
				sourceLabel: getCategoryLabel(document.category),
				assignmentLabel: getAssignmentLabel(document),
				date: document.uploadedAt,
			})),
		[propertyDocuments, getAssignmentLabel],
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
					sourceLabel: device?.type || device?.name || 'Appliance/System',
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
		setDocumentAssignment('property');
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
			const assignmentFields = getAssignmentFields(documentAssignment);
			const customNameForSingleFile =
				selectedFiles.length === 1 ? uploadName.trim() : '';
			const uploadedDocuments = await Promise.all(
				selectedFiles.map((file) =>
					uploadPropertyDocument(
						file,
						property.id,
						documentCategory,
						customNameForSingleFile,
					),
				),
			);
			await updateProperty({
				id: property.id,
				updates: {
					documents: [
						...propertyDocuments,
						...uploadedDocuments.map((document) => ({
							...document,
							...assignmentFields,
						})),
					],
				},
			}).unwrap();
			feedback.notify('Documents uploaded.');
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
		setEditAssignment(getDocumentAssignmentValue(document));
		setIsEditOpen(true);
	};

	const closeEditModal = () => {
		setIsEditOpen(false);
		setEditingDocument(null);
		setEditName('');
		setEditCategory('manual');
		setEditAssignment('property');
	};

	const handleSaveEdit = async () => {
		if (!property?.id || !editingDocument || isSaving) return;
		const trimmedName = editName.trim();
		if (!trimmedName) {
			feedback.notify('Document name is required.');
			return;
		}

		setIsSaving(true);
		try {
			const assignmentFields = getAssignmentFields(editAssignment);
			await updateProperty({
				id: property.id,
				updates: {
					documents: propertyDocuments.map((document) =>
						document.id === editingDocument.id
							? (() => {
									const baseDocument = { ...document };
									delete baseDocument.assignedDeviceId;
									delete baseDocument.assignedTaskId;
									delete baseDocument.assignedTaskStatus;
									return {
										...baseDocument,
										name: trimmedName,
										category: editCategory,
										...assignmentFields,
									};
							  })()
							: document,
					),
				},
			}).unwrap();
			feedback.notify('Document updated.');
			closeEditModal();
		} catch (error) {
			console.error('Error updating property document:', error);
			feedback.notify('Could not update document. Please try again.');
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

	const renderAssignmentOptions = () => (
		<>
			<option value='property'>Property only</option>
			{propertyDevices.length > 0 && (
				<optgroup label='Appliances & Systems'>
					{propertyDevices.map((device: any) => {
						const label = [
							device?.type || device?.name || 'Appliance/System',
							[device?.brand, device?.model].filter(Boolean).join(' '),
						]
							.filter(Boolean)
							.join(' - ');
						return (
							<option key={`device-${device.id}`} value={`device:${device.id}`}>
								{label}
							</option>
						);
					})}
				</optgroup>
			)}
			{sortedTasks.length > 0 && (
				<optgroup label='Tasks'>
					{sortedTasks.map((task) => (
						<option key={`task-${task.id}`} value={`task:${task.id}`}>
							{task.title} ({getTaskAssignmentStatus(task)})
						</option>
					))}
				</optgroup>
			)}
		</>
	);

	return (
		<SectionContainer>
			<HeaderRow>
				<div>
					<SectionHeader>Files & Documents ({allDocuments.length})</SectionHeader>
					<SectionLead>
						Review every file attached across this property, including manuals, warranties, appliance records, and maintenance documentation.
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
					{applianceDocuments.length} appliance/system file{applianceDocuments.length === 1 ? '' : 's'}
				</TabSummaryPill>
				<TabSummaryPill>
					{maintenanceDocuments.length} maintenance file{maintenanceDocuments.length === 1 ? '' : 's'}
				</TabSummaryPill>
			</TabSummaryBar>

			{allDocuments.length === 0 ? (
				<EmptyState>
					<h3>No files or documents yet</h3>
					<p>
						Upload manuals, warranty documents, appliance files, or task completion records to build the property record.
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
									<DocumentBadge>
										{isPropertyDocument
											? getCategoryLabel(file.category)
											: file.source === 'appliance'
												? 'Appliance/System'
												: 'Maintenance'}
									</DocumentBadge>
								</DocumentTitleRow>
								<DocumentMeta>
									{isPropertyDocument ? 'Type' : 'Source'}: {file.sourceLabel}
								</DocumentMeta>
								{isPropertyDocument && file.assignmentLabel && (
									<DocumentMeta>Assigned to: {file.assignmentLabel}</DocumentMeta>
								)}
								<DocumentMeta>{formatDate(file.date)}</DocumentMeta>
								{isPropertyDocument && canManageDocuments && (
									<DocumentActions>
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
				<FormGroup>
					<FormLabel htmlFor='property-document-assignment'>Assign to</FormLabel>
					<FormSelect
						id='property-document-assignment'
						value={documentAssignment}
						onChange={(event) => setDocumentAssignment(event.target.value)}>
						{renderAssignmentOptions()}
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
				<FormGroup>
					<FormLabel htmlFor='property-document-edit-assignment'>Assign to</FormLabel>
					<FormSelect
						id='property-document-edit-assignment'
						value={editAssignment}
						onChange={(event) => setEditAssignment(event.target.value)}>
						{renderAssignmentOptions()}
					</FormSelect>
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
	background: #10b981;
	color: #ffffff;
	font-size: 14px;
	font-weight: 800;
	padding: 11px 14px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: #059669;
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
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	background: #ffffff;
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
	color: #0f766e;
	font-size: 14px;
	font-weight: 800;
	line-height: 1.35;
	text-decoration: underline;
	text-underline-offset: 2px;
	overflow-wrap: anywhere;
`;

const DocumentName = styled.div`
	min-width: 0;
	color: #1f2937;
	font-size: 14px;
	font-weight: 800;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const DocumentBadge = styled.span`
	width: fit-content;
	border: 1px solid #dbeafe;
	border-radius: 999px;
	background: #eff6ff;
	color: #1d4ed8;
	font-size: 11px;
	font-weight: 800;
	line-height: 1.2;
	padding: 5px 8px;
	white-space: nowrap;
`;

const DocumentMeta = styled.div`
	color: #64748b;
	font-size: 12px;
	line-height: 1.35;
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
	color: ${({ $danger }) => ($danger ? '#b91c1c' : '#0f766e')};
	font-size: 13px;
	font-weight: 800;
	padding: 4px 0;
	cursor: pointer;
	text-decoration: underline;
	text-underline-offset: 3px;

	&:disabled {
		color: #94a3b8;
		cursor: not-allowed;
	}
`;
