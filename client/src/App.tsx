import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCurrentUser, MOCK_USERS } from './Redux/Slices/userSlice';
import { RouterComponent } from './router';

export const App = () => {
	const dispatch = useDispatch();

	useEffect(() => {
		// Restore user session from localStorage on app startup
		const savedSession = localStorage.getItem('loggedUser');
		console.log('App.tsx: Checking for saved session...', savedSession);
		if (savedSession) {
			try {
				const parsedSession = JSON.parse(savedSession);
				console.log('App.tsx: Parsed session:', parsedSession);
				// If there's a user object in the session, restore it
				if (parsedSession.user) {
					console.log('App.tsx: Restoring user:', parsedSession.user);
					dispatch(setCurrentUser(parsedSession.user));
				} else {
					console.log('App.tsx: No user object in parsed session');
				}
			} catch (error) {
				console.error('Failed to restore user session:', error);
				localStorage.removeItem('loggedUser');
			}
		} else {
			console.log('App.tsx: No saved session found');
		}
	}, [dispatch]);

	return <RouterComponent />;
};

export default App;
