import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
	useAddTenantMutation,
	useCreateTenantInvitationCodeMutation,
	useRevokeTenantInvitationCodeMutation,
	useUpdateTenantMutation,
} from '../../Redux/API/tenantSlice';
import { GenericModal, FormGroup, FormLabel, FormInput } from '../Library';
import { COLORS } from '../../constants/colors';

interface AddTenantModalProps {
	open: boolean;
	onClose: () => void;
	propertyId: string;
	mode?: 'create' | 'edit';
	tenant?: any;
	/** Pre-fill and lock the unit field (e.g. when opened from a unit detail page) */
	defaultUnit?: string;
}

export const AddTenantModal: React.FC<AddTenantModalProps> = ({
	open,
	onClose,
	propertyId,
	mode = 'create',
	tenant,
	defaultUnit,
}) => {
	const resolveMutationErrorMessage = (
		error: any,
		fallback: string,
	): string => {
		if (typeof error === 'string' && error.trim()) {
			return error;
		}

		const dataMessage =
			typeof error?.data === 'string'
				? error.data
				: typeof error?.data?.message === 'string'
					? error.data.message
					: '';
		if (dataMessage.trim()) {
			return dataMessage;
		}

		const directMessage =
			typeof error?.message === 'string' ? error.message : '';
		if (directMessage.trim()) {
			return directMessage;
		}

		return fallback;
	};

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		unit: defaultUnit || '',
		leaseStart: '',
		leaseEnd: '',
	});

	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [isRegenerating, setIsRegenerating] = useState(false);
	const [generatedInviteCode, setGeneratedInviteCode] = useState('');
	const [codeCopied, setCodeCopied] = useState(false);
	const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const [addTenant, { isLoading }] = useAddTenantMutation();
	const [updateTenant, { isLoading: isUpdating }] = useUpdateTenantMutation();
	const [createTenantInvitationCode] = useCreateTenantInvitationCodeMutation();
	const [revokeTenantInvitationCode, { isLoading: isRevoking }] =
		useRevokeTenantInvitationCodeMutation();

	// Units are temporarily hidden from the app flow.

	useEffect(() => {
		if (mode === 'edit' && tenant) {
			setFormData({
				firstName: tenant.firstName || '',
				lastName: tenant.lastName || '',
				email: tenant.email || '',
				phone: tenant.phone || '',
				unit: tenant.unit || '',
				leaseStart: tenant.leaseStart || '',
				leaseEnd: tenant.leaseEnd || '',
			});
		} else if (mode === 'create') {
			setFormData({
				firstName: '',
				lastName: '',
				email: '',
				phone: '',
				unit: '',
				leaseStart: '',
				leaseEnd: '',
			});
		}
		setGeneratedInviteCode('');
		setCodeCopied(false);
	}, [mode, tenant, open]);

	const buildPromoCode = () => {
		const partA = Math.random().toString(36).slice(2, 6).toUpperCase();
		const partB = Math.random().toString(36).slice(2, 6).toUpperCase();
		return `TENANT-${partA}-${partB}`;
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setSuccess('');

		// Validation
		if (!formData.firstName.trim() || !formData.lastName.trim()) {
			setError('First and last name are required');
			return;
		}

		if (!formData.email.trim() || !formData.email.includes('@')) {
			setError('Valid email is required');
			return;
		}

		try {
			if (mode === 'edit' && tenant?.id) {
				await updateTenant({
					propertyId,
					tenantId: tenant.id,
					updates: {
						firstName: formData.firstName,
						lastName: formData.lastName,
						email: formData.email.toLowerCase(),
						phone: formData.phone,
						unit: formData.unit,
						leaseStart: formData.leaseStart,
						leaseEnd: formData.leaseEnd,
					},
				}).unwrap();
				setSuccess('Tenant updated successfully!');
				setTimeout(() => {
					onClose();
				}, 800);
				return;
			}

			const normalizedEmail = formData.email.toLowerCase();
			const promoCodeResult = await createTenantInvitationCode({
				propertyId,
				tenantEmail: normalizedEmail,
				code: buildPromoCode(),
			}).unwrap();
			const promoCodeId = promoCodeResult.id;

			await addTenant({
				propertyId,
				firstName: formData.firstName,
				lastName: formData.lastName,
				email: normalizedEmail,
				phone: formData.phone,
				unit: formData.unit,
				leaseStart: formData.leaseStart,
				leaseEnd: formData.leaseEnd,
				tenantInvitationCodeId: promoCodeId,
			}).unwrap();

			setGeneratedInviteCode(promoCodeResult.code);
			setSuccess('Tenant added! Share the invitation code below with your tenant.');
			setFormData({
				firstName: '',
				lastName: '',
				email: '',
				phone: '',
				unit: defaultUnit || '',
				leaseStart: '',
				leaseEnd: '',
			});
			// Don't auto-close so user can copy the invitation code
		} catch (err: any) {
			setError(
				resolveMutationErrorMessage(
					err,
					mode === 'edit' ? 'Failed to update tenant' : 'Failed to add tenant',
				),
			);
		}
	};

	const handleRevokePromo = async () => {
		if (!formData.email) {
			setError('Tenant email is required to revoke promo code');
			return;
		}
		setError('');
		setSuccess('');
		try {
			await revokeTenantInvitationCode({
				propertyId,
				tenantEmail: formData.email.toLowerCase(),
			}).unwrap();
			setSuccess('Invitation code revoked.');
		} catch (err: any) {
			setError(resolveMutationErrorMessage(err, 'Failed to revoke promo code'));
		}
	};

	const handleRegeneratePromo = async () => {
		if (!formData.email) {
			setError('Tenant email is required to regenerate promo code');
			return;
		}
		const confirmRegenerate = window.confirm(
			`This will revoke any existing promo codes for ${formData.email} and create a new one. Continue?`,
		);
		if (!confirmRegenerate) return;

		setError('');
		setSuccess('');
		setIsRegenerating(true);
		try {
			// First revoke any existing active invitation codes
			await revokeTenantInvitationCode({
				propertyId,
				tenantEmail: formData.email.toLowerCase(),
			}).unwrap();

			// Create a new invitation code
			const promoCodeResult = await createTenantInvitationCode({
				propertyId,
				tenantEmail: formData.email.toLowerCase(),
				code: buildPromoCode(),
			}).unwrap();

			// Update the tenant record with the new promo code ID if we have tenant data
			if (mode === 'edit' && tenant?.id) {
				await updateTenant({
					propertyId,
					tenantId: tenant.id,
					updates: { tenantInvitationCodeId: promoCodeResult.id },
				}).unwrap();
			}

			setGeneratedInviteCode(promoCodeResult.code);
			setSuccess('New invitation code generated. Share it with your tenant.');
		} catch (err: any) {
			setError(resolveMutationErrorMessage(err, 'Failed to regenerate promo code'));
		} finally {
			setIsRegenerating(false);
		}
	};

	const handleCopyCode = () => {
		if (!generatedInviteCode) return;
		navigator.clipboard.writeText(generatedInviteCode).catch(() => {
			// Fallback for environments without clipboard API
			const el = document.createElement('textarea');
			el.value = generatedInviteCode;
			document.body.appendChild(el);
			el.select();
			document.execCommand('copy');
			document.body.removeChild(el);
		});
		setCodeCopied(true);
		if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
		copyTimeoutRef.current = setTimeout(() => setCodeCopied(false), 2000);
	};

	return (
		<GenericModal
			isOpen={open}
			title={mode === 'edit' ? 'Edit Tenant' : 'Add Tenant'}
			onClose={onClose}
			showActions={true}
			onSubmit={handleSubmit}
			primaryButtonLabel={
				mode === 'edit'
					? isUpdating
						? 'Saving...'
						: 'Save Changes'
					: isLoading
					? 'Adding...'
					: 'Add Tenant'
			}
			secondaryButtonLabel='Cancel'
			primaryButtonDisabled={isLoading || isUpdating}
			isLoading={isLoading || isUpdating}>
			{error && <Alert type='error'>{error}</Alert>}
			{success && <Alert type='success'>{success}</Alert>}
			{generatedInviteCode && (
				<InviteCodeBox>
					<InviteCodeLabel>Tenant Invitation Code</InviteCodeLabel>
					<InviteCodeRow>
						<InviteCodeValue>{generatedInviteCode}</InviteCodeValue>
						<CopyButton type='button' onClick={handleCopyCode}>
							{codeCopied ? '✓ Copied' : 'Copy'}
						</CopyButton>
					</InviteCodeRow>
					<InviteCodeHint>
						Give this code to your tenant. They enter it when
						registering to link to your property.
					</InviteCodeHint>
				</InviteCodeBox>
			)}
			<FormGroup>
				<FormLabel>First Name *</FormLabel>
				<FormInput
					type='text'
					name='firstName'
					value={formData.firstName}
					onChange={handleChange}
					placeholder='Enter first name'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Last Name *</FormLabel>
				<FormInput
					type='text'
					name='lastName'
					value={formData.lastName}
					onChange={handleChange}
					placeholder='Enter last name'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Email *</FormLabel>
				<FormInput
					type='email'
					name='email'
					value={formData.email}
					onChange={handleChange}
					placeholder='Enter email'
					required
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Phone</FormLabel>
				<FormInput
					type='tel'
					name='phone'
					value={formData.phone}
					onChange={handleChange}
					placeholder='Enter phone number'
				/>
			</FormGroup>

			{/* Units are temporarily hidden from the app flow.
			<FormGroup>
				<FormLabel>Unit</FormLabel>
				{defaultUnit ? (
					<FormInput
						name='unit'
						value={formData.unit}
						readOnly
						style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
					/>
				) : (
					<select
						name='unit'
						value={formData.unit}
						onChange={handleChange}
						style={{
							width: '100%',
							padding: '8px 12px',
							border: '1px solid #d1d5db',
							borderRadius: '6px',
							fontSize: '14px',
							backgroundColor: 'white',
						}}>
						<option value=''>Select a unit</option>
						{units.map((unit: any) => (
							<option key={unit.id} value={unit.name}>
								{unit.name}
							</option>
						))}
					</select>
				)}
			</FormGroup>
			*/}

			<FormGroup>
				<FormLabel>Lease Start Date</FormLabel>
				<FormInput
					type='date'
					name='leaseStart'
					value={formData.leaseStart}
					onChange={handleChange}
				/>
			</FormGroup>

			<FormGroup>
				<FormLabel>Lease End Date</FormLabel>
				<FormInput
					type='date'
					name='leaseEnd'
					value={formData.leaseEnd}
					onChange={handleChange}
				/>
			</FormGroup>

			{mode === 'edit' && (
				<FormGroup>
					<RetryRow>
						<PromoStatus>Manage promo codes for this tenant.</PromoStatus>
						<RetryButton
							type='button'
							disabled={isRegenerating || isRevoking}
							onClick={handleRegeneratePromo}>
							{isRegenerating ? 'Regenerating...' : 'Regenerate Promo'}
						</RetryButton>
						<RetryButton
							type='button'
							disabled={isRevoking}
							onClick={handleRevokePromo}>
							{isRevoking ? 'Revoking...' : 'Revoke Promo'}
						</RetryButton>
					</RetryRow>
				</FormGroup>
			)}
		</GenericModal>
	);
};

const Alert = styled.div<{ type: 'error' | 'success' }>`
	margin-bottom: 16px;
	padding: 12px 16px;
	border-radius: 4px;
	background-color: ${(props) =>
		props.type === 'error' ? COLORS.alertErrorBg : COLORS.alertSuccessBg};
	color: ${(props) =>
		props.type === 'error' ? COLORS.alertError : COLORS.alertSuccess};
	border-left: 4px solid
		${(props) =>
			props.type === 'error' ? COLORS.alertError : COLORS.alertSuccess};
	font-size: 14px;
	margin: 0 0 16px 0;
`;

const PromoStatus = styled.p`
	margin: 8px 0 0 0;
	font-size: 12px;
	color: ${COLORS.textSecondary};
`;

const RetryRow = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
	margin-top: 8px;
`;

const RetryButton = styled.button`
	border: 1px solid ${COLORS.primary};
	background: ${COLORS.bgWhite};
	color: ${COLORS.primary};
	padding: 6px 10px;
	border-radius: 6px;
	font-size: 12px;
	cursor: pointer;
`;

const InviteCodeBox = styled.div`
	margin-bottom: 16px;
	padding: 12px 16px;
	border: 1px solid ${COLORS.primary};
	border-radius: 6px;
	background: #f0f4ff;
`;

const InviteCodeLabel = styled.p`
	margin: 0 0 6px 0;
	font-size: 12px;
	font-weight: 600;
	color: ${COLORS.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.5px;
`;

const InviteCodeRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`;

const InviteCodeValue = styled.span`
	flex: 1;
	font-size: 16px;
	font-family: monospace;
	font-weight: 700;
	color: ${COLORS.primary};
	letter-spacing: 1px;
`;

const CopyButton = styled.button`
	border: 1px solid ${COLORS.primary};
	background: ${COLORS.bgWhite};
	color: ${COLORS.primary};
	padding: 4px 10px;
	border-radius: 4px;
	font-size: 12px;
	cursor: pointer;
	white-space: nowrap;
`;

const InviteCodeHint = styled.p`
	margin: 8px 0 0 0;
	font-size: 11px;
	color: ${COLORS.textSecondary};
	line-style: italic;
`;
