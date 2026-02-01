import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
	shouldShowUpdateNotification,
	dismissUpdateNotification,
	downloadAPK,
	getAvailableVersion,
	getCurrentAppVersion,
	checkForUpdates,
} from '../../../utils/versionCheck';
import { isNativeApp } from '../../../utils/platform';

const NotificationWrapper = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

	@media (max-width: 768px) {
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
		color: #667eea;
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

const HelpLink = styled.button`
	background: none;
	border: none;
	color: rgba(255, 255, 255, 0.9);
	font-size: 12px;
	text-decoration: underline;
	cursor: pointer;
	padding: 0;
	margin-top: 8px;
	align-self: flex-start;

	&:hover {
		color: white;
	}
`;

const HelpOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(3px);
	z-index: 1100;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 16px;
`;

const HelpModal = styled.div`
	background: white;
	color: #1f2937;
	border-radius: 12px;
	max-width: 520px;
	width: 100%;
	padding: 20px 22px;
	box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
`;

const HelpTitle = styled.h4`
	margin: 0 0 10px 0;
	font-size: 16px;
	font-weight: 700;
`;

const HelpText = styled.p`
	margin: 0 0 10px 0;
	font-size: 14px;
	line-height: 1.5;
`;

const HelpList = styled.ol`
	margin: 0 0 12px 18px;
	font-size: 14px;
	line-height: 1.5;
`;

const HelpActions = styled.div`
	display: flex;
	justify-content: flex-end;
	margin-top: 12px;
`;

interface UpdateNotificationProps {
	onDismiss?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
	onDismiss,
}) => {
	const [show, setShow] = useState(false);
	const [showHelp, setShowHelp] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const runCheck = async () => {
			try {
				await checkForUpdates();
			} catch (error) {
				console.error('Error checking for updates:', error);
			}

			if (isMounted) {
				// Only show if on native app
				setShow(isNativeApp() && shouldShowUpdateNotification());
			}
		};

		runCheck();

		return () => {
			isMounted = false;
		};
	}, []);

	// The handleDownload function is not related to push notifications, so it remains unchanged.
	const handleDownload = async () => {
		const confirmed = window.confirm(
			'Before downloading:\n\n' +
				'Android requires enabling installs from unknown sources for APKs not from the Play Store.\n\n' +
				'Instructions (may vary by device):\n' +
				'1) Open Settings → Security (or Privacy)\n' +
				'2) Enable "Install unknown apps" / "Unknown sources"\n' +
				'3) Select your browser and allow installs\n\n' +
				'Continue to download the APK?',
		);

		if (!confirmed) {
			return;
		}

		await downloadAPK();
		handleDismiss();
	};

	const handleDismiss = () => {
		dismissUpdateNotification();
		setShow(false);
		onDismiss?.();
	};

	const handleOpenHelp = () => {
		setShowHelp(true);
	};

	const handleCloseHelp = () => {
		setShowHelp(false);
	};

	if (!show) {
		return null;
	}

	const availableVersion = getAvailableVersion();
	const currentVersion = getCurrentAppVersion();

	return (
		<NotificationWrapper>
			<CloseButton onClick={handleDismiss}>×</CloseButton>
			<NotificationTitle>
				📱 Update Available
				<span
					style={{
						fontWeight: 400,
						fontSize: 12,
						display: 'block',
						marginTop: 2,
					}}>
					Current: v{currentVersion}{' '}
					{availableVersion && `→ Available: v${availableVersion}`}
				</span>
			</NotificationTitle>
			<NotificationText>
				A new version of My Property Manager is ready to download. Get the
				latest features and improvements.
			</NotificationText>
			<HelpLink onClick={handleOpenHelp}>
				Need help enabling installs from unknown sources?
			</HelpLink>
			<ButtonGroup>
				<Button variant='secondary' onClick={handleDismiss}>
					Remind Later
				</Button>
				<Button variant='primary' onClick={handleDownload}>
					Download Now
				</Button>
			</ButtonGroup>
			<VersionInfo>
				Current: v{currentVersion}{' '}
				{availableVersion && `→ Available: v${availableVersion}`}
			</VersionInfo>
			{showHelp && (
				<HelpOverlay onClick={handleCloseHelp}>
					<HelpModal onClick={(event) => event.stopPropagation()}>
						<HelpTitle>Installing Updates Safely</HelpTitle>
						<HelpText>
							Android blocks APK installs from outside the Play Store by
							default. You can allow it for your browser just while installing
							the update.
						</HelpText>
						<HelpText>
							Your data stays private—this update doesn’t request new access to
							your personal information.
						</HelpText>
						<HelpList>
							<li>
								Open <strong>Settings</strong> → <strong>Security</strong> (or
								<strong>Privacy</strong>).
							</li>
							<li>
								Tap <strong>Install unknown apps</strong> or{' '}
								<strong>Unknown sources</strong>.
							</li>
							<li>
								Select your browser (Chrome, Samsung Internet, etc.) and toggle
								<strong>Allow</strong>.
							</li>
							<li>After installing, you can turn this back off.</li>
						</HelpList>
						<HelpText>
							If you get stuck, close this popup and try the download again.
						</HelpText>
						<HelpActions>
							<Button variant='primary' onClick={handleCloseHelp}>
								Got it
							</Button>
						</HelpActions>
					</HelpModal>
				</HelpOverlay>
			)}
		</NotificationWrapper>
	);
};

export default UpdateNotification;
