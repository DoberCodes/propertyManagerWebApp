import { useEffect, useState } from 'react';
import { setUserCred } from '../Redux/Slices/userSlice';
import { useDispatch } from 'react-redux';
import { Timeout } from './Controller';

const FAILED_AUTH_STATUS = {
	loading: false,
	Authenticated: false,
};
const PASSED_AUTH_STATUS = {
	loading: false,
	Authenticated: true,
};

const getStoredLoggedUser = () => {
	try {
		const rawValue = localStorage.getItem('loggedUser');
		if (!rawValue) return null;

		const parsed = JSON.parse(rawValue);
		return parsed?.user || parsed;
	} catch {
		return null;
	}
};

export const useGetAuthStatus = () => {
	const dispatch = useDispatch();
	const [Authenticated, setAuthenticated] = useState({
		loading: true,
		Authenticated: false,
	});
	useEffect(() => {
		const localUser = getStoredLoggedUser();
		if (Authenticated.loading && localUser) {
			const payload = {
				token: localUser,
			};
			const status = getStatus(payload);
			if (status) {
				fetch(`http://localhost:5000/authentication/${status}`, {
					method: 'GET',
					signal: Timeout(5).signal,
				}).then(async (res) => {
					let userData;
					if (res.status === 200) {
						userData = await res.json();
						setAuthenticated(PASSED_AUTH_STATUS);
						dispatch(setUserCred(userData));
					}
				});
			} else {
				setAuthenticated(FAILED_AUTH_STATUS);
			}
		}
	}, [Authenticated.loading, dispatch]);
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
