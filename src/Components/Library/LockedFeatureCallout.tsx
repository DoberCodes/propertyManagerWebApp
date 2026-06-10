import React from 'react';
import { useNavigate } from 'react-router-dom';

type LockedFeatureCalloutProps = {
	title: string;
	description: string;
	upgradeLabel?: string;
	compact?: boolean;
};

export const LockedFeatureCallout: React.FC<LockedFeatureCalloutProps> = ({
	title,
	description,
	upgradeLabel = 'Upgrade to unlock',
	compact = false,
}) => {
	const navigate = useNavigate();

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
					{description}
				</span>
			</div>
			<button
				type='button'
				onClick={() => navigate('/paywall')}
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
				{upgradeLabel}
			</button>
		</div>
	);
};
