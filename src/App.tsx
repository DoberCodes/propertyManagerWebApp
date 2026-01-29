import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentUser, setAuthLoading } from './Redux/Slices/userSlice';
import { RouterComponent } from './router';
import { FirebaseConnectionTest } from './Components/FirebaseConnectionTest';
import { DataFetchProvider } from './Hooks/DataFetchContext';
import { onAuthStateChange } from './services/authService';

export const App = () => {
	const dispatch = useDispatch();

	useEffect(() => {
		// Listen to Firebase auth state changes to persist authentication
		const unsubscribe = onAuthStateChange(async (user) => {
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
		return () => unsubscribe();
	}, [dispatch]);

	return (
		<>
			{process.env.NODE_ENV === 'development' && <FirebaseConnectionTest />}
			<DataFetchProvider>
				<RouterComponent />
			</DataFetchProvider>
		</>
	);
};

export default App;
