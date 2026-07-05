import React, { useState } from 'react';
import { FileUploader } from '../FileUploader';
import GenericModal from './GenericModal';
import {
	FormGrid,
	FormGroup,
	FormGroupFull,
	FormInput,
	FormLabel,
	FormSelect,
	FormTextarea,
	ModalTab,
	ModalTabContainer,
	ModalTabContent,
} from './ModalStyles';
import {
	hasCostData,
	toNumberOrUndefined,
	calculateCostTotal,
	formatCurrency,
} from '../../../utils/financialUtils';
import { TaskFinancials } from '../../../types/Task.types';
import { COLORS } from '../../../constants/colors';

// Add Maintenance History Modal Component
interface AddMaintenanceHistoryModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	primaryButtonLabel?: string;
	hideAttachmentField?: boolean;
	initialData?: {
		title?: string;
		completionDate?: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		deviceIds?: string[];
		maintenanceGroupId?: string;
		financials?: TaskFinancials;
	};
	onSubmit?: (data: {
		title: string;
		completionDate: string;
		completedBy?: string;
		completedByName?: string;
		completionNotes?: string;
		unitId?: string;
		deviceIds?: string[];
		completionFile?: File;
		recurringTaskId?: string;
		maintenanceGroupId?: string;
		financials?: TaskFinancials;
	}) => void;
	property: any;
	devices?: any[];
	units: any[];
	teamMembers: any[];
	contractors: any[];
	familyMembers: any[];
	groupOptions: Array<{ value: string; label: string }>;
	onCreateGroupId: () => string;
	relatedDocuments?: Array<{ name: string; url?: string }>;
}

export const AddMaintenanceHistoryModal: React.FC<
	AddMaintenanceHistoryModalProps
> = ({
	isOpen,
	onClose,
	onSubmit,
	devices = [],
	teamMembers,
	contractors,
	familyMembers,
	groupOptions,
	onCreateGroupId,
	title = 'Add Maintenance History',
	primaryButtonLabel = 'Add History',
	hideAttachmentField = false,
	initialData,
	relatedDocuments = [],
}) => {
	const [activeTab, setActiveTab] = useState<'record' | 'costs' | 'attachments'>(
		'record',
	);
	const [formData, setFormData] = useState({
		title: '',
		completionDate: '',
		completedBy: '',
		completedByName: '',
		completionNotes: '',
		unitId: '',
		completionFile: null as File | null,
		contractorCost: '',
		materialsCost: '',
		laborCost: '',
		otherCost: '',
	});
	const [completedByMode, setCompletedByMode] = useState<'dropdown' | 'custom'>(
		'dropdown',
	);
	const [selectedGroupId, setSelectedGroupId] = useState<string>('');
	const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

	React.useEffect(() => {
		if (!isOpen) return;
		setActiveTab('record');

		if (initialData) {
			setFormData({
				title: initialData.title || '',
				completionDate: initialData.completionDate || '',
				completedBy: initialData.completedBy || '',
				completedByName: initialData.completedByName || '',
				completionNotes: initialData.completionNotes || '',
				unitId: initialData.unitId || '',
				completionFile: null,
				contractorCost: initialData.financials?.actual?.contractorCost?.toString?.() || '',
				materialsCost: initialData.financials?.actual?.materialsCost?.toString?.() || '',
				laborCost: initialData.financials?.actual?.laborCost?.toString?.() || '',
				otherCost: initialData.financials?.actual?.otherCost?.toString?.() || '',
			});
			setCompletedByMode(initialData.completedByName ? 'custom' : 'dropdown');
			setSelectedGroupId(initialData.maintenanceGroupId || '');
			setSelectedDeviceIds(initialData.deviceIds || []);
			return;
		}

		setFormData({
			title: '',
			completionDate: '',
			completedBy: '',
			completedByName: '',
			completionNotes: '',
			unitId: '',
			completionFile: null,
			contractorCost: '',
			materialsCost: '',
			laborCost: '',
			otherCost: '',
		});
		setCompletedByMode('dropdown');
		setSelectedGroupId('');
		setSelectedDeviceIds([]);
	}, [initialData, isOpen]);

	// Generate completed by options from available data sources
	const completedByOptions = React.useMemo(() => {
		const options: Array<{ value: string; label: string; type: string }> = [];

		// Add family members
		familyMembers.forEach((member) => {
			options.push({
				value: `family-${member.id}`,
				label: `${member.firstName} ${member.lastName} (Family)`,
				type: 'family',
			});
		});

		// Add contractors
		contractors.forEach((contractor) => {
			options.push({
				value: `contractor-${contractor.id}`,
				label: `${contractor.companyName || contractor.name} (Contractor)`,
				type: 'contractor',
			});
		});

		// Add team members
		teamMembers.forEach((member) => {
			options.push({
				value: `team-${member.id}`,
				label: `${member.firstName} ${member.lastName} (Team)`,
				type: 'team',
			});
		});

		// Add custom option
		options.push({
			value: 'custom',
			label: 'Enter custom name...',
			type: 'custom',
		});

		return options;
	}, [familyMembers, contractors, teamMembers]);

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleCompletedByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		if (value === 'custom') {
			setCompletedByMode('custom');
			setFormData((prev) => ({
				...prev,
				completedBy: '',
				completedByName: '',
			}));
		} else {
			setCompletedByMode('dropdown');
			const [, id] = value.split('-');
			setFormData((prev) => ({
				...prev,
				completedBy: id,
				completedByName: '',
			}));
		}
	};

	const handleFileChange = (file: File | null) => {
		setFormData((prev) => ({
			...prev,
			completionFile: file,
		}));
	};

	const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedGroupId(e.target.value);
	};

	const handleDeviceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const values = Array.from(e.target.selectedOptions, (option) => option.value);
		setSelectedDeviceIds(values);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const groupId =
			selectedGroupId === '__new__'
				? onCreateGroupId()
				: selectedGroupId || undefined;

		const data = {
			financials: (() => {
				const actual = {
					contractorCost: toNumberOrUndefined(formData.contractorCost),
					materialsCost: toNumberOrUndefined(formData.materialsCost),
					laborCost: toNumberOrUndefined(formData.laborCost),
					otherCost: toNumberOrUndefined(formData.otherCost),
				};
				if (!hasCostData(actual)) return undefined;
				return {
					currency: 'USD',
					actual,
				};
			})(),
			title: formData.title,
			completionDate: formData.completionDate,
			completedBy:
				completedByMode === 'dropdown' ? formData.completedBy : undefined,
			completedByName:
				completedByMode === 'custom' ? formData.completedByName : undefined,
			completionNotes: formData.completionNotes,
			unitId: formData.unitId,
			deviceIds: selectedDeviceIds.length > 0 ? selectedDeviceIds : undefined,
			completionFile: formData.completionFile || undefined,
			maintenanceGroupId: groupId,
		};

		await onSubmit?.(data);

		// Reset form
		setFormData({
			title: '',
			completionDate: '',
			completedBy: '',
			completedByName: '',
			completionNotes: '',
			unitId: '',
			completionFile: null,
			contractorCost: '',
			materialsCost: '',
			laborCost: '',
			otherCost: '',
		});
		setCompletedByMode('dropdown');
		setSelectedGroupId('');
		setSelectedDeviceIds([]);
		onClose();
	};

	const deviceOptions = devices
		.map((device: any) => ({
			id: String(device.id),
			label:
				device.name ||
				[device.type, device.brand, device.model].filter(Boolean).join(' ') ||
				device.serialNumber ||
				`Appliance ${device.id}`,
		}))
		.filter((device) => device.id);

	return (
		<GenericModal
			isOpen={isOpen}
			title={title}
			onClose={onClose}
			showActions={true}
			primaryButtonLabel={primaryButtonLabel}
			secondaryButtonLabel='Cancel'
			onSubmit={handleSubmit}>
			<>
				<ModalTabContainer role='tablist' aria-label='Maintenance record sections'>
					<ModalTab
						type='button'
						$active={activeTab === 'record'}
						onClick={() => setActiveTab('record')}>
						Record
					</ModalTab>
					<ModalTab
						type='button'
						$active={activeTab === 'costs'}
						onClick={() => setActiveTab('costs')}>
						Costs
					</ModalTab>
					<ModalTab
						type='button'
						$active={activeTab === 'attachments'}
						onClick={() => setActiveTab('attachments')}>
						Attachments
					</ModalTab>
				</ModalTabContainer>

				<ModalTabContent $active={activeTab === 'record'}>
					<FormGrid>
						<FormGroup>
							<FormLabel htmlFor='maintenance-record-title'>
								Record Name *
							</FormLabel>
							<FormInput
								id='maintenance-record-title'
								type='text'
								name='title'
								value={formData.title}
								onChange={handleChange}
								placeholder='e.g., Replaced filter'
								required
							/>
						</FormGroup>

						<FormGroup>
							<FormLabel htmlFor='maintenance-record-date'>Date *</FormLabel>
							<FormInput
								id='maintenance-record-date'
								type='date'
								name='completionDate'
								value={formData.completionDate}
								onChange={handleChange}
								required
							/>
						</FormGroup>

						<FormGroupFull>
							<FormLabel htmlFor='maintenance-record-description'>
								Description
							</FormLabel>
							<FormTextarea
								id='maintenance-record-description'
								name='completionNotes'
								value={formData.completionNotes}
								onChange={handleChange}
								placeholder='Add more detail about what was done.'
								rows={4}
							/>
						</FormGroupFull>

						{deviceOptions.length > 0 && (
							<FormGroupFull>
								<FormLabel htmlFor='maintenance-linked-appliances'>
									Related Appliances
								</FormLabel>
								<FormSelect
									id='maintenance-linked-appliances'
									multiple
									value={selectedDeviceIds}
									onChange={handleDeviceChange}
									style={{ minHeight: 120 }}>
									{deviceOptions.map((device) => (
										<option key={device.id} value={device.id}>
											{device.label}
										</option>
									))}
								</FormSelect>
								<small style={{ color: '#6b7280', fontSize: 12 }}>
									Hold Ctrl/Command to select multiple appliances.
								</small>
							</FormGroupFull>
						)}

						<FormGroup>
							<FormLabel htmlFor='maintenance-completed-by'>
								Completed By
							</FormLabel>
							{completedByMode === 'dropdown' ? (
								<FormSelect
									id='maintenance-completed-by'
									value={
										formData.completedBy
											? familyMembers.find((m) => m.id === formData.completedBy)
												? `family-${formData.completedBy}`
												: contractors.find((c) => c.id === formData.completedBy)
													? `contractor-${formData.completedBy}`
													: teamMembers.find((t) => t.id === formData.completedBy)
														? `team-${formData.completedBy}`
														: ''
											: ''
									}
									onChange={handleCompletedByChange}>
									<option value=''>Select from existing...</option>
									{completedByOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</FormSelect>
							) : (
								<div>
									<FormInput
										type='text'
										name='completedByName'
										value={formData.completedByName}
										onChange={handleChange}
										placeholder='e.g., John Doe or ABC Plumbing'
									/>
									<button
										type='button'
										onClick={() => {
											setCompletedByMode('dropdown');
											setFormData((prev) => ({
												...prev,
												completedBy: '',
												completedByName: '',
											}));
										}}
										style={{
											marginTop: 4,
											padding: '4px 0',
											background: 'none',
											border: 'none',
											color: COLORS.primary,
											cursor: 'pointer',
											fontSize: 12,
											textDecoration: 'underline',
										}}>
										Select from existing instead
									</button>
								</div>
							)}
							{completedByMode === 'dropdown' && (
								<small style={{ color: '#6b7280', fontSize: 12 }}>
									Select "Enter custom name..." if the person or company is not
									listed.
								</small>
							)}
						</FormGroup>

						<FormGroup>
							<FormLabel htmlFor='maintenance-group'>Maintenance Group</FormLabel>
							<FormSelect
								id='maintenance-group'
								name='maintenanceGroupId'
								value={selectedGroupId}
								onChange={handleGroupChange}>
								<option value=''>No group</option>
								<option value='__new__'>Create new group</option>
								{groupOptions.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</FormSelect>
						</FormGroup>
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent $active={activeTab === 'costs'}>
					<FormGrid>
						<FormGroup>
							<FormLabel htmlFor='maintenance-contractor-cost'>
								Contractor Cost
							</FormLabel>
							<FormInput
								id='maintenance-contractor-cost'
								type='number'
								name='contractorCost'
								min='0'
								step='0.01'
								value={formData.contractorCost}
								onChange={handleChange}
								placeholder='0.00'
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='maintenance-materials-cost'>
								Materials Cost
							</FormLabel>
							<FormInput
								id='maintenance-materials-cost'
								type='number'
								name='materialsCost'
								min='0'
								step='0.01'
								value={formData.materialsCost}
								onChange={handleChange}
								placeholder='0.00'
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='maintenance-labor-cost'>Labor Cost</FormLabel>
							<FormInput
								id='maintenance-labor-cost'
								type='number'
								name='laborCost'
								min='0'
								step='0.01'
								value={formData.laborCost}
								onChange={handleChange}
								placeholder='0.00'
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='maintenance-other-cost'>Other Cost</FormLabel>
							<FormInput
								id='maintenance-other-cost'
								type='number'
								name='otherCost'
								min='0'
								step='0.01'
								value={formData.otherCost}
								onChange={handleChange}
								placeholder='0.00'
							/>
						</FormGroup>
						<FormGroupFull>
							<small style={{ color: '#475569', fontSize: 13, fontWeight: 700 }}>
								Total:{' '}
								{formatCurrency(
									calculateCostTotal({
										contractorCost: toNumberOrUndefined(
											formData.contractorCost,
										),
										materialsCost: toNumberOrUndefined(
											formData.materialsCost,
										),
										laborCost: toNumberOrUndefined(formData.laborCost),
										otherCost: toNumberOrUndefined(formData.otherCost),
									}),
									'USD',
								)}
							</small>
						</FormGroupFull>
					</FormGrid>
				</ModalTabContent>

				<ModalTabContent $active={activeTab === 'attachments'}>
					<div style={{ display: 'grid', gap: 16 }}>
						{!hideAttachmentField && (
							<FormGroup>
								<FormLabel>Attachment</FormLabel>
								<FileUploader
									label='Attach File'
									helperText='Images, PDF, Word, Excel, Text (max 10MB)'
									accept='image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx'
									allowedTypes={[
										'image/jpeg',
										'image/png',
										'image/jpg',
										'image/gif',
										'image/webp',
										'application/pdf',
										'application/msword',
										'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
										'text/plain',
										'application/vnd.ms-excel',
										'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
									]}
									maxSizeBytes={10 * 1024 * 1024}
									setFile={handleFileChange}
									showSelectedFiles={false}
								/>
								{formData.completionFile && (
									<div
										style={{
											marginTop: 4,
											fontSize: 14,
											color: COLORS.primary,
										}}>
										Selected: {formData.completionFile.name}
									</div>
								)}
							</FormGroup>
						)}

						{relatedDocuments.length > 0 && (
							<FormGroup>
								<FormLabel>Related Task Documents</FormLabel>
								<div style={{ display: 'grid', gap: 8 }}>
									{relatedDocuments.map((document, index) =>
										document.url ? (
											<a
												key={`${document.name}-${document.url}-${index}`}
												href={document.url}
												target='_blank'
												rel='noreferrer'
												style={{
													color: COLORS.primary,
													fontSize: 14,
													fontWeight: 700,
													textDecoration: 'underline',
												}}>
												{document.name}
											</a>
										) : (
											<span
												key={`${document.name}-${index}`}
												style={{ color: '#475569', fontSize: 14 }}>
												{document.name}
											</span>
										),
									)}
								</div>
							</FormGroup>
						)}

						{hideAttachmentField && relatedDocuments.length === 0 && (
							<small style={{ color: '#64748b', fontSize: 13 }}>
								No attachments are linked to this record.
							</small>
						)}
					</div>
				</ModalTabContent>
			</>
		</GenericModal>
	);
};
