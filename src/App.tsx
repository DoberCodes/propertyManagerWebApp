import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentUser, setAuthLoading } from './Redux/Slices/userSlice';
import { RouterComponent } from './router';
import { FirebaseConnectionTest } from './Components/FirebaseConnectionTest';
import { DataFetchProvider } from './Hooks/DataFetchContext';
import { onAuthStateChange } from './services/authService';
import { DebugConsole } from './Components/DebugConsole/DebugConsole';
import styled from 'styled-components';

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

	useEffect(() => {
		console.log('App mounted, starting auth check...');

		// Set a timeout to ensure auth loading completes even if Firebase hangs
		const timeout = setTimeout(() => {
			console.warn('Auth check timeout - completing auth check');
			dispatch(setAuthLoading(false));
		}, 5000); // 5 second timeout

		// Listen to Firebase auth state changes to persist authentication
		const unsubscribe = onAuthStateChange(async (user) => {
			clearTimeout(timeout);
			if (user) {
				console.log('App.tsx: User authenticated:', user);
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
				console.log('App.tsx: No user authenticated');
				dispatch(setCurrentUser(null));
				localStorage.removeItem('loggedUser');
			}
			// Auth check is complete - stop showing loading state
			dispatch(setAuthLoading(false));
		});

		// Cleanup subscription on unmount
		return () => {
			unsubscribe();
			clearTimeout(timeout);
		};
	}, [dispatch]);

	console.log('Current authLoading state:', authLoading);

	if (authLoading) {
		return (
			<LoadingContainer>
				<div>⚙️</div>
				<div>Initializing App...</div>
			</LoadingContainer>
		);
	}

	try {
		return (
			<>
				<DebugConsole />
				<DataFetchProvider>
					<RouterComponent />
				</DataFetchProvider>
			</>
		);
	} catch (error) {
		console.error('Error rendering app:', error);
		return (
			<LoadingContainer>
				<div>❌</div>
				<div>Error loading app</div>
			</LoadingContainer>
		);
	}
};

export default App;
