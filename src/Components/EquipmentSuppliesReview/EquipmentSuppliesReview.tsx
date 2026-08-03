import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { BarcodeScannerModal } from '../Library/BarcodeScanner/BarcodeScannerModal';
import { MultiSelect } from '../Library';
import {
	FormGrid,
	FormGroup,
	FormInput,
	FormLabel,
	FormSelect,
	FormTextarea,
} from '../Library/Modal/ModalStyles';
import type { PropertySupply, PropertySupplyDraft } from '../../types/Supply.types';
import {
	buildPropertySupplyDraftFromBarcode,
	findPropertySupplyByBarcode,
	getPropertySupplyTypeLabel,
	PROPERTY_SUPPLY_TYPE_OPTIONS,
} from '../../utils/propertySupplies';
import { COLORS } from '../../constants/colors';

export type PendingEquipmentSupplyDraft = PropertySupplyDraft & {
	clientId: string;
};

interface EquipmentSuppliesReviewProps {
	supplies: PropertySupply[];
	selectedSupplyIds: string[];
	onSelectedSupplyIdsChange: (supplyIds: string[]) => void;
	pendingSupplies: PendingEquipmentSupplyDraft[];
	onPendingSuppliesChange: (supplies: PendingEquipmentSupplyDraft[]) => void;
}

const Panel = styled.section`
	display: flex;
	flex-direction: column;
	gap: 1rem;
`;

const ReviewBanner = styled.div`
	padding: 0.9rem 1rem;
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 10px;
	background: #f0fdf9;
	color: ${COLORS.textSecondary};
	line-height: 1.5;

	strong {
		display: block;
		color: ${COLORS.textPrimary};
	}
`;

const PendingList = styled.div`
	display: grid;
	gap: 0.6rem;
`;

const PendingRow = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	align-items: center;
	padding: 0.75rem;
	border: 1px solid ${COLORS.gray200};
	border-radius: 8px;
	background: white;

	button {
		border: 0;
		background: transparent;
		color: ${COLORS.errorDark};
		font-weight: 700;
		cursor: pointer;
	}
`;

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.65rem;

	button {
		border: 1px solid ${COLORS.primary};
		border-radius: 7px;
		padding: 0.55rem 0.8rem;
		background: white;
		color: ${COLORS.primary};
		font-weight: 700;
		cursor: pointer;
	}
`;

const EMPTY_DRAFT: PropertySupplyDraft = {
	name: '',
	type: 'filter',
	manufacturer: '',
	modelOrSku: '',
	barcodeValue: '',
	partNumber: '',
	size: '',
	notes: '',
};

export const EquipmentSuppliesReview: React.FC<
	EquipmentSuppliesReviewProps
> = ({
	supplies,
	selectedSupplyIds,
	onSelectedSupplyIdsChange,
	pendingSupplies,
	onPendingSuppliesChange,
}) => {
	const [draft, setDraft] = useState<PropertySupplyDraft>(EMPTY_DRAFT);
	const [isAdding, setIsAdding] = useState(false);
	const [isScanOpen, setIsScanOpen] = useState(false);
	const [message, setMessage] = useState('');
	const activeSupplies = useMemo(
		() => supplies.filter((supply) => !supply.isArchived),
		[supplies],
	);

	const addPendingSupply = () => {
		if (!draft.name.trim()) {
			setMessage('Add a Supply name before including it in the review.');
			return;
		}
		const normalizedBarcode = draft.barcodeValue?.trim().toLowerCase();
		if (
			normalizedBarcode &&
			pendingSupplies.some(
				(supply) =>
					supply.barcodeValue?.trim().toLowerCase() === normalizedBarcode,
			)
		) {
			setMessage('This scanned Supply is already included in the review.');
			return;
		}
		onPendingSuppliesChange([
			...pendingSupplies,
			{
				...draft,
				name: draft.name.trim(),
				clientId: `pending-supply-${Date.now()}-${Math.random()
					.toString(36)
					.slice(2, 8)}`,
			},
		]);
		setDraft(EMPTY_DRAFT);
		setMessage('');
		setIsAdding(false);
	};

	const handleBarcodeDetected = (rawValue: string) => {
		setIsScanOpen(false);
		const existing = findPropertySupplyByBarcode(supplies, rawValue);
		if (existing) {
			onSelectedSupplyIdsChange(
				Array.from(new Set([...selectedSupplyIds, existing.id])),
			);
			setMessage(
				`${existing.name} already exists for this property and will be connected instead of duplicated.`,
			);
			return;
		}
		const normalizedBarcode = rawValue.trim().toLowerCase();
		const pending = pendingSupplies.find(
			(supply) =>
				supply.barcodeValue?.trim().toLowerCase() === normalizedBarcode,
		);
		if (pending) {
			setMessage(`${pending.name} is already included in this Equipment review.`);
			return;
		}
		setDraft(buildPropertySupplyDraftFromBarcode(rawValue));
		setMessage('Review the scanned value before adding this new Supply.');
		setIsAdding(true);
	};

	return (
		<Panel>
			<ReviewBanner>
				<strong>Review Equipment Supplies</strong>
				On save, Maintley will connect {selectedSupplyIds.length} existing Supply
				{selectedSupplyIds.length === 1 ? '' : ' records'} and create{' '}
				{pendingSupplies.length} new property Supply
				{pendingSupplies.length === 1 ? '' : ' records'}. Supplies remain owned by
				the property and can be reused by other Equipment, Spaces, and Tasks.
			</ReviewBanner>

			<FormGroup>
				<FormLabel>Connect existing property Supplies</FormLabel>
				<MultiSelect
					value={selectedSupplyIds}
					onChange={onSelectedSupplyIdsChange}
					options={activeSupplies.map((supply) => ({
						value: supply.id,
						label: `${supply.name} · ${getPropertySupplyTypeLabel(supply.type)}`,
					}))}
					placeholder='Choose Supplies already saved for this property'
				/>
			</FormGroup>

			{pendingSupplies.length > 0 && (
				<PendingList aria-label='New Supplies included in this Equipment review'>
					{pendingSupplies.map((supply) => (
						<PendingRow key={supply.clientId}>
							<span>
								<strong>{supply.name}</strong>
								<br />
								{getPropertySupplyTypeLabel(supply.type)} · New property Supply
							</span>
							<button
								type='button'
								onClick={() =>
									onPendingSuppliesChange(
										pendingSupplies.filter(
											(item) => item.clientId !== supply.clientId,
										),
									)
								}>
								Remove
							</button>
						</PendingRow>
					))}
				</PendingList>
			)}

			<ActionRow>
				<button type='button' onClick={() => setIsAdding((current) => !current)}>
					{isAdding ? 'Cancel New Supply' : 'Create New Supply'}
				</button>
				<button type='button' onClick={() => setIsScanOpen(true)}>
					Scan Supply Barcode
				</button>
			</ActionRow>

			{message && <div role='status'>{message}</div>}

			{isAdding && (
				<ReviewBanner>
					<FormGrid>
						<FormGroup>
							<FormLabel htmlFor='equipment-supply-name'>Supply name *</FormLabel>
							<FormInput
								id='equipment-supply-name'
								value={draft.name}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										name: event.target.value,
									}))
								}
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='equipment-supply-type'>Type</FormLabel>
							<FormSelect
								id='equipment-supply-type'
								value={draft.type}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										type: event.target.value as PropertySupplyDraft['type'],
									}))
								}>
								{PROPERTY_SUPPLY_TYPE_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</FormSelect>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='equipment-supply-manufacturer'>Manufacturer</FormLabel>
							<FormInput
								id='equipment-supply-manufacturer'
								value={draft.manufacturer || ''}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										manufacturer: event.target.value,
									}))
								}
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='equipment-supply-model'>Model or SKU</FormLabel>
							<FormInput
								id='equipment-supply-model'
								value={draft.modelOrSku || ''}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										modelOrSku: event.target.value,
									}))
								}
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='equipment-supply-part-number'>Part number</FormLabel>
							<FormInput
								id='equipment-supply-part-number'
								value={draft.partNumber || ''}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										partNumber: event.target.value,
									}))
								}
							/>
						</FormGroup>
						<FormGroup>
							<FormLabel htmlFor='equipment-supply-size'>Size</FormLabel>
							<FormInput
								id='equipment-supply-size'
								value={draft.size || ''}
								onChange={(event) =>
									setDraft((current) => ({
										...current,
										size: event.target.value,
									}))
								}
							/>
						</FormGroup>
					</FormGrid>
					<FormGroup>
					<FormLabel htmlFor='equipment-supply-notes'>Notes</FormLabel>
					<FormTextarea
						id='equipment-supply-notes'
							value={draft.notes || ''}
							onChange={(event) =>
								setDraft((current) => ({
									...current,
									notes: event.target.value,
								}))
							}
						/>
					</FormGroup>
					<ActionRow>
						<button type='button' onClick={addPendingSupply}>
							Add to Equipment Review
						</button>
					</ActionRow>
				</ReviewBanner>
			)}

			<BarcodeScannerModal
				isOpen={isScanOpen}
				title='Supply Barcode Scanner'
				defaultMethod='barcode'
				captureIntent='part'
				onClose={() => setIsScanOpen(false)}
				onDetected={handleBarcodeDetected}
			/>
		</Panel>
	);
};
