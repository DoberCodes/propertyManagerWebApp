import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUser, setAuthLoading } from './Redux/Slices/userSlice';
import { RouterComponent } from './router';
import { DataFetchProvider } from './Hooks/DataFetchContext';
import { onAuthStateChange } from './services/authService';
import { UpdateNotification } from './Components/Library/UpdateNotification/UpdateNotification';
import { checkForUpdates } from './utils/versionCheck';
import styled from 'styled-components';
import { Capacitor } from '@capacitor/core';
// import { initializePushNotifications } from './services/pushNotifications';

const LoadingContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100vh;
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

export const App = () => {
	const dispatch = useDispatch();
	const authLoading = useSelector((state: any) => state.user.authLoading);
	// const currentUser = useSelector((state: any) => state.user.currentUser);

	// Register push notifications on native app startup (DISABLED: backend not ready)
	// useEffect(() => {
	// 	if (!Capacitor.isNativePlatform()) return;
	// 	initializePushNotifications(
	// 		(token) => {
	// 			console.log('Push token received:', token);
	// 		},
	// 		(notification) => {
	// 			// Optionally handle foreground notification
	// 			console.log('Foreground push notification:', notification);
	// 		},
	// 		() => currentUser?.id || null,
	// 	);
	// }, [currentUser]);

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
		if (!Capacitor.isNativePlatform()) {
			return;
		}

		let startY = 0;
		let isPulling = false;
		let triggered = false;
		const threshold = 80;

		const getScrollTop = () =>
			window.scrollY || document.documentElement.scrollTop || 0;

		const onTouchStart = (event: TouchEvent) => {
			if (getScrollTop() !== 0) {
				return;
			}
			startY = event.touches[0].clientY;
			isPulling = true;
			triggered = false;
		};

		const onTouchMove = (event: TouchEvent) => {
			if (!isPulling || triggered) {
				return;
			}

			const currentY = event.touches[0].clientY;
			const delta = currentY - startY;

			if (delta > threshold) {
				triggered = true;
				window.location.reload();
			}
		};

		const onTouchEnd = () => {
			isPulling = false;
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

	console.log('Current authLoading state:', authLoading);

	if (authLoading) {
		return (
			<LoadingContainer>
				<div>⚙️</div>
				<div>Initializing App...</div>
			</LoadingContainer>
		);
	}

	return (
		<>
			<UpdateNotification />
			<DataFetchProvider>
				<RouterComponent />
			</DataFetchProvider>
		</>
	);
};

export default App;
