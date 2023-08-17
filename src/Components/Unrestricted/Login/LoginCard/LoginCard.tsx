import { useState } from 'react';
import { Input, Wrapper, Submit, RegisterWrapper } from './LoginCard.styles';
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../../../firebase/firebase';

export const LoginCard = () => {
	const [username, setUsername] = useState<string>('');
	const [password, setPassword] = useState<string>('');

	const login = async (event: any) => {
		event.preventDefault();
		signInWithEmailAndPassword(auth, username, password)
			.then((userCredential) => {
				// Signed in
				const user = userCredential.user;
				if (user) {
				}
			})
			.catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				console.log(errorCode + errorMessage);
			});
	};

	return (
		<Wrapper>
			<Input
				placeholder='Username'
				onChange={(event) => {
					setUsername(event.target.value);
				}}
			/>
			<Input
				placeholder='Password'
				onChange={(event) => {
					setPassword(event.target.value);
				}}
			/>
			<Submit onClick={(event) => login(event)}>Login</Submit>
			<RegisterWrapper>
				<p>
					Don't already have an account?{' '}
					<a href='/Registration'>Sign up here</a>
				</p>
			</RegisterWrapper>
		</Wrapper>
	);
};
