import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const SubTitle = styled.h3`
	font-size: 1.5rem;
	margin-bottom: 12px;
`;

const Paragraph = styled.p`
	font-size: 1.1rem;
	margin-bottom: 10px;
`;

const Container = styled.div`
	max-width: 800px;
	margin: 40px auto;
	padding: 32px;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
`;

const Title = styled.h2`
	font-size: 2.5rem;
	margin-bottom: 24px;
`;

const Section = styled.section`
	margin-bottom: 32px;
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

export const FeatureDocsPage: React.FC = () => {
	const navigate = useNavigate();
	return (
		<Container>
			<Title>Feature Documentation</Title>
			<LinkButton
				onClick={() => navigate('/dashboard')}
				style={{ marginBottom: 32 }}>
				← Back to Dashboard
			</LinkButton>
			<Section>
				<SubTitle>Overview</SubTitle>
				<Paragraph>
					This page provides an overview of the main features available in the
					Property Manager Web App. For a comprehensive list, see the in-app
					documentation or contact support.
				</Paragraph>
			</Section>
			<Section>
				<SubTitle>Dashboard & Analytics</SubTitle>
				<Paragraph>
					Visualize property and task efficiency, view recent activity, and
					access quick links to key actions.
				</Paragraph>
			</Section>
			<Section>
				<SubTitle>Task Management</SubTitle>
				<Paragraph>
					Create, assign, and track tasks for properties, units, and suites.
					Statuses include Pending, In Progress, Awaiting Approval, Completed,
					and Rejected.
				</Paragraph>
			</Section>
			<Section>
				<SubTitle>Profile & Settings</SubTitle>
				<Paragraph>
					Manage your user profile, update your information, and access the
					settings page for more options.
				</Paragraph>
			</Section>
			<Section>
				<SubTitle>More Features</SubTitle>
				<Paragraph>
					- Property and unit detail pages
					<br />
					- Team management
					<br />
					- Role-based access control
					<br />
					- Data export and reporting
					<br />- And more!
				</Paragraph>
			</Section>
		</Container>
	);
};
