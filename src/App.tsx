import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUser, setAuthLoading } from './Redux/Slices/userSlice';
import { RouterComponent } from './router';
import { DataFetchProvider } from './Hooks/DataFetchContext';
import { onAuthStateChange } from './services/authService';
import { UpdateNotification } from './Components/Library/UpdateNotification/UpdateNotification';
import { checkForUpdates } from './utils/versionCheck';
import styled from 'styled-components';
import { Capacitor } from '@capacitor/core';
import { initializePushNotifications } from './services/pushNotifications';
import { setIsMobile } from './Redux/Slices/appSlice';
import { AppFeedbackProvider } from './Components/Library/AppFeedback/AppFeedbackProvider';

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	min-height: 100vh;
	padding: 24px;
	background:
		radial-gradient(circle at top, rgba(220, 252, 231, 0.28), transparent 34%),
		linear-gradient(135deg, #065f46 0%, #047857 100%);
	color: #ffffff;

	@supports (min-height: 100dvh) {
		min-height: 100dvh;
	}

	> div:not([class]) {
		display: none;
	}
`;

const SplashCard = styled.div`
	width: min(420px, 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18px;
	padding: 34px 28px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.94);
	box-shadow: 0 26px 80px rgba(6, 78, 59, 0.36);
	text-align: center;
`;

const SplashLogoFrame = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 96px;
	height: 96px;
`;

const SplashLogo = styled.img`
	width: 96px;
	height: 96px;
	display: block;
	object-fit: contain;
`;

const SplashHome = styled.div`
	position: relative;
	width: 72px;
	height: 62px;
	margin-top: 4px;
`;

const SplashRoof = styled.div`
	position: absolute;
	left: 12px;
	top: 1px;
	width: 48px;
	height: 48px;
	background: #16a34a;
	transform: rotate(45deg);
	border-radius: 6px 6px 2px 6px;
	animation: app-splash-build-roof 1.8s ease-in-out infinite;

	@keyframes app-splash-build-roof {
		0%,
		34% {
			opacity: 0;
			transform: translateY(-16px) rotate(45deg) scale(0.88);
		}

		58%,
		86% {
			opacity: 1;
			transform: translateY(0) rotate(45deg) scale(1);
		}

		100% {
			opacity: 0.55;
			transform: translateY(0) rotate(45deg) scale(1);
		}
	}
`;

const SplashHomeBody = styled.div`
	position: absolute;
	left: 10px;
	bottom: 0;
	width: 52px;
	height: 38px;
	border-radius: 8px;
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	overflow: hidden;
`;

const SplashBlock = styled.div<{
	$delay: string;
	$slot: 'one' | 'two' | 'three' | 'four';
}>`
	position: absolute;
	width: 19px;
	height: 13px;
	border-radius: 4px;
	background: #16a34a;
	left: ${({ $slot }) =>
		$slot === 'one' || $slot === 'three' ? '6px' : '27px'};
	top: ${({ $slot }) =>
		$slot === 'one' || $slot === 'two' ? '6px' : '21px'};
	animation: app-splash-build-block 1.8s ease-in-out infinite;
	animation-delay: ${({ $delay }) => $delay};
	transform-origin: center;

	@keyframes app-splash-build-block {
		0% {
			opacity: 0;
			transform: translateY(24px) scale(0.88);
		}

		28%,
		78% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}

		100% {
			opacity: 0.45;
			transform: translateY(0) scale(1);
		}
	}
`;

const SplashTitle = styled.div`
	color: #0f172a;
	font-size: 18px;
	font-weight: 900;
`;

const SplashText = styled.div`
	color: #475569;
	font-size: 14px;
	line-height: 1.45;
`;

const RefreshSpinner = styled.div<{ $isVisible: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 9999;
	display: ${(props) => (props.$isVisible ? 'flex' : 'none')};
	justify-content: center;
	align-items: center;
	padding: 20px;
	background: linear-gradient(135deg, #065f46 0%, #047857 100%);
	color: white;
	font-size: 16px;
	font-weight: 600;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

	.spinner {
		width: 24px;
		height: 24px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-right: 12px;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
`;

export const App = () => {
	const dispatch = useDispatch();
	const authLoading = useSelector((state: any) => state.user.authLoading);
	const currentUser = useSelector((state: any) => state.user.currentUser);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const currentUserIdRef = useRef<string | null>(null);
	const pushNotificationsInitializedRef = useRef(false);

	useEffect(() => {
		if ('scrollRestoration' in window.history) {
			window.history.scrollRestoration = 'manual';
		}
	}, []);

	useEffect(() => {
		currentUserIdRef.current = currentUser?.id || null;
	}, [currentUser?.id]);

	// Register push notifications on native app startup
	useEffect(() => {
		if (!Capacitor.isNativePlatform()) return;
		if (!currentUser?.id || pushNotificationsInitializedRef.current) return;

		pushNotificationsInitializedRef.current = true;
		initializePushNotifications(
			(token) => {
				console.log('Push token received:', token);
			},
			(notification) => {
				console.log('Foreground push notification:', notification);
			},
			() => currentUserIdRef.current,
			(action) => {
				console.log('Push notification action:', action);
			},
		);
	}, [currentUser?.id]);

	useEffect(() => {
		// Set a timeout to ensure auth loading completes even if Firebase hangs
		const timeout = setTimeout(() => {
			dispatch(setAuthLoading(false));
		}, 5000); // 5 second timeout

		// Listen to Firebase auth state changes to persist authentication
		const unsubscribe = onAuthStateChange(async (user) => {
			clearTimeout(timeout);
			if (user) {
				dispatch(setCurrentUser(user));
				// Update localStorage to keep session in sync
				localStorage.setItem(
					'loggedUser',
					JSON.stringify({
						token: `firebase-token-${user.id}`,
						user,
					}),
				);
			} else {
				dispatch(setCurrentUser(null));
				localStorage.removeItem('loggedUser');
			}
			// Auth check is complete - stop showing loading state
			dispatch(setAuthLoading(false));
		});

		// Check for app updates after auth is initialized
		const initVersionCheck = async () => {
			try {
				await checkForUpdates();
			} catch (error) {
				console.error('Error checking for updates:', error);
			}
		};

		// Check for updates when app mounts
		initVersionCheck();

		// Cleanup subscription on unmount
		return () => {
			unsubscribe();
			clearTimeout(timeout);
		};
	}, [dispatch]);

	useEffect(() => {
		const checkMobile = () => {
			dispatch(setIsMobile(window.innerWidth < 768));
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, [dispatch]);

	useEffect(() => {
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		let startY = 0;
		let isPulling = false;
		let triggered = false;
		let holdStartTime = 0;
		const threshold = 150; // Increased from 80 to 150 pixels
		const holdDuration = 500; // Require 500ms hold at threshold

		const getScrollTop = () =>
			window.scrollY || document.documentElement.scrollTop || 0;

		const onTouchStart = (event: TouchEvent) => {
			if (getScrollTop() !== 0) {
				return;
			}
			startY = event.touches[0].clientY;
			isPulling = true;
			triggered = false;
			holdStartTime = 0;
		};

		const onTouchMove = (event: TouchEvent) => {
			if (!isPulling || triggered) {
				return;
			}

			const currentY = event.touches[0].clientY;
			const delta = currentY - startY;

			if (delta > threshold) {
				// Start hold timer if not already started
				if (holdStartTime === 0) {
					holdStartTime = Date.now();
					setIsRefreshing(true); // Show spinner when threshold is reached
				} else {
					// Check if held long enough
					const holdTime = Date.now() - holdStartTime;
					if (holdTime >= holdDuration) {
						triggered = true;
						window.location.reload();
					}
				}
			} else {
				// Reset hold timer if user pulls back below threshold
				holdStartTime = 0;
				setIsRefreshing(false); // Hide spinner if pulled back
			}
		};

		const onTouchEnd = () => {
			isPulling = false;
			holdStartTime = 0;
			setIsRefreshing(false); // Hide spinner when touch ends
		};

		window.addEventListener('touchstart', onTouchStart, { passive: true });
		window.addEventListener('touchmove', onTouchMove, { passive: true });
		window.addEventListener('touchend', onTouchEnd);

		return () => {
			window.removeEventListener('touchstart', onTouchStart);
			window.removeEventListener('touchmove', onTouchMove);
			window.removeEventListener('touchend', onTouchEnd);
		};
	}, []);

	if (authLoading) {
		return (
			<LoadingContainer>
				<div>🔄</div>
				<SplashCard>
					<SplashLogoFrame>
						<SplashLogo src='/Favicon.png' alt='Maintley' />
					</SplashLogoFrame>
					<SplashHome aria-hidden='true'>
						<SplashRoof />
						<SplashHomeBody>
							<SplashBlock $delay='0s' $slot='one' />
							<SplashBlock $delay='0.14s' $slot='two' />
							<SplashBlock $delay='0.28s' $slot='three' />
							<SplashBlock $delay='0.42s' $slot='four' />
						</SplashHomeBody>
					</SplashHome>
					<SplashTitle>Getting Maintley ready</SplashTitle>
					<SplashText>
						Loading your properties, tasks, and maintenance history.
					</SplashText>
				</SplashCard>
			</LoadingContainer>
		);
	}

	return (
		<DataFetchProvider>
			<AppFeedbackProvider>
				<RefreshSpinner $isVisible={isRefreshing}>
					<div className='spinner'></div>
					Refreshing...
				</RefreshSpinner>
				<RouterComponent />
				<UpdateNotification />
			</AppFeedbackProvider>
		</DataFetchProvider>
	);
};

export default App;
