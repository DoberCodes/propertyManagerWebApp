import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const Container = styled.div`
	max-width: 600px;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
`;

const Title = styled.h2`
	font-size: 2rem;
	margin-bottom: 24px;
`;

const LinkButton = styled.button`
	display: inline-block;
	margin: 16px 0;
	padding: 12px 24px;
	background: #6366f1;
	color: #fff;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: background 0.2s;
	border: none;
	cursor: pointer;
	&:hover {
		background: #4f46e5;
	}
`;

const SettingsPage: React.FC = () => {
	const navigate = useNavigate();
	return (
		<Container>
			<Title>Settings</Title>
			<LinkButton onClick={() => navigate('/docs')}>
				View Full Feature Guide
			</LinkButton>
			{/* Add more settings here as needed */}
		</Container>
	);
};

export default SettingsPage;
