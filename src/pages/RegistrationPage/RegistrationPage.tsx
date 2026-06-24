import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegistrationCard } from '../../Components/RegistrationCard/RegistrationCard';
import { Wrapper } from './RegistrationPage.styles';
import { isNativeApp } from '../../utils/platform';
import { openRegistrationInBrowser } from '../../utils/authLinks';

export const RegistrationPage = () => {
	const navigate = useNavigate();

	useEffect(() => {
		if (!isNativeApp()) return;

		void openRegistrationInBrowser().finally(() => {
			navigate('/login', { replace: true });
		});
	}, [navigate]);

	if (isNativeApp()) {
		return <Wrapper>Opening secure signup in your browser...</Wrapper>;
	}

	return (
		<Wrapper>
			<RegistrationCard />
		</Wrapper>
	);
};
