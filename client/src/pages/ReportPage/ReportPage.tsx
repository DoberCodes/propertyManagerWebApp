import React from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
`;

const Title = styled.h1`
	font-size: 32px;
	font-weight: 700;
	color: #333;
	margin: 0;
`;

const Description = styled.p`
	font-size: 16px;
	color: #999999;
	margin: 0;
`;

export const ReportPage = () => {
	return (
		<Wrapper>
			<Title>Reports</Title>
			<Description>Reports and analytics features coming soon...</Description>
		</Wrapper>
	);
};
