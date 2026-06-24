import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isNativeApp } from '../../utils/platform';
import { openSubscriptionManagementInBrowser } from '../../utils/authLinks';

type LockedFeatureCalloutProps = {
	title: string;
	description: string;
	upgradeLabel?: string;
	showUpgradeAction?: boolean;
	compact?: boolean;
};

export const LockedFeatureCallout: React.FC<LockedFeatureCalloutProps> = ({
	title,
	description,
	upgradeLabel = 'Upgrade to unlock',
	showUpgradeAction = true,
	compact = false,
}) => {
	const navigate = useNavigate();
	const nativeApp = isNativeApp();
	const resolvedDescription = nativeApp
		? description
			.replace(/Upgrade to [^.]+?\./gi, 'Manage this in the web account center.')
			.replace(/by upgrading to [^.]+?\./gi, 'in the web account center.')
			.replace(/\s{2,}/g, ' ')
		: description;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: compact ? 'center' : 'flex-start',
				justifyContent: 'space-between',
				gap: 12,
				padding: compact ? '10px 12px' : '14px 16px',
				borderRadius: 12,
				border: '1px solid #fcd34d',
				background: '#fffbeb',
				marginBottom: compact ? 12 : 16,
			}}>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
				<strong style={{ fontSize: compact ? 13 : 14, color: '#92400e' }}>{title}</strong>
				<span style={{ fontSize: compact ? 12 : 13, color: '#92400e', lineHeight: 1.45 }}>
					{resolvedDescription}
				</span>
			</div>
			{showUpgradeAction && (
				<button
					type='button'
					onClick={() => {
						if (!nativeApp) {
							navigate('/paywall');
							return;
						}
						void openSubscriptionManagementInBrowser();
					}}
					style={{
						border: '1px solid #f59e0b',
						background: '#f59e0b',
						color: '#fff',
						borderRadius: 999,
						padding: compact ? '6px 10px' : '8px 12px',
						fontSize: compact ? 12 : 13,
						fontWeight: 700,
						cursor: 'pointer',
						whiteSpace: 'nowrap',
					}}>
					{nativeApp ? 'Manage Subscription' : upgradeLabel}
				</button>
			)}
		</div>
	);
};
