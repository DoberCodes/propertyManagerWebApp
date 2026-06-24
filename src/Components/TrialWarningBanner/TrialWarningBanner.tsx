import React from 'react';
import { isNativeApp } from '../../utils/platform';

/**
 * Access Expiration Warning Banner
 * Shows when a legacy access period is about to expire (3 days or less)
 */
interface TrialWarningBannerProps {
	daysRemaining: number;
	onUpgradeClick?: () => void;
}

export const TrialWarningBanner: React.FC<TrialWarningBannerProps> = ({
	daysRemaining,
	onUpgradeClick,
}) => {
	const nativeApp = isNativeApp();

	// Don't show banner for unlimited access (-1) or access periods with more than 3 days remaining
	if (daysRemaining === -1 || daysRemaining > 3) {
		return null;
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
				{nativeApp
					? daysRemaining === 0
						? 'Your current access period has ended. Manage your subscription in the web account center.'
						: `Your current access period ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Manage subscription in the web account center if you need to make changes.`
					: daysRemaining === 0
						? 'Your current access period has ended. Upgrade to continue using premium features.'
						: `Your current access period ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Upgrade to avoid interruption.`}
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
					{nativeApp ? 'Manage in Browser' : 'Upgrade Now'}
				</button>
			)}
		</div>
	);
};

export default TrialWarningBanner;
