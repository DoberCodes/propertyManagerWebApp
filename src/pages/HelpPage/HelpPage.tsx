import React from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import SEO from 'Components/SEO/SEO';
import { COLORS } from '../../constants/colors';

const Container = styled.div`
	max-width: 1000px;
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
	padding: 48px 32px;
	border-radius: 16px;
	margin-bottom: 28px;
	text-align: center;
`;

const Title = styled.h2`
	margin: 0 0 10px 0;
	font-size: 2rem;
	font-weight: 800;
	color: white;
`;

const Subtitle = styled.p`
	margin: 0;
	font-size: 1rem;
	color: rgba(255, 255, 255, 0.9);
`;

const BackButton = styled.button`
	display: inline-block;
	margin-bottom: 20px;
	padding: 10px 20px;
	background: ${COLORS.primary};
	color: white;
	border: none;
	border-radius: 8px;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background: ${COLORS.primaryDark};
	}
`;

const Section = styled.section`
	background: white;
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	padding: 24px;
	margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
	margin: 0 0 12px 0;
	font-size: 1.25rem;
	color: ${COLORS.gray800};
`;

const SectionText = styled.p`
	margin: 0;
	color: ${COLORS.gray600};
	line-height: 1.6;
`;

const FaqList = styled.div`
	display: grid;
	gap: 14px;
`;

const FaqItem = styled.div`
	border: 1px solid ${COLORS.gray200};
	border-radius: 10px;
	padding: 16px;
	background: ${COLORS.gray50};
`;

const FaqQuestion = styled.h4`
	margin: 0 0 8px 0;
	font-size: 1rem;
	color: ${COLORS.gray800};
`;

const FaqAnswer = styled.p`
	margin: 0;
	font-size: 0.95rem;
	line-height: 1.6;
	color: ${COLORS.gray600};
`;

const SupportActions = styled.div`
	margin-top: 14px;
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
`;

const SupportButton = styled.a`
	display: inline-block;
	padding: 10px 16px;
	border-radius: 8px;
	background: ${COLORS.primary};
	color: white;
	text-decoration: none;
	font-weight: 600;
	font-size: 0.9rem;

	&:hover {
		background: ${COLORS.primaryDark};
	}
`;


const InfoList = styled.ul`
	margin: 0;
	padding-left: 20px;
	color: ${COLORS.gray600};
	line-height: 1.7;
`;

const InfoItem = styled.li`
	margin-bottom: 6px;
`;

const faqItems = [
	{
		q: 'How do I submit feedback or report a bug?',
		a: 'Open the Support Center from the app navigation and select New support request. You can track the response from My requests.',
	},
	{
		q: "Why can't I see the Team page?",
		a: 'Team access depends on your account role and permissions. Owners/admin roles can access team management features.',
	},
	{
		q: 'How do subscriptions work?',
		a: 'Maintley includes a free tier and optional paid plans. You can review billing details under the Subscription area in the app.',
	},
	{
		q: 'Can I invite family members to my account?',
		a: 'Yes. Account owners can invite members from Settings. Invited users receive an email invitation to join your account.',
	},
	{
		q: 'Where can I review legal documents?',
		a: 'Open the Legal page to view Terms of Service, Privacy Policy, Maintenance Disclaimer, Subscription Terms, and EULA.',
	},
];

const HelpPage: React.FC = () => {
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

	return (
		<Container>
			<SEO
				title='Help Center — Maintley'
				description='Maintley help center with quick answers and frequently asked questions.'
				url={`${window.location.origin}/help`}
				keywords='maintley help, faq, support'
			/>

			<BackButton onClick={handleBack}>← Back</BackButton>

			<Header>
				<Title>Help Center</Title>
				<Subtitle>Quick answers to common questions</Subtitle>
			</Header>

			<Section>
				<SectionTitle>Need Help?</SectionTitle>
				<SectionText>
					If you are signed in, use the Support Center to submit a request and
					track its progress. If you are having login or account access issues,
					email the support team directly. Include enough detail to help us
					understand what happened.
				</SectionText>
				<SupportActions>
					<SupportButton href='mailto:maintleyapp@gmail.com?subject=Maintley%20Support%20Request'>
						Email Support
					</SupportButton>
				</SupportActions>
				<SectionText style={{ marginTop: 12 }}>
					Support email: <strong>maintleyapp@gmail.com</strong>
				</SectionText>
			</Section>

			<Section>
				<SectionTitle>Frequently Asked Questions</SectionTitle>
				<FaqList>
					{faqItems.map((item) => (
						<FaqItem key={item.q}>
							<FaqQuestion>{item.q}</FaqQuestion>
							<FaqAnswer>{item.a}</FaqAnswer>
						</FaqItem>
					))}
				</FaqList>
			</Section>

			<Section>
				<SectionTitle>Known Issues</SectionTitle>
				<InfoList>
					<InfoItem>
						Some ad/privacy blockers may interfere with certain network
						requests.
					</InfoItem>
					<InfoItem>
						If mobile notifications fail, re-check push permissions and
						app-level notification settings.
					</InfoItem>
					<InfoItem>
						Occasional sync delays can happen on unstable networks and usually
						recover automatically.
					</InfoItem>
				</InfoList>
			</Section>

			<Section>
				<SectionTitle>What to Include in a Bug Report</SectionTitle>
				<InfoList>
					<InfoItem>What you expected to happen</InfoItem>
					<InfoItem>What actually happened</InfoItem>
					<InfoItem>Steps to reproduce the issue</InfoItem>
					<InfoItem>
						Device/browser details and screenshots (if possible)
					</InfoItem>
				</InfoList>
			</Section>

			<Section>
				<SectionTitle>Response Times</SectionTitle>
				<SectionText>
					We typically review incoming requests within 24–48 hours. Critical
					account or access issues are prioritized first.
				</SectionText>
			</Section>
		</Container>
	);
};

export default HelpPage;
