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
	background: linear-gradient(135deg, #065f46 0%, #047857 100%);
	color: white;
	font-size: 18px;
	font-weight: 600;
	gap: 20px;

	div {
		animation: spin 1s linear infinite;
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
				<div>Loading Maintley...</div>
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
