import { useState } from 'react';
import {
	Input,
	Wrapper,
	Submit,
	RegisterWrapper,
	Title,
	BackButton,
} from './LoginCard.styles';
import { signIn } from '../../../../firebase/hooks/Authentication';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';

export const LoginCard = () => {
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const login = async (event: any) => {
		event.preventDefault();
		console.log(email, password);
		await signIn(email, password);

		// TODO: add Redux and alert handler to add a popup window to inform user to confirm password
		console.log('confirm password');
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
