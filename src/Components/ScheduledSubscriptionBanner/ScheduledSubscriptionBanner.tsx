import React from 'react';
import { SUBSCRIPTION_PLANS } from '../../constants/subscriptions';
import { COLORS } from '../../constants/colors';

/**
 * Scheduled Subscription Banner
 * Shows when user has pre-scheduled a subscription to start after a current access period ends
 */
interface ScheduledSubscriptionBannerProps {
	scheduledPlan: string;
	trialEndsAt: number;
	onManageClick?: () => void;
}

export const ScheduledSubscriptionBanner: React.FC<
	ScheduledSubscriptionBannerProps
> = ({ scheduledPlan, trialEndsAt, onManageClick }) => {
	const planName =
		Object.values(SUBSCRIPTION_PLANS).find((p) => p.id === scheduledPlan)
			?.name || scheduledPlan;

	const accessEndDate = new Date(trialEndsAt * 1000).toLocaleDateString(
		'en-US',
		{
			month: 'long',
			day: 'numeric',
			year: 'numeric',
		},
	);

	return (
		<div
			style={{
				backgroundColor: COLORS.primary,
				color: COLORS.textInverse,
				padding: '15px 20px',
				borderRadius: '6px',
				marginBottom: '20px',
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				fontSize: '14px',
				fontWeight: '500',
			}}>
			<span>
				✅ You're all set! Your <strong>{planName}</strong> subscription will
				automatically start on {accessEndDate} when your current access period
				ends. No interruption to your service!
			</span>
			{onManageClick && (
				<button
					onClick={onManageClick}
					style={{
						background: COLORS.bgWhite,
						color: COLORS.primary,
						border: 'none',
						padding: '8px 16px',
						borderRadius: '4px',
						fontWeight: '600',
						cursor: 'pointer',
						marginLeft: '15px',
						whiteSpace: 'nowrap',
					}}>
					Manage
				</button>
			)}
		</div>
	);
};

export default ScheduledSubscriptionBanner;
