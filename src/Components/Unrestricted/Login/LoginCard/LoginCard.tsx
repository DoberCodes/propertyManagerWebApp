import { useState } from 'react';
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
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const LoginCard = () => {
	const navigate = useNavigate();
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const login = async (event: any) => {
		event.preventDefault();
		// console.log(username, password);
		// const user = await signIn(email, password);
		const user = await axios
			.post('http://localhost:3001/validatePassword', {
				username,
				password,
			})
			.then((res) => {
				if (res.data.validation) {
					console.log('UserFound');
				} else {
					console.log('Please check username or password');
				}
			});
		console.log(user);
		// if (user) {
		// 	return navigate('/property_manager');
		// }

		// TODO: add Redux and alert handler to add a popup window to inform user to confirm password
	};

	return (
		<Wrapper>
			<BackButton href='/'>
				<FontAwesomeIcon icon={solid('arrow-left')} />
			</BackButton>
			<Title>Login</Title>
			<Input
				placeholder='Email Address'
				autoComplete='email'
				onChange={(event) => {
					setUsername(event.target.value);
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
