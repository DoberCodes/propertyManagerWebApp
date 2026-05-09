import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useGetPropertiesQuery, useGetUnitsQuery } from '../../Redux/API/propertySlice';
import {
	useGetDeviceQuery,
	useGetDevicesQuery,
	useUpdateDeviceMutation,
} from '../../Redux/API/deviceSlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import { useGetMaintenanceHistoryByPropertyQuery } from '../../Redux/API/maintenanceSlice';
import { DetailPageLayout, TabContent, ReusableTable } from '../../Components/Library';
import { TabConfig } from '../../types/DetailPage.types';
import {
	InfoGrid,
	InfoCard,
	InfoLabel,
	InfoValue,
	SectionContainer,
	SectionHeader,
} from '../../Components/Library/InfoCards/InfoCardStyles';
import {
	GridContainer,
	GridTable,
	EmptyState,
} from '../../Components/Library/DataGrid/DataGridStyles';
import {
	formatCurrency,
	getFinancialDisplayTotal,
} from '../../utils/financialUtils';
import { uploadDeviceFile } from '../../utils/deviceFileUpload';
import {
	getDeviceIdFromSlug,
	getDeviceSlugBase,
} from '../../utils/deviceSlug';
import {
	parseDeviceBarcodePayload,
	parsePartBarcodePayload,
} from '../../utils/barcodeScanParser';
import { DeviceServiceItem } from '../../types/Property.types';
import {
	DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS,
	DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY,
	buildDeviceServiceItemDetails,
} from '../../constants/deviceServiceItems';
import { BarcodeScannerModal } from '../../Components/Library/BarcodeScanner/BarcodeScannerModal';

type PartFormState = Omit<DeviceServiceItem, 'id'>;


// Styled components for parts management
const PartsTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin-bottom: 16px;

	thead {
		background-color: #f3f4f6;
	}

	th {
		text-align: left;
		padding: 12px;
		font-weight: 600;
		font-size: 14px;
		border-bottom: 2px solid #e5e7eb;
		color: #374151;
	}

	td {
		padding: 12px;
		border-bottom: 1px solid #e5e7eb;
		font-size: 14px;
	}

	tbody tr:hover {
		background-color: #f9fafb;
	}
`;

const ActionButton = styled.button`
	background: none;
	border: none;
	cursor: pointer;
	padding: 6px 8px;
	color: #6b7280;
	border-radius: 4px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;

	&:hover {
		background-color: #e5e7eb;
		color: #374151;
	}

	&.delete:hover {
		color: #dc2626;
		background-color: #fee2e2;
	}
`;

const PartsForm = styled.div`
	background-color: #f9fafb;
	padding: 16px;
	border-radius: 8px;
	margin-bottom: 16px;
	border: 1px solid #e5e7eb;
`;

const FormRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr auto;
	gap: 12px;
	align-items: flex-end;
	margin-bottom: 12px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const DynamicFieldsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px;
	margin-bottom: 12px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
`;

const FormField = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const FormLabel = styled.label`
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #64748b;
`;

const FormInput = styled.input`
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 13px;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #0f766e;
		box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
	}
`;

const FormSelect = styled.select`
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 13px;
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: #0f766e;
		box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
	}
`;

const FormTextarea = styled.textarea`
	padding: 8px 12px;
	border: 1px solid #d1d5db;
	border-radius: 6px;
	font-size: 13px;
	font-family: inherit;
	resize: vertical;
	min-height: 72px;

	&:focus {
		outline: none;
		border-color: #0f766e;
		box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
	}
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 8px;
`;

const SubmitButton = styled.button`
	padding: 8px 16px;
	background-color: #0f766e;
	color: white;
	border: none;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background-color: #0d5d56;
	}
`;

const CancelButton = styled.button`
	padding: 8px 16px;
	background-color: #e5e7eb;
	color: #374151;
	border: none;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background-color: #d1d5db;
	}
`;

const ScanButton = styled.button`
	padding: 8px 14px;
	background-color: #ffffff;
	color: #0f766e;
	border: 1px solid #0f766e;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background-color: #ecfeff;
	}
`;

const CombinedHistoryContainer = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
`;

const PageStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
`;

const SummaryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 1280px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const SummaryCard = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	padding: 14px 16px;
`;

const SummaryLabel = styled.div`
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: #64748b;
	margin-bottom: 6px;
`;

const SummaryValue = styled.div`
	font-size: 30px;
	line-height: 1;
	font-weight: 700;
	color: #0f172a;
`;

const SurfaceCard = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 14px 18px;
`;

const PhotoSection = styled.div`
	display: grid;
	grid-template-columns: 280px 1fr;
	gap: 16px;
	margin-bottom: 16px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`;

const DevicePhotoCard = styled.div`
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	padding: 10px;
	min-height: 220px;
	display: flex;
	align-items: center;
	justify-content: center;
`;

const DevicePhotoImg = styled.img`
	width: 100%;
	height: 220px;
	object-fit: cover;
	border-radius: 8px;
`;

const PhotoPlaceholder = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #64748b;
	text-align: center;
	padding: 0 12px;
`;

const PhotoActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	align-items: center;
`;

const PhotoActionButton = styled.button`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid #0f766e;
	background: #0f766e;
	color: #ffffff;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;

	&:disabled {
		opacity: 0.65;
		cursor: not-allowed;
	}
`;

const RemovePhotoButton = styled.button`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1px solid #dc2626;
	background: #ffffff;
	color: #dc2626;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
`;

const PhotoHelperText = styled.div`
	font-size: 12px;
	color: #64748b;
`;

const SectionBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin: 6px 0 14px;
`;

const SectionEyebrow = styled.span`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #64748b;
`;

const SectionTitleStrong = styled.h3`
	margin: 0;
	font-size: 1.08rem;
	font-weight: 800;
	color: #0f172a;
`;

const SectionDescription = styled.p`
	margin: 0;
	font-size: 0.9rem;
	line-height: 1.5;
	color: #475569;
`;

const IntelligenceStrip = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;
	margin-top: 2px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

const IntelligencePill = styled.div<{ $tone?: 'warning' | 'neutral' | 'success' }>`
	padding: 10px 12px;
	border-radius: 10px;
	border: 1px solid
		${(props) =>
			props.$tone === 'warning'
				? '#fcd34d'
				: props.$tone === 'success'
					? '#86efac'
					: '#cbd5e1'};
	background: ${(props) =>
		props.$tone === 'warning'
			? '#fffbeb'
			: props.$tone === 'success'
				? '#f0fdf4'
				: '#f8fafc'};
	font-size: 0.84rem;
	font-weight: 600;
	color: ${(props) =>
		props.$tone === 'warning'
			? '#92400e'
			: props.$tone === 'success'
				? '#166534'
				: '#334155'};
`;

const formatDate = (value?: string) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString();
};

export const DeviceDetailPage: React.FC = () => {
	const { slug, deviceSlug } = useParams<{ slug: string; deviceSlug: string }>();
	const photoInputRef = useRef<HTMLInputElement | null>(null);
	const [activeTab, setActiveTab] = useState<string>('info');
	const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [isDeviceScanOpen, setIsDeviceScanOpen] = useState(false);
	const [isPartScanOpen, setIsPartScanOpen] = useState(false);
	const [partFormData, setPartFormData] = useState<PartFormState>({
		name: '',
		category: 'part',
		details: '',
		partNumber: '',
		size: '',
		manufacturer: '',
		material: '',
		voltage: '',
		mervRating: '',
		compatibility: '',
		replacementInterval: '',
		notes: '',
	});

	const [updateDevice] = useUpdateDeviceMutation();

	const resetPartForm = () => {
		setPartFormData({
			name: '',
			category: 'part',
			details: '',
			partNumber: '',
			size: '',
			manufacturer: '',
			material: '',
			voltage: '',
			mervRating: '',
			compatibility: '',
			replacementInterval: '',
			notes: '',
		});
	};


	const deviceId = useMemo(() => getDeviceIdFromSlug(deviceSlug), [deviceSlug]);

	const { data: properties = [] } = useGetPropertiesQuery();
	const property = useMemo(
		() => properties.find((item: any) => item.slug === slug),
		[properties, slug],
	);

	const { data: device, isLoading: deviceLoading } = useGetDeviceQuery(deviceId || '', {
		skip: !deviceId,
	});

	const { data: units = [] } = useGetUnitsQuery(property?.id || '', {
		skip: !property?.id,
	});

	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: propertyDevices = [] } = useGetDevicesQuery(property?.id || '', {
		skip: !property?.id,
	});
	const { data: propertyMaintenanceHistory = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
		});

	const normalizeIdentifier = (value?: string) =>
		String(value || '')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');

	const locationLabel = useMemo(() => {
		if (!device || !property) return 'N/A';

		if (device.location?.unitId) {
			const unit = units.find((item: any) => item.id === device.location.unitId);
			return unit?.name || `Unit (${device.location.unitId})`;
		}

		if (device.location?.suiteId) {
			const suite = (property.suites || []).find(
				(item: any) => item.id === device.location.suiteId,
			);
			return suite?.name || `Suite (${device.location.suiteId})`;
		}

		return 'Property level';
	}, [device, property, units]);

	const linkedTasks = useMemo(() => {
		if (!device || !property) return [];
		const deviceIdString = String(device.id);

		return allTasks
			.filter((task: any) => {
				if (task.propertyId !== property.id) return false;
				if (String(task.deviceId || '') === deviceIdString) return true;
				if (Array.isArray(task.devices)) {
					return task.devices.map((id: any) => String(id)).includes(deviceIdString);
				}
				return false;
			})
			.filter((task: any) => String(task.status || '').toLowerCase() !== 'completed');
	}, [allTasks, device, property]);

	const relatedMaintenanceHistory = useMemo(() => {
		if (!device) return [];
		const deviceIdString = String(device.id);

		return propertyMaintenanceHistory
			.filter((record: any) => {
				if (String(record.deviceId || '') === deviceIdString) return true;
				if (Array.isArray(record.devices)) {
					return record.devices
						.map((id: any) => String(id))
						.includes(deviceIdString);
				}
				return false;
			})
			.sort((a: any, b: any) => {
				const aDate =
					new Date(
						a.completionDate || a.approvedAt || a.dueDate || a.date || 0,
					).getTime() || 0;
				const bDate =
					new Date(
						b.completionDate || b.approvedAt || b.dueDate || b.date || 0,
					).getTime() || 0;
				return bDate - aDate;
			});
	}, [device, propertyMaintenanceHistory]);

	const deviceFiles = useMemo(() => device?.files || [], [device?.files]);
	const devicePhotoFile = useMemo(
		() => deviceFiles.find((file: any) => String(file.type || '').startsWith('image/')),
		[deviceFiles],
	);
	const serviceParts = device?.serviceItems || [];
	const activePartFields = useMemo(
		() =>
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY[partFormData.category] ||
			DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY.other,
		[partFormData.category],
	);

	const overdueTasksCount = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		return linkedTasks.filter((task: any) => {
			const dueDate = task?.dueDate ? new Date(task.dueDate) : null;
			if (!dueDate || Number.isNaN(dueDate.getTime())) return false;
			dueDate.setHours(0, 0, 0, 0);
			return dueDate < today;
		}).length;
	}, [linkedTasks]);

	const recurringTaskCount = useMemo(
		() => linkedTasks.filter((task: any) => Boolean(task.isRecurring)).length,
		[linkedTasks],
	);

	const upcomingDueSoonCount = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const maxDate = new Date(today);
		maxDate.setDate(maxDate.getDate() + 30);

		return linkedTasks.filter((task: any) => {
			const dueDate = task?.dueDate ? new Date(task.dueDate) : null;
			if (!dueDate || Number.isNaN(dueDate.getTime())) return false;
			dueDate.setHours(0, 0, 0, 0);
			return dueDate >= today && dueDate <= maxDate;
		}).length;
	}, [linkedTasks]);

	const tabs: TabConfig[] = [
		{ id: 'info' as any, label: 'Device Info' },
		{ id: 'parts' as any, label: 'Parts & Service', count: serviceParts.length },
		{
			id: 'history' as any,
			label: 'Tasks & History',
			count: linkedTasks.length + relatedMaintenanceHistory.length,
		},
	];

	const handleAddPart = async () => {
		if (!device || !partFormData.name.trim()) return;

		const newPart: DeviceServiceItem = {
			id: `${Date.now()}`,
			name: partFormData.name.trim(),
			category: partFormData.category,
			details: buildDeviceServiceItemDetails(partFormData) || undefined,
			partNumber: partFormData.partNumber?.trim() || undefined,
			size: partFormData.size?.trim() || undefined,
			manufacturer: partFormData.manufacturer?.trim() || undefined,
			material: partFormData.material?.trim() || undefined,
			voltage: partFormData.voltage?.trim() || undefined,
			mervRating: partFormData.mervRating?.trim() || undefined,
			compatibility: partFormData.compatibility?.trim() || undefined,
			replacementInterval: partFormData.replacementInterval?.trim() || undefined,
			notes: partFormData.notes?.trim() || undefined,
		};

		const updatedParts = [...serviceParts, newPart];
		await updateDevice({
			id: device.id,
			updates: { serviceItems: updatedParts },
		});

		resetPartForm();
	};

	const handleUpdatePart = async () => {
		if (!device || editingPartIndex === null || !partFormData.name.trim()) return;

		const updatedParts = [...serviceParts];
		updatedParts[editingPartIndex] = {
			...serviceParts[editingPartIndex],
			name: partFormData.name.trim(),
			category: partFormData.category,
			details: buildDeviceServiceItemDetails(partFormData) || undefined,
			partNumber: partFormData.partNumber?.trim() || undefined,
			size: partFormData.size?.trim() || undefined,
			manufacturer: partFormData.manufacturer?.trim() || undefined,
			material: partFormData.material?.trim() || undefined,
			voltage: partFormData.voltage?.trim() || undefined,
			mervRating: partFormData.mervRating?.trim() || undefined,
			compatibility: partFormData.compatibility?.trim() || undefined,
			replacementInterval: partFormData.replacementInterval?.trim() || undefined,
			notes: partFormData.notes?.trim() || undefined,
		};

		await updateDevice({
			id: device.id,
			updates: { serviceItems: updatedParts },
		});

		resetPartForm();
		setEditingPartIndex(null);
	};

	const handleDeletePart = async (index: number) => {
		if (!device) return;

		const updatedParts = serviceParts.filter((_: any, i: number) => i !== index);
		await updateDevice({
			id: device.id,
			updates: { serviceItems: updatedParts },
		});
	};

	const handleEditPart = (index: number) => {
		const part = serviceParts[index];
		setPartFormData({
			name: part.name || '',
			category: part.category || 'part',
			details: part.details || '',
			partNumber: part.partNumber || '',
			size: part.size || '',
			manufacturer: part.manufacturer || '',
			material: part.material || '',
			voltage: part.voltage || '',
			mervRating: part.mervRating || '',
			compatibility: part.compatibility || '',
			replacementInterval: part.replacementInterval || '',
			notes: part.notes || '',
		});
		setEditingPartIndex(index);
	};

	const handleCancelEdit = () => {
		resetPartForm();
		setEditingPartIndex(null);
	};

	const handleDeviceBarcodeDetected = async (rawValue: string) => {
		if (!device) return;
		const parsed = parseDeviceBarcodePayload(rawValue);
		const updates: any = {};

		const scannedSerial = normalizeIdentifier(parsed.serialNumber || rawValue);
		const scannedPart = normalizeIdentifier(parsed.partNumber || rawValue);
		const matchingDevice = propertyDevices.find((candidate: any) => {
			if (!candidate || String(candidate.id) === String(device.id)) return false;
			const candidateSerial = normalizeIdentifier(candidate.serialNumber);
			const candidatePart = normalizeIdentifier(candidate.partNumber);
			return (
				(!!scannedSerial && !!candidateSerial && scannedSerial === candidateSerial) ||
				(!!scannedPart && !!candidatePart && scannedPart === candidatePart)
			);
		});

		if (parsed.type || matchingDevice?.type) updates.type = parsed.type || matchingDevice?.type;
		if (parsed.brand || matchingDevice?.brand) updates.brand = parsed.brand || matchingDevice?.brand;
		if (parsed.model || matchingDevice?.model) updates.model = parsed.model || matchingDevice?.model;
		if (parsed.serialNumber) updates.serialNumber = parsed.serialNumber;
		if (parsed.partNumber) updates.partNumber = parsed.partNumber;
		if (parsed.filterSize || matchingDevice?.filterSize) {
			updates.filterSize = parsed.filterSize || matchingDevice?.filterSize;
		}
		if (parsed.specNotes) {
			updates.specNotes = matchingDevice
				? `${parsed.specNotes} | Matched existing device: ${matchingDevice.type || 'Device'} ${matchingDevice.brand || ''} ${matchingDevice.model || ''}`.trim()
				: parsed.specNotes;
			updates.notes = parsed.specNotes;
		}

		if (Object.keys(updates).length === 0) return;
		await updateDevice({ id: device.id, updates });
	};

	const handlePartBarcodeDetected = (rawValue: string) => {
		const parsed = parsePartBarcodePayload(rawValue);
		setPartFormData((prev) => ({
			...prev,
			name: parsed.name || prev.name,
			category: parsed.category || prev.category,
			details: parsed.details || prev.details,
			partNumber: parsed.partNumber || prev.partNumber,
			size: parsed.size || prev.size,
			manufacturer: parsed.manufacturer || prev.manufacturer,
			material: parsed.material || prev.material,
			voltage: parsed.voltage || prev.voltage,
			mervRating: parsed.mervRating || prev.mervRating,
			compatibility: parsed.compatibility || prev.compatibility,
			replacementInterval: parsed.replacementInterval || prev.replacementInterval,
			notes: parsed.notes || prev.notes,
		}));
	};

	const handleSelectPhotoClick = () => {
		photoInputRef.current?.click();
	};

	const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !device || !property) return;
		if (!String(file.type || '').startsWith('image/')) return;

		try {
			setIsUploadingPhoto(true);
			const uploaded = await uploadDeviceFile(file, property.id, device.id);
			const nonImageFiles = (device.files || []).filter(
				(existing: any) => !String(existing.type || '').startsWith('image/'),
			);
			await updateDevice({
				id: device.id,
				updates: { files: [uploaded, ...nonImageFiles] },
			});
		} finally {
			setIsUploadingPhoto(false);
			if (photoInputRef.current) {
				photoInputRef.current.value = '';
			}
		}
	};

	const handleRemovePhoto = async () => {
		if (!device || !devicePhotoFile) return;
		const nextFiles = (device.files || []).filter(
			(file: any) => file.url !== devicePhotoFile.url,
		);
		await updateDevice({
			id: device.id,
			updates: { files: nextFiles },
		});
	};

	if (!slug || !deviceId) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Invalid device link</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	if (!property) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Property not found</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	if (deviceLoading) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Loading device...</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	if (!device || device.location?.propertyId !== property.id) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Device not found for this property</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	const prettyDeviceSlug = getDeviceSlugBase({
		type: device.type,
		brand: device.brand,
		model: device.model,
	});

	return (
		<DetailPageLayout
			title={device.type || 'Device'}
			subtitle={`${property.title} • ${property.slug}`}
			badge={prettyDeviceSlug}
			backPath={`/property/${property.slug}`}
			headerTheme='slate'
			contentMaxWidth='100%'
			tabs={tabs}
			activeTab={activeTab}
			onTabChange={(tab) => setActiveTab(tab)}>
			<PageStack>
				<SummaryGrid>
					<SummaryCard>
						<SummaryLabel>Open Tasks</SummaryLabel>
						<SummaryValue>{linkedTasks.length}</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Overdue</SummaryLabel>
						<SummaryValue>{overdueTasksCount}</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Parts</SummaryLabel>
						<SummaryValue>{serviceParts.length}</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>History Records</SummaryLabel>
						<SummaryValue>{relatedMaintenanceHistory.length}</SummaryValue>
					</SummaryCard>
				</SummaryGrid>

				<IntelligenceStrip>
					<IntelligencePill $tone={overdueTasksCount > 0 ? 'warning' : 'success'}>
						{overdueTasksCount > 0
							? `Filter or service tasks overdue by ${overdueTasksCount} item${overdueTasksCount === 1 ? '' : 's'}`
							: 'No overdue tasks linked to this device'}
					</IntelligencePill>
					<IntelligencePill $tone='neutral'>
						{recurringTaskCount > 0
							? `${recurringTaskCount} recurring maintenance workflow${recurringTaskCount === 1 ? '' : 's'} active`
							: 'No recurring workflow configured yet'}
					</IntelligencePill>
					<IntelligencePill $tone={upcomingDueSoonCount > 0 ? 'warning' : 'success'}>
						{upcomingDueSoonCount > 0
							? `${upcomingDueSoonCount} task${upcomingDueSoonCount === 1 ? '' : 's'} due in the next 30 days`
							: 'No tasks due in the next 30 days'}
					</IntelligencePill>
				</IntelligenceStrip>

			{activeTab === 'info' && (
				<TabContent>
					<SurfaceCard>
						<SectionContainer>
						<SectionBlock>
							<SectionEyebrow>Device Information</SectionEyebrow>
							<SectionTitleStrong>Core Profile and Warranty Context</SectionTitleStrong>
							<SectionDescription>
								Keep this profile current so linked tasks, service records, and documents stay actionable.
							</SectionDescription>
						</SectionBlock>
						<PhotoActions style={{ marginBottom: 14 }}>
							<ScanButton type='button' onClick={() => setIsDeviceScanOpen(true)}>
								Scan Device Barcode
							</ScanButton>
							<PhotoHelperText>
								Use barcode/QR scan to auto-fill device type, brand, model, and serial when available.
							</PhotoHelperText>
						</PhotoActions>

						<PhotoSection>
							<DevicePhotoCard>
								{devicePhotoFile?.url ? (
									<DevicePhotoImg src={devicePhotoFile.url} alt={`${device.type || 'Device'} photo`} />
								) : (
									<PhotoPlaceholder>No device photo selected</PhotoPlaceholder>
								)}
							</DevicePhotoCard>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
								<SectionHeader style={{ marginBottom: 4 }}>Device Photo</SectionHeader>
								<PhotoHelperText>
									Add a clear photo for quick recognition. This appears in the device profile.
								</PhotoHelperText>
								<PhotoActions>
									<PhotoActionButton
										type='button'
										onClick={handleSelectPhotoClick}
										disabled={isUploadingPhoto}>
										{isUploadingPhoto
											? 'Uploading...'
											: devicePhotoFile
											? 'Replace Photo'
											: 'Upload Photo'}
									</PhotoActionButton>
									{devicePhotoFile && (
										<RemovePhotoButton type='button' onClick={handleRemovePhoto}>
											Remove Photo
										</RemovePhotoButton>
									)}
									<input
										ref={photoInputRef}
										type='file'
										accept='image/*'
										onChange={handlePhotoUpload}
										style={{ display: 'none' }}
									/>
								</PhotoActions>
							</div>
						</PhotoSection>

						<SectionHeader>Device Information</SectionHeader>
						<InfoGrid>
							<InfoCard>
								<InfoLabel>Type</InfoLabel>
								<InfoValue>{device.type || 'N/A'}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Brand</InfoLabel>
								<InfoValue>{device.brand || 'N/A'}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Model</InfoLabel>
								<InfoValue>{device.model || 'N/A'}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Serial Number</InfoLabel>
								<InfoValue>{device.serialNumber || 'N/A'}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Status</InfoLabel>
								<InfoValue>{device.status || 'Active'}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Installed</InfoLabel>
								<InfoValue>{formatDate(device.installationDate)}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Location</InfoLabel>
								<InfoValue>{locationLabel}</InfoValue>
							</InfoCard>
						</InfoGrid>

						{device.notes && (
							<InfoCard>
								<InfoLabel>Notes</InfoLabel>
								<InfoValue>{device.notes}</InfoValue>
							</InfoCard>
						)}

						<InfoCard>
							<InfoLabel>Attached Files</InfoLabel>
							{deviceFiles.length > 0 ? (
								<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
									{deviceFiles.map((file: any) => (
										<a
											key={`${file.url}-${file.name}`}
											href={file.url}
											target='_blank'
											rel='noopener noreferrer'>
											{file.name}
										</a>
									))}
								</div>
							) : (
								<InfoValue>No files attached</InfoValue>
							)}
						</InfoCard>
						</SectionContainer>
					</SurfaceCard>
				</TabContent>
			)}

			{activeTab === 'history' && (
				<TabContent>
					<CombinedHistoryContainer>
						{linkedTasks.length > 0 && (
							<SurfaceCard>
								<SectionContainer>
								<SectionBlock>
									<SectionEyebrow>Linked Tasks</SectionEyebrow>
									<SectionTitleStrong>Open Work in Progress</SectionTitleStrong>
									<SectionDescription>
										Use this as your device-specific queue for assignments and completions.
									</SectionDescription>
								</SectionBlock>
								<SectionHeader>Open Tasks ({linkedTasks.length})</SectionHeader>
								<ReusableTable
									rowData={linkedTasks}
									showCheckbox={false}
									columns={[
										{ header: 'Task', key: 'title' },
										{ header: 'Status', key: 'status' },
										{ header: 'Priority', key: 'priority' },
										{ header: 'Due Date', key: 'dueDate' },
										{ header: 'Assignee', key: 'assignee' },
									]}
									emptyMessage='No open tasks linked to this device'
								/>
								</SectionContainer>
							</SurfaceCard>
						)}

						<SurfaceCard>
							<SectionContainer>
							<SectionBlock>
								<SectionEyebrow>Service History</SectionEyebrow>
								<SectionTitleStrong>Maintenance Lifecycle Records</SectionTitleStrong>
								<SectionDescription>
									Every completed record adds to the long-term operational memory of this system.
								</SectionDescription>
							</SectionBlock>
							<SectionHeader>Maintenance History ({relatedMaintenanceHistory.length})</SectionHeader>
							{relatedMaintenanceHistory.length > 0 ? (
								<GridContainer>
									<GridTable>
										<thead>
											<tr>
												<th>Date</th>
												<th>Description</th>
												<th>Status</th>
												<th>Cost</th>
											</tr>
										</thead>
										<tbody>
											{relatedMaintenanceHistory.map((record: any, index: number) => (
												<tr
													key={`${record.id || record.originalTaskId || 'history'}-${index}`}>
													<td>
														{formatDate(
															record.completionDate ||
																record.approvedAt ||
																record.dueDate ||
																record.date,
														)}
													</td>
													<td>
														{record.title || record.taskTitle || record.description || 'Task'}
													</td>
													<td>{record.status || 'Completed'}</td>
													<td>
														{formatCurrency(
															getFinancialDisplayTotal(record.financials),
															record.financials?.currency || 'USD',
														)}
													</td>
												</tr>
											))}
										</tbody>
									</GridTable>
								</GridContainer>
							) : (
								<EmptyState>
									<p>No maintenance history linked to this device</p>
								</EmptyState>
							)}
							</SectionContainer>
						</SurfaceCard>
					</CombinedHistoryContainer>
				</TabContent>
			)}

			{activeTab === 'parts' && (
				<TabContent>
					<SurfaceCard>
						<SectionContainer>
						<SectionBlock>
							<SectionEyebrow>Warranty and Documents</SectionEyebrow>
							<SectionTitleStrong>Parts, Filters, and Service Knowledge</SectionTitleStrong>
							<SectionDescription>
								Capture part numbers, specs, and service notes so replacements are fast in the field.
							</SectionDescription>
						</SectionBlock>
						<SectionHeader>Parts & Service</SectionHeader>
						<PhotoActions style={{ marginBottom: 10 }}>
							<ScanButton type='button' onClick={() => setIsPartScanOpen(true)}>
								Scan Part Barcode
							</ScanButton>
							<PhotoHelperText>
								Scan to prefill part number, size/spec, and notes fields.
							</PhotoHelperText>
						</PhotoActions>

						{/* Add/Edit Form */}
						<PartsForm>
							<div style={{ marginBottom: editingPartIndex !== null ? 12 : 0 }}>
								<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: '#374151' }}>
									{editingPartIndex !== null ? 'Edit Part' : 'Add New Part'}
								</div>
							</div>

							<FormRow>
								<FormField>
									<FormLabel>Part Name</FormLabel>
									<FormInput
										type='text'
										placeholder='Part Name'
										value={partFormData.name}
										onChange={(e) =>
											setPartFormData({ ...partFormData, name: e.target.value })
										}
									/>
								</FormField>
								<FormField>
									<FormLabel>Category</FormLabel>
									<FormSelect
										value={partFormData.category}
										onChange={(e) =>
											setPartFormData({ ...partFormData, category: e.target.value })
										}>
										{DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</FormSelect>
								</FormField>

								<ButtonGroup>
									{editingPartIndex !== null ? (
										<>
											<SubmitButton onClick={handleUpdatePart}>Update</SubmitButton>
											<CancelButton onClick={handleCancelEdit}>Cancel</CancelButton>
										</>
									) : (
										<SubmitButton onClick={handleAddPart}>Add Part</SubmitButton>
									)}
								</ButtonGroup>
							</FormRow>

							<DynamicFieldsGrid>
								{activePartFields.map((field) => (
									<FormField key={String(field.key)}>
										<FormLabel>{field.label}</FormLabel>
										<FormInput
											type={field.type || 'text'}
											placeholder={field.placeholder}
											value={String(partFormData[field.key] || '')}
											onChange={(e) =>
												setPartFormData({
													...partFormData,
													[field.key]: e.target.value,
												})
											}
										/>
									</FormField>
								))}
							</DynamicFieldsGrid>

							<FormField>
								<FormLabel>Additional Notes</FormLabel>
								<FormTextarea
									placeholder='Any relevant details for this part, such as installation tips or preferred vendor.'
									value={partFormData.notes || ''}
									onChange={(e) =>
										setPartFormData({ ...partFormData, notes: e.target.value })
									}
								/>
							</FormField>
						</PartsForm>

						{/* Parts Table */}
						{serviceParts.length > 0 ? (
							<PartsTable>
								<thead>
									<tr>
										<th>Part Name</th>
										<th>Category</th>
										<th>Part #</th>
										<th>Size/Spec</th>
										<th>Notes</th>
										<th style={{ width: '150px' }}>Actions</th>
									</tr>
								</thead>
								<tbody>
									{serviceParts.map((part: DeviceServiceItem, index: number) => (
										<tr key={`${part.id}-${index}`}>
											<td style={{ fontWeight: 500 }}>{part.name}</td>
											<td>
												<span
													style={{
														display: 'inline-block',
														padding: '4px 8px',
														backgroundColor: '#f0fdf4',
														color: '#166534',
														borderRadius: '4px',
														fontSize: '12px',
														fontWeight: 500,
													}}>
													{part.category}
												</span>
											</td>
											<td>{part.partNumber || '-'}</td>
											<td>{part.size || part.mervRating || part.voltage || '-'}</td>
											<td>{part.notes || '-'}</td>
											<td>
												<ActionButton onClick={() => handleEditPart(index)}>
													<FontAwesomeIcon icon={faEdit} />
													Edit
												</ActionButton>
												<ActionButton
													className='delete'
													onClick={() => handleDeletePart(index)}>
													<FontAwesomeIcon icon={faTrash} />
													Delete
												</ActionButton>
											</td>
										</tr>
									))}
								</tbody>
							</PartsTable>
						) : (
							<EmptyState>
								<p>No parts added yet. Add a part to get started.</p>
							</EmptyState>
						)}
						</SectionContainer>
					</SurfaceCard>
				</TabContent>
			)}
			</PageStack>
			<BarcodeScannerModal
				isOpen={isDeviceScanOpen}
				title='Scan Device Barcode'
				onClose={() => setIsDeviceScanOpen(false)}
				onDetected={handleDeviceBarcodeDetected}
			/>
			<BarcodeScannerModal
				isOpen={isPartScanOpen}
				title='Scan Part Barcode'
				onClose={() => setIsPartScanOpen(false)}
				onDetected={handlePartBarcodeDetected}
			/>
		</DetailPageLayout>
	);
};
