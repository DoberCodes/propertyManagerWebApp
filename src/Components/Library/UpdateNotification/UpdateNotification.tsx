import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
	shouldShowUpdateNotification,
	dismissUpdateNotification,
	openGooglePlayUpdate,
	getAvailableVersion,
	getCurrentAppVersion,
	checkForUpdates,
} from '../../../utils/versionCheck';
import { isNativeApp } from '../../../utils/platform';
import { COLORS } from '../../../constants/colors';

const NotificationWrapper = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	background: ${COLORS.gradientPrimary};
	color: white;
	padding: 20px 24px;
	border-radius: 12px;
	box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
	max-width: 400px;
	z-index: 1000;
	animation: slideIn 0.3s ease-out;

	@keyframes slideIn {
		from {
			transform: translateX(400px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@media (max-width: 1024px) {
		left: 10px;
		right: 10px;
		max-width: none;
		bottom: 10px;
	}
`;

const NotificationTitle = styled.h4`
	margin: 0 0 8px 0;
	font-size: 16px;
	font-weight: 600;
`;

const NotificationText = styled.p`
	margin: 0 0 16px 0;
	font-size: 14px;
	line-height: 1.5;
	opacity: 0.95;
`;

const ButtonGroup = styled.div`
	display: flex;
	gap: 10px;
	justify-content: flex-end;

	@media (max-width: 480px) {
		flex-direction: column;
	}
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
	padding: 10px 16px;
	border: none;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;

	${(props) =>
		props.variant === 'primary'
			? `
		background: white;
		color: ${COLORS.primary};
		&:hover {
			background: #f0f0f0;
			transform: translateY(-1px);
		}
	`
			: `
		background: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		&:hover {
			background: rgba(255, 255, 255, 0.3);
		}
	`}
`;

const CloseButton = styled.button`
	position: absolute;
	top: 10px;
	right: 10px;
	background: rgba(255, 255, 255, 0.2);
	border: none;
	color: white;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	cursor: pointer;
	font-size: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.3);
	}
`;

const VersionInfo = styled.div`
	font-size: 12px;
	opacity: 0.8;
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid rgba(255, 255, 255, 0.2);
`;

interface UpdateNotificationProps {
	onDismiss?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
	onDismiss,
}) => {
	const [show, setShow] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const runCheck = async () => {
			try {
				await checkForUpdates();
			} catch (error) {
				console.error('Error checking for updates:', error);
			}

			if (isMounted) {
				setShow(isNativeApp() && shouldShowUpdateNotification());
			}
		};

		runCheck();

		return () => {
			isMounted = false;
		};
	}, []);

	const handleUpdate = async () => {
		await openGooglePlayUpdate();
		handleDismiss();
	};

	const handleDismiss = () => {
		dismissUpdateNotification();
		setShow(false);
		onDismiss?.();
	};

	if (!show) {
		return null;
	}

	const availableVersion = getAvailableVersion();
	const currentVersion = getCurrentAppVersion();

	return (
		<NotificationWrapper>
			<CloseButton aria-label='Dismiss update' onClick={handleDismiss}>
				&times;
			</CloseButton>
			<NotificationTitle>
				Update Available
				<span
					style={{
						fontWeight: 400,
						fontSize: 12,
						display: 'block',
						marginTop: 2,
					}}>
					Current: v{currentVersion}{' '}
					{availableVersion && `-> Available: v${availableVersion}`}
				</span>
			</NotificationTitle>
			<NotificationText>
				A new version of Maintley is ready. Open Google Play to update the
				Android app.
			</NotificationText>
			<ButtonGroup>
				<Button variant='secondary' onClick={handleDismiss}>
					Remind Later
				</Button>
				<Button variant='primary' onClick={handleUpdate}>
					Open Google Play
				</Button>
			</ButtonGroup>
			<VersionInfo>
				Current: v{currentVersion}{' '}
				{availableVersion && `-> Available: v${availableVersion}`}
			</VersionInfo>
		</NotificationWrapper>
	);
};

export default UpdateNotification;
