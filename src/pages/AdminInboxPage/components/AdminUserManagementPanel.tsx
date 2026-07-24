import React, { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Button,
    ErrorText,
    Input,
    InlineToggle,
    Label,
    Select,
	SecondaryButton,
    SubTitle,
    SuccessText,
    UserActivityItem,
    UserActivityList,
    UserDetailsGrid,
    UserDetailsItem,
    UserDetailsKey,
    UserDetailsPanel,
    UserDetailsValue,
    UserPanelToolbar,
    UserPanelWrap,
    UserRowActionButton,
    UserRolePill,
    UserTable,
    UserTableWrap,
} from '../AdminInboxPage.styles';
import { GenericModal } from 'Components/Library';
import {
    adminPortalApplyUserBillingActions,
	adminPortalMutateEntitlementGrant,
	adminPortalPreviewEntitlementGrant,
    adminPortalManageUserSubscription,
    adminPortalRefreshUserSubscriptionFromStripe,
    getAdminPortalUserTroubleshootingDetails,
    type AdminPortalUserTroubleshootingDetails,
	type AdminEntitlementAccessPreview,
	type AdminEntitlementGrantAction,
} from '../../../services/adminPortalService';
import {
    selectFilteredAdminUsers,
    selectAdminUsersLoading,
    selectAdminUsersError,
    selectAdminUsersLastLoaded,
    selectAdminUsersFilters,
} from '../../../Redux/selectors/adminPortalSelectors';
import { setUsersFilters } from '../../../Redux/Slices/adminPortalSlice';
import { fetchAdminUsers } from '../../../Redux/thunks/adminPortalThunks';
import type { AppDispatch } from '../../../Redux/store/store';
import { isMultiHomeownerPlanEnabled } from '../../../entitlements/planAvailability';

interface AdminUserManagementPanelProps {
    sessionToken: string;
}

const LIST_FILTER_OPTIONS = [
    { value: '', label: 'All Users' },
    { value: 'active', label: 'Active' },
    { value: 'disabled', label: 'Disabled' },
    { value: 'trial', label: 'Trial' },
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
    { value: 'property_manager', label: 'Property Manager' },
];

const PLAN_OPTIONS = [
    { value: 'homeowner', label: 'Homeowner' },
    { value: 'homeowner_plus', label: 'Homeowner+' },
    ...(isMultiHomeownerPlanEnabled()
        ? [{ value: 'multi_homeowner', label: 'Multi-Homeowner' }]
        : []),
    { value: 'property', label: 'Property' },
    { value: 'portfolio', label: 'Portfolio' },
];

const formatLabel = (value: string): string =>
    String(value || '')
        .replace(/[_-]/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase()) || 'Unknown';

const formatDate = (value?: string | null): string => {
    if (!value) return 'n/a';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 'n/a' : parsed.toLocaleString();
};

const formatRelative = (value?: string | null): string => {
    if (!value) return 'n/a';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'n/a';

    const diffMs = Date.now() - parsed.getTime();
    if (diffMs < 60_000) return 'just now';
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

const formatBytesToMb = (bytes: number): string => {
    const safeBytes = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
    return `${(safeBytes / (1024 * 1024)).toFixed(2)} MB`;
};

const createGrantRequestId = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return `grant:${crypto.randomUUID()}`;
	}
	return `grant:${Date.now()}:${Math.random().toString(36).slice(2, 12)}`;
};

export const AdminUserManagementPanel: React.FC<AdminUserManagementPanelProps> = ({
    sessionToken,
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const filteredUsers = useSelector(selectFilteredAdminUsers);
    const loading = useSelector(selectAdminUsersLoading);
    const error = useSelector(selectAdminUsersError);
    const lastLoadedAt = useSelector(selectAdminUsersLastLoaded);
    const filters = useSelector(selectAdminUsersFilters);
    const [localError, setLocalError] = useState('');
    const [isUserListExpanded, setIsUserListExpanded] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [details, setDetails] = useState<AdminPortalUserTroubleshootingDetails | null>(null);
    const [selectedPlan, setSelectedPlan] = useState('property');
    const [trialDays, setTrialDays] = useState('');
    const [planActionLoading, setPlanActionLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
	const [showClearStripeConfirm, setShowClearStripeConfirm] = useState(false);
	const [stripeClearReason, setStripeClearReason] = useState('');
	const [stripeClearConfirmation, setStripeClearConfirmation] = useState('');
	const [stripeClearRequestId, setStripeClearRequestId] = useState('');
    const [showBillingActionsDialog, setShowBillingActionsDialog] = useState(false);
    const [actionMessage, setActionMessage] = useState('');
    const [syncStripe, setSyncStripe] = useState(false);
    const [stripeRefreshLoading, setStripeRefreshLoading] = useState(false);
    const [checkoutBillingCycle, setCheckoutBillingCycle] = useState<'month' | 'year'>('month');
    const [checkoutCouponCode, setCheckoutCouponCode] = useState('');
    const [checkoutLink, setCheckoutLink] = useState('');
	const [showGrantDialog, setShowGrantDialog] = useState(false);
	const [grantAction, setGrantAction] = useState<AdminEntitlementGrantAction>('create');
	const [grantProgramId, setGrantProgramId] = useState('');
	const [grantKind, setGrantKind] = useState<'temporary' | 'permanent'>('temporary');
	const [grantDurationDays, setGrantDurationDays] = useState('30');
	const [selectedGrantId, setSelectedGrantId] = useState('');
	const [grantReason, setGrantReason] = useState('');
	const [grantRequestId, setGrantRequestId] = useState('');
	const [grantConfirmation, setGrantConfirmation] = useState('');
	const [grantPreview, setGrantPreview] = useState<{
		currentAccess: AdminEntitlementAccessPreview;
		proposedAccess: AdminEntitlementAccessPreview;
		confirmationPhrase: string;
		programLabel: string;
	} | null>(null);
	const [grantActionLoading, setGrantActionLoading] = useState(false);
	const grantPreviewRef = useRef<HTMLDivElement | null>(null);
    const displayError = localError || error || '';

    const sortedUsers = useMemo(() => {
        return [...filteredUsers].sort((left, right) => {
            const leftMillis = new Date(String(left.lastActiveAt || '')).getTime();
            const rightMillis = new Date(String(right.lastActiveAt || '')).getTime();
            if (Number.isFinite(leftMillis) && Number.isFinite(rightMillis) && leftMillis !== rightMillis) {
                return rightMillis - leftMillis;
            }
            return String(left.displayName || '').localeCompare(String(right.displayName || ''));
        });
    }, [filteredUsers]);

    const handleLoadUsers = async () => {
        await dispatch(
            fetchAdminUsers({
                sessionToken,
                query: filters.query,
                filter: filters.listFilter || undefined,
                limit: 250,
            }),
        );
    };

    const handleFilterChange = (filterUpdates: Partial<typeof filters>) => {
        dispatch(setUsersFilters(filterUpdates));
    };

    const handleInspectUser = async (userId: string) => {
        if (!userId) return;
        setDetailLoading(true);
        setLocalError('');
        setSelectedUserId(userId);
        try {
            const result = await getAdminPortalUserTroubleshootingDetails({
                sessionToken,
                userId,
            });
            setDetails(result);
            setCheckoutLink('');
            setSelectedPlan(result.profile.subscriptionPlan || 'property');
            setTrialDays('');
            setCheckoutCouponCode('');
			setSyncStripe(Boolean(result.profile.hasStripeSubscription));
        } catch (detailError) {
            const message =
                detailError instanceof Error
                    ? detailError.message
                    : 'Failed to load user troubleshooting details.';
            setLocalError(message);
        } finally {
            setDetailLoading(false);
        }

        if (typeof window !== 'undefined' && window.innerWidth <= 768) {
            setIsUserListExpanded(false);
        }
    };

    const handleSubscriptionAction = async (
        action: 'change_plan' | 'extend_trial' | 'cancel_subscription',
    ): Promise<boolean> => {
        if (!selectedUserId) return false;

        setPlanActionLoading(true);
        setLocalError('');
        setActionMessage('');
        try {
            const result = await adminPortalManageUserSubscription({
                sessionToken,
                userId: selectedUserId,
                action,
                planId: action === 'change_plan' ? selectedPlan : undefined,
                trialDays: action === 'extend_trial' ? Number(trialDays || 0) : undefined,
                syncStripe,
            });

            await handleInspectUser(selectedUserId);
            setActionMessage(
                `Subscription updated to ${formatLabel(result.subscriptionPlan)} (${formatLabel(result.subscriptionStatus)}). ${result.stripeUpdated ? 'Stripe updated. ' : ''
                }Audit log saved.`,
            );
            return true;
        } catch (actionError) {
            const message =
                actionError instanceof Error
                    ? actionError.message
                    : 'Failed to update subscription.';
            setLocalError(message);
            return false;
        } finally {
            setPlanActionLoading(false);
        }
    };

    const handleApplyBillingUpdates = async (): Promise<void> => {
        if (!selectedUserId) return;

        const currentPlan = details?.profile.subscriptionPlan || '';
        const stripeInterval = details?.profile.stripeSubscription?.interval;
        const billingCycleChanged =
            syncStripe &&
            (stripeInterval === 'month' || stripeInterval === 'year') &&
            checkoutBillingCycle !== stripeInterval;
        const planId =
            selectedPlan && (selectedPlan !== currentPlan || billingCycleChanged)
                ? selectedPlan
                : undefined;
        const trimmedTrialDays = trialDays.trim();
        const parsedTrialDays = trimmedTrialDays ? Number(trimmedTrialDays) : undefined;
        const promoCode = checkoutCouponCode.trim();

        if (!planId && !parsedTrialDays && !promoCode) {
            setLocalError('Add a plan change, trial days, or coupon code before applying billing updates.');
            return;
        }

        setPlanActionLoading(true);
        setLocalError('');
        setActionMessage('');
        try {
            const result = await adminPortalApplyUserBillingActions({
                sessionToken,
                userId: selectedUserId,
                planId: planId || (promoCode ? selectedPlan : undefined),
                billingCycle: checkoutBillingCycle,
                trialDays: parsedTrialDays,
                promoCode: promoCode || undefined,
                syncStripe,
            });
            const createdCheckoutLink = result.checkoutUrl || '';
			setActionMessage(
				result.applied.checkoutLinkCreated
					? 'Stripe Checkout link created. No paid access was granted; Maintley will update only after Stripe confirms the subscription. Audit log saved.'
					: `Stripe billing updated for ${formatLabel(result.subscriptionPlan)} (${formatLabel(result.subscriptionStatus)}). Audit log saved.`,
			);
            await handleInspectUser(selectedUserId);
            setCheckoutLink(createdCheckoutLink);
            setTrialDays('');
            setCheckoutCouponCode('');
        } catch (linkError) {
            setLocalError(
                linkError instanceof Error
                    ? linkError.message
                    : 'Failed to apply billing updates.',
            );
        } finally {
            setPlanActionLoading(false);
        }
    };

    const handleRefreshSubscriptionFromStripe = async (): Promise<void> => {
        if (!selectedUserId) return;

        setStripeRefreshLoading(true);
        setLocalError('');
        setActionMessage('');
        try {
            const result = await adminPortalRefreshUserSubscriptionFromStripe({
                sessionToken,
                userId: selectedUserId,
            });
            await handleInspectUser(selectedUserId);
            const matchLabel =
                result.matchedBy === 'stripe_subscription_id'
                    ? 'subscription ID'
                    : result.matchedBy === 'stripe_customer_id'
                        ? 'customer ID'
                        : result.matchedBy === 'email'
                            ? 'email'
                            : 'Stripe';
            setActionMessage(
                `Firebase subscription refreshed from Stripe by ${matchLabel}: ${formatLabel(result.subscriptionPlan)} (${formatLabel(result.subscriptionStatus)}). Audit log saved.`,
            );
        } catch (refreshError) {
            setLocalError(
                refreshError instanceof Error
                    ? refreshError.message
                    : 'Failed to refresh subscription from Stripe.',
            );
        } finally {
            setStripeRefreshLoading(false);
        }
    };

    const handleCopyCheckoutLink = async (): Promise<void> => {
        if (!checkoutLink) return;
        try {
            await navigator.clipboard.writeText(checkoutLink);
            setActionMessage('Checkout link copied.');
        } catch {
            setActionMessage('Checkout link is ready.');
        }
    };

	const resetGrantPreview = () => {
		setGrantPreview(null);
		setGrantConfirmation('');
	};

	const handleOpenGrantDialog = () => {
		const programs = details?.access?.grantAdministration?.programs || [];
		const firstProgram = programs[0];
		const activeGrant = details?.access?.grants?.find((grant) =>
			['active', 'scheduled'].includes(grant.state),
		);
		setGrantAction('create');
		setGrantProgramId(firstProgram?.programId || '');
		setGrantKind(firstProgram?.allowedKinds?.[0] || 'temporary');
		setGrantDurationDays(String(firstProgram?.defaultDurationDays || 30));
		setSelectedGrantId(activeGrant?.grantId || '');
		setGrantReason('');
		setGrantRequestId(createGrantRequestId());
		setGrantConfirmation('');
		setGrantPreview(null);
		setLocalError('');
		setActionMessage('');
		setShowGrantDialog(true);
	};

	const handlePreviewGrant = async () => {
		if (!selectedUserId) return;
		setGrantActionLoading(true);
		setLocalError('');
		setActionMessage('');
		try {
			const preview = await adminPortalPreviewEntitlementGrant({
				sessionToken,
				targetUserId: selectedUserId,
				action: grantAction,
				programId: grantAction === 'create' ? grantProgramId : undefined,
				kind: grantAction === 'create' ? grantKind : undefined,
				durationDays:
					grantAction === 'revoke' ? undefined : Number(grantDurationDays || 0),
				grantId: grantAction === 'create' ? undefined : selectedGrantId,
			});
			setGrantPreview(preview);
			setGrantConfirmation('');
			window.requestAnimationFrame(() => {
				grantPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			});
		} catch (previewError) {
			setLocalError(
				previewError instanceof Error
					? previewError.message
					: 'Unable to preview the internal access grant.',
			);
		} finally {
			setGrantActionLoading(false);
		}
	};

	const handleApplyGrant = async () => {
		if (!selectedUserId || !grantPreview) return;
		setGrantActionLoading(true);
		setLocalError('');
		setActionMessage('');
		try {
			const result = await adminPortalMutateEntitlementGrant({
				sessionToken,
				targetUserId: selectedUserId,
				action: grantAction,
				programId: grantAction === 'create' ? grantProgramId : undefined,
				kind: grantAction === 'create' ? grantKind : undefined,
				durationDays:
					grantAction === 'revoke' ? undefined : Number(grantDurationDays || 0),
				grantId: grantAction === 'create' ? undefined : selectedGrantId,
				reason: grantReason,
				requestId: grantRequestId,
				confirmation: grantConfirmation,
			});
			await handleInspectUser(selectedUserId);
			setActionMessage(
				`${formatLabel(grantAction)} completed for internal grant ${result.grantId}. No Stripe billing relationship was created. Audit log saved.`,
			);
			setShowGrantDialog(false);
		} catch (grantError) {
			setLocalError(
				grantError instanceof Error
					? grantError.message
					: 'Unable to apply the internal access grant change.',
			);
		} finally {
			setGrantActionLoading(false);
		}
	};

    const handleConfirmCancelSubscription = async (): Promise<void> => {
        const completed = await handleSubscriptionAction('cancel_subscription');
        if (completed) {
            setShowCancelConfirm(false);
            setShowBillingActionsDialog(false);
        }
    };

	const handleOpenClearStripeLinkage = () => {
		setStripeClearReason('');
		setStripeClearConfirmation('');
		setStripeClearRequestId(createGrantRequestId().replace(/^grant:/, 'billing-clear:'));
		setLocalError('');
		setShowClearStripeConfirm(true);
	};

	const handleClearStripeLinkage = async (): Promise<void> => {
		if (!selectedUserId) return;
		setPlanActionLoading(true);
		setLocalError('');
		setActionMessage('');
		try {
			await adminPortalManageUserSubscription({
				sessionToken,
				userId: selectedUserId,
				action: 'clear_stripe_linkage',
				reason: stripeClearReason,
				confirmation: stripeClearConfirmation,
				requestId: stripeClearRequestId,
			});
			setShowClearStripeConfirm(false);
			setShowBillingActionsDialog(false);
			await handleInspectUser(selectedUserId);
			setActionMessage(
				'Stale Stripe linkage cleared. Billing returned to the free Homeowner plan; internal grants were preserved. Audit log saved.',
			);
		} catch (clearError) {
			setLocalError(
				clearError instanceof Error
					? clearError.message
					: 'Unable to clear the stale Stripe linkage.',
			);
		} finally {
			setPlanActionLoading(false);
		}
	};

    const selectedRow = sortedUsers.find((user) => String(user.id) === selectedUserId) || null;
    const selectedUserCurrentPlan = details?.profile.subscriptionPlan || '';
    const selectedUserCurrentBillingCycle = details?.profile.stripeSubscription?.interval;
    const hasPlanChange = Boolean(selectedPlan && selectedPlan !== selectedUserCurrentPlan);
    const hasBillingCycleChange = Boolean(
        syncStripe &&
        (selectedUserCurrentBillingCycle === 'month' || selectedUserCurrentBillingCycle === 'year') &&
        checkoutBillingCycle !== selectedUserCurrentBillingCycle,
    );
    const hasTrialChange = Boolean(trialDays.trim());
    const hasCouponChange = Boolean(checkoutCouponCode.trim());
    const hasBillingUpdatesToApply =
        hasPlanChange || hasBillingCycleChange || hasTrialChange || hasCouponChange;

    return (
        <UserPanelWrap>
            <SubTitle>
                User troubleshooting: quickly inspect account profile, usage, support history, recent activity, and error context.
            </SubTitle>

            <UserPanelToolbar>
                <div>
                    <Label htmlFor='admin-user-search'>Search users</Label>
                    <Input
                        id='admin-user-search'
                        type='text'
                        placeholder='Name, email, plan, account id'
                        value={filters.query}
                        onChange={(event) => handleFilterChange({ query: event.target.value })}
                    />
                </div>
                <div>
                    <Label htmlFor='admin-user-filter'>Filter</Label>
                    <Select
                        id='admin-user-filter'
                        value={filters.listFilter}
                        onChange={(event) => handleFilterChange({ listFilter: event.target.value })}>
                        {LIST_FILTER_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
                <Button type='button' onClick={() => void handleLoadUsers()} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh'}
                </Button>
            </UserPanelToolbar>

            {displayError ? <ErrorText>{displayError}</ErrorText> : null}
            {actionMessage ? <SuccessText>{actionMessage}</SuccessText> : null}
            {lastLoadedAt ? <SubTitle>Last loaded at {lastLoadedAt}</SubTitle> : null}

            <div>
                <InlineToggle
                    type='button'
                    onClick={() => setIsUserListExpanded((prev) => !prev)}
                    aria-expanded={isUserListExpanded}
                    aria-controls='admin-user-list-table'>
                    {isUserListExpanded ? 'Hide User List' : 'Show User List'} ({sortedUsers.length})
                </InlineToggle>
            </div>

            {isUserListExpanded ? (
                <UserTableWrap id='admin-user-list-table'>
                    <UserTable>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Plan</th>
                                <th>Properties</th>
                                <th>Last Active</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>No users loaded yet.</td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => (
                                    <tr key={String(user.id)}>
                                        <td>
                                            {String(user.displayName || '') || 'Unknown User'}
                                            <div>
                                                <UserRolePill>{formatLabel(String(user.maintleyRole || 'user'))}</UserRolePill>
                                            </div>
                                        </td>
                                        <td>{String(user.email || '') || 'No email'}</td>
                                        <td>{formatLabel(String(user.subscriptionPlan || 'none'))}</td>
                                        <td>{String(user.propertyCount ?? 0)}</td>
                                        <td>{formatRelative(user.lastActiveAt)}</td>
                                        <td>{formatLabel(String(user.accountStatus || user.subscriptionStatus || 'active'))}</td>
                                        <td>{formatDate(String(user.createdAt || ''))}</td>
                                        <td>
                                            <UserRowActionButton
                                                type='button'
                                                onClick={() => void handleInspectUser(String(user.id || ''))}>
                                                Inspect
                                            </UserRowActionButton>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </UserTable>
                </UserTableWrap>
            ) : null}

            {details ? (
                <UserDetailsPanel>
                    <SubTitle>
                        {detailLoading
                            ? 'Loading user details...'
                            : `Customer Lookup Card: ${details.profile.displayName}`}
                    </SubTitle>

                    <Label>Account</Label>
                    <UserDetailsGrid>
                        <UserDetailsItem>
                            <UserDetailsKey>Name</UserDetailsKey>
                            <UserDetailsValue>{details.profile.displayName || 'Unknown User'}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Email</UserDetailsKey>
                            <UserDetailsValue>{details.profile.email || 'No email'}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Account ID</UserDetailsKey>
                            <UserDetailsValue>{details.profile.accountId || details.profile.id}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Created Date</UserDetailsKey>
                            <UserDetailsValue>{formatDate(details.profile.createdAt)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Last Login</UserDetailsKey>
                            <UserDetailsValue>{formatDate(details.profile.lastLoginAt)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Last Activity</UserDetailsKey>
                            <UserDetailsValue>{formatDate(details.profile.lastActivityAt)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
							<UserDetailsKey>Billing Plan</UserDetailsKey>
                            <UserDetailsValue>
                                {formatLabel(details.profile.subscriptionPlan)} ({formatLabel(details.profile.subscriptionStatus)})
                            </UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Invite Code</UserDetailsKey>
                            <UserDetailsValue>{details.profile.inviteCode || 'n/a'}</UserDetailsValue>
                        </UserDetailsItem>
                    </UserDetailsGrid>

                    <Label>Usage Summary</Label>
                    <UserDetailsGrid>
                        <UserDetailsItem>
                            <UserDetailsKey>Properties</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.propertyCount)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Systems</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.systemCount)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Tasks</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.taskCount)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Documents</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.documentCount ?? 0)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Storage</UserDetailsKey>
                            <UserDetailsValue>{formatBytesToMb(details.metrics.supportAttachmentStorageBytes)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Team Members</UserDetailsKey>
                            <UserDetailsValue>{String(details.metrics.teamMemberCount ?? 0)}</UserDetailsValue>
                        </UserDetailsItem>
                    </UserDetailsGrid>

					<div style={{ marginTop: 20 }}>
						<Label>Stripe Billing</Label>
						<p style={{ margin: '4px 0 12px' }}>
							Paid subscriptions, invoices, renewals, coupons, and Stripe trial periods. These controls do not create internal complimentary grants.
						</p>
					</div>
                    <UserDetailsGrid>
                        <UserDetailsItem>
                            <UserDetailsKey>Current Plan</UserDetailsKey>
                            <UserDetailsValue>{formatLabel(details.profile.subscriptionPlan)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Billing Status</UserDetailsKey>
                            <UserDetailsValue>{formatLabel(details.profile.subscriptionStatus)}</UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Stripe Connection</UserDetailsKey>
                            <UserDetailsValue>
                                {details.profile.hasStripeSubscription ? 'Connected' : 'No Stripe subscription on record'}
                            </UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Stripe Plan</UserDetailsKey>
                            <UserDetailsValue>
                                {details.profile.stripeSubscription?.planLabel ||
                                    (details.profile.stripeSubscription?.error
                                        ? 'Unable to load Stripe plan'
                                        : 'n/a')}
                            </UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Stripe Status</UserDetailsKey>
                            <UserDetailsValue>
                                {details.profile.stripeSubscription?.status
                                    ? formatLabel(details.profile.stripeSubscription.status)
                                    : 'n/a'}
                                {details.profile.stripeSubscription?.cancelAtPeriodEnd
                                    ? ' (Cancels at period end)'
                                    : ''}
                            </UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Stripe Price</UserDetailsKey>
                            <UserDetailsValue>
                                {details.profile.stripeSubscription?.priceId || 'n/a'}
                            </UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Stripe Subscription</UserDetailsKey>
                            <UserDetailsValue>{details.profile.stripeSubscriptionId || 'n/a'}</UserDetailsValue>
                        </UserDetailsItem>
                        {details.profile.stripeSubscription?.error ? (
                            <UserDetailsItem>
                                <UserDetailsKey>Stripe Lookup</UserDetailsKey>
                                <UserDetailsValue>{details.profile.stripeSubscription.error}</UserDetailsValue>
                            </UserDetailsItem>
                        ) : null}
                        <UserDetailsItem>
                            <UserDetailsKey>Stripe Customer</UserDetailsKey>
                            <UserDetailsValue>
                                {details.profile.stripeCustomerUrl ? (
                                    <a
                                        href={details.profile.stripeCustomerUrl}
                                        target='_blank'
                                        rel='noreferrer'>
                                        View in Stripe
                                    </a>
                                ) : (
                                    details.profile.stripeCustomerId || 'n/a'
                                )}
                            </UserDetailsValue>
                        </UserDetailsItem>
                        <UserDetailsItem>
                            <UserDetailsKey>Billing Actions</UserDetailsKey>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <Button
                                    type='button'
                                    disabled={planActionLoading || stripeRefreshLoading}
                                    onClick={() => setShowBillingActionsDialog(true)}>
                                    Manage Billing
                                </Button>
								<SecondaryButton
                                    type='button'
                                    disabled={planActionLoading || stripeRefreshLoading}
                                    onClick={() => void handleRefreshSubscriptionFromStripe()}>
                                    {stripeRefreshLoading ? 'Refreshing...' : 'Refresh From Stripe'}
								</SecondaryButton>
								{details.profile.hasStripeSubscription ? (
									<SecondaryButton
										type='button'
										disabled={planActionLoading || stripeRefreshLoading}
										onClick={() => setShowCancelConfirm(true)}>
										Cancel Subscription
									</SecondaryButton>
								) : null}
								{details.profile.stripeCustomerId || details.profile.stripeSubscriptionId ? (
									<SecondaryButton
										type='button'
										disabled={planActionLoading || stripeRefreshLoading}
										onClick={handleOpenClearStripeLinkage}>
										Clear Stale Stripe Linkage
									</SecondaryButton>
								) : null}
                            </div>
                        </UserDetailsItem>
                    </UserDetailsGrid>

					<div style={{ marginTop: 20 }}>
						<Label>Internal Access Grants</Label>
						<p style={{ margin: '4px 0 12px' }}>
							Complimentary Maintley access issued outside Stripe. A grant does not create a Stripe customer, subscription, invoice, renewal, or charge.
						</p>
					</div>
					<UserDetailsGrid>
						<UserDetailsItem>
							<UserDetailsKey>Active Internal Grants</UserDetailsKey>
							<UserDetailsValue>{String(details.access?.activeGrantCount ?? 0)}</UserDetailsValue>
						</UserDetailsItem>
						<UserDetailsItem>
							<UserDetailsKey>Grant Administration</UserDetailsKey>
							<div style={{ display: 'grid', gap: 8 }}>
								<UserDetailsValue>
									{!details.access?.grantAdministration
										? 'Grant administration is unavailable until the updated Firebase Functions are deployed.'
										: !details.access.grantAdministration.enabled
											? 'Disabled by the internal entitlement-grant rollout flag.'
										: details.access.grantAdministration.canManage
											? details.access.grantAdministration.isMaintleyOwner
												? 'Maintley owner: unrestricted grant administration, including self-grants and lifetime access.'
												: 'Authorized grant manager. Self-grants are prohibited.'
											: 'Requires the entitlement_grants.manage Maintley permission.'}
								</UserDetailsValue>
								{details.access?.grantAdministration?.targetRestrictionReason ? (
									<ErrorText>{details.access.grantAdministration.targetRestrictionReason}</ErrorText>
								) : null}
								<Button
									type='button'
									disabled={
										grantActionLoading ||
										!details.access?.grantAdministration?.enabled ||
										!details.access?.grantAdministration?.canManage ||
										details.access?.grantAdministration?.targetAllowed === false
									}
									onClick={handleOpenGrantDialog}>
									Manage Internal Grants
								</Button>
							</div>
						</UserDetailsItem>
						{details.access?.grants?.map((grant) => (
							<UserDetailsItem key={grant.grantId}>
								<UserDetailsKey>{formatLabel(grant.programId || grant.grantId)}</UserDetailsKey>
								<UserDetailsValue>
									{formatLabel(grant.state)} · {formatLabel(grant.kind)}
									{grant.bundleId ? ` · ${formatLabel(grant.bundleId)}` : ''}
									{grant.endsAt ? ` · Ends ${formatDate(grant.endsAt)}` : ''}
								</UserDetailsValue>
							</UserDetailsItem>
						))}
					</UserDetailsGrid>

					<div style={{ marginTop: 20 }}>
						<Label>Resolved Product Access</Label>
						<p style={{ margin: '4px 0 12px' }}>
							The access Maintley currently resolves from the Stripe billing plan plus any active internal grants.
						</p>
					</div>
					<UserDetailsGrid>
						<UserDetailsItem>
							<UserDetailsKey>Billing Base Plan</UserDetailsKey>
							<UserDetailsValue>{formatLabel(details.access?.basePlan || details.profile.subscriptionPlan)}</UserDetailsValue>
						</UserDetailsItem>
						<UserDetailsItem>
							<UserDetailsKey>Effective Bundles</UserDetailsKey>
							<UserDetailsValue>
								{details.access?.effectiveBundles?.length
									? details.access.effectiveBundles.map(formatLabel).join(', ')
									: formatLabel(details.profile.subscriptionPlan)}
							</UserDetailsValue>
						</UserDetailsItem>
						<UserDetailsItem>
							<UserDetailsKey>Homeowner+ Trial</UserDetailsKey>
							<UserDetailsValue>
								{details.access?.homeownerPlusTrial
									? `${formatLabel(details.access.homeownerPlusTrial.state)} through ${formatDate(details.access.homeownerPlusTrial.endsAt)}`
									: 'Not issued'}
							</UserDetailsValue>
						</UserDetailsItem>
					</UserDetailsGrid>

					{details.access?.timeline?.length ? (
						<>
							<Label>Access Timeline</Label>
							<UserDetailsGrid>
								{details.access.timeline.map((event) => (
									<UserDetailsItem key={event.id}>
										<UserDetailsKey>{formatDate(event.createdAt || undefined)}</UserDetailsKey>
										<UserDetailsValue>
											{formatLabel(event.action)}{event.reason ? ` — ${event.reason}` : ''}
										</UserDetailsValue>
									</UserDetailsItem>
								))}
							</UserDetailsGrid>
						</>
					) : null}

					{details.access?.lifecycleDeliveries?.length ? (
						<>
							<Label>Access Lifecycle Deliveries</Label>
							<UserDetailsGrid>
								{details.access.lifecycleDeliveries.map((delivery) => (
									<UserDetailsItem key={delivery.id}>
										<UserDetailsKey>
											{formatLabel(delivery.milestone)} · {formatLabel(delivery.status)}
										</UserDetailsKey>
										<UserDetailsValue>
											{delivery.outcome ? formatLabel(delivery.outcome) : 'Pending'}
											{` · ${delivery.attempts} attempt${delivery.attempts === 1 ? '' : 's'}`}
											{delivery.sentAt || delivery.updatedAt
												? ` · ${formatDate(delivery.sentAt || delivery.updatedAt || undefined)}`
												: ''}
										</UserDetailsValue>
									</UserDetailsItem>
								))}
							</UserDetailsGrid>
						</>
					) : null}

                    <div>
                        <Label>Support History</Label>
                        <UserActivityList>
                            {details.recentSupportRequests.length === 0 ? (
                                <UserActivityItem>No support requests found.</UserActivityItem>
                            ) : (
                                details.recentSupportRequests.map((entry) => (
                                    <UserActivityItem key={`support-${entry.id}`}>
                                        {entry.ticketNumber ? `${entry.ticketNumber} - ` : ''}
                                        {entry.subject} ({formatLabel(entry.status)})
                                        {entry.createdAt ? ` | ${formatDate(entry.createdAt)}` : ''}
                                    </UserActivityItem>
                                ))
                            )}
                        </UserActivityList>
                    </div>

                    <div>
                        <Label>Recent Activity</Label>
                        <UserActivityList>
                            {details.recentActivity.length === 0 ? (
                                <UserActivityItem>No recent activity available.</UserActivityItem>
                            ) : (
                                details.recentActivity.map((entry, index) => (
                                    <UserActivityItem key={`activity-${index}`}>
                                        {formatLabel(entry.source)}: {entry.description}
                                        {entry.createdAt ? ` | ${formatDate(entry.createdAt)}` : ''}
                                    </UserActivityItem>
                                ))
                            )}
                        </UserActivityList>
                    </div>

                    <div>
                        <Label>Error History</Label>
                        <UserActivityList>
                            {details.recentErrors.length === 0 ? (
                                <UserActivityItem>No recent bug reports.</UserActivityItem>
                            ) : (
                                details.recentErrors.map((entry) => (
                                    <UserActivityItem key={`error-${entry.id}`}>
                                        {entry.ticketNumber ? `${entry.ticketNumber} - ` : ''}
                                        {entry.subject} ({formatLabel(entry.status)})
                                        {entry.pageUrl ? ` | Route: ${entry.pageUrl}` : ''}
                                        {entry.appVersion ? ` | Version: ${entry.appVersion}` : ''}
                                        {entry.createdAt ? ` | ${formatDate(entry.createdAt)}` : ''}
                                    </UserActivityItem>
                                ))
                            )}
                        </UserActivityList>
                    </div>

                    <div>
                        <Label>Notification History</Label>
                        <UserActivityList>
                            {details.recentNotifications.length === 0 ? (
                                <UserActivityItem>No recent notifications found.</UserActivityItem>
                            ) : (
                                details.recentNotifications.map((entry) => (
                                    <UserActivityItem key={`notification-${entry.id}`}>
                                        {entry.title}
                                        {entry.status ? ` (${formatLabel(entry.status)})` : ''}
                                        {entry.message ? ` | ${entry.message}` : ''}
                                        {entry.createdAt ? ` | ${formatDate(entry.createdAt)}` : ''}
                                    </UserActivityItem>
                                ))
                            )}
                        </UserActivityList>
                    </div>
                </UserDetailsPanel>
            ) : selectedRow && detailLoading ? (
                <SubTitle>Loading inspection details for {selectedRow.displayName}...</SubTitle>
            ) : null}

            <GenericModal
                isOpen={showBillingActionsDialog}
				title='Manage Stripe billing'
                onClose={() => {
                    if (!planActionLoading) {
                        setShowBillingActionsDialog(false);
                    }
                }}
                compact>
                <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                        <p style={{ margin: '0 0 6px' }}>
                            <strong>{details?.profile.displayName || selectedRow?.displayName || 'Selected user'}</strong>
                        </p>
                        <p style={{ margin: 0 }}>
                            Maintley: {formatLabel(details?.profile.subscriptionPlan || 'none')} (
                            {formatLabel(details?.profile.subscriptionStatus || 'none')})
                        </p>
                        <p style={{ margin: '4px 0 0' }}>
                            Stripe:{' '}
                            {details?.profile.stripeSubscription?.planLabel ||
                                (details?.profile.hasStripeSubscription ? 'Connected' : 'No subscription on record')}
                        </p>
						<p style={{ margin: '10px 0 0', padding: 10, background: '#FAFAF8', border: '1px solid #3FCC7C', borderRadius: 8 }}>
							This workflow manages paid billing only. For complimentary access without a billing relationship, use the separate Internal Access Grants workflow when grant administration is enabled.
						</p>
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
						<Label>Stripe subscription or Checkout</Label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                            <div>
                                <Label>Plan</Label>
                                <Select
                                    value={selectedPlan}
                                    onChange={(event) => setSelectedPlan(event.target.value)}>
                                    {PLAN_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <div>
                                <Label>Billing cycle</Label>
                                <Select
                                    value={checkoutBillingCycle}
                                    onChange={(event) =>
                                        setCheckoutBillingCycle(event.target.value as 'month' | 'year')
                                    }>
                                    <option value='month'>Monthly</option>
                                    <option value='year'>Annual</option>
                                </Select>
                            </div>
                            <div>
								<Label>Add Stripe trial days</Label>
                                <Input
                                    type='number'
                                    min={1}
                                    max={90}
									placeholder={details?.profile.stripeSubscription?.status === 'trialing' ? 'Optional' : 'Requires trialing Stripe subscription'}
                                    value={trialDays}
									disabled={details?.profile.stripeSubscription?.status !== 'trialing'}
                                    onChange={(event) => setTrialDays(event.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Coupon code</Label>
                                <Input
                                    type='text'
                                    placeholder='Optional'
                                    value={checkoutCouponCode}
                                    onChange={(event) => setCheckoutCouponCode(event.target.value.toUpperCase())}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
						<p style={{ margin: 0 }}>
							{details?.profile.hasStripeSubscription
								? 'Changes update the existing Stripe subscription first, then refresh Maintley.'
								: 'This account has no Stripe subscription. Selecting a paid plan creates a Checkout link; it does not grant paid access immediately.'}
						</p>
                        <Button
                            type='button'
                            disabled={planActionLoading || !hasBillingUpdatesToApply}
                            onClick={() => void handleApplyBillingUpdates()}>
							{planActionLoading
								? 'Applying...'
								: details?.profile.hasStripeSubscription
									? 'Update Stripe Billing'
									: 'Create Stripe Checkout Link'}
                        </Button>
                        {checkoutLink ? (
                            <Button
                                type='button'
                                disabled={planActionLoading}
                                onClick={() => void handleCopyCheckoutLink()}>
                                Copy Checkout Link
                            </Button>
                        ) : null}
                    </div>

                </div>
            </GenericModal>

			<GenericModal
				isOpen={showGrantDialog}
				title='Manage internal access grant'
				onClose={() => {
					if (!grantActionLoading) setShowGrantDialog(false);
				}}
				compact>
				<div style={{ display: 'grid', gap: 16 }}>
					{localError ? <ErrorText role='alert'>{localError}</ErrorText> : null}
					<div style={{ padding: 12, background: '#FAFAF8', border: '1px solid #3FCC7C', borderRadius: 8 }}>
						<strong>No Stripe billing relationship</strong>
						<p style={{ margin: '6px 0 0' }}>
							This workflow changes Maintley product access only. It does not create or modify a Stripe customer, subscription, invoice, renewal, payment method, or charge.
						</p>
					</div>

					<div>
						<Label>Action</Label>
						<Select
							value={grantAction}
							onChange={(event) => {
								setGrantAction(event.target.value as AdminEntitlementGrantAction);
								resetGrantPreview();
							}}>
							<option value='create'>Create grant</option>
							<option value='extend'>Extend grant</option>
							<option value='revoke'>Revoke grant</option>
						</Select>
					</div>

					{grantAction === 'create' ? (
						<>
							<div>
								<Label>Approved program</Label>
								<Select
									value={grantProgramId}
									onChange={(event) => {
										const programId = event.target.value;
										const program = details?.access?.grantAdministration?.programs.find(
											(candidate) => candidate.programId === programId,
										);
										setGrantProgramId(programId);
										setGrantKind(program?.allowedKinds?.[0] || 'temporary');
										setGrantDurationDays(String(program?.defaultDurationDays || 30));
										resetGrantPreview();
									}}>
									{details?.access?.grantAdministration?.programs.map((program) => (
										<option key={program.programId} value={program.programId}>
											{program.label}{program.ownerOnly ? ' — Maintley owner only' : ''}
										</option>
									))}
								</Select>
							</div>
							<div>
								<Label>Grant type</Label>
								<Select
									value={grantKind}
									onChange={(event) => {
										setGrantKind(event.target.value as 'temporary' | 'permanent');
										resetGrantPreview();
									}}>
									{details?.access?.grantAdministration?.programs
										.find((program) => program.programId === grantProgramId)
										?.allowedKinds.map((kind) => (
											<option key={kind} value={kind}>{formatLabel(kind)}</option>
										))}
								</Select>
							</div>
						</>
					) : (
						<div>
							<Label>Existing grant</Label>
							<Select
								value={selectedGrantId}
								onChange={(event) => {
									setSelectedGrantId(event.target.value);
									resetGrantPreview();
								}}>
								<option value=''>Select a grant</option>
								{details?.access?.grants
									.filter((grant) =>
										grantAction === 'extend'
											? grant.state === 'active' && grant.kind === 'temporary'
											: ['active', 'scheduled'].includes(grant.state),
									)
									.map((grant) => (
										<option key={grant.grantId} value={grant.grantId}>
											{formatLabel(grant.programId)} — {formatLabel(grant.state)}
										</option>
									))}
							</Select>
						</div>
					)}

					{grantAction !== 'revoke' && grantKind !== 'permanent' ? (
						<div>
							<Label>{grantAction === 'extend' ? 'Additional days' : 'Duration in days'}</Label>
							<Input
								type='number'
								min={1}
								value={grantDurationDays}
								onChange={(event) => {
									setGrantDurationDays(event.target.value);
									resetGrantPreview();
								}}
							/>
						</div>
					) : null}

					<div>
						<Label>Required audit reason</Label>
						<Input
							type='text'
							placeholder='Explain why this access change is authorized'
							value={grantReason}
							onChange={(event) => setGrantReason(event.target.value)}
						/>
					</div>
					<div>
						<Label>Request ID</Label>
						<Input type='text' value={grantRequestId} readOnly />
					</div>

					<Button
						type='button'
						disabled={
							grantActionLoading ||
							grantReason.trim().length < 10 ||
							(grantAction === 'create' ? !grantProgramId : !selectedGrantId)
						}
						onClick={() => void handlePreviewGrant()}>
						{grantActionLoading ? 'Checking...' : 'Preview Access Change'}
					</Button>
					<SubTitle>
						Previewing does not change access. Review the result below, enter the confirmation phrase, and apply the grant to save it.
					</SubTitle>

					{grantPreview ? (
						<div ref={grantPreviewRef} style={{ display: 'grid', gap: 10, padding: 12, border: '1px solid #3FCC7C', borderRadius: 8 }}>
							<strong>{grantPreview.programLabel}</strong>
							<div>
								Current bundles: {grantPreview.currentAccess.effectiveBundles.map(formatLabel).join(', ') || 'None'}
							</div>
							<div>
								Resulting bundles: {grantPreview.proposedAccess.effectiveBundles.map(formatLabel).join(', ') || 'None'}
							</div>
							<div>
								Property limit: {grantPreview.currentAccess.propertyLimit} → {grantPreview.proposedAccess.propertyLimit}
							</div>
							<div>
								Active grants: {grantPreview.currentAccess.activeGrantIds.length} → {grantPreview.proposedAccess.activeGrantIds.length}
							</div>
							<div>
								<Label>Type “{grantPreview.confirmationPhrase}” to confirm</Label>
								<Input
									type='text'
									value={grantConfirmation}
									onChange={(event) => setGrantConfirmation(event.target.value)}
								/>
							</div>
							<Button
								type='button'
								disabled={grantActionLoading || grantConfirmation !== grantPreview.confirmationPhrase}
								onClick={() => void handleApplyGrant()}>
								{grantActionLoading ? 'Applying...' : `${formatLabel(grantAction)} Internal Access`}
							</Button>
						</div>
					) : null}
				</div>
			</GenericModal>

            <GenericModal
                isOpen={showCancelConfirm}
                title='Cancel subscription?'
                onClose={() => {
                    if (!planActionLoading) {
                        setShowCancelConfirm(false);
                    }
                }}
                primaryButtonLabel={planActionLoading ? 'Cancelling...' : 'Cancel Subscription'}
                primaryButtonAction={handleConfirmCancelSubscription}
                secondaryButtonLabel='Keep Subscription'
                secondaryButtonAction={() => setShowCancelConfirm(false)}
                primaryButtonDisabled={planActionLoading}
                isLoading={planActionLoading}
                showActions
                compact>
                <p>
                    This will mark the subscription as cancelled for{' '}
                    <strong>{details?.profile.displayName || selectedRow?.displayName || 'this user'}</strong>.
                </p>
                <p>
                    Property records and support history will stay in place. If this customer has an
                    active Stripe subscription, Stripe will {syncStripe ? '' : 'not '}be updated.
                </p>
                <p>
                    Current plan: {formatLabel(details?.profile.subscriptionPlan || 'none')} (
                    {formatLabel(details?.profile.subscriptionStatus || 'none')}).
                </p>
            </GenericModal>

			<GenericModal
				isOpen={showClearStripeConfirm}
				title='Clear stale Stripe linkage?'
				onClose={() => {
					if (!planActionLoading) setShowClearStripeConfirm(false);
				}}
				compact>
				<div style={{ display: 'grid', gap: 14 }}>
					{localError ? <ErrorText role='alert'>{localError}</ErrorText> : null}
					<p style={{ margin: 0 }}>
						This does not delete anything in Stripe. It verifies that the Stripe customer is deleted or missing and that the subscription is cancelled, expired, or missing.
					</p>
					<p style={{ margin: 0 }}>
						Maintley billing will return to the free Homeowner plan. Internal entitlement grants remain unchanged.
					</p>
					<div>
						<Label>Stored Stripe customer</Label>
						<UserDetailsValue>{details?.profile.stripeCustomerId || 'None'}</UserDetailsValue>
					</div>
					<div>
						<Label>Stored Stripe subscription</Label>
						<UserDetailsValue>{details?.profile.stripeSubscriptionId || 'None'}</UserDetailsValue>
					</div>
					<div>
						<Label>Required audit reason</Label>
						<Input
							type='text'
							placeholder='Explain why this stale billing relationship is being cleared'
							value={stripeClearReason}
							onChange={(event) => setStripeClearReason(event.target.value)}
						/>
					</div>
					<div>
						<Label>Type “CLEAR STRIPE LINK” to confirm</Label>
						<Input
							type='text'
							value={stripeClearConfirmation}
							onChange={(event) => setStripeClearConfirmation(event.target.value)}
						/>
					</div>
					<Button
						type='button'
						disabled={
							planActionLoading ||
							stripeClearReason.trim().length < 10 ||
							stripeClearConfirmation !== 'CLEAR STRIPE LINK'
						}
						onClick={() => void handleClearStripeLinkage()}>
						{planActionLoading ? 'Verifying Stripe...' : 'Verify and Clear Linkage'}
					</Button>
				</div>
			</GenericModal>
        </UserPanelWrap>
    );
};
