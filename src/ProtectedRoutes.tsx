import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from './Redux/user';

// export interface ProtectedRoutesProps {
// 	children: any;
// }

export const ProtectedRoutes = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	console.log(loggedIn);

	// useEffect(() => {
	// 	onAuthStateChanged(auth, (user) => {
	// 		if (user) {
	// 			// User is signed in, see docs for a list of available properties
	// 			// https://firebase.google.com/docs/reference/js/firebase.User
	// 			const uid = user.uid;
	// 			dispatch(setUser({ UID: uid }));
	// 			console.log('uid', uid);
	// 			setLoggedIn(true);
	// 		} else {
	// 			// User is signed out
	// 			setLoggedIn(false);
	// 			console.log('user is logged out');
	// 		}
	// 	});
	// }, []);

	if (loggedIn) {
		return <Navigate to='/property_manager/dashboard' />;
	} else {
		return <Navigate to='/' />;
	}
};
