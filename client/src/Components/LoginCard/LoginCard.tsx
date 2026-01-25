import React, { useState } from 'react';
import {
	Input,
	Wrapper,
	Submit,
	RegisterWrapper,
	Title,
	BackButton,
} from './LoginCard.styles';
// import { signIn } from '../../../../firebase/hooks/Authentication';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowAltCircleLeft } from '@fortawesome/free-regular-svg-icons';
import { useNavigate } from 'react-router-dom';

export const LoginCard = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const login = async (event: any) => {
		event.preventDefault();
		const payload = { email, password };
		console.log(payload);
		try {
			await fetch('http://localhost:5000/authentication', {
				method: 'POST',
				headers: {
					'Content-type': 'application/json',
				},
				body: JSON.stringify(payload),
			}).then(async (response) => {
				const data = await response.json();
				if (data) {
					console.log('Login data', data);
					localStorage.setItem('loggedUser', JSON.stringify(data.token));
				}
				return;
			});
			navigate('/property_manager');
		} catch (error) {
			console.log(error);
			// setErrorMessage(error);
		}
		// TODO: add Redux and alert handler to add a popup window to inform user to confirm password
	};

	return (
		<Wrapper>
			<BackButton href='/'>
				<FontAwesomeIcon icon={faArrowAltCircleLeft} />
			</BackButton>
			<Title>Login</Title>
			<Input
				placeholder='Email Address'
				autoComplete='email'
				onChange={(event) => {
					setEmail(event.target.value);
				}}
			/>
			<Input
				placeholder='Password'
				type='password'
				autoComplete='current-pa ssword'
				onChange={(event) => {
					setPassword(event.target.value);
				}}
			/>
			<Submit onClick={(event) => login(event)}>Login</Submit>
			<RegisterWrapper>
				<p>
					Don't have an account? <a href='/Registration'>Sign up here</a>
				</p>
			</RegisterWrapper>
		</Wrapper>
	);
};
