import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { RootState } from './Redux/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';

export interface ProtectedRoutesProps {
	children: any;
}

export const ProtectedRoutes = (props: ProtectedRoutesProps) => {
	const [isLoggedIn, setIsLoggedIn] = useState(true);
	const user = useSelector((state: RootState) => state.user.cred);
	useEffect(() => {
		onAuthStateChanged(auth, (user) => {
			if (user) {
				console.log(user.uid);
				setIsLoggedIn(true);
			}
		});
	});

	useEffect(() => {
		if (user) {
			setIsLoggedIn(true);
		}
	}, []);

	const location = useLocation();
	if (isLoggedIn) {
		return <Navigate to='/' replace={true} state={{ from: location }} />;
	} else {
		return props.children;
	}
};
