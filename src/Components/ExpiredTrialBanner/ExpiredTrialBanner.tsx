import React from 'react';
import { isNativeApp } from '../../utils/platform';

/**
 * Expired Access Warning Banner
 * Shows when a legacy access period has expired
 */
interface ExpiredTrialBannerProps {
	onUpgradeClick?: () => void;
}

export const ExpiredTrialBanner: React.FC<ExpiredTrialBannerProps> = ({
	onUpgradeClick,
}) => {
	const nativeApp = isNativeApp();

	return (
		<div
			style={{
				backgroundColor: '#dc3545',
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
					? 'Your current access period has ended. You can still view and export your data, but you cannot add new information. Manage your subscription in the web account center.'
					: 'Your current access period has ended. You can still view and export your data, but you cannot add new information. Upgrade to continue using premium features.'}
			</span>
			{onUpgradeClick && (
				<button
					onClick={onUpgradeClick}
					style={{
						background: 'white',
						color: '#dc3545',
						border: 'none',
						padding: '8px 16px',
						borderRadius: '4px',
						fontWeight: '600',
						cursor: 'pointer',
						marginLeft: '15px',
					}}>
					{nativeApp ? 'Manage Subscription' : 'Upgrade Now'}
				</button>
			)}
		</div>
	);
};

export default ExpiredTrialBanner;
