import React from 'react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// export interface ProtectedRoutesProps {
// 	children: any;
// }

export const ProtectedRoutes = () => {
	const { state } = useLocation();
	const navigate = useNavigate();
	console.log(state);

	useEffect(() => {
		if (state) {
			navigate('/dashboard', { state: state });
		} else {
			navigate('/');
		}
	}, []);
	return <div> Loading</div>;
};
