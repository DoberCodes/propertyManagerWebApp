import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 100vh;
	text-align: center;
	background-color: #f5f5f5;
`;

const Content = styled.div`
	background: white;
	padding: 40px;
	border-radius: 8px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	max-width: 600px;
`;

const Title = styled.h1`
	font-size: 48px;
	margin-bottom: 16px;
	color: #d32f2f;
`;

const Message = styled.p`
	font-size: 18px;
	color: #666;
	margin-bottom: 32px;
`;

const StyledLink = styled(Link)`
	display: inline-block;
	padding: 10px 24px;
	background-color: #1976d2;
	color: white;
	text-decoration: none;
	border-radius: 4px;
	font-weight: 500;
	transition: background-color 0.3s;

	&:hover {
		background-color: #1565c0;
	}
`;

export const UnauthorizedPage = () => {
	return (
		<Container>
			<Content>
				<Title>403</Title>
				<Message>
					You do not have permission to access this page. Your user role does
					not grant access to this resource.
				</Message>
				<StyledLink to='/dashboard'>Return to Dashboard</StyledLink>
			</Content>
		</Container>
	);
};
