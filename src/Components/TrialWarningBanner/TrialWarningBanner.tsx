import React from 'react';

/**
 * Trial Expiration Warning Banner
 * Shows when trial is about to expire (3 days or less)
 */
interface TrialWarningBannerProps {
	daysRemaining: number;
	onUpgradeClick?: () => void;
}

export const TrialWarningBanner: React.FC<TrialWarningBannerProps> = ({
	daysRemaining,
	onUpgradeClick,
}) => {
	if (daysRemaining > 3) {
		return null; // Don't show if more than 3 days
	}

	return (
		<div
			style={{
				backgroundColor: daysRemaining === 0 ? '#dc3545' : '#ff9800',
				color: 'white',
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
				{daysRemaining === 0
					? '⚠️ Your trial has expired. Upgrade now to continue using all features.'
					: `⏰ Your free trial expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Upgrade now to avoid interruption.`}
			</span>
			{onUpgradeClick && (
				<button
					onClick={onUpgradeClick}
					style={{
						background: 'white',
						color: daysRemaining === 0 ? '#dc3545' : '#ff9800',
						border: 'none',
						padding: '8px 16px',
						borderRadius: '4px',
						fontWeight: '600',
						cursor: 'pointer',
						marginLeft: '15px',
					}}>
					Upgrade Now
				</button>
			)}
		</div>
	);
};

export default TrialWarningBanner;
