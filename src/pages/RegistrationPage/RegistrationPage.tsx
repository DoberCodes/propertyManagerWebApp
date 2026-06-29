import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegistrationCard } from '../../Components/RegistrationCard/RegistrationCard';
import { Wrapper } from './RegistrationPage.styles';
import { isNativeApp } from '../../utils/platform';
import { openRegistrationInBrowser } from '../../utils/authLinks';
import { LoadingState } from '../../Components/LoadingState';

export const RegistrationPage = () => {
	const navigate = useNavigate();

	useEffect(() => {
		if (!isNativeApp()) return;

		void openRegistrationInBrowser().finally(() => {
			navigate('/login', { replace: true });
		});
	}, [navigate]);

	if (isNativeApp()) {
		return (
			<LoadingState
				loadingKey='registration'
				title='Opening signup'
				message='Opening secure signup in your browser.'
				steps={[
					'Opening secure signup...',
					'Preparing your account setup...',
					'Almost ready...',
				]}
			/>
		);
	}

	return (
		<Wrapper>
			<RegistrationCard />
		</Wrapper>
	);
};
