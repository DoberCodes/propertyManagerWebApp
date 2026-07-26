import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faDownload,
	faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { COLORS } from '../../constants/colors';
import { TYPOGRAPHY } from '../../constants/typography';
import {
	BeforeInstallPromptEvent,
	clearDeferredPwaInstallPrompt,
	getDeferredPwaInstallPrompt,
	subscribeToPwaInstallPrompt,
} from '../../services/pwaInstallPrompt';

const DISMISS_STORAGE_KEY = 'maintley_pwa_install_banner_dismissed_at';
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const getIsStandalone = () =>
	window.matchMedia('(display-mode: standalone)').matches ||
	(window.navigator as Navigator & { standalone?: boolean }).standalone === true;

const getIsIos = () => {
	const navigatorWithPlatform = window.navigator as Navigator & {
		userAgentData?: { platform?: string };
	};
	const platform =
		navigatorWithPlatform.userAgentData?.platform ||
		window.navigator.platform ||
		'';
	return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
		(/mac/i.test(platform) && window.navigator.maxTouchPoints > 1);
};

const getIsDismissed = () => {
	const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
	if (!raw) return false;
	const dismissedAt = Number(raw);
	if (!Number.isFinite(dismissedAt)) return false;
	return Date.now() - dismissedAt < DISMISS_DURATION_MS;
};

export const PwaInstallBanner = () => {
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isDismissed, setIsDismissed] = useState(() => getIsDismissed());
	const [isStandalone, setIsStandalone] = useState(() => getIsStandalone());
	const [showIosSteps, setShowIosSteps] = useState(false);
	const isIos = useMemo(() => getIsIos(), []);

	useEffect(() => {
		const handleAppInstalled = () => {
			window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
			setDeferredPrompt(null);
			clearDeferredPwaInstallPrompt();
			setIsDismissed(true);
			setIsStandalone(true);
		};

		window.addEventListener('appinstalled', handleAppInstalled);
		const unsubscribe = subscribeToPwaInstallPrompt(setDeferredPrompt);
		setDeferredPrompt(getDeferredPwaInstallPrompt());

		return () => {
			window.removeEventListener('appinstalled', handleAppInstalled);
			unsubscribe();
		};
	}, []);

	const canShow = !isStandalone && !isDismissed && (Boolean(deferredPrompt) || isIos);

	if (!canShow) {
		return null;
	}

	const handleDismiss = () => {
		window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
		setIsDismissed(true);
	};

	const handleInstall = async () => {
		if (!deferredPrompt) return;
		await deferredPrompt.prompt();
		const choice = await deferredPrompt.userChoice;
		setDeferredPrompt(null);
		clearDeferredPwaInstallPrompt();
		if (choice.outcome === 'accepted') {
			window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
			setIsDismissed(true);
		}
	};

	const handlePrimaryAction = () => {
		if (deferredPrompt) {
			void handleInstall();
			return;
		}
		if (isIos) {
			setShowIosSteps((current) => !current);
		}
	};

	const primaryActionLabel = deferredPrompt
		? 'Install Maintley'
		: 'Show Home Screen steps';

	return (
		<Banner role='region' aria-label='Install Maintley'>
			<BannerContent
				type='button'
				onClick={handlePrimaryAction}
				aria-label={primaryActionLabel}>
				<IconBadge aria-hidden='true' $clickable={Boolean(deferredPrompt) || isIos}>
					<FontAwesomeIcon icon={faDownload} />
				</IconBadge>
				<TextGroup>
					<BannerTitle>
						{isIos ? 'Add Maintley to your Home Screen' : 'Install Maintley'}
					</BannerTitle>
					<BannerText>
						{isIos
							? 'Open the Share menu, then choose Add to Home Screen to keep your property records one tap away.'
							: 'Keep your property records one tap away.'}
					</BannerText>
					{isIos && showIosSteps && (
						<IosSteps>
							Tap Share, choose Add to Home Screen, then tap Add.
						</IosSteps>
					)}
				</TextGroup>
			</BannerContent>
			<ActionGroup>
				{deferredPrompt && (
					<InstallButton type='button' onClick={handleInstall}>
						Install
					</InstallButton>
				)}
				{isIos && !deferredPrompt && (
					<InstallButton
						type='button'
						onClick={() => setShowIosSteps((current) => !current)}>
						How to install
						<FontAwesomeIcon icon={faChevronDown} aria-hidden='true' />
					</InstallButton>
				)}
				<DismissButton
					type='button'
					onClick={handleDismiss}
					aria-label='Dismiss install prompt'>
					<span>Not now</span>
					<FontAwesomeIcon icon={faXmark} aria-hidden='true' />
				</DismissButton>
			</ActionGroup>
		</Banner>
	);
};

const Banner = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 16px;
	padding: 12px 14px;
	border: 1px solid rgba(0, 158, 113, 0.22);
	border-radius: 8px;
	background: linear-gradient(
		135deg,
		rgba(4, 120, 87, 0.08) 0%,
		rgba(0, 158, 113, 0.12) 100%
	);
	color: ${COLORS.textPrimary};

	@media (max-width: 720px) {
		align-items: stretch;
		flex-direction: column;
	}
`;

const BannerContent = styled.button`
	display: flex;
	flex: 1;
	align-items: center;
	gap: 12px;
	min-width: 0;
	padding: 0;
	border: 0;
	background: transparent;
	color: inherit;
	cursor: pointer;
	text-align: left;
`;

const IconBadge = styled.span<{ $clickable: boolean }>`
	display: inline-flex;
	width: 36px;
	height: 36px;
	flex: 0 0 36px;
	align-items: center;
	justify-content: center;
	border-radius: 8px;
	background: ${COLORS.primary};
	color: ${COLORS.white};
	box-shadow: ${({ $clickable }) =>
		$clickable ? '0 8px 18px rgba(4, 120, 87, 0.18)' : 'none'};
`;

const TextGroup = styled.div`
	display: flex;
	min-width: 0;
	flex-direction: column;
	gap: 2px;
`;

const BannerTitle = styled.div`
	color: ${COLORS.textPrimary};
	font-size: ${TYPOGRAPHY.bodySmall.fontSize};
	font-weight: ${TYPOGRAPHY.weights.bold};
	line-height: 1.3;
`;

const BannerText = styled.div`
	color: ${COLORS.textSecondary};
	font-size: ${TYPOGRAPHY.caption.fontSize};
	font-weight: ${TYPOGRAPHY.weights.medium};
	line-height: 1.4;
`;

const IosSteps = styled.div`
	margin-top: 6px;
	color: ${COLORS.primary};
	font-size: ${TYPOGRAPHY.caption.fontSize};
	font-weight: ${TYPOGRAPHY.weights.bold};
	line-height: 1.4;
`;

const ActionGroup = styled.div`
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;

	@media (max-width: 720px) {
		justify-content: stretch;
	}
`;

const InstallButton = styled.button`
	display: inline-flex;
	min-height: 36px;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 8px 14px;
	border: 1px solid ${COLORS.primary};
	border-radius: 8px;
	background: ${COLORS.primary};
	color: ${COLORS.white};
	cursor: pointer;
	font-size: ${TYPOGRAPHY.button.fontSize};
	font-weight: ${TYPOGRAPHY.button.fontWeight};

	&:hover {
		background: ${COLORS.primaryHover};
	}

	@media (max-width: 720px) {
		flex: 1;
	}
`;

const DismissButton = styled.button`
	display: inline-flex;
	min-height: 36px;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 8px 12px;
	border: 1px solid rgba(4, 120, 87, 0.24);
	border-radius: 8px;
	background: ${COLORS.white};
	color: ${COLORS.textSecondary};
	cursor: pointer;
	font-size: ${TYPOGRAPHY.bodySmall.fontSize};
	font-weight: ${TYPOGRAPHY.weights.semibold};

	&:hover {
		color: ${COLORS.primary};
		border-color: rgba(4, 120, 87, 0.42);
	}

	@media (max-width: 720px) {
		flex: 1;
	}
`;
