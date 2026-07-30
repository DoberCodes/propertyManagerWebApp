import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	Button,
	ButtonRow,
	ErrorText,
	Input,
	InlineToggle,
	Label,
	Select,
	SubTitle,
	SuccessText,
	UserActivityItem,
	UserActivityList,
	UserDetailsGrid,
	UserDetailsItem,
	UserDetailsKey,
	UserDetailsPanel,
	UserPanelToolbar,
	UserPanelWrap,
	UserTable,
	UserTableWrap,
} from '../AdminInboxPage.styles';
import {
	adminPortalCreateBillingCoupon,
	adminPortalCreateComplimentaryAccessCode,
	adminPortalListComplimentaryAccessCodes,
	type AdminBillingCoupon,
	type AdminComplimentaryAccessCode,
} from '../../../services/adminPortalService';
import {
	selectBillingCoupons,
	selectBillingCouponsLoading,
	selectBillingCouponsError,
} from '../../../Redux/selectors/adminPortalSelectors';
import { addBillingCoupon } from '../../../Redux/Slices/adminPortalSlice';
import { fetchBillingCoupons } from '../../../Redux/thunks/adminPortalThunks';
import type { AppDispatch } from '../../../Redux/store/store';

interface AdminBillingToolsPanelProps {
	sessionToken: string;
}

const PLAN_OPTIONS = [
	{ value: '', label: 'All Paid Plans' },
	{ value: 'homeowner_plus', label: 'Homeowner+' },
	{ value: 'property', label: 'Property' },
	{ value: 'portfolio', label: 'Portfolio' },
];

const ACCESS_PLAN_OPTIONS = PLAN_OPTIONS.filter((option) => option.value);

const createRequestId = (): string =>
	`access-code:${Date.now()}:${Math.random().toString(36).slice(2, 12)}`;

const formatLabel = (value: string): string =>
	String(value || '')
		.replace(/[_-]/g, ' ')
		.trim()
		.replace(/\b\w/g, (char) => char.toUpperCase()) || 'n/a';

const formatDate = (value?: string | null): string => {
	if (!value) return 'n/a';
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? 'n/a' : parsed.toLocaleDateString();
};

const formatDiscount = (coupon: AdminBillingCoupon): string => {
	if (coupon.percentOff) return `${coupon.percentOff}% off`;
	if (coupon.amountOff) {
		return `$${(Number(coupon.amountOff) / 100).toFixed(2)} off`;
	}
	return 'n/a';
};

export const AdminBillingToolsPanel: React.FC<AdminBillingToolsPanelProps> = ({
	sessionToken,
}) => {
	const dispatch = useDispatch<AppDispatch>();
	const coupons = useSelector(selectBillingCoupons);
	const loading = useSelector(selectBillingCouponsLoading);
	const error = useSelector(selectBillingCouponsError);
	const [localError, setLocalError] = useState('');
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState('');
	const [code, setCode] = useState('');
	const [name, setName] = useState('');
	const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
	const [percentOff, setPercentOff] = useState('25');
	const [amountOff, setAmountOff] = useState('10');
	const [duration, setDuration] = useState<'once' | 'repeating' | 'forever'>('once');
	const [durationMonths, setDurationMonths] = useState('3');
	const [maxRedemptions, setMaxRedemptions] = useState('');
	const [expiresAt, setExpiresAt] = useState('');
	const [appliesToPlan, setAppliesToPlan] = useState('');
	const [appliesToBillingCycle, setAppliesToBillingCycle] = useState<'month' | 'year'>('month');
	const [internalNote, setInternalNote] = useState('');
	const [couponsLoaded, setCouponsLoaded] = useState(false);
	const [showInactiveCoupons, setShowInactiveCoupons] = useState(false);
	const [accessCodes, setAccessCodes] = useState<AdminComplimentaryAccessCode[]>([]);
	const [showInactiveAccessCodes, setShowInactiveAccessCodes] = useState(false);
	const [accessCodesLoading, setAccessCodesLoading] = useState(false);
	const [accessCodesLoaded, setAccessCodesLoaded] = useState(false);
	const [accessLabel, setAccessLabel] = useState('');
	const [accessBundleId, setAccessBundleId] = useState<'homeowner_plus' | 'property' | 'portfolio'>('homeowner_plus');
	const [accessDurationDays, setAccessDurationDays] = useState('30');
	const [accessExpiresAt, setAccessExpiresAt] = useState('');
	const [accessMaxRedemptions, setAccessMaxRedemptions] = useState('1');
	const [accessRecipientEmail, setAccessRecipientEmail] = useState('');
	const [accessTransitionMode, setAccessTransitionMode] = useState<'none' | 'checkout_required'>('checkout_required');
	const [accessReason, setAccessReason] = useState('');
	const [accessRequestId, setAccessRequestId] = useState(createRequestId);
	const [generatedAccessCode, setGeneratedAccessCode] = useState('');
	const displayError = localError || error || '';

	const activeCoupons = useMemo(
		() => coupons.filter((coupon) => coupon.status === 'active').length,
		[coupons],
	);
	const visibleCoupons = useMemo(
		() => showInactiveCoupons
			? coupons
			: coupons.filter((coupon) => coupon.status === 'active'),
		[coupons, showInactiveCoupons],
	);
	const visibleAccessCodes = useMemo(() => {
		if (showInactiveAccessCodes) return accessCodes;
		const nowMs = Date.now();
		return accessCodes.filter((accessCode) => {
			const expiresAtMs = accessCode.expiresAt
				? new Date(accessCode.expiresAt).getTime()
				: Number.POSITIVE_INFINITY;
			return accessCode.status === 'active' &&
				expiresAtMs > nowMs &&
				accessCode.redeemedCount < accessCode.maxRedemptions;
		});
	}, [accessCodes, showInactiveAccessCodes]);

	const loadCoupons = async () => {
		await dispatch(fetchBillingCoupons({ sessionToken, limit: 100 }));
		setCouponsLoaded(true);
	};

	const loadAccessCodes = async () => {
		setAccessCodesLoading(true);
		setLocalError('');
		try {
			setAccessCodes(await adminPortalListComplimentaryAccessCodes({ sessionToken, limit: 100 }));
			setAccessCodesLoaded(true);
		} catch (loadError) {
			setLocalError(loadError instanceof Error ? loadError.message : 'Failed to load access codes.');
		} finally {
			setAccessCodesLoading(false);
		}
	};

	const handleCreateCoupon = async () => {
		setSaving(true);
		setLocalError('');
		setMessage('');
		try {
			const amountOffCents = Math.round(Number(amountOff || 0) * 100);
			const result = await adminPortalCreateBillingCoupon({
				sessionToken,
				code,
				name: name.trim() || undefined,
				discountType,
				percentOff: discountType === 'percent' ? Number(percentOff || 0) : undefined,
				amountOffCents: discountType === 'amount' ? amountOffCents : undefined,
				duration,
				durationMonths: duration === 'repeating' ? Number(durationMonths || 0) : undefined,
				maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
				expiresAt: expiresAt || undefined,
				appliesToPlan: appliesToPlan || undefined,
				appliesToBillingCycle,
				internalNote: internalNote.trim() || undefined,
			});
			dispatch(addBillingCoupon(result.coupon));
			setMessage(`Coupon ${result.coupon.code} created in Stripe.`);
			setCode('');
			setName('');
			setInternalNote('');
		} catch (createError) {
			setLocalError(createError instanceof Error ? createError.message : 'Failed to create coupon.');
		} finally {
			setSaving(false);
		}
	};

	const handleCopyCode = async (couponCode: string) => {
		try {
			await navigator.clipboard.writeText(couponCode);
			setMessage(`Copied ${couponCode}.`);
		} catch {
			setMessage(`Code: ${couponCode}`);
		}
	};

	const handleCreateAccessCode = async () => {
		setSaving(true);
		setLocalError('');
		setMessage('');
		setGeneratedAccessCode('');
		try {
			const result = await adminPortalCreateComplimentaryAccessCode({
				sessionToken,
				label: accessLabel.trim(),
				bundleId: accessBundleId,
				durationDays: Number(accessDurationDays),
				expiresAt: accessExpiresAt || undefined,
				maxRedemptions: accessRecipientEmail.trim() ? 1 : Number(accessMaxRedemptions),
				recipientEmail: accessRecipientEmail.trim() || undefined,
				transitionMode: accessTransitionMode,
				reason: accessReason.trim(),
				requestId: accessRequestId,
			});
			if (!result.code) {
				setMessage('This request was already completed. Its plaintext code cannot be retrieved; create a new code if it was not saved.');
				return;
			}
			setGeneratedAccessCode(result.code);
			setMessage('Complimentary access code created. Copy it now; Maintley cannot retrieve it later.');
			setAccessRequestId(createRequestId());
			await loadAccessCodes();
		} catch (createError) {
			setLocalError(createError instanceof Error ? createError.message : 'Failed to create access code.');
		} finally {
			setSaving(false);
		}
	};

	return (
		<UserPanelWrap>
			<SubTitle>
				Manage Stripe billing promotions and separate Maintley complimentary access. Stripe remains the billing source of truth for paid access.
			</SubTitle>

			{displayError ? <ErrorText>{displayError}</ErrorText> : null}
			{message ? <SuccessText>{message}</SuccessText> : null}

			<details
				onToggle={(event) => {
					if (event.currentTarget.open && !couponsLoaded) void loadCoupons();
				}}
				style={{ marginBottom: 16 }}>
				<summary style={{ cursor: 'pointer', fontSize: 18, fontWeight: 700, padding: '16px 0' }}>
					Stripe Coupons
				</summary>
				<SubTitle>
					Discounts used during Stripe Checkout. These may establish or modify a billing relationship.
				</SubTitle>
			<UserDetailsPanel>
				<Label>Create Coupon</Label>
				<UserPanelToolbar>
					<div>
						<Label htmlFor='billing-coupon-code'>Code</Label>
						<Input
							id='billing-coupon-code'
							type='text'
							placeholder='EARLY25'
							value={code}
							onChange={(event) => setCode(event.target.value.toUpperCase())}
						/>
					</div>
					<div>
						<Label htmlFor='billing-coupon-name'>Name</Label>
						<Input
							id='billing-coupon-name'
							type='text'
							placeholder='Early adopter discount'
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor='billing-discount-type'>Discount</Label>
						<Select
							id='billing-discount-type'
							value={discountType}
							onChange={(event) => setDiscountType(event.target.value as 'percent' | 'amount')}>
							<option value='percent'>Percent off</option>
							<option value='amount'>Dollar off</option>
						</Select>
					</div>
					<div>
						<Label htmlFor='billing-discount-value'>
							{discountType === 'percent' ? 'Percent' : 'Dollars'}
						</Label>
						<Input
							id='billing-discount-value'
							type='number'
							min='1'
							max={discountType === 'percent' ? '100' : undefined}
							value={discountType === 'percent' ? percentOff : amountOff}
							onChange={(event) =>
								discountType === 'percent'
									? setPercentOff(event.target.value)
									: setAmountOff(event.target.value)
							}
						/>
					</div>
					<div>
						<Label htmlFor='billing-duration'>Duration</Label>
						<Select
							id='billing-duration'
							value={duration}
							onChange={(event) =>
								setDuration(event.target.value as 'once' | 'repeating' | 'forever')
							}>
							<option value='once'>Once</option>
							<option value='repeating'>Repeating</option>
							<option value='forever'>Forever</option>
						</Select>
					</div>
					{duration === 'repeating' ? (
						<div>
							<Label htmlFor='billing-duration-months'>Months</Label>
							<Input
								id='billing-duration-months'
								type='number'
								min='1'
								max='36'
								value={durationMonths}
								onChange={(event) => setDurationMonths(event.target.value)}
							/>
						</div>
					) : null}
					<div>
						<Label htmlFor='billing-max-redemptions'>Max redemptions</Label>
						<Input
							id='billing-max-redemptions'
							type='number'
							min='1'
							placeholder='Optional'
							value={maxRedemptions}
							onChange={(event) => setMaxRedemptions(event.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor='billing-expires-at'>Expiration</Label>
						<Input
							id='billing-expires-at'
							type='date'
							value={expiresAt}
							onChange={(event) => setExpiresAt(event.target.value)}
						/>
					</div>
					<div>
						<Label htmlFor='billing-applies-plan'>Applies to plan</Label>
						<Select
							id='billing-applies-plan'
							value={appliesToPlan}
							onChange={(event) => setAppliesToPlan(event.target.value)}>
							{PLAN_OPTIONS.map((option) => (
								<option key={option.value || 'all'} value={option.value}>
									{option.label}
								</option>
							))}
						</Select>
					</div>
					<div>
						<Label htmlFor='billing-applies-cycle'>Billing cycle</Label>
						<Select
							id='billing-applies-cycle'
							value={appliesToBillingCycle}
							onChange={(event) =>
								setAppliesToBillingCycle(event.target.value as 'month' | 'year')
							}>
							<option value='month'>Monthly</option>
							<option value='year'>Annual</option>
						</Select>
					</div>
				</UserPanelToolbar>
				<UserDetailsGrid>
					<UserDetailsItem>
						<UserDetailsKey>Internal Note</UserDetailsKey>
						<Input
							type='text'
							placeholder='Beta, annual promo, friends and family'
							value={internalNote}
							onChange={(event) => setInternalNote(event.target.value)}
						/>
					</UserDetailsItem>
					<UserDetailsItem>
						<UserDetailsKey>Create</UserDetailsKey>
						<Button type='button' onClick={() => void handleCreateCoupon()} disabled={saving}>
							{saving ? 'Creating...' : 'Create Coupon'}
						</Button>
					</UserDetailsItem>
				</UserDetailsGrid>
			</UserDetailsPanel>

			<UserDetailsPanel>
				<ButtonRow>
					<Label>View Coupons</Label>
					<InlineToggle>
						<input
							type='checkbox'
							aria-label='Show inactive and expired coupons'
							checked={showInactiveCoupons}
							onChange={(event) => setShowInactiveCoupons(event.target.checked)}
						/>
						Show inactive and expired
					</InlineToggle>
					<Button type='button' onClick={() => void loadCoupons()} disabled={loading}>
						{loading ? 'Loading...' : 'Refresh'}
					</Button>
				</ButtonRow>
				<SubTitle>
					{activeCoupons} active of {coupons.length} loaded coupons.
				</SubTitle>
				<UserTableWrap>
					<UserTable>
						<thead>
							<tr>
								<th>Code</th>
								<th>Discount</th>
								<th>Duration</th>
								<th>Status</th>
								<th>Redeemed</th>
								<th>Expires</th>
								<th>Plan</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{visibleCoupons.length === 0 ? (
								<tr>
									<td colSpan={8}>{coupons.length ? 'No active Stripe coupons.' : 'No Stripe coupons loaded yet.'}</td>
								</tr>
							) : (
								visibleCoupons.map((coupon) => (
									<tr key={coupon.id}>
										<td>
											{coupon.code}
											{coupon.internalNote ? (
												<div style={{ fontSize: 11 }}>{coupon.internalNote}</div>
											) : null}
										</td>
										<td>{formatDiscount(coupon)}</td>
										<td>
											{formatLabel(String(coupon.duration || ''))}
											{coupon.durationMonths ? ` (${coupon.durationMonths}m)` : ''}
										</td>
										<td>{formatLabel(String(coupon.status || 'inactive'))}</td>
										<td>
											{coupon.redeemedCount ?? 0}
											{coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ''}
										</td>
										<td>{formatDate(coupon.expiresAt)}</td>
										<td>
											{coupon.appliesToPlan
												? `${formatLabel(coupon.appliesToPlan)} ${coupon.appliesToBillingCycle || ''}`
												: 'All paid plans'}
										</td>
										<td>
											<Button
												type='button'
												onClick={() => void handleCopyCode(coupon.code)}>
												Copy Code
											</Button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</UserTable>
				</UserTableWrap>
			</UserDetailsPanel>

			<UserActivityList>
				<UserActivityItem>
					Use cases: early adopter discounts, contractor trials, friends and family beta codes, annual promos, and first-month offers.
				</UserActivityItem>
			</UserActivityList>
			</details>

			<details
				onToggle={(event) => {
					if (event.currentTarget.open && !accessCodesLoaded) void loadAccessCodes();
				}}
				style={{ marginBottom: 16 }}>
				<summary style={{ cursor: 'pointer', fontSize: 18, fontWeight: 700, padding: '16px 0' }}>
					Complimentary Access Codes
				</summary>
				<SubTitle>
					Temporary Maintley access without Stripe billing or automatic renewal. Each code grants one access level.
				</SubTitle>
				<UserDetailsPanel>
					<Label>Create Complimentary Access Code</Label>
					<UserPanelToolbar>
						<div>
							<Label htmlFor='access-code-label'>Program label</Label>
							<Input id='access-code-label' value={accessLabel} onChange={(event) => setAccessLabel(event.target.value)} placeholder='Community partner trial' />
						</div>
						<div>
							<Label htmlFor='access-code-plan'>Access level</Label>
							<Select id='access-code-plan' value={accessBundleId} onChange={(event) => setAccessBundleId(event.target.value as typeof accessBundleId)}>
								{ACCESS_PLAN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
							</Select>
						</div>
						<div>
							<Label htmlFor='access-code-duration'>Access duration (days)</Label>
							<Input id='access-code-duration' type='number' min='1' max='730' value={accessDurationDays} onChange={(event) => setAccessDurationDays(event.target.value)} />
						</div>
						<div>
							<Label htmlFor='access-code-expiration'>Redeem by</Label>
							<Input id='access-code-expiration' type='date' value={accessExpiresAt} onChange={(event) => setAccessExpiresAt(event.target.value)} />
						</div>
						<div>
							<Label htmlFor='access-code-redemptions'>Maximum redemptions</Label>
							<Input id='access-code-redemptions' type='number' min='1' max='1000' disabled={Boolean(accessRecipientEmail.trim())} value={accessRecipientEmail.trim() ? '1' : accessMaxRedemptions} onChange={(event) => setAccessMaxRedemptions(event.target.value)} />
						</div>
						<div>
							<Label htmlFor='access-code-email'>Recipient email (optional)</Label>
							<Input id='access-code-email' type='email' value={accessRecipientEmail} onChange={(event) => setAccessRecipientEmail(event.target.value)} placeholder='customer@example.com' />
						</div>
						<div>
							<Label htmlFor='access-code-transition'>When access ends</Label>
							<Select id='access-code-transition' value={accessTransitionMode} onChange={(event) => setAccessTransitionMode(event.target.value as typeof accessTransitionMode)}>
								<option value='checkout_required'>Offer Checkout to continue</option>
								<option value='none'>Return to existing plan</option>
							</Select>
						</div>
					</UserPanelToolbar>
					<UserDetailsGrid>
						<UserDetailsItem>
							<UserDetailsKey>Administrative reason</UserDetailsKey>
							<Input value={accessReason} onChange={(event) => setAccessReason(event.target.value)} placeholder='Why this access is being offered' />
						</UserDetailsItem>
						<UserDetailsItem>
							<UserDetailsKey>Generate</UserDetailsKey>
							<Button type='button' disabled={saving} onClick={() => void handleCreateAccessCode()}>
								{saving ? 'Generating...' : 'Generate Access Code'}
							</Button>
						</UserDetailsItem>
					</UserDetailsGrid>
					{generatedAccessCode ? (
						<SuccessText>
							<strong>{generatedAccessCode}</strong>{' '}
							<Button type='button' onClick={() => void handleCopyCode(generatedAccessCode)}>Copy Code</Button>
							<div style={{ marginTop: 8 }}>Copy this code now. Maintley stores only its secure verifier.</div>
						</SuccessText>
					) : null}
				</UserDetailsPanel>

				<UserDetailsPanel>
					<ButtonRow>
						<Label>Issued Codes</Label>
						<InlineToggle>
							<input
								type='checkbox'
								aria-label='Show inactive and expired access codes'
								checked={showInactiveAccessCodes}
								onChange={(event) => setShowInactiveAccessCodes(event.target.checked)}
							/>
							Show inactive and expired
						</InlineToggle>
						<Button type='button' disabled={accessCodesLoading} onClick={() => void loadAccessCodes()}>
							{accessCodesLoading ? 'Loading...' : 'Refresh'}
						</Button>
					</ButtonRow>
					<UserTableWrap>
						<UserTable>
							<thead><tr><th>Program</th><th>Access</th><th>Duration</th><th>Redeemed</th><th>Redeem by</th><th>Recipient</th><th>Status</th></tr></thead>
							<tbody>
								{visibleAccessCodes.length === 0 ? (
									<tr><td colSpan={7}>{accessCodes.length ? 'No active complimentary access codes.' : 'No complimentary access codes loaded yet.'}</td></tr>
								) : visibleAccessCodes.map((accessCode) => (
									<tr key={accessCode.codeId}>
										<td>{accessCode.label}<div style={{ fontSize: 11 }}>{accessCode.codeId}</div></td>
										<td>{formatLabel(accessCode.bundleId)}</td>
										<td>{accessCode.durationDays} days</td>
										<td>{accessCode.redeemedCount} / {accessCode.maxRedemptions}</td>
										<td>{formatDate(accessCode.expiresAt)}</td>
										<td>{accessCode.recipientEmail || 'Any eligible account'}</td>
										<td>{formatLabel(accessCode.status)}</td>
									</tr>
								))}
							</tbody>
						</UserTable>
					</UserTableWrap>
				</UserDetailsPanel>
			</details>
		</UserPanelWrap>
	);
};
