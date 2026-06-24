import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	Button,
	ButtonRow,
	ErrorText,
	Input,
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
	type AdminBillingCoupon,
} from '../../../services/adminPortalService';
import {
	selectBillingCoupons,
	selectBillingCouponsLoading,
	selectBillingCouponsError,
	selectBillingCouponsLastLoaded,
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
	const lastLoadedAt = useSelector(selectBillingCouponsLastLoaded);
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
	const displayError = localError || error || '';

	const activeCoupons = useMemo(
		() => coupons.filter((coupon) => coupon.status === 'active').length,
		[coupons],
	);

	const loadCoupons = async () => {
		await dispatch(fetchBillingCoupons({ sessionToken, limit: 100 }));
	};

	useEffect(() => {
		void loadCoupons();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionToken]);

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

	return (
		<UserPanelWrap>
			<SubTitle>
				Billing tools create Stripe coupons and checkout links. Stripe remains the billing source of truth.
			</SubTitle>

			{displayError ? <ErrorText>{displayError}</ErrorText> : null}
			{message ? <SuccessText>{message}</SuccessText> : null}

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
							{coupons.length === 0 ? (
								<tr>
									<td colSpan={8}>No Stripe coupons loaded yet.</td>
								</tr>
							) : (
								coupons.map((coupon) => (
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
		</UserPanelWrap>
	);
};
