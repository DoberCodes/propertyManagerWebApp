import { useEffect, useState } from 'react';
import { setUserCred } from '../Redux/Slices/userSlice';
import { useDispatch } from 'react-redux';
import { Timeout } from './Controller';

export const useGetAuthStatus = () => {
	const dispatch = useDispatch();
	const [Authenticated, setAuthenticated] = useState({
		loading: true,
		Authenticated: false,
	});
	const failed = {
		loading: false,
		Authenticated: false,
	};
	const passed = {
		loading: false,
		Authenticated: true,
	};

	const localUser: any = JSON.parse(localStorage.getItem('loggedUser') || '');

	useEffect(() => {
		if (Authenticated.loading && localUser) {
			const payload = {
				token: localUser,
			};
			const status = getStatus(payload);
			if (status) {
				const authenticated = fetch(
					`http://localhost:5000/authentication/${status}`,
					{
						method: 'GET',
						signal: Timeout(5).signal,
					},
				).then(async (res) => {
					let userData;
					if (res.status === 200) {
						userData = await res.json();
						setAuthenticated(passed);
						dispatch(setUserCred(userData));
					}
				});
			} else {
				setAuthenticated(failed);
			}
		}
	}, []);
	return Authenticated;
};

const getStatus = async (payload) => {
	const response = await fetch('http://localhost:5000/status', {
		method: 'POST',
		headers: {
			'Content-type': 'application/json',
		},
		body: JSON.stringify(payload),
		signal: Timeout(5).signal,
	}).then(async (response) => {
		response.json();
		return response;
	});
	return response;
};
