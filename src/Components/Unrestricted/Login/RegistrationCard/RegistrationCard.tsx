import { useEffect, useState } from 'react';
import { Input, Wrapper, Submit, Title } from './RegistrationCard.styles';
import { createAccount } from '../../../../firebase/hooks/Authentication';
export const RegistrationCard = () => {
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [householdName, setHouseholdName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [passwordConfirm, setPasswordConfirm] = useState<string>('');
	const [confirmed, setConfirmed] = useState<boolean>(false);

	const signup = async (event: any) => {
		event.preventDefault();
		if (confirmed) {
			createAccount(email, password, firstName, lastName, householdName);
		} else {
            // TODO: add Redux and alert handler to add a popup window to inform user to confirm password
            console.log("confirm password")
		}
	};

	useEffect(() => {
		if (password === passwordConfirm) {
			setConfirmed(true);
		} else {
			setConfirmed(false);
		}
	}, [password, passwordConfirm]);

	return (
		<Wrapper>
			<Title>Create Account</Title>
			<div>
				<Input
					placeholder='First Name'
					onChange={(event) => {
						setFirstName(event.target.value);
					}}
				/>
				<Input
					placeholder='Last Name'
					onChange={(event) => {
						setLastName(event.target.value);
					}}
				/>
				<Input
					placeholder='Household Name'
					onChange={(event) => {
						setHouseholdName(event.target.value);
					}}
				/>
			</div>
			<Input
				placeholder='Email Address'
				onChange={(event) => {
					setEmail(event.target.value);
				}}
			/>
			<Input
				placeholder='Password'
				type='password'
				onChange={(event) => {
					setPassword(event.target.value);
				}}
			/>
			<Input
				placeholder='Confirm Password'
				type='password'
				onChange={(event) => {
					setPasswordConfirm(event.target.value);
				}}
			/>
			<Submit onClick={(event) => signup(event)}>Sign up</Submit>
		</Wrapper>
	);
};
