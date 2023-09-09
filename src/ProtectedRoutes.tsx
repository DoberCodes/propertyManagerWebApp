import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RootState } from './Redux/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { Navbar } from './Components/Restricted/Navbar';

// export interface ProtectedRoutesProps {
// 	children: any;
// }

export const ProtectedRoutes = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				// User is signed in, see docs for a list of available properties
				// https://firebase.google.com/docs/reference/js/firebase.User
				const uid = user.uid;
				setLoggedIn(true);
				console.log('uid', uid);
			} else {
				// User is signed out
				setLoggedIn(false);
				console.log('user is logged out');
			}
		});
	}, []);
	// const user = useSelector((state: RootState) => state.user.cred);
	// useEffect(() => {
	// 	onAuthStateChanged(auth, (user) => {
	// 		if (user) {
	// 			console.log(user.uid);
	// 			setIsLoggedIn(true);
	// 		}
	// 	});
	// });

	// const location = useLocation();
	if (loggedIn) {
		return <Navigate to='/property_manager/dashboard' />;
	} else return <Navigate to='/' />;
};
