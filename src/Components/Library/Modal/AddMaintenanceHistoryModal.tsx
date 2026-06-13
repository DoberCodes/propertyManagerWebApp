import React, { useState } from 'react';
import { FileUploader } from '../FileUploader';
import GenericModal from './GenericModal';
import {
	hasCostData,
	toNumberOrUndefined,
	calculateCostTotal,
	formatCurrency,
} from '../../../utils/financialUtils';
import { TaskFinancials } from '../../../types/Task.types';

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
}) => {
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
			<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Task Title *
					</label>
					<input
						type='text'
						name='title'
						value={formData.title}
						onChange={handleChange}
						placeholder='e.g., Fixed leaking faucet'
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
						}}
						required
					/>
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Financials (optional)
					</label>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: '8px',
						}}>
						<input
							type='number'
							name='contractorCost'
							min='0'
							step='0.01'
							value={formData.contractorCost}
							onChange={handleChange}
							placeholder='Contractor cost'
							style={{
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}
						/>
						<input
							type='number'
							name='materialsCost'
							min='0'
							step='0.01'
							value={formData.materialsCost}
							onChange={handleChange}
							placeholder='Materials cost'
							style={{
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}
						/>
						<input
							type='number'
							name='laborCost'
							min='0'
							step='0.01'
							value={formData.laborCost}
							onChange={handleChange}
							placeholder='Labor cost'
							style={{
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}
						/>
						<input
							type='number'
							name='otherCost'
							min='0'
							step='0.01'
							value={formData.otherCost}
							onChange={handleChange}
							placeholder='Other cost'
							style={{
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}
						/>
					</div>
					<small
						style={{
							color: '#6b7280',
							fontSize: '12px',
							marginTop: '4px',
							display: 'block',
						}}>
						Total:{' '}
						{formatCurrency(
							calculateCostTotal({
								contractorCost: toNumberOrUndefined(formData.contractorCost),
								materialsCost: toNumberOrUndefined(formData.materialsCost),
								laborCost: toNumberOrUndefined(formData.laborCost),
								otherCost: toNumberOrUndefined(formData.otherCost),
							}),
							'USD',
						)}
					</small>
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Completion Date *
					</label>
					<input
						type='date'
						name='completionDate'
						value={formData.completionDate}
						onChange={handleChange}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
						}}
						required
					/>
				</div>

				{/* Units are temporarily hidden from the app flow.
				{property?.propertyType === 'Multi-Family' && units.length > 0 && (
					<div>
						<label
							style={{
								display: 'block',
								marginBottom: '4px',
								fontWeight: 'bold',
							}}>
							Unit
						</label>
						<select
							name='unitId'
							value={formData.unitId}
							onChange={handleChange}
							style={{
								width: '100%',
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}>
							<option value=''>Property Level</option>
							{units.map((unit) => (
								<option key={unit.id} value={unit.id}>
									{unit.unitNumber || unit.address || `Unit ${unit.id}`}
								</option>
							))}
						</select>
					</div>
				)}
				*/}

				{deviceOptions.length > 0 && (
					<div>
						<label
							style={{
								display: 'block',
								marginBottom: '4px',
								fontWeight: 'bold',
							}}>
							Linked Appliances
						</label>
						<select
							multiple
							value={selectedDeviceIds}
							onChange={handleDeviceChange}
							style={{
								width: '100%',
								minHeight: '120px',
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}>
							{deviceOptions.map((device) => (
								<option key={device.id} value={device.id}>
									{device.label}
								</option>
							))}
						</select>
						<small
							style={{
								color: '#6b7280',
								fontSize: '12px',
								marginTop: '4px',
								display: 'block',
							}}>
							Hold Ctrl/Command to select multiple appliances.
						</small>
					</div>
				)}

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Maintenance Group
					</label>
					<select
						name='maintenanceGroupId'
						value={selectedGroupId}
						onChange={handleGroupChange}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
						}}>
						<option value=''>No group</option>
						<option value='__new__'>Create new group</option>
						{groupOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					<small
						style={{
							color: '#6b7280',
							fontSize: '12px',
							marginTop: '4px',
							display: 'block',
						}}>
						Add this history item to an existing maintenance group or create a
						new one.
					</small>
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Completed By
					</label>
					{completedByMode === 'dropdown' ? (
						<select
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
							onChange={handleCompletedByChange}
							style={{
								width: '100%',
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								fontSize: '14px',
							}}>
							<option value=''>Select from existing...</option>
							{completedByOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					) : (
						<div>
							<input
								type='text'
								name='completedByName'
								value={formData.completedByName}
								onChange={handleChange}
								placeholder='e.g., John Doe or ABC Plumbing'
								style={{
									width: '100%',
									padding: '8px',
									border: '1px solid #ccc',
									borderRadius: '4px',
									fontSize: '14px',
								}}
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
									marginTop: '4px',
									padding: '4px 8px',
									background: 'none',
									border: 'none',
									color: '#3b82f6',
									cursor: 'pointer',
									fontSize: '12px',
									textDecoration: 'underline',
								}}>
								Select from existing instead
							</button>
						</div>
					)}
					{completedByMode === 'dropdown' && (
						<small
							style={{
								color: '#6b7280',
								fontSize: '12px',
								marginTop: '4px',
								display: 'block',
							}}>
							Can't find who you're looking for? Select "Enter custom name..."
							to add manually.
						</small>
					)}
				</div>

				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '4px',
							fontWeight: 'bold',
						}}>
						Notes
					</label>
					<textarea
						name='completionNotes'
						value={formData.completionNotes}
						onChange={handleChange}
						placeholder='Additional details about the maintenance...'
						rows={3}
						style={{
							width: '100%',
							padding: '8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							fontSize: '14px',
							resize: 'vertical',
						}}
					/>
				</div>

				{!hideAttachmentField && (
					<div>
						<label
							style={{
								display: 'block',
								marginBottom: '4px',
								fontWeight: 'bold',
							}}>
							Attachment (optional)
						</label>
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
						<small style={{ color: '#6b7280', fontSize: '12px' }}>
							Supported formats: Images, PDF, Word, Excel, Text (max 10MB)
						</small>
						{formData.completionFile && (
							<div
								style={{ marginTop: '4px', fontSize: '14px', color: '#059669' }}>
								Selected: {formData.completionFile.name}
							</div>
						)}
					</div>
				)}
			</div>
		</GenericModal>
	);
};
