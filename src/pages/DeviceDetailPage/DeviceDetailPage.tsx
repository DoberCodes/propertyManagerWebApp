import React, { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faCircleCheck,
	faClipboardCheck,
	faClock,
	faCommentDots,
	faEdit,
	faFileInvoiceDollar,
	faFileLines,
	faRepeat,
	faScrewdriverWrench,
	faShieldHalved,
	faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../Redux/store/store';
import { useGetPropertiesQuery, useGetUnitQuery, useGetUnitsQuery } from '../../Redux/API/propertySlice';
import {
	useGetDeviceQuery,
	useGetDevicesQuery,
	useUpdateDeviceMutation,
} from '../../Redux/API/deviceSlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import {
	useAddMaintenanceHistoryMutation,
	useGetMaintenanceHistoryByPropertyQuery,
} from '../../Redux/API/maintenanceSlice';
import {
	getMaintenanceEventDate,
	getMaintenanceEventTitle,
	isContinuityEvent,
} from '../../utils/maintenanceEventUtils';
import { DetailPageLayout, TabContent, ReusableTable, GenericModal } from '../../Components/Library';
import { HeaderlessFeedSurface } from '../../Components/Library/ReusableTable/ReusableTable.styles';
import { DeviceModal } from '../../Components/Library/Modal';
import { TaskModal } from '../../Components/Library/Modal/TaskModal';
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
import {
	canLinkParts,
	canTrackWarranties,
} from '../../utils/subscriptionUtils';
import { LockedFeatureCallout } from '../../Components/Library/LockedFeatureCallout';
import { DeviceServiceItem } from '../../types/Property.types';
import {
	DEVICE_SERVICE_ITEM_CATEGORY_OPTIONS,
	DEVICE_SERVICE_ITEM_FIELDS_BY_CATEGORY,
	buildDeviceServiceItemDetails,
} from '../../constants/deviceServiceItems';
import { BarcodeScannerModal } from '../../Components/Library/BarcodeScanner/BarcodeScannerModal';

type PartFormState = Omit<DeviceServiceItem, 'id'>;

type DeviceEditFormState = {
	type: string;
	brand: string;
	model: string;
	serialNumber?: string;
	serviceItems?: DeviceServiceItem[];
	installationDate: string;
	decommissionDate?: string;
	status: 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned';
	location: {
		propertyId: string;
		unitId?: string;
		suiteId?: string;
	};
	files?: Array<{
		name: string;
		url: string;
		size: number;
		type: string;
	}>;
};


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

const QuickActionPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
	padding: 14px;
`;

const ViewActionsButton = styled.button`
	border: 1px solid #0f766e;
	background: #ffffff;
	color: #0f766e;
	border-radius: 999px;
	padding: 8px 12px;
	font-size: 12px;
	font-weight: 800;
	cursor: pointer;
	transition: background-color 0.15s ease, border-color 0.15s ease;

	&:hover {
		background: #ecfeff;
		border-color: #115e59;
	}

	@media (max-width: 480px) {
		padding: 8px 10px;
		font-size: 11px;
	}
`;

const QuickActionHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;

	div {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	h3 {
		margin: 0;
		font-size: 1.02rem;
		font-weight: 800;
		color: #0f172a;
	}

	p {
		margin: 0;
		font-size: 0.86rem;
		color: #64748b;
	}
`;

const QuickActionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 10px;

	@media (max-width: 1200px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const QuickActionButton = styled.button`
	border: 1px solid #dbe3ea;
	background: #ffffff;
	border-radius: 10px;
	padding: 12px 14px;
	text-align: left;
	cursor: pointer;
	transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;

	strong {
		display: block;
		font-size: 0.92rem;
		font-weight: 800;
		color: #0f172a;
		margin-bottom: 4px;
	}

	span {
		display: block;
		font-size: 0.78rem;
		line-height: 1.35;
		color: #64748b;
	}

	&:hover {
		border-color: #16a34a;
		background: #f0fdf4;
		transform: translateY(-1px);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.65;
		border-color: #e2e8f0;
		background: #f8fafc;
		transform: none;
	}
`;

const QuickActionHint = styled.div`
	font-size: 0.8rem;
	color: #64748b;
`;

const TimelineList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const TimelineItem = styled.div`
	display: grid;
	grid-template-columns: 110px 1fr;
	gap: 12px;
	padding: 12px 14px;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	background: #ffffff;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const TimelineDate = styled.div`
	font-size: 0.8rem;
	font-weight: 800;
	color: #16a34a;
`;

const TimelineDateSub = styled.div`
	margin-top: 2px;
	font-size: 0.72rem;
	font-weight: 600;
	color: #94a3b8;
`;

const TimelineContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const TimelineTitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

const TimelineIconBadge = styled.span<{ $color: string; $background: string }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 8px;
	color: ${(props) => props.$color};
	background: ${(props) => props.$background};
	font-size: 0.75rem;
	flex-shrink: 0;
`;

const TimelineTitle = styled.div`
	font-size: 0.95rem;
	font-weight: 800;
	color: #0f172a;
	margin-bottom: 4px;
`;

const TimelineEventBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 3px 8px;
	border-radius: 999px;
	font-size: 0.7rem;
	font-weight: 800;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: #334155;
	background: #e2e8f0;
`;

const TimelineDescription = styled.div`
	font-size: 0.88rem;
	color: #475569;
	line-height: 1.45;
`;

const TimelineMeta = styled.div`
	margin-top: 6px;
	font-size: 0.76rem;
	color: #64748b;
`;

const TimelineExpandButton = styled.button`
	margin-top: 8px;
	align-self: flex-start;
	border: 1px solid #cbd5e1;
	background: #f8fafc;
	color: #334155;
	border-radius: 999px;
	padding: 4px 10px;
	font-size: 0.75rem;
	font-weight: 700;
	cursor: pointer;

	&:hover {
		background: #f1f5f9;
		border-color: #94a3b8;
	}
`;

const TimelineDetailsPanel = styled.div`
	margin-top: 10px;
	padding: 10px;
	border-radius: 10px;
	border: 1px solid #e2e8f0;
	background: #f8fafc;
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`;

const TimelineDetailBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const TimelineDetailLabel = styled.div`
	font-size: 0.7rem;
	font-weight: 800;
	letter-spacing: 0.05em;
	text-transform: uppercase;
	color: #64748b;
`;

const TimelineDetailValue = styled.div`
	font-size: 0.82rem;
	line-height: 1.45;
	color: #334155;
`;

const TimelineAttachmentList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const TimelineAttachmentLink = styled.a`
	font-size: 0.82rem;
	line-height: 1.4;
	color: #1d4ed8;
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
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

const UpcomingCareCard = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 14px 18px;
	margin-top: 12px;
`;

const UpcomingCareHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 10px;
`;

const UpcomingCareTitle = styled.h4`
	margin: 0;
	font-size: 0.95rem;
	font-weight: 700;
	color: #0f172a;
`;

const UpcomingCareLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	font-size: 0.85rem;
	font-weight: 600;
	color: #2563eb;
	&:hover { text-decoration: underline; }
`;

const UpcomingCareRows = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

const UpcomingCareRow = styled.div<{ $tone?: 'error' | 'success' | 'info' | 'neutral' }>`
	font-size: 0.88rem;
	padding: 6px 10px;
	border-radius: 6px;
	color: ${(props) =>
		props.$tone === 'error'
			? '#991b1b'
			: props.$tone === 'success'
				? '#166534'
				: props.$tone === 'info'
					? '#1e40af'
					: '#475569'};
	background: ${(props) =>
		props.$tone === 'error'
			? '#fee2e2'
			: props.$tone === 'success'
				? '#dcfce7'
				: props.$tone === 'info'
					? '#dbeafe'
					: '#f8fafc'};
`;



const formatDate = (value?: string) => {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString();
};

const formatRelativeTime = (value?: string): string => {
	if (!value) return 'recently';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'recently';

	const diffMs = Date.now() - date.getTime();
	const diffDays = Math.round(Math.abs(diffMs) / 86400000);

	if (diffDays === 0) return diffMs >= 0 ? 'today' : 'later today';
	if (diffDays === 1) return diffMs >= 0 ? 'yesterday' : 'tomorrow';
	if (diffDays < 7) return diffMs >= 0 ? `${diffDays} days ago` : `in ${diffDays} days`;
	if (diffDays < 30) {
		const weeks = Math.round(diffDays / 7);
		return diffMs >= 0 ? `${weeks} weeks ago` : `in ${weeks} weeks`;
	}
	const months = Math.round(diffDays / 30);
	return diffMs >= 0 ? `${months} months ago` : `in ${months} months`;
};

const getTimelineEntryKey = (entry: any, index: number): string => {
	if (entry?.id) return String(entry.id);
	if (entry?.raw?.id) return String(entry.raw.id);
	if (entry?.raw?.originalTaskId) return `task-${entry.raw.originalTaskId}`;
	return `${entry?.sourceType || 'timeline'}-${entry?.date || 'no-date'}-${entry?.title || 'event'}-${index}`;
};

const getTimelineAttachments = (entry: any): Array<{ name: string; url?: string }> => {
	const raw = entry?.raw || {};
	const files: Array<{ name: string; url?: string }> = [];

	if (raw.completionFile?.name) {
		files.push({
			name: raw.completionFile.name,
			url: raw.completionFile.url,
		});
	}

	if (Array.isArray(raw.files)) {
		raw.files.forEach((file: any) => {
			if (!file?.name) return;
			files.push({ name: file.name, url: file.url });
		});
	}

	if (entry?.sourceType === 'device-log') {
		const title = String(entry?.title || '').toLowerCase();
		if (title.includes('document') || title.includes('invoice') || title.includes('warranty')) {
			const detail = String(entry?.description || '').trim();
			if (detail) files.push({ name: detail });
		}
	}

	const deduped = new Map<string, { name: string; url?: string }>();
	files.forEach((file) => {
		const key = `${file.name}::${file.url || ''}`;
		if (!deduped.has(key)) deduped.set(key, file);
	});
	return Array.from(deduped.values());
};

const getTimelineContractorLabel = (entry: any): string => {
	const raw = entry?.raw || {};
	if (raw.assignedTo?.name) return String(raw.assignedTo.name);
	if (raw.assignee) return String(raw.assignee);
	if (raw.completedByName) return String(raw.completedByName);
	if (raw.completedBy) return String(raw.completedBy);
	return 'Not recorded';
};

const getTimelinePartsUsed = (entry: any): string => {
	const raw = entry?.raw || {};
	const parts: string[] = [];

	if (Array.isArray(raw.partsUsed)) {
		raw.partsUsed.forEach((part: any) => {
			if (typeof part === 'string' && part.trim()) parts.push(part.trim());
			if (part && typeof part === 'object' && part.name) parts.push(String(part.name));
		});
	}

	if (Array.isArray(raw.serviceItems)) {
		raw.serviceItems.forEach((item: any) => {
			if (item?.name) parts.push(String(item.name));
		});
	}

	if (parts.length === 0) return 'Not documented';
	return Array.from(new Set(parts)).join(', ');
};

const getTimelineNotes = (entry: any): string => {
	const raw = entry?.raw || {};
	if (raw.completionNotes) return String(raw.completionNotes);
	if (raw.notes) return String(raw.notes);
	if (raw.financials?.notes) return String(raw.financials.notes);
	return 'No additional notes recorded';
};

const getTimelineTitle = (description?: string) => {
	const raw = String(description || '').trim();
	if (!raw) return 'Maintenance event';
	if (raw.toLowerCase().startsWith('document uploaded:')) return 'Document uploaded';
	if (raw.toLowerCase().startsWith('service note added:')) return 'Service note added';
	if (raw.toLowerCase().startsWith('repair logged:')) return 'Repair logged';
	if (raw.toLowerCase().startsWith('warranty uploaded:')) return 'Warranty uploaded';
	if (raw.toLowerCase().startsWith('invoice uploaded:')) return 'Invoice uploaded';
	if (raw.toLowerCase().startsWith('recurring maintenance created:')) return 'Recurring maintenance created';
	if (raw.toLowerCase().startsWith('inspection completed:')) return 'Inspection completed';
	if (raw.toLowerCase().startsWith('task completed:')) return 'Task completed';
	return raw.split(':')[0] || 'Maintenance event';
};

const getTimelineDescription = (description?: string) => {
	const raw = String(description || '').trim();
	if (!raw) return 'Recorded in maintenance history';
	const colonIndex = raw.indexOf(':');
	if (colonIndex === -1) return raw;
	return raw.slice(colonIndex + 1).trim() || raw;
};

type TimelineEventCategory =
	| 'repair'
	| 'invoice'
	| 'inspection'
	| 'recurring'
	| 'completed'
	| 'warranty'
	| 'document'
	| 'note'
	| 'default';

const getTimelineEventCategory = (entry: { title?: string; description?: string; type?: string }): TimelineEventCategory => {
	const text = `${String(entry.title || '')} ${String(entry.description || '')} ${String(entry.type || '')}`.toLowerCase();
	if (text.includes('repair')) return 'repair';
	if (text.includes('invoice')) return 'invoice';
	if (text.includes('inspection')) return 'inspection';
	if (text.includes('recurring')) return 'recurring';
	if (text.includes('warranty')) return 'warranty';
	if (text.includes('document') || text.includes('upload') || text.includes('file')) return 'document';
	if (text.includes('note')) return 'note';
	if (text.includes('complete') || text.includes('approved') || text.includes('done')) return 'completed';
	return 'default';
};

const getTimelineEventIcon = (category: TimelineEventCategory) => {
	switch (category) {
		case 'repair':
			return { icon: faScrewdriverWrench, color: '#92400e', background: '#fef3c7' };
		case 'invoice':
			return { icon: faFileInvoiceDollar, color: '#1d4ed8', background: '#dbeafe' };
		case 'inspection':
			return { icon: faClipboardCheck, color: '#0f766e', background: '#ccfbf1' };
		case 'recurring':
			return { icon: faRepeat, color: '#7c3aed', background: '#ede9fe' };
		case 'completed':
			return { icon: faCircleCheck, color: '#166534', background: '#dcfce7' };
		case 'warranty':
			return { icon: faShieldHalved, color: '#1e3a8a', background: '#dbeafe' };
		case 'document':
			return { icon: faFileLines, color: '#334155', background: '#e2e8f0' };
		case 'note':
			return { icon: faCommentDots, color: '#0f766e', background: '#ccfbf1' };
		default:
			return { icon: faClock, color: '#475569', background: '#e2e8f0' };
	}
};

const getTimelineEventLabel = (entry: { type?: string; title?: string; description?: string }) => {
	const eventType = String(entry.type || '').toLowerCase();
	const text = `${String(entry.title || '')} ${String(entry.description || '')} ${String(entry.type || '')}`.toLowerCase();

	if (eventType === 'task_completed') return 'Task Completed';
	if (eventType === 'task_approved') return 'Task Approved';
	if (eventType === 'repair_logged' || text.includes('repair')) return 'Repair Logged';
	if (eventType === 'inspection_completed' || text.includes('inspection')) return 'Inspection';
	if (eventType === 'invoice_uploaded' || text.includes('invoice')) return 'Invoice';
	if (eventType === 'document_uploaded' || text.includes('document')) return 'Document';
	if (eventType === 'service_note_added' || text.includes('note')) return 'Service Note';
	if (eventType === 'maintenance_recorded' || text.includes('recorded')) return 'Recorded';
	if (eventType === 'completed' || text.includes('complete') || text.includes('done')) return 'Completed';
	return 'Event';
};

export const DeviceDetailPage: React.FC = () => {
	const { slug, deviceSlug } = useParams<{ slug: string; deviceSlug: string }>();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const canAccessParts = !!currentUser?.subscription && canLinkParts(currentUser.subscription);
	const canAccessWarranty =
		!!currentUser?.subscription && canTrackWarranties(currentUser.subscription);
	const photoInputRef = useRef<HTMLInputElement | null>(null);
	const documentInputRef = useRef<HTMLInputElement | null>(null);
	const [showDeviceEditModal, setShowDeviceEditModal] = useState(false);
	const [editingDevice, setEditingDevice] = useState<any>(null);
	const [deviceFormData, setDeviceFormData] = useState<DeviceEditFormState>({
		type: '',
		brand: '',
		model: '',
		serialNumber: '',
		serviceItems: [],
		installationDate: '',
		decommissionDate: '',
		status: 'Active',
		location: {
			propertyId: '',
		},
		files: [],
	});
	const [pendingDeviceFiles, setPendingDeviceFiles] = useState<File[]>([]);
	const [removedExistingFileUrls, setRemovedExistingFileUrls] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<string>('info');
	const [areQuickActionsOpen, setAreQuickActionsOpen] = useState(false);
	const [showTaskModal, setShowTaskModal] = useState(false);
	const [showRecurringTaskModal, setShowRecurringTaskModal] = useState(false);
	const [showQuickLogModal, setShowQuickLogModal] = useState(false);
	const [quickLogMode, setQuickLogMode] = useState<
		'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor'
	>('note');
	const [quickLogDate, setQuickLogDate] = useState(new Date().toISOString().split('T')[0]);
	const [quickLogDescription, setQuickLogDescription] = useState('');
	const [isSavingQuickLog, setIsSavingQuickLog] = useState(false);
	const [editingPartIndex, setEditingPartIndex] = useState<number | null>(null);
	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [isDeviceScanOpen, setIsDeviceScanOpen] = useState(false);
	const [isPartScanOpen, setIsPartScanOpen] = useState(false);
	const [expandedTimelineEntries, setExpandedTimelineEntries] = useState<Record<string, boolean>>({});
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
	const [addMaintenanceHistory] = useAddMaintenanceHistoryMutation();

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
	const { data: unitById } = useGetUnitQuery(device?.location?.unitId || '', {
		skip: !device?.location?.unitId,
	});

	const { data: allTasks = [] } = useGetTasksQuery();
	const { data: propertyDevices = [] } = useGetDevicesQuery(property?.id || '', {
		skip: !property?.id,
	});
	const { data: propertyMaintenanceHistory = [] } =
		useGetMaintenanceHistoryByPropertyQuery(property?.id || '', {
			skip: !property?.id,
			refetchOnMountOrArgChange: true,
		});

	const normalizeIdentifier = (value?: string) =>
		String(value || '')
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');

	const locationLabel = useMemo(() => {
		if (!device || !property) return 'N/A';

		if (device.location?.unitId) {
			const unit = units.find(
				(item: any) => String(item.id || '') === String(device.location?.unitId || ''),
			);
			const unitName =
				unit?.name ||
				(unit as any)?.unitName ||
				(unitById as any)?.name ||
				(unitById as any)?.unitName;
			return unitName || 'Property level';
		}

		if (device.location?.suiteId) {
			const suite = (Array.isArray(property.suites) ? property.suites : []).find(
				(item: any) => item.id === device.location.suiteId,
			);
			return suite?.name || 'Property level';
		}

		return 'Property level';
	}, [device, property, unitById, units]);

	const deviceTaskTemplate = useMemo(() => {
		if (!device || !property) return null;
		const deviceName = [device.type, device.brand, device.model]
			.filter(Boolean)
			.join(' ')
			.trim() || 'Appliance';
		return {
			title: `${deviceName} maintenance`,
			dueDate: new Date().toISOString().split('T')[0],
			status: 'Initiated',
			propertyId: property.id,
			unitId: String(device.location?.unitId || ''),
			location: '',
			devices: [String(device.id)],
			priority: 'Medium',
			isRecurring: false,
			notes: `${deviceName} maintenance task created from the appliance page.`,
		};
	}, [device, property]);

	const recurringTaskTemplate = useMemo(() => {
		if (!deviceTaskTemplate) return null;
		return {
			...deviceTaskTemplate,
			title: `${deviceTaskTemplate.title} - recurring`,
			isRecurring: true,
			recurrenceFrequency: 'monthly',
		};
	}, [deviceTaskTemplate]);

	const taskUnitOptions = useMemo(() => {
	       console.log('[DeviceDetailPage] units:', units);
	       const options = units.map((unit: any) => ({
		       label: unit.unitName || unit.name || unit.title || 'Unit',
		       value: String(unit.id || ''),
	       }));
	       console.log('[DeviceDetailPage] taskUnitOptions:', options);
	       return options;
	}, [units]);

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
				if (!isContinuityEvent(record)) return false;
				if (String(record.deviceId || '') === deviceIdString) return true;
				if (Array.isArray(record.deviceIds)) {
					return record.deviceIds
						.map((id: any) => String(id))
						.includes(deviceIdString);
				}
				if (Array.isArray(record.devices)) {
					return record.devices
						.map((id: any) => String(id))
						.includes(deviceIdString);
				}
				return false;
			})
			.sort((a: any, b: any) => {
				const aDate = new Date(getMaintenanceEventDate(a) || 0).getTime() || 0;
				const bDate = new Date(getMaintenanceEventDate(b) || 0).getTime() || 0;
				return bDate - aDate;
			});
	}, [device, propertyMaintenanceHistory]);

	const deviceTimelineEntries = useMemo(() => {
		const deviceMaintenanceEntries = Array.isArray(device?.maintenanceHistory)
			? device.maintenanceHistory.map((entry: any, index: number) => ({
				id: `device-log-${entry.date || 'no-date'}-${index}`,
				sourceType: 'device-log',
				date: entry.date,
				title: getTimelineTitle(entry.description),
				description: getTimelineDescription(entry.description),
				type: 'Appliance Log',
				raw: entry,
			}))
			: [];

		const propertyEntries = relatedMaintenanceHistory.map((record: any, index: number) => ({
			id: record.id || record.originalTaskId || `maintenance-record-${index}`,
			sourceType: 'maintenance-record',
			date: getMaintenanceEventDate(record),
			title: getMaintenanceEventTitle(record) || getTimelineTitle(record.description) || 'Maintenance event',
			description:
				record.completionNotes ||
				record.notes ||
				getTimelineDescription(record.description) ||
				record.description ||
				'Maintenance record',
			type: record.eventType || record.status || 'Completed',
			raw: record,
		}));

		return [...deviceMaintenanceEntries, ...propertyEntries].sort((a, b) => {
			const aDate = new Date(a.date || 0).getTime() || 0;
			const bDate = new Date(b.date || 0).getTime() || 0;
			return bDate - aDate;
		});
	}, [device?.maintenanceHistory, relatedMaintenanceHistory]);

	const applianceMaintenanceFeedRecords = useMemo(() => {
		const records: any[] = [];
		const seenKeys = new Set<string>();

		const getRecordKey = (record: any) => {
			const rawDate = getMaintenanceEventDate(record) || record?.date || '';
			const dateKey = String(rawDate).split('T')[0];
			const textKey = String(
				record?.title ||
					record?.taskTitle ||
					record?.description ||
					record?.completionNotes ||
					'',
			)
				.trim()
				.toLowerCase();
			return `${dateKey}|${textKey}`;
		};

		relatedMaintenanceHistory.forEach((record: any) => {
			const key = getRecordKey(record);
			if (seenKeys.has(key)) return;
			seenKeys.add(key);
			records.push(record);
		});

		if (Array.isArray(device?.maintenanceHistory)) {
			device.maintenanceHistory.forEach((entry: any, index: number) => {
				const record = {
					id: `appliance-log-${entry.date || 'no-date'}-${index}`,
					date: entry.date,
					completionDate: entry.date,
					title: getTimelineTitle(entry.description),
					description: getTimelineDescription(entry.description),
					status: 'Logged',
					sourceType: 'appliance-log',
				};
				const key = getRecordKey(record);
				if (seenKeys.has(key)) return;
				seenKeys.add(key);
				records.push(record);
			});
		}

		return records.sort((a, b) => {
			const aDate = new Date(getMaintenanceEventDate(a) || a?.date || 0).getTime() || 0;
			const bDate = new Date(getMaintenanceEventDate(b) || b?.date || 0).getTime() || 0;
			return bDate - aDate;
		});
	}, [device?.maintenanceHistory, relatedMaintenanceHistory]);

	const deviceFiles = useMemo(() => device?.files || [], [device?.files]);
	const devicePhotoFile = useMemo(
		() => deviceFiles.find((file: any) => String(file.type || '').startsWith('image/')),
		[deviceFiles],
	);
	const serviceParts = device?.serviceItems || [];
	const resolvedDeviceStatus = device?.decommissionDate
		? 'Decommissioned'
		: device?.status || 'Active';
	const hasApplianceDetails = useMemo(() => {
		const serviceItems = Array.isArray(device?.serviceItems) ? device.serviceItems : [];
		const files = Array.isArray(device?.files) ? device.files : [];
		return Boolean(
			String(device?.brand || '').trim() ||
				String(device?.model || '').trim() ||
				String(device?.serialNumber || '').trim() ||
				String(device?.partNumber || '').trim() ||
				String(device?.filterSize || '').trim() ||
				String(device?.specNotes || '').trim() ||
				String(device?.installationDate || '').trim() ||
				String(device?.decommissionDate || '').trim() ||
				serviceItems.length > 0 ||
				files.length > 0,
		);
	}, [device]);
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

	// Compute earliest upcoming task for the compact care summary
	const nextScheduledMaintenance = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const upcoming = linkedTasks
			.filter((task: any) => {
				const dueDate = task?.dueDate ? new Date(task.dueDate) : null;
				if (!dueDate || Number.isNaN(dueDate.getTime())) return false;
				dueDate.setHours(0, 0, 0, 0);
				return dueDate >= today;
			})
			.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
		if (!upcoming[0]?.dueDate) return null;
		return new Date(upcoming[0].dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}, [linkedTasks]);

	const documentCount = useMemo(
		() => deviceFiles.filter((file: any) => !String(file.type || '').startsWith('image/')).length,
		[deviceFiles],
	);

	const repairCount = useMemo(
		() =>
			deviceTimelineEntries.filter((entry) =>
				/repair|fixed|replace|replaced|serviced|service/i.test(
					`${entry.title} ${entry.description}`,
				),
			).length,
		[deviceTimelineEntries],
	);

	const lastServicedEntry = useMemo(() => deviceTimelineEntries[0] || null, [deviceTimelineEntries]);

	const maintenanceEventCount = deviceTimelineEntries.length;

	const toggleTimelineDetails = (entryKey: string) => {
		setExpandedTimelineEntries((prev) => ({
			...prev,
			[entryKey]: !prev[entryKey],
		}));
	};

	const openCreateTaskModal = () => {
		if (!deviceTaskTemplate) return;
		setShowRecurringTaskModal(false);
		setShowTaskModal(true);
	};

	const openRecurringTaskModal = () => {
		if (!recurringTaskTemplate) return;
		setShowTaskModal(false);
		setShowRecurringTaskModal(true);
	};

	const openQuickLogModal = (
		mode: 'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
	) => {
		if (mode === 'warranty' && !canAccessWarranty) {
			return;
		}
		setQuickLogMode(mode);
		setQuickLogDescription('');
		setQuickLogDate(new Date().toISOString().split('T')[0]);
		setShowQuickLogModal(true);
	};

	const handleSaveQuickLog = async () => {
		if (!device || !property || !quickLogDescription.trim()) return;
		if (quickLogMode === 'warranty' && !canAccessWarranty) return;
		setIsSavingQuickLog(true);
		try {
			const prefixMap: Record<
				'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
				string
			> = {
				'repair': 'Repair logged:',
				'note': 'Service note added:',
				'invoice': 'Invoice uploaded:',
				'inspection': 'Inspection completed:',
				'warranty': 'Warranty added:',
				'contractor': 'Contractor visit logged:',
			};
			const eventMap: Record<
				'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
				| 'maintenance_recorded'
				| 'service_note_added'
				| 'repair_logged'
				| 'invoice_uploaded'
				| 'inspection_completed'
				| 'warranty_added'
				| 'contractor_visit_logged'
			> = {
				'repair': 'repair_logged',
				'note': 'service_note_added',
				'invoice': 'invoice_uploaded',
				'inspection': 'inspection_completed',
				'warranty': 'warranty_added',
				'contractor': 'contractor_visit_logged',
			};
			const sourceMap: Record<
				'note' | 'repair' | 'invoice' | 'inspection' | 'warranty' | 'contractor',
				'device_log' | 'manual_entry' | 'contractor_entry'
			> = {
				'repair': 'device_log',
				'note': 'device_log',
				'invoice': 'device_log',
				'inspection': 'device_log',
				'warranty': 'manual_entry',
				'contractor': 'contractor_entry',
			};
			const descriptionPrefix = prefixMap[quickLogMode];
			const descriptionText = quickLogDescription.trim();

			await addMaintenanceHistory({
				propertyId: property.id,
				propertyTitle: property.title,
				title: `${descriptionPrefix} ${descriptionText}`,
				description: descriptionText,
				completionDate: new Date(quickLogDate).toISOString(),
				unitId: device.location?.unitId,
				deviceIds: [device.id],
				eventType: eventMap[quickLogMode],
				eventSource: sourceMap[quickLogMode],
				tags: ['device', quickLogMode],
			}).unwrap();

			const nextEntries = [
				{
					date: quickLogDate,
					description: `${descriptionPrefix} ${descriptionText}`,
				},
				...(Array.isArray(device.maintenanceHistory) ? device.maintenanceHistory : []),
			];
			await updateDevice({
				id: device.id,
				updates: { maintenanceHistory: nextEntries },
			}).unwrap();
			setShowQuickLogModal(false);
		} finally {
			setIsSavingQuickLog(false);
		}
	};

	const handleRecurringTaskSaved = async () => {
		if (!device) {
			setShowRecurringTaskModal(false);
			return;
		}
		try {
			const deviceName = [device.type, device.brand, device.model]
				.filter(Boolean)
				.join(' ')
				.trim() || 'Appliance';
			const nextEntries = [
				{
					date: new Date().toISOString(),
					description: `Recurring maintenance created: ${deviceName}`,
				},
				...(Array.isArray(device.maintenanceHistory) ? device.maintenanceHistory : []),
			];
			await updateDevice({
				id: device.id,
				updates: { maintenanceHistory: nextEntries },
			}).unwrap();
		} finally {
			setShowRecurringTaskModal(false);
		}
	};

	const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file || !device || !property) return;
		try {
			const uploaded = await uploadDeviceFile(file, property.id, device.id);
			const isWarrantyDocument = /warranty|guarantee/i.test(file.name) && canAccessWarranty;

			await addMaintenanceHistory({
				propertyId: property.id,
				propertyTitle: property.title,
				title: isWarrantyDocument
					? `Warranty added: ${file.name}`
					: `Document uploaded: ${file.name}`,
				description: file.name,
				completionDate: new Date().toISOString(),
				unitId: device.location?.unitId,
				deviceIds: [device.id],
				eventType: isWarrantyDocument
					? 'warranty_added'
					: 'document_uploaded',
				eventSource: 'document_upload',
				completionFileData: uploaded,
				tags: isWarrantyDocument
					? ['device', 'document', 'warranty']
					: ['device', 'document'],
			}).unwrap();

			const nextEntries = [
				{
					date: new Date().toISOString(),
					description: `Document uploaded: ${file.name}`,
				},
				...(Array.isArray(device.maintenanceHistory) ? device.maintenanceHistory : []),
			];
			await updateDevice({
				id: device.id,
				updates: {
					files: [uploaded, ...(device.files || [])],
					maintenanceHistory: nextEntries,
				},
			}).unwrap();
		} finally {
			if (documentInputRef.current) {
				documentInputRef.current.value = '';
			}
		}
	};

	const resetDeviceEditState = () => {
		setEditingDevice(null);
		setPendingDeviceFiles([]);
		setRemovedExistingFileUrls([]);
		setDeviceFormData({
			type: device?.type || '',
			brand: device?.brand || '',
			model: device?.model || '',
			serialNumber: device?.serialNumber || '',
			serviceItems: device?.serviceItems || [],
			installationDate: device?.installationDate || '',
			decommissionDate: device?.decommissionDate || '',
			status: device?.decommissionDate ? 'Decommissioned' : device?.status || 'Active',
			location: device?.location || { propertyId: property?.id || '' },
			files: device?.files || [],
		});
	};

	const handleOpenEditDeviceModal = () => {
		if (!device || !property) return;
		setEditingDevice(device);
		setDeviceFormData({
			type: device.type || '',
			brand: device.brand || '',
			model: device.model || '',
			serialNumber: device.serialNumber || '',
			serviceItems: device.serviceItems || [],
			installationDate: device.installationDate || '',
			decommissionDate: device.decommissionDate || '',
			status: device.decommissionDate ? 'Decommissioned' : device.status || 'Active',
			location: device.location || { propertyId: property.id },
			files: device.files || [],
		});
		setPendingDeviceFiles([]);
		setRemovedExistingFileUrls([]);
		setShowDeviceEditModal(true);
	};

	const handleCloseEditDeviceModal = () => {
		setShowDeviceEditModal(false);
		resetDeviceEditState();
	};

	const handleDeviceFormChange = (
		event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = event.target;

		if (name.startsWith('location.')) {
			const locationField = name.split('.')[1];
			setDeviceFormData((prev) => ({
				...prev,
				location: {
					...prev.location,
					[locationField]: value,
				},
			}));
			return;
		}

		setDeviceFormData((prev) => {
			if (name === 'decommissionDate') {
				return {
					...prev,
					decommissionDate: value,
					status: value ? 'Decommissioned' : prev.status === 'Decommissioned' ? 'Active' : prev.status,
				};
			}

			if (name === 'status' && value !== 'Decommissioned') {
				return {
					...prev,
					status: value as DeviceEditFormState['status'],
					decommissionDate: '',
				};
			}

			return {
				...prev,
				[name]: value,
			};
		});
	};

	const handleSaveDeviceEdit = async () => {
		if (!device || !property || !editingDevice) return;

		try {
			const persistedFiles = (deviceFormData.files || []).filter(
				(file) => !removedExistingFileUrls.includes(file.url),
			);
			let uploadedFiles = persistedFiles;

			if (pendingDeviceFiles.length > 0) {
				const uploaded = await Promise.all(
					pendingDeviceFiles.map((file) => uploadDeviceFile(file, property.id, editingDevice.id)),
				);
				uploadedFiles = [...persistedFiles, ...uploaded];
			}

			await updateDevice({
				id: editingDevice.id,
				updates: {
					...deviceFormData,
					type: deviceFormData.type.trim(),
					brand: deviceFormData.brand.trim(),
					model: deviceFormData.model.trim(),
					serialNumber: deviceFormData.serialNumber?.trim() || '',
					status: deviceFormData.decommissionDate
						? 'Decommissioned'
						: deviceFormData.status,
					files: uploadedFiles,
				},
			}).unwrap();

			setShowDeviceEditModal(false);
			resetDeviceEditState();
		} catch (error) {
			console.error('Failed to save appliance edits:', error);
		}
	};

	const tabs: TabConfig[] = [
		{ id: 'info' as any, label: 'Details' },
		{ id: 'tasks' as any, label: 'Tasks', count: linkedTasks.length },
		{
			id: 'history' as any,
			label: 'History',
			count: deviceTimelineEntries.length + relatedMaintenanceHistory.length,
		},
		{ id: 'parts' as any, label: 'Parts', count: serviceParts.length },
	];

	const handleAddPart = async () => {
		if (!canAccessParts) return;
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
		if (!canAccessParts) return;
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
		if (!canAccessParts) return;
		if (!device) return;

		const updatedParts = serviceParts.filter((_: any, i: number) => i !== index);
		await updateDevice({
			id: device.id,
			updates: { serviceItems: updatedParts },
		});
	};

	const handleEditPart = (index: number) => {
		if (!canAccessParts) return;
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
				? `${parsed.specNotes} | Matched existing appliance: ${matchingDevice.type || 'Appliance'} ${matchingDevice.brand || ''} ${matchingDevice.model || ''}`.trim()
				: parsed.specNotes;
			updates.notes = parsed.specNotes;
		}

		if (Object.keys(updates).length === 0) return;
		await updateDevice({ id: device.id, updates });
	};

	const handlePartBarcodeDetected = (rawValue: string) => {
		if (!canAccessParts) return;
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
					<p>Invalid appliance link</p>
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
					<p>Loading appliance...</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	if (!device || device.location?.propertyId !== property.id) {
		return (
			<SectionContainer>
				<EmptyState>
					<p>Appliance not found for this property</p>
				</EmptyState>
			</SectionContainer>
		);
	}

	const prettyDeviceSlug = getDeviceSlugBase({
		type: device.type,
		brand: device.brand,
		model: device.model,
	});

	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	return (
		<DetailPageLayout
			title={device.type || 'Appliance'}
			subtitle={`${property.title} • ${property.slug}`}
			badge={prettyDeviceSlug}
			backPath={`/property/${property.slug}`}
			headerTheme='slate'
			contentMaxWidth='100%'
			tabs={tabs}
			activeTab={activeTab}
			onTabChange={handleTabChange}>
			<PageStack>
				<SummaryGrid>
					<SummaryCard>
						<SummaryLabel>Maintenance Events Recorded</SummaryLabel>
						<SummaryValue>{maintenanceEventCount}</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Last Maintenance Event</SummaryLabel>
						<SummaryValue style={{ fontSize: 18, lineHeight: 1.3 }}>
							{lastServicedEntry ? formatDate(lastServicedEntry.date) : 'Not yet'}
						</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Repairs Documented</SummaryLabel>
						<SummaryValue>{repairCount}</SummaryValue>
					</SummaryCard>
					<SummaryCard>
						<SummaryLabel>Documents Stored</SummaryLabel>
						<SummaryValue>{documentCount}</SummaryValue>
					</SummaryCard>
				</SummaryGrid>

				<QuickActionPanel id='appliance-quick-actions'>
					<QuickActionHeader>
						<div>
							<h3>Quick Actions</h3>
							<p>Keep this appliance moving with the next maintenance step.</p>
						</div>
						<ViewActionsButton
							type='button'
							aria-expanded={areQuickActionsOpen}
							aria-controls='appliance-quick-action-list'
							onClick={() => setAreQuickActionsOpen((isOpen) => !isOpen)}>
							{areQuickActionsOpen ? 'Hide Actions' : 'View Actions'}
						</ViewActionsButton>
					</QuickActionHeader>
					{areQuickActionsOpen && (
						<>
							<QuickActionGrid id='appliance-quick-action-list'>
								<QuickActionButton type='button' onClick={handleOpenEditDeviceModal}>
									<strong>Edit Appliance</strong>
									<span>Change the appliance profile, status, or location.</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={openCreateTaskModal}>
									<strong>Create Task</strong>
									<span>Turn this appliance into a tracked maintenance job.</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={openRecurringTaskModal}>
									<strong>Add Recurring Maintenance</strong>
									<span>Set ongoing care for filters, service, and inspections.</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={() => documentInputRef.current?.click()}>
									<strong>Upload Invoice / Document</strong>
									<span>Store proof of service, receipts, or manuals here.</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={() => openQuickLogModal('note')}>
									<strong>Add Service Note</strong>
									<span>Capture context that should travel with the system.</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={() => openQuickLogModal('repair')}>
									<strong>Log Repair</strong>
									<span>Write a repair entry directly into the maintenance trail.</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={() => openQuickLogModal('invoice')}>
									<strong>Log Invoice</strong>
									<span>Record invoice details in the maintenance history.</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={() => openQuickLogModal('inspection')}>
									<strong>Log Inspection</strong>
									<span>Document findings and recommendations from inspections.</span>
								</QuickActionButton>
								<QuickActionButton
									type='button'
									onClick={() => openQuickLogModal('warranty')}
									disabled={!canAccessWarranty}
									title={
										canAccessWarranty
											? undefined
											: 'Warranty tracking requires the Property plan or higher'
									}>
									<strong>Log Warranty</strong>
									<span>
										{canAccessWarranty
											? 'Capture coverage terms and warranty lifecycle notes.'
											: 'Upgrade to Property or Portfolio to track warranties.'}
									</span>
								</QuickActionButton>
								<QuickActionButton type='button' onClick={() => openQuickLogModal('contractor')}>
									<strong>Log Contractor Visit</strong>
									<span>Document who visited, what they found, and next steps.</span>
								</QuickActionButton>
							</QuickActionGrid>
							<QuickActionHint>
								These actions all feed the same service history so the appliance becomes more useful over time.
							</QuickActionHint>
						</>
					)}
				</QuickActionPanel>
				<input
					ref={documentInputRef}
					type='file'
					accept='image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt'
					onChange={handleDocumentUpload}
					style={{ display: 'none' }}
				/>

			{activeTab === 'info' && (
				<TabContent>
					<SurfaceCard>
						<SectionContainer>
						<SectionBlock>
							<SectionEyebrow>Appliance Information</SectionEyebrow>
							<SectionTitleStrong>Core Profile and Warranty Context</SectionTitleStrong>
							<SectionDescription>
								Keep this profile current so linked tasks, service records, and documents stay actionable.
							</SectionDescription>
						</SectionBlock>
						<PhotoActions style={{ marginBottom: 14 }}>
							<ScanButton type='button' onClick={() => setIsDeviceScanOpen(true)}>
								Scan Appliance Barcode
							</ScanButton>
							<PhotoHelperText>
								Use barcode/QR scan to auto-fill appliance type, brand, model, and serial when available.
							</PhotoHelperText>
						</PhotoActions>

						<PhotoSection>
							<DevicePhotoCard>
								{devicePhotoFile?.url ? (
									<DevicePhotoImg src={devicePhotoFile.url} alt={`${device.type || 'Appliance'} photo`} />
								) : (
									<PhotoPlaceholder>No appliance photo selected</PhotoPlaceholder>
								)}
							</DevicePhotoCard>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
								<SectionHeader style={{ marginBottom: 4 }}>Appliance Photo</SectionHeader>
								<PhotoHelperText>
									Add a clear photo for quick recognition. This appears in the appliance profile.
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

						<SectionHeader>Appliance Information</SectionHeader>
						{!hasApplianceDetails && (
							<InfoCard style={{ borderColor: '#fde68a', background: '#fefce8' }}>
								<InfoLabel>Profile Details</InfoLabel>
								<InfoValue style={{ color: '#854d0e' }}>
									No details added yet. This appliance can still be linked to tasks now and filled in later.
								</InfoValue>
							</InfoCard>
						)}
						<InfoGrid>
							<InfoCard>
								<InfoLabel>Name</InfoLabel>
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
								<InfoValue>{resolvedDeviceStatus}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Installed</InfoLabel>
								<InfoValue>{formatDate(device.installationDate)}</InfoValue>
							</InfoCard>
							<InfoCard>
								<InfoLabel>Decommissioned</InfoLabel>
								<InfoValue>{formatDate(device.decommissionDate)}</InfoValue>
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

			{activeTab === 'tasks' && (
				<TabContent>
					<IntelligenceStrip>
						<IntelligencePill $tone={overdueTasksCount > 0 ? 'warning' : 'success'}>
							{overdueTasksCount > 0
								? `${overdueTasksCount} overdue maintenance item${overdueTasksCount === 1 ? '' : 's'} need attention`
								: 'No overdue maintenance linked to this appliance'}
						</IntelligencePill>
						<IntelligencePill $tone='neutral'>
							{recurringTaskCount > 0
								? `${recurringTaskCount} recurring care task${recurringTaskCount === 1 ? '' : 's'} active`
								: 'No recurring care configured yet'}
						</IntelligencePill>
						<IntelligencePill $tone={upcomingDueSoonCount > 0 ? 'warning' : 'success'}>
							{upcomingDueSoonCount > 0
								? `${upcomingDueSoonCount} upcoming service ${upcomingDueSoonCount === 1 ? '' : 's'} in the next 30 days`
								: 'No upcoming service in the next 30 days'}
						</IntelligencePill>
					</IntelligenceStrip>

					<UpcomingCareCard>
						<UpcomingCareHeader>
							<UpcomingCareTitle>Upcoming Care</UpcomingCareTitle>
							<UpcomingCareLink onClick={() => setActiveTab('history')}>View Timeline →</UpcomingCareLink>
						</UpcomingCareHeader>
						<UpcomingCareRows>
							<UpcomingCareRow $tone={overdueTasksCount > 0 ? 'error' : 'success'}>
								{overdueTasksCount > 0
									? `${overdueTasksCount} overdue maintenance item${overdueTasksCount === 1 ? '' : 's'}`
									: 'No overdue items'}
							</UpcomingCareRow>
							<UpcomingCareRow $tone={recurringTaskCount > 0 ? 'info' : 'neutral'}>
								{recurringTaskCount > 0
									? `${recurringTaskCount} recurring task${recurringTaskCount === 1 ? '' : 's'} active`
									: 'No recurring tasks configured'}
							</UpcomingCareRow>
							<UpcomingCareRow $tone='neutral'>
								{nextScheduledMaintenance
									? `Next scheduled maintenance: ${nextScheduledMaintenance}`
									: 'No additional maintenance due in next 30 days'}
							</UpcomingCareRow>
						</UpcomingCareRows>
					</UpcomingCareCard>

					<SurfaceCard>
						<SectionContainer>
							<SectionBlock>
								<SectionEyebrow>Linked Tasks</SectionEyebrow>
								<SectionTitleStrong>Execution Queue</SectionTitleStrong>
								<SectionDescription>
									Use this as your appliance-specific queue for assignments and completions.
								</SectionDescription>
							</SectionBlock>
							<SectionHeader>Open Tasks ({linkedTasks.length})</SectionHeader>
							<HeaderlessFeedSurface>
								<ReusableTable
									rowData={linkedTasks}
									showCheckbox={false}
									columns={[
									{
										header: 'Task Summary',
										key: 'title',
										render: (value: string, row: any) => (
											<div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 300 }}>
												<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
													<span
														style={{
															display: 'inline-flex',
															alignItems: 'center',
															justifyContent: 'center',
															width: 24,
															height: 24,
															borderRadius: 8,
															background: '#ecfeff',
															color: '#0f766e',
														}}>
														<FontAwesomeIcon icon={faScrewdriverWrench} />
													</span>
													<strong>{value}</strong>
												</div>
												<div style={{ fontSize: 12, color: '#64748b' }}>
													Maintenance Lead: {row.assignee || 'Unassigned'}
												</div>
											</div>
										),
									},
									{
										header: 'Status',
										key: 'status',
										render: (value: string) => (
											<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
												<FontAwesomeIcon
													icon={value === 'Overdue' ? faClock : faCircleCheck}
													color={value === 'Overdue' ? '#b91c1c' : '#166534'}
												/>
												<span style={{ fontWeight: 700 }}>{value || 'Pending'}</span>
											</div>
										),
									},
									{
										header: 'Maintenance Activity',
										key: 'dueDate',
										render: (value: string, row: any) => (
											<div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
												<div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
													{row.status === 'Overdue'
														? 'Maintenance is overdue'
														: 'Maintenance task active'}
												</div>
												<div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 6, alignItems: 'center' }}>
													<FontAwesomeIcon icon={faClock} />
													Due: {value || 'No due date set'}
												</div>
												<div style={{ fontSize: 12, color: '#64748b' }}>
													Priority: {row.priority || 'Low'}
												</div>
											</div>
										),
									},
									]}
									hideHeader={true}
									emptyTitle='No open tasks linked yet'
									emptyMessage='No open tasks linked to this appliance. New maintenance tasks will appear here.'
									emptyActionLabel='Add Task'
									onEmptyAction={openCreateTaskModal}
								/>
							</HeaderlessFeedSurface>
						</SectionContainer>
					</SurfaceCard>
				</TabContent>
			)}

			{activeTab === 'history' && (
				<TabContent>
					<CombinedHistoryContainer>
						<SurfaceCard>
							<SectionContainer>
								<SectionBlock>
									<SectionEyebrow>Timeline</SectionEyebrow>
									<SectionTitleStrong>Maintenance Timeline</SectionTitleStrong>
									<SectionDescription>
										A simple chronological record of what has happened to this system.
									</SectionDescription>
								</SectionBlock>
								{deviceTimelineEntries.length > 0 ? (
									<TimelineList>
										{deviceTimelineEntries.map((entry: any, index: number) => (
											<TimelineItem key={getTimelineEntryKey(entry, index)}>
												<div>
													<TimelineDate>{formatRelativeTime(entry.date)}</TimelineDate>
													<TimelineDateSub>{formatDate(entry.date)}</TimelineDateSub>
												</div>
													<TimelineContent>
														<TimelineTitleRow>
															{(() => {
																const iconData = getTimelineEventIcon(
																	getTimelineEventCategory(entry),
																);
																return (
																	<TimelineIconBadge
																		$color={iconData.color}
																		$background={iconData.background}>
																		<FontAwesomeIcon icon={iconData.icon} />
																	</TimelineIconBadge>
																);
															})()}
															<TimelineTitle>{entry.title}</TimelineTitle>
															<TimelineEventBadge>{getTimelineEventLabel(entry)}</TimelineEventBadge>
														</TimelineTitleRow>
													<TimelineDescription>{entry.description}</TimelineDescription>
													<TimelineMeta>{entry.type}</TimelineMeta>
													<TimelineExpandButton
														type='button'
														onClick={() => toggleTimelineDetails(getTimelineEntryKey(entry, index))}>
														{expandedTimelineEntries[getTimelineEntryKey(entry, index)]
															? 'Hide details'
															: 'View details'}
													</TimelineExpandButton>
													{expandedTimelineEntries[getTimelineEntryKey(entry, index)] ? (
														<TimelineDetailsPanel>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Notes</TimelineDetailLabel>
																<TimelineDetailValue>{getTimelineNotes(entry)}</TimelineDetailValue>
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Contractor Info</TimelineDetailLabel>
																<TimelineDetailValue>{getTimelineContractorLabel(entry)}</TimelineDetailValue>
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Attachments, Photos, Invoices</TimelineDetailLabel>
																{getTimelineAttachments(entry).length > 0 ? (
																	<TimelineAttachmentList>
																		{getTimelineAttachments(entry).map((file, fileIndex) =>
																			file.url ? (
																				<TimelineAttachmentLink
																					key={`${file.name}-${file.url || 'no-url'}-${fileIndex}`}
																					href={file.url}
																					target='_blank'
																					rel='noreferrer'>
																					{file.name}
																				</TimelineAttachmentLink>
																			) : (
																				<TimelineDetailValue key={`${file.name}-label-${fileIndex}`}>
																					{file.name}
																				</TimelineDetailValue>
																			),
																		)}
																	</TimelineAttachmentList>
																) : (
																	<TimelineDetailValue>No files attached</TimelineDetailValue>
																)}
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Parts Used</TimelineDetailLabel>
																<TimelineDetailValue>{getTimelinePartsUsed(entry)}</TimelineDetailValue>
															</TimelineDetailBlock>
															<TimelineDetailBlock>
																<TimelineDetailLabel>Invoice / Cost</TimelineDetailLabel>
																<TimelineDetailValue>
																	{entry.raw?.financials
																		? `${formatCurrency(
																				getFinancialDisplayTotal(entry.raw.financials),
																				entry.raw.financials.currency || 'USD',
																		  )}${entry.raw.financials.notes ? ` • ${entry.raw.financials.notes}` : ''}`
																		: 'No financials recorded'}
																</TimelineDetailValue>
															</TimelineDetailBlock>
														</TimelineDetailsPanel>
													) : null}
													</TimelineContent>
											</TimelineItem>
										))}
									</TimelineList>
								) : (
									<EmptyState>
										<p>
											No timeline entries yet. Tasks and quick service notes create the record for this appliance.
										</p>
										<ButtonGroup>
											<SubmitButton type='button' onClick={openCreateTaskModal}>
												Add Task
											</SubmitButton>
											<ScanButton type='button' onClick={() => openQuickLogModal('note')}>
												Add Service Note
											</ScanButton>
										</ButtonGroup>
									</EmptyState>
								)}
							</SectionContainer>
						</SurfaceCard>

						<SurfaceCard>
							<SectionContainer>
							<SectionBlock>
								<SectionEyebrow>Service History</SectionEyebrow>
								<SectionTitleStrong>Maintenance Lifecycle Records</SectionTitleStrong>
								<SectionDescription>
									Every completed record adds to the long-term operational memory of this system.
								</SectionDescription>
							</SectionBlock>
							<SectionHeader>Maintenance History ({applianceMaintenanceFeedRecords.length})</SectionHeader>
							{applianceMaintenanceFeedRecords.length > 0 ? (
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
											{applianceMaintenanceFeedRecords.map((record: any, index: number) => (
												<tr
													key={`${record.id || record.originalTaskId || 'history'}-${index}`}>
													<td>
														{formatDate(
															getMaintenanceEventDate(record) ||
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
									<p>
										No maintenance history linked to this appliance yet. Completed tasks will appear here as the service record grows.
									</p>
									<SubmitButton type='button' onClick={openCreateTaskModal}>
										Add Task
									</SubmitButton>
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
						{!canAccessParts && (
							<LockedFeatureCallout
								title='Parts & Service is locked on your current plan'
								description='Track part inventory, filter specs, and service component history by upgrading to the Property plan or higher.'
								upgradeLabel='Upgrade for Parts'
								compact
							/>
						)}
						<SectionBlock>
							<SectionEyebrow>Warranty and Documents</SectionEyebrow>
							<SectionTitleStrong>Parts, Filters, and Service Knowledge</SectionTitleStrong>
							<SectionDescription>
								Capture part numbers, specs, and service notes so replacements are fast in the field.
							</SectionDescription>
						</SectionBlock>
						<SectionHeader>Parts & Service</SectionHeader>
						<PhotoActions style={{ marginBottom: 10 }}>
							<ScanButton
								type='button'
								onClick={() => setIsPartScanOpen(true)}
								disabled={!canAccessParts}>
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
										disabled={!canAccessParts}
										onChange={(e) =>
											setPartFormData({ ...partFormData, name: e.target.value })
										}
									/>
								</FormField>
								<FormField>
									<FormLabel>Category</FormLabel>
									<FormSelect
										value={partFormData.category}
										disabled={!canAccessParts}
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
											<SubmitButton onClick={handleUpdatePart} disabled={!canAccessParts}>Update</SubmitButton>
											<CancelButton onClick={handleCancelEdit} disabled={!canAccessParts}>Cancel</CancelButton>
										</>
									) : (
										<SubmitButton onClick={handleAddPart} disabled={!canAccessParts}>Add Part</SubmitButton>
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
											disabled={!canAccessParts}
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
									disabled={!canAccessParts}
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
												<ActionButton onClick={() => handleEditPart(index)} disabled={!canAccessParts}>
													<FontAwesomeIcon icon={faEdit} />
													Edit
												</ActionButton>
												<ActionButton
													className='delete'
													disabled={!canAccessParts}
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

			<TaskModal
				isOpen={showTaskModal}
				isEditing={false}
				editingTaskId={null}
				initialTask={deviceTaskTemplate || undefined}
				propertyId={property?.id || null}
				onClose={() => setShowTaskModal(false)}
				onSaved={() => setShowTaskModal(false)}
				currentUser={currentUser || null}
				unitId={device?.location?.unitId || null}
				unitOptions={taskUnitOptions}
			/>

			<TaskModal
				isOpen={showRecurringTaskModal}
				isEditing={false}
				editingTaskId={null}
				initialTask={recurringTaskTemplate || undefined}
				propertyId={property?.id || null}
				onClose={() => setShowRecurringTaskModal(false)}
				onSaved={handleRecurringTaskSaved}
				currentUser={currentUser || null}
				unitId={device?.location?.unitId || null}
				unitOptions={taskUnitOptions}
			/>

			<GenericModal
				isOpen={showQuickLogModal}
				title={
					quickLogMode === 'repair'
						? 'Log Repair'
						: quickLogMode === 'invoice'
							? 'Log Invoice'
							: quickLogMode === 'inspection'
								? 'Log Inspection'
								: quickLogMode === 'warranty'
									? 'Log Warranty'
									: quickLogMode === 'contractor'
										? 'Log Contractor Visit'
										: 'Add Service Note'
				}
				onClose={() => setShowQuickLogModal(false)}
				onSubmit={handleSaveQuickLog}
				showActions={true}
				primaryButtonLabel={isSavingQuickLog ? 'Saving...' : 'Save Entry'}
				secondaryButtonLabel='Cancel'>
				<PartsForm>
					<FormRow style={{ gridTemplateColumns: '1fr 1fr' }}>
						<FormField>
							<FormLabel>Date</FormLabel>
							<FormInput
								type='date'
								value={quickLogDate}
								onChange={(e) => setQuickLogDate(e.target.value)}
							/>
						</FormField>
						<FormField>
							<FormLabel>Type</FormLabel>
							<FormSelect
								value={quickLogMode}
								onChange={(e) =>
									setQuickLogMode(
										e.target.value as
											| 'note'
											| 'repair'
											| 'invoice'
											| 'inspection'
											| 'warranty'
												| 'contractor'
										)
								}>
								<option value='note'>Service Note</option>
								<option value='repair'>Repair</option>
								<option value='invoice'>Invoice</option>
								<option value='inspection'>Inspection</option>
								<option value='warranty' disabled={!canAccessWarranty}>
									Warranty{canAccessWarranty ? '' : ' (Property+)'}
								</option>
								<option value='contractor'>Contractor Visit</option>
							</FormSelect>
						</FormField>
					</FormRow>
					<FormField>
						<FormLabel>Description</FormLabel>
						<FormTextarea
							placeholder={
								quickLogMode === 'repair'
									? 'Describe the repair, parts used, and any follow-up.'
									: quickLogMode === 'invoice'
										? 'Invoice number, amount, and service details.'
										: quickLogMode === 'inspection'
											? 'Inspection findings, recommendations, and any issues noted.'
											: quickLogMode === 'warranty'
												? 'Warranty provider, coverage details, and expiration notes.'
												: quickLogMode === 'contractor'
													? 'Contractor name, scope of visit, and recommended follow-up.'
													: 'Add a note that should stay with the maintenance record.'
							}
							value={quickLogDescription}
							onChange={(e) => setQuickLogDescription(e.target.value)}
						/>
					</FormField>
				</PartsForm>
			</GenericModal>

			{device && property && (
				<DeviceModal
					isOpen={showDeviceEditModal}
					onClose={handleCloseEditDeviceModal}
					onSubmit={handleSaveDeviceEdit}
					property={property}
					isEditing={true}
					units={units}
					pendingFiles={pendingDeviceFiles}
					onPendingFilesChange={setPendingDeviceFiles}
					removedExistingFileUrls={removedExistingFileUrls}
					onRemoveExistingFile={(url) =>
						setRemovedExistingFileUrls((prev) =>
							prev.includes(url) ? prev : [...prev, url],
						)
					}
					onRestoreExistingFile={(url) =>
						setRemovedExistingFileUrls((prev) => prev.filter((item) => item !== url))
					}
					onRemovePendingFile={(fileKey) =>
						setPendingDeviceFiles((prev) =>
							prev.filter((file) => `${file.name}-${file.size}` !== fileKey),
						)
					}
					deviceFormData={deviceFormData}
					onFormChange={handleDeviceFormChange}
				/>
			)}
			</PageStack>
			<BarcodeScannerModal
				isOpen={isDeviceScanOpen}
				title='Scan Appliance Barcode'
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
