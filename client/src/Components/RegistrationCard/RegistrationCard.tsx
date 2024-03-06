import React, { useEffect, useState } from 'react';
import {
	Input,
	Wrapper,
	Submit,
	Title,
	BackButton,
	RegisterWrapper,
} from './RegistrationCard.styles';
import { Navigate } from 'react-router-dom';
import { faArrowCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const RegistrationCard = () => {
	const [firstName, setFirstName] = useState<string>('');
	const [lastName, setLastName] = useState<string>('');
	const [householdName, setHouseholdName] = useState<string>('');
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [passwordConfirm, setPasswordConfirm] = useState<string>('');
	const [confirmed, setConfirmed] = useState<boolean>(false);
	const [verified, setVerified] = useState<boolean>(false);

	const signup = (event: any) => {
		event.preventDefault();
		if (confirmed) {
			return <Navigate to={'/property_manager'}></Navigate>;
		} else {
			// TODO: add Redux and alert handler to add a popup window to inform user to confirm password
			console.log('confirm password');
			return;
		}
	};
	const verifyInputs = () => {
		let error = {
			email: '',
			password: '',
		};
		if (password.length < 8) {
			error.password = 'Password is too short';
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
			<BackButton href='/'>
				<FontAwesomeIcon icon={faArrowCircleLeft} />
			</BackButton>
			<Title>Create Account</Title>
			<div>
				<Input
					placeholder='First Name'
					type='text'
					autoComplete='given-name'
					onChange={(event) => {
						setFirstName(event.target.value);
					}}
				/>
				<Input
					placeholder='Last Name'
					type='text'
					autoComplete='family-name'
					onChange={(event) => {
						setLastName(event.target.value);
					}}
				/>
				<Input
					placeholder='Household Name'
					type='text'
					autoComplete='family-name'
					onChange={(event) => {
						setHouseholdName(event.target.value);
					}}
				/>
			</div>
			<Input
				placeholder='Email Address'
				type='email'
				autoComplete='email'
				onChange={(event) => {
					setEmail(event.target.value);
				}}
			/>
			<Input
				placeholder='Password'
				type='password'
				autoComplete='new-password'
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

			<RegisterWrapper>
				<p>
					Already have an account? <a href='/Login'>Login here</a>
				</p>
			</RegisterWrapper>
		</Wrapper>
	);
};
