import React from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import SEO from 'Components/SEO/SEO';

const SubTitle = styled.h3`
	font-size: 1.3rem;
	margin-bottom: 12px;
	color: ${COLORS.gray800};
	display: flex;
	align-items: center;
	font-weight: 600;
`;

const Paragraph = styled.p`
	font-size: 0.95rem;
	margin-bottom: 16px;
	line-height: 1.6;
	color: ${COLORS.gray600};
`;

const Container = styled.div`
	max-width: 1200px;
	margin: 0 auto;
	padding: 40px 20px;
	background: ${COLORS.gray50};
	min-height: 100vh;
`;

const Header = styled.div`
	background: linear-gradient(
		135deg,
		${COLORS.primary} 0%,
		${COLORS.primaryDark} 100%
	);
	color: white;
	padding: 60px 40px;
	border-radius: 16px;
	text-align: center;
	margin-bottom: 50px;
	box-shadow: 0 10px 30px rgba(16, 185, 129, 0.2);

	@media (max-width: 1024px) {
		padding: 40px 20px;
	}
`;

const Title = styled.h2`
	font-size: 2.5rem;
	margin-bottom: 16px;
	color: white;
	font-weight: 800;

	@media (max-width: 1024px) {
		font-size: 1.8rem;
	}
`;

const HeaderSubtitle = styled.p`
	font-size: 1.1rem;
	color: rgba(255, 255, 255, 0.9);
	margin: 0;
	font-weight: 300;
`;

const FeatureGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
	gap: 24px;
	margin-bottom: 50px;
`;

const FeatureCard = styled.div`
	background: white;
	border-radius: 12px;
	padding: 32px;
	border-left: 4px solid ${COLORS.primary};
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
	transition: all 0.3s ease;
	cursor: default;

	&:hover {
		box-shadow: 0 12px 32px rgba(16, 185, 129, 0.15);
		transform: translateY(-4px);
		border-left-color: ${COLORS.primaryHover};
	}
`;

const FeatureList = styled.ul`
	margin: 16px 0;
	padding-left: 20px;
	list-style: none;
`;

const FeatureItem = styled.li`
	margin-bottom: 10px;
	font-size: 0.95rem;
	color: ${COLORS.gray600};
	line-height: 1.6;
	position: relative;
	padding-left: 20px;

	&::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: ${COLORS.primary};
		font-weight: bold;
		font-size: 1.1rem;
	}
`;

const LinkButton = styled.button`
	display: inline-block;
	margin: 24px 0;
	padding: 12px 28px;
	background: linear-gradient(
		135deg,
		${COLORS.primary} 0%,
		${COLORS.primaryDark} 100%
	);
	color: white;
	border-radius: 8px;
	text-decoration: none;
	font-weight: 600;
	transition: all 0.3s ease;
	border: none;
	cursor: pointer;
	font-size: 0.95rem;
	box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);

	&:hover {
		background: linear-gradient(
			135deg,
			${COLORS.primaryHover} 0%,
			${COLORS.primary} 100%
		);
		box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
		transform: translateY(-2px);
	}

	&:active {
		transform: translateY(0);
	}
`;

const FeatureIcon = styled.span`
	font-size: 1.6rem;
	margin-right: 12px;
	display: inline-block;
	min-width: 32px;
`;

export const FeatureDocsPage: React.FC = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const handleBack = () => {
		const from = (location.state as { from?: string } | null)?.from;
		if (from) {
			navigate(from);
			return;
		}

		if ((window.history.state?.idx ?? 0) > 0) {
			navigate(-1);
			return;
		}

		navigate('/');
	};

	const screenshots = [
		`${window.location.origin}/screenshots/dashboard.png`,
		`${window.location.origin}/screenshots/devicemanagement.png`,
		`${window.location.origin}/screenshots/properties.png`,
		`${window.location.origin}/screenshots/propertyDetails.png`,
		`${window.location.origin}/screenshots/reporting.png`,
		`${window.location.origin}/screenshots/taskpage.png`,
		`${window.location.origin}/screenshots/teampage.png`,
	];
	return (
		<React.Fragment>
			<Container>
				<SEO
					title='Features — Maintley'
					description='Feature overview: property management, tasks, reporting, team collaboration and mobile access.'
					url={`${window.location.origin}/features`}
					image={screenshots[0]}
					keywords='property maintenance, features, maintenance history, property manager'
				/>
				<Header>
					<Title>Maintley Features</Title>
					<HeaderSubtitle>
						Everything you need to manage property maintenance efficiently
					</HeaderSubtitle>
				</Header>
				<LinkButton onClick={handleBack}>← Back</LinkButton>
				<FeatureGrid>
					<FeatureCard>
						<SubTitle>
							<FeatureIcon>🔐</FeatureIcon>User Authentication & Security
						</SubTitle>
						<Paragraph>
							Secure user authentication with Firebase Authentication, including
							email verification, password reset, and secure login/logout
							functionality.
						</Paragraph>
						<FeatureList>
							<FeatureItem>User registration and login</FeatureItem>
							<FeatureItem>Password reset via email</FeatureItem>
							<FeatureItem>Email verification</FeatureItem>
							<FeatureItem>Secure session management</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>🏢</FeatureIcon>Property Management
						</SubTitle>
						<Paragraph>
							Comprehensive property management with detailed suite tracking.
							Create and manage multiple properties with complete organizational
							structure.
						</Paragraph>
						<FeatureList>
							<FeatureItem>Add, edit, and delete properties</FeatureItem>
							<FeatureItem>
								Manage suites within commercial properties
							</FeatureItem>
							<FeatureItem>
								Detailed property information and history
							</FeatureItem>
							<FeatureItem>Property assignment to team members</FeatureItem>
							<FeatureItem>Visual property organization</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>📋</FeatureIcon>Task Management System
						</SubTitle>
						<Paragraph>
							Complete task tracking and management system with status updates,
							assignments, and approval tasks.
						</Paragraph>
						<FeatureList>
							<FeatureItem>Create and assign tasks to team members</FeatureItem>
							<FeatureItem>
								Task status tracking (Pending, In Progress, Awaiting Approval,
								Completed, Rejected)
							</FeatureItem>
							<FeatureItem>
								Task completion with notes and photo uploads
							</FeatureItem>
							<FeatureItem>
								Overdue task notifications and highlighting
							</FeatureItem>
							<FeatureItem>Task history and audit trail</FeatureItem>
							<FeatureItem>Maintenance request conversion to tasks</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>👥</FeatureIcon>Team Management
						</SubTitle>
						<Paragraph>
							Role-based team management with invitation system and permission
							controls.
						</Paragraph>
						<FeatureList>
							<FeatureItem>
								Role-based access control (Admin, Property Manager, Assistant
								Manager, Member, Tenant)
							</FeatureItem>
							<FeatureItem>Team member invitations via email</FeatureItem>
							<FeatureItem>Team member management and removal</FeatureItem>
							<FeatureItem>Property-specific team assignments</FeatureItem>
							<FeatureItem>Team collaboration features</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>📊</FeatureIcon>Dashboard & Analytics
						</SubTitle>
						<Paragraph>
							Real-time dashboard with visual analytics and efficiency tracking.
						</Paragraph>
						<FeatureList>
							<FeatureItem>
								Live efficiency pie chart showing task status breakdown
							</FeatureItem>
							<FeatureItem>Recent activity feed</FeatureItem>
							<FeatureItem>Team member overview</FeatureItem>
							<FeatureItem>Quick action shortcuts</FeatureItem>
							<FeatureItem>Real-time data updates</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>📈</FeatureIcon>Reporting & Analytics
						</SubTitle>
						<Paragraph>
							Comprehensive reporting tools for maintenance history, trends, and
							documentation.
						</Paragraph>
						<FeatureList>
							<FeatureItem>Detailed maintenance history reports</FeatureItem>
							<FeatureItem>Task completion analytics</FeatureItem>
							<FeatureItem>Property performance metrics</FeatureItem>
							<FeatureItem>
								Data export capabilities for reference/supporting documentation
							</FeatureItem>
							<FeatureItem>Custom report generation</FeatureItem>
							<FeatureItem>Historical trend analysis</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>📱</FeatureIcon>Mobile App Features
						</SubTitle>
						<Paragraph>
							Native Android app with additional mobile-specific features and
							optimizations.
						</Paragraph>
						<FeatureList>
							<FeatureItem>Native Android APK downloads</FeatureItem>
							<FeatureItem>Push notifications for task updates</FeatureItem>
							<FeatureItem>Automatic update notifications</FeatureItem>
							<FeatureItem>Mobile-optimized interface</FeatureItem>
							<FeatureItem>Offline-capable features</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>🔔</FeatureIcon>Notifications & Communication
						</SubTitle>
						<Paragraph>
							Comprehensive notification system for staying updated on property
							activities.
						</Paragraph>
						<FeatureList>
							<FeatureItem>Push notifications (native app)</FeatureItem>
							<FeatureItem>In-app notifications</FeatureItem>
							<FeatureItem>Task assignment notifications</FeatureItem>
							<FeatureItem>Overdue task alerts</FeatureItem>
							<FeatureItem>Update notifications</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>⚙️</FeatureIcon>Settings & Profile Management
						</SubTitle>
						<Paragraph>
							User profile management and application settings customization.
						</Paragraph>
						<FeatureList>
							<FeatureItem>User profile management</FeatureItem>
							<FeatureItem>Account settings</FeatureItem>
							<FeatureItem>Notification preferences</FeatureItem>
							<FeatureItem>Subscription management</FeatureItem>
							<FeatureItem>App configuration options</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>🔒</FeatureIcon>Subscription & Access Control
						</SubTitle>
						<Paragraph>
							Role-based access control and subscription management for
							different user tiers.
						</Paragraph>
						<FeatureList>
							<FeatureItem>Multiple subscription plans</FeatureItem>
							<FeatureItem>
								Feature access based on subscription level
							</FeatureItem>
							<FeatureItem>Paywall system for premium features</FeatureItem>
							<FeatureItem>Role-based feature restrictions</FeatureItem>
							<FeatureItem>Usage tracking and limits</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>🛠️</FeatureIcon>Maintenance History & Documentation
						</SubTitle>
						<Paragraph>
							Complete maintenance history tracking with visual documentation
							and contractor records.
						</Paragraph>
						<FeatureList>
							<FeatureItem>
								Detailed maintenance records for all properties
							</FeatureItem>
							<FeatureItem>Photo and document attachments</FeatureItem>
							<FeatureItem>Contractor work history tracking</FeatureItem>
							<FeatureItem>Searchable maintenance database</FeatureItem>
							<FeatureItem>
								Documentation and audit trail for your records
							</FeatureItem>
							<FeatureItem>Visual maintenance documentation</FeatureItem>
						</FeatureList>
					</FeatureCard>

					<FeatureCard>
						<SubTitle>
							<FeatureIcon>🔄</FeatureIcon>Real-time Updates & Synchronization
						</SubTitle>
						<Paragraph>
							Real-time data synchronization across all devices and users.
						</Paragraph>
						<FeatureList>
							<FeatureItem>Real-time task updates</FeatureItem>
							<FeatureItem>Live dashboard updates</FeatureItem>
							<FeatureItem>Cross-device synchronization</FeatureItem>
							<FeatureItem>Instant notification delivery</FeatureItem>
							<FeatureItem>Collaborative editing</FeatureItem>
						</FeatureList>
					</FeatureCard>
				</FeatureGrid>
			</Container>
		</React.Fragment>
	);
};
