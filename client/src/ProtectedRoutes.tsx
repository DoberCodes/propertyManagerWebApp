import React, { useState } from 'react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { useDispatch } from 'react-redux';
import { setUserCred } from './Redux/Slices/userSlice';

export const ProtectedRoutes = () => {
	const [userState, setUserState]: any = useState();

	const { state } = useLocation();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	useEffect(() => {
		if (state !== null) {
			const payload = {
				id: state.UserId,
				activation: state.token,
			};
			localStorage.setItem('loggedUser', JSON.stringify(payload));
			setUserState({ UserId: state.UserId, username: state.username });
			console.log('Location state', state);
			dispatch(setUserCred(state));
		} else {
			if (localStorage.getItem('loggedUser')) {
				const localUser: any = JSON.parse(
					localStorage.getItem('loggedUser') || ''
				);
				console.log('localUser', localUser);
				const payload = {
					token: localUser.activation,
				};
				fetch('http://localhost:5000/status', {
					method: 'POST',
					headers: {
						'Content-type': 'application/json',
					},
					body: JSON.stringify(payload),
				})
					.then(async (response) => {
						let data;
						if (response.status === 200) {
							data = await response.json();
						} else {
							navigate('/login');
						}
						console.log(data);

						if (data) {
							const token = data;
							fetch(`http://localhost:5000/authentication/${token}`, {
								method: 'GET',
							})
								.then(async (res) => {
									let userData;
									if (res.status === 200) {
										userData = await res.json();
									} else {
										navigate('/login');
									}
									if (userData) {
										dispatch(setUserCred(state));
										setUserState({ UserId: token, username: userData.user });
									}
								})
								.catch((error) => {
									console.log(error);
									navigate('/login');
								});
						} else {
							navigate('/login');
						}
					})
					.catch((error) => {
						console.log(error);
						navigate('/login');
					});
			} else {
				navigate('/login');
			}
		}
	}, []);

	return <div>{userState ? <HomePage /> : <div>Loading </div>}</div>;
};
