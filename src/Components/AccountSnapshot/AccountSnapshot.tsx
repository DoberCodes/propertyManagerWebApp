import { useStorageUsage } from "Hooks/useStorageUsage";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "Redux/store/store";
import { filterPropertyGroupsByRole } from "utils/dataFilters";
import {
	getEffectiveSubscriptionPlanId,
	getRemainingPropertySlots,
	getSubscriptionPlanDetails,
} from "utils/subscriptionUtils";
import { formatStorageBytes } from 'utils/storageQuota';
import { TeamMember } from 'Redux/Slices/teamSlice';
import { useNavigate } from "react-router";
import { selectIsTeamMemberAccount, selectIsTenant } from "Redux/selectors/permissionSelectors";
import { isNativeApp } from 'utils/platform';
import { openSubscriptionManagementInBrowser } from 'utils/authLinks';
import { COLORS } from 'constants/colors';

interface AccountSnapshotProps {
	isSidebarOpen: boolean;
	setIsSidebarOpen?: (isOpen: boolean) => void;
}

export const AccountSnapshot: React.FC<AccountSnapshotProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
	const navigate = useNavigate();
	const nativeApp = isNativeApp();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isUserTenant = useSelector(selectIsTenant);
	const isTeamMemberAccount = useSelector(selectIsTeamMemberAccount);

	const propertyGroups = useSelector(
		(state: RootState) => state.propertyData.groups,
	);
	const teamGroups = useSelector((state: RootState) => state.team.groups);

	const teamMembers = React.useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);


	const {
		usage: storageUsage,
		isLoading: isStorageUsageLoading,
		refetch: refetchStorageUsage,
	} =
		useStorageUsage(currentUser, !isUserTenant && !isTeamMemberAccount);

	useEffect(() => {
		if (!isSidebarOpen || isUserTenant || isTeamMemberAccount) {
			return;
		}

		void refetchStorageUsage();
	}, [isSidebarOpen, isUserTenant, isTeamMemberAccount, refetchStorageUsage]);

	const filteredPropertyGroups = React.useMemo(
		() =>
			filterPropertyGroupsByRole(
				propertyGroups.map((group) => ({
					...group,
					properties: group.properties || [],
				})) as any[],
				currentUser,
				teamMembers.filter((member): member is TeamMember => member !== undefined),
			),
		[propertyGroups, currentUser, teamMembers],
	);



	const totalProperties = React.useMemo(
		() =>
			Array.from(
				new Set(
					filteredPropertyGroups
						.flatMap((group) => group.properties || [])
						.map((property) => property.id),
				),
			).length,
		[filteredPropertyGroups],
	);
	const effectivePlanId = getEffectiveSubscriptionPlanId(
		currentUser?.subscription,
		'homeowner',
	);



	const planDetails = getSubscriptionPlanDetails(effectivePlanId);

	const maxProperties = planDetails?.maxProperties ?? 1;
	const remainingSlots = currentUser?.subscription
		? getRemainingPropertySlots(currentUser.subscription, totalProperties)
		: 0;

	const propertyUsagePercent =
		maxProperties > 0 ? Math.min(100, (totalProperties / maxProperties) * 100) : 0;
	const hasPropertyCapacity = maxProperties > 0;
	const planRecordNoun = maxProperties <= 1 ? 'home' : 'property';
	const planUsageLabel = hasPropertyCapacity
		? `${totalProperties} of ${maxProperties}`
		: `${totalProperties}`;
	const planSlotLabel = !hasPropertyCapacity
		? 'Property creation is not included'
		: remainingSlots === 0 && totalProperties > maxProperties
			? `${totalProperties - maxProperties} over plan limit`
			: `${remainingSlots} ${planRecordNoun} slot${remainingSlots === 1 ? '' : 's'} available`;
	const planSubtitle = `Plan: ${planDetails?.name || 'Homeowner'}`;
	const storageUsagePercent = Math.min(100, storageUsage?.usagePercent || 0);
	const storageUsageLabel = isStorageUsageLoading
		? 'Loading storage...'
		: storageUsage && storageUsage.maxBytes > 0
			? `${formatStorageBytes(storageUsage.usedBytes)} of ${formatStorageBytes(
				storageUsage.maxBytes,
			)}`
			: 'Storage not included';
	const storageFileLabel = storageUsage
		? `${storageUsage.fileCount} of ${storageUsage.maxFiles} files`
		: '';

	return (
		<div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
			<div
				style={{
					border: '1px solid #cfdbe5',
					borderRadius: '12px',
					padding: '12px',
					background:
						'linear-gradient(180deg, #f4f8fb 0%, #ffffff 100%)',
					display: 'flex',
					flexDirection: 'column',
					gap: '8px',
				}}>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: '8px',
						alignItems: 'flex-start',
					}}>
					<div
						style={{
							fontSize: '15px',
							fontWeight: 800,
							color: '#111827',
						}}>
						Plan & Usage
					</div>
					<div
						style={{
							fontSize: '12px',
							fontWeight: 700,
							color: '#334155',
							background: '#e8eef3',
							border: '1px solid #d6e0e8',
							borderRadius: '999px',
							padding: '4px 10px',
							whiteSpace: 'nowrap',
						}}>
						{planUsageLabel}
					</div>
				</div>
				<div
					style={{
						fontSize: '13px',
						fontWeight: 600,
						color: '#475569',
						lineHeight: 1.35,
					}}>
					{planSubtitle}
				</div>
				<div
					style={{
						height: '7px',
						borderRadius: '999px',
						background: '#dfe7ee',
						overflow: 'hidden',
					}}>
					<div
						style={{
							height: '100%',
							width: `${propertyUsagePercent}%`,
							background: COLORS.gradientPrimary,
							transition: 'width 0.2s ease',
						}}
					/>
				</div>
				<div
					style={{
						fontSize: '13px',
						fontWeight: 500,
						color: '#475569',
						lineHeight: 1.4,
					}}>
					{planSlotLabel}
				</div>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						gap: '8px',
						alignItems: 'flex-start',
						marginTop: '4px',
					}}>
					<div
						style={{
							fontSize: '13px',
							fontWeight: 700,
							color: '#334155',
						}}>
						Storage
					</div>
					<div
						style={{
							fontSize: '12px',
							fontWeight: 700,
							color: '#334155',
							background: '#e8eef3',
							border: '1px solid #d6e0e8',
							borderRadius: '999px',
							padding: '4px 10px',
							whiteSpace: 'nowrap',
						}}>
						{storageFileLabel || 'Files'}
					</div>
				</div>
				<div
					style={{
						height: '7px',
						borderRadius: '999px',
						background: '#dfe7ee',
						overflow: 'hidden',
					}}>
					<div
						style={{
							height: '100%',
							width: `${storageUsagePercent}%`,
							background: COLORS.gradientPrimary,
							transition: 'width 0.2s ease',
						}}
					/>
				</div>
				<div
					style={{
						fontSize: '13px',
						fontWeight: 500,
						color: '#475569',
						lineHeight: 1.4,
					}}>
					{storageUsageLabel}
				</div>
				<button
					type='button'
					onClick={() => {
						if (!nativeApp) {
							navigate('/paywall');
						} else {
							void openSubscriptionManagementInBrowser();
						}
						if (setIsSidebarOpen) {
							setIsSidebarOpen(false);
						}
					}}
					style={{
						border: '1px solid #cfd8e3',
						background: '#ffffff',
						color: '#0f172a',
						fontSize: '13px',
						fontWeight: 600,
						borderRadius: '10px',
						padding: '8px 10px',
						cursor: 'pointer',
						width: '100%',
					}}>
					{nativeApp ? 'Manage Subscription' : 'Manage Plan'}
				</button>
			</div>
		</div>
	);
}
