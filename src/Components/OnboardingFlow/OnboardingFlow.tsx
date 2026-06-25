import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../Redux/store/store';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import {
	selectIsHomeowner,
	selectCanAccessProperties,
} from '../../Redux/selectors/permissionSelectors';
import { getPropertySetupProgress } from '../../utils/propertySetupAssistant';
import { canUseSuggestedMaintenancePackages } from '../../utils/subscriptionUtils';

const OnboardingOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	z-index: 11000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	overflow-x: hidden;

	@media (max-width: 768px) {
		padding: 8px;
	}
`;

const OnboardingModal = styled.div`
	background: white;
	border-radius: 16px;
	padding: 40px;
	max-width: 600px;
	width: 100%;
	max-height: 90vh;
	overflow-y: auto;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

	@media (max-width: 768px) {
		border-radius: 14px;
		padding: 18px 16px;
		max-height: calc(100dvh - 16px);
		overflow-y: auto;
	}
`;

const OnboardingHeader = styled.div`
	text-align: center;
	margin-bottom: 32px;

	h1 {
		font-size: 28px;
		font-weight: 700;
		color: ${COLORS.primary};
		margin: 0 0 8px 0;
	}

	p {
		font-size: 16px;
		color: #64748b;
		margin: 0;
	}

	@media (max-width: 768px) {
		margin-bottom: 14px;

		h1 {
			font-size: 22px;
			margin: 0 0 6px 0;
		}

		p {
			font-size: 13px;
		}
	}
`;

const StepIndicator = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 32px;
	gap: 8px;

	@media (max-width: 768px) {
		margin-bottom: 14px;
		gap: 6px;
	}
`;

const StepDotBase = styled.div<{ $active: boolean; $completed: boolean }>`
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: ${({ $active, $completed }) => {
		if ($completed) return COLORS.success;
		if ($active) return COLORS.primary;
		return '#e2e8f0';
	}};
	transition: all 0.3s ease;
`;

const StepDot: React.FC<{ active: boolean; completed: boolean }> = ({
	active,
	completed,
}) => {
	return <StepDotBase $active={active} $completed={completed} />;
};

const StepContent = styled.div`
	text-align: center;
	margin-bottom: 32px;

	h2 {
		font-size: 24px;
		font-weight: 600;
		color: #1e293b;
		margin: 0 0 16px 0;
	}

	p {
		font-size: 16px;
		color: #64748b;
		line-height: 1.6;
		margin: 0 0 24px 0;
	}

	.feature-list {
		text-align: left;
		max-width: 400px;
		margin: 0 auto;

		ul {
			list-style: none;
			padding: 0;
			margin: 0;

			li {
				display: flex;
				align-items: center;
				margin-bottom: 12px;
				font-size: 16px;
				color: #475569;

				&:before {
					content: '✓';
					color: ${COLORS.success};
					font-weight: bold;
					margin-right: 12px;
					font-size: 18px;
				}
			}
		}
	}

	@media (max-width: 768px) {
		margin-bottom: 14px;

		h2 {
			font-size: 20px;
			margin: 0 0 10px 0;
		}

		p {
			font-size: 14px;
			line-height: 1.45;
			margin: 0 0 12px 0;
		}
	}
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 16px;
	justify-content: center;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;

		button {
			width: 100%;
		}
	}
`;

const PrimaryButton = styled.button`
	background: #16a34a;
	color: white;
	border: none;
	padding: 12px 28px;
	border-radius: 8px;
	font-size: 16px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);

	&:hover {
		background: #15803d;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3);
	}

	&:active {
		transform: translateY(0);
	}
`;

const SkipButton = styled.button`
	background: transparent;
	color: #64748b;
	border: none;
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 14px;
	cursor: pointer;
	text-decoration: underline;
	transition: color 0.2s ease;

	&:hover {
		color: #475569;
	}
`;

// Celebration Modal
const CelebrationModal = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.9);
	z-index: 11001;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	overflow-x: hidden;
	animation: fadeIn 0.5s ease;

	@media (max-width: 768px) {
		align-items: center;
		padding: max(10px, calc(8px + env(safe-area-inset-top))) 10px
			max(10px, calc(8px + env(safe-area-inset-bottom)));
	}
`;

const CelebrationContent = styled.div`
	background: white;
	border-radius: 20px;
	padding: 60px 40px;
	max-width: 500px;
	width: 100%;
	max-height: min(92vh, calc(100dvh - 20px));
	overflow-y: auto;
	overflow-x: hidden;
	text-align: center;
	box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
	animation: bounceIn 0.6s ease;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes bounceIn {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		50% {
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		border-radius: 14px;
		padding: 22px 16px 18px;
		max-width: 100%;
		max-height: calc(100dvh - 20px);
	}

	@media (max-width: 480px) {
		padding: 18px 14px 14px;
	}
`;

const CelebrationIcon = styled.div`
	font-size: 80px;
	margin-bottom: 24px;
	animation: celebrate 1s ease infinite alternate;
	color: ${COLORS.success};

	@keyframes celebrate {
		from {
			transform: scale(1);
		}
		to {
			transform: scale(1.1);
		}
	}

	@media (max-width: 768px) {
		font-size: 54px;
		margin-bottom: 12px;
	}
`;

const CelebrationTitle = styled.h1`
	font-size: 32px;
	font-weight: 700;
	color: ${COLORS.primary};
	margin: 0 0 16px 0;

	@media (max-width: 768px) {
		font-size: 24px;
		line-height: 1.2;
		margin: 0 0 10px 0;
	}
`;

const CelebrationMessage = styled.p`
	font-size: 18px;
	color: #64748b;
	line-height: 1.6;
	margin: 0 0 32px 0;

	@media (max-width: 768px) {
		font-size: 14px;
		line-height: 1.45;
		margin: 0 0 14px 0;
	}
`;

const CelebrationActions = styled.div`
	display: flex;
	justify-content: center;
	gap: 16px;

	@media (max-width: 768px) {
		width: 100%;
		gap: 10px;

		button {
			width: 100%;
			padding: 11px 14px;
			font-size: 15px;
		}
	}
`;

const MinimizedWaitingModal = styled.div`
	position: fixed;
	bottom: 20px;
	right: 20px;
	background: transparent;
	z-index: 11000;
	pointer-events: none;

	@media (max-width: 1024px) {
		bottom: max(16px, calc(12px + env(safe-area-inset-bottom)));
		right: 16px;
	}
`;

const MinimizedWaitingContent = styled.div`
	pointer-events: auto;
`;

const MinimizedWaitingText = styled.div`
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
`;

const MinimizedWaitingActions = styled.div`
	display: block;
`;

const MinimizedWaitingButton = styled.button`
	display: inline-flex;
	align-items: center;
	background: ${COLORS.primary};
	justify-content: center;
	color: #0f172a;
	border: 1px solid #cbd5e1;
	width: 42px;
	height: 42px;
	border-radius: 999px;
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.01em;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 8px 22px rgba(15, 23, 42, 0.2);

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.24);
	}

	.indicator {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: ${COLORS.primary};
		color: #166534;
		font-size: 11px;
		font-weight: 800;
		line-height: 1;
	}

	@media (max-width: 768px) {
		width: 40px;
		height: 40px;
	}
`;

// Role selection
const RoleGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin-top: 24px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		margin-top: 12px;
	}
`;

const RoleCard = styled.button<{ $selected?: boolean }>`
	padding: 18px 16px;
	border-radius: 12px;
	border: 2px solid ${(p) => (p.$selected ? '#16a34a' : '#e2e8f0')};
	background: ${(p) => (p.$selected ? '#f0fdf4' : '#f8fafc')};
	cursor: pointer;
	text-align: left;
	transition: all 0.2s ease;
	display: flex;
	flex-direction: column;
	gap: 6px;

	&:hover {
		border-color: #16a34a;
		background: #f0fdf4;
		transform: translateY(-1px);
	}

	@media (max-width: 768px) {
		padding: 12px 12px;
		gap: 4px;
	}
`;

const RoleCardEmoji = styled.div`
	font-size: 26px;
	margin-bottom: 2px;
`;

const RoleCardLabel = styled.div`
	font-size: 15px;
	font-weight: 700;
	color: #0f172a;
`;

const RoleCardDesc = styled.div`
	font-size: 12px;
	color: #64748b;
	line-height: 1.4;
`;

// Payoff preview card
const PayoffPreview = styled.div`
	background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
	border: 1px solid rgba(22, 163, 74, 0.2);
	border-radius: 12px;
	padding: 18px;
	margin-top: 20px;
	text-align: left;

	@media (max-width: 768px) {
		padding: 12px;
		margin-top: 12px;
	}
`;

const PayoffPreviewTitle = styled.div`
	font-size: 12px;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.07em;
	color: #16a34a;
	margin-bottom: 12px;
`;

const PayoffItems = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const PayoffItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	font-size: 14px;
	color: #1e293b;

	.icon {
		font-size: 16px;
		margin-top: 1px;
		flex-shrink: 0;
	}

	.text strong {
		display: block;
		font-weight: 700;
		color: #0f172a;
	}

	.text span {
		font-size: 12px;
		color: #64748b;
	}
`;

const BridgeStatement = styled.div`
	margin-top: 14px;
	padding: 10px 12px;
	border-radius: 8px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	font-size: 13px;
	font-weight: 600;
	color: #334155;
	text-align: left;

	@media (max-width: 768px) {
		margin-top: 10px;
		font-size: 12px;
		padding: 8px 10px;
	}
`;

const VisualPayoffGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;
	margin-top: 16px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const VisualPayoffCard = styled.div`
	background: #ffffff;
	border: 1px solid #d1fae5;
	border-radius: 10px;
	padding: 12px;
	text-align: left;
	box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);

	.header {
		font-size: 12px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #16a34a;
		margin-bottom: 8px;
	}

	.title {
		font-size: 13px;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 5px;
	}

	.meta {
		font-size: 12px;
		color: #64748b;
		line-height: 1.35;
	}
`;

// Enhanced interfaces
interface OnboardingStep {
	id: string;
	type: 'instruction' | 'celebration' | 'page_guide' | 'waiting';
	title: string;
	description: string;
	content?: React.ReactNode;
	actionLabel?: string;
	action?: () => void;
	waitCondition?: () => boolean;
	autoAdvance?: boolean;
	skipLabel?: string;
}

interface OnboardingFlowProps {
	onComplete: () => void;
	onSkip: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
	onComplete,
	onSkip,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);

	// Fetch data for real-time validation
	const { data: properties = [] } = useGetPropertiesQuery();

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [showCelebration, setShowCelebration] = useState(false);
	const [userPersona, setUserPersona] = useState<'homeowner' | 'landlord' | 'manager' | null>(null);
	const [isCompactMobile, setIsCompactMobile] = useState(
		typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
	);
	const [waitingModalMinimized, setWaitingModalMinimized] = useState(false);

	useEffect(() => {
		const handleResize = () => setIsCompactMobile(window.innerWidth <= 768);
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Handle step advancement
	const advanceToNextStep = useCallback(() => {
		setCurrentStepIndex((prev) => prev + 1);
	}, []);

	// Determine user type and permissions (use selectors)
	const isHomeowner = useSelector(selectIsHomeowner);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isPropertyManager =
		!!currentUser && canAccessProperties && !isHomeowner;
	const hasSuggestedTaskAutomation = currentUser?.subscription
		? canUseSuggestedMaintenancePackages(currentUser.subscription)
		: false;
	const hasSetupAssistantProgress = properties.some(
		(property: any) =>
			getPropertySetupProgress(property.setupAssistant).reviewed > 0 ||
			Boolean(property.setupAssistant?.completedAt),
	);

	const toDate = (value: any): Date | null => {
		if (!value) return null;
		if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
		if (typeof value?.toDate === 'function') {
			const converted = value.toDate();
			return converted instanceof Date && !Number.isNaN(converted.getTime())
				? converted
				: null;
		}
		if (typeof value === 'string' || typeof value === 'number') {
			const converted = new Date(value);
			return Number.isNaN(converted.getTime()) ? null : converted;
		}
		if (typeof value?.seconds === 'number') {
			const converted = new Date(value.seconds * 1000);
			return Number.isNaN(converted.getTime()) ? null : converted;
		}
		if (typeof value?._seconds === 'number') {
			const converted = new Date(value._seconds * 1000);
			return Number.isNaN(converted.getTime()) ? null : converted;
		}
		return null;
	};

	const latestCreatedProperty = (properties as any[]).reduce<any | null>(
		(currentLatest, property) => {
			if (!property) return currentLatest;
			if (!currentLatest) return property;

			const propertyDate =
				toDate(property.createdAt) ||
				toDate(property.updatedAt) ||
				toDate(property.dateCreated);
			const currentLatestDate =
				toDate(currentLatest.createdAt) ||
				toDate(currentLatest.updatedAt) ||
				toDate(currentLatest.dateCreated);

			if (!propertyDate && !currentLatestDate) return property;
			if (!propertyDate) return currentLatest;
			if (!currentLatestDate) return property;

			return propertyDate.getTime() >= currentLatestDate.getTime()
				? property
				: currentLatest;
		},
		null,
	);

	const createdPropertyAddress =
		String(
			latestCreatedProperty?.address ||
			latestCreatedProperty?.title ||
			latestCreatedProperty?.name ||
			'Your property',
		).trim() || 'Your property';

	const createdPropertyMonthYear = new Intl.DateTimeFormat('en-US', {
		month: 'long',
		year: 'numeric',
	}).format(
		toDate(latestCreatedProperty?.createdAt) ||
		toDate(latestCreatedProperty?.updatedAt) ||
		toDate(latestCreatedProperty?.dateCreated) ||
		new Date(),
	);

	// Enhanced step definitions with validation and celebration logic
	const getSteps = (): OnboardingStep[] => {
		// Persona-aware copy
		const welcomeHeadline =
			userPersona === 'homeowner'
				? 'Stop letting maintenance pile up.'
				: userPersona === 'landlord'
					? 'Stop managing properties from memory.'
					: userPersona === 'manager'
						? 'Bring order to multi-property maintenance.'
						: 'Your property maintenance, finally organized.';

		const welcomeSubtext =
			userPersona === 'homeowner'
				? isCompactMobile
					? 'Stay ahead of repairs with a simple system for tasks, service history, and reminders.'
					: "We'll help you stay ahead of repairs, track every service, and never forget an important maintenance task again."
				: userPersona === 'landlord'
					? isCompactMobile
						? 'Track repairs, appliances, and service records across properties in one place.'
						: "Track appliances, repairs, contractors, and service history across all your properties in one place."
					: userPersona === 'manager'
						? isCompactMobile
							? 'Manage tasks, teams, and records across your portfolio with less back-and-forth.'
							: "Manage tasks, tenants, contractors, and maintenance records across your entire portfolio."
						: isCompactMobile
							? 'Track appliances, repairs, and service history so nothing falls through the cracks.'
							: 'Track appliances, repairs, tasks, and service history in one place — so nothing falls through the cracks.';

		const steps: OnboardingStep[] = [
			// Step 0: Role selection
			{
				id: 'who_are_you',
				type: 'instruction',
				title: 'First — how are you using Maintley?',
				description: 'Pick your role so we can keep this relevant and fast.',
				content: (
					<RoleGrid>
						{[
							{ id: 'homeowner' as const, emoji: '🏡', label: 'Homeowner', desc: 'Keeping my home maintained and organized' },
							{ id: 'landlord' as const, emoji: '🏘️', label: 'Landlord / Investor', desc: 'Managing 1–5 rental or investment properties' },
							{ id: 'manager' as const, emoji: '🏢', label: 'Property Manager', desc: 'Managing portfolios and teams' },
						].map((role) => (
							<RoleCard
								key={role.id}
								type="button"
								$selected={userPersona === role.id}
								onClick={() => setUserPersona(role.id)}>
								<RoleCardEmoji>{role.emoji}</RoleCardEmoji>
								<RoleCardLabel>{role.label}</RoleCardLabel>
								<RoleCardDesc>{role.desc}</RoleCardDesc>
							</RoleCard>
						))}
					</RoleGrid>
				),
				actionLabel: userPersona ? 'Continue →' : undefined,
				action: () => advanceToNextStep(),
				skipLabel: 'Skip',
			},

			// Step 1: Welcome
			{
				id: 'welcome_beta',
				type: 'instruction',
				title: welcomeHeadline,
				description: welcomeSubtext,
				content: (
					<PayoffPreview>
						<PayoffPreviewTitle>What you'll have by the end of setup</PayoffPreviewTitle>
						<PayoffItems>
							<PayoffItem>
								<span className="icon">🏠</span>
								<div className="text">
									<strong>Your property, fully profiled</strong>
									<span>All key info and history in one place</span>
								</div>
							</PayoffItem>
							<PayoffItem>
								<span className="icon">✅</span>
								<div className="text">
									<strong>Your first maintenance task live</strong>
									<span>With reminders so nothing gets forgotten</span>
								</div>
							</PayoffItem>
							<PayoffItem>
								<span className="icon">📋</span>
								<div className="text">
									<strong>The foundation of your service history</strong>
									<span>Every future repair adds to a record you'll actually use</span>
								</div>
							</PayoffItem>
							{isCompactMobile && (
								<PayoffItem>
									<span className="icon">🧠</span>
									<div className="text">
										<strong>Property Assistant + Property Scan</strong>
										<span>Maintley reviews the record and highlights what is worth attention</span>
									</div>
								</PayoffItem>
							)}
						</PayoffItems>
					</PayoffPreview>
				),
				actionLabel: "Let's get started →",
				action: () => advanceToNextStep(),
				skipLabel: 'Skip Tour',
			},

			// Step 2: Create Property (with waiting)
			{
				id: 'create_property_instruction',
				type: 'instruction',
				title: 'Add your first property.',
				description:
					"This takes about 2 minutes and starts your long-term maintenance record. I'll open the add-property dialog for you.",
				content: (
					<div style={{ textAlign: 'left', marginTop: '20px' }}>
						<p style={{ marginBottom: '12px', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
							You only need:
						</p>
						<ul style={{ paddingLeft: '20px', margin: '0', color: '#475569', fontSize: '14px', lineHeight: isCompactMobile ? '1.55' : '2' }}>
							<li>Property address</li>
							<li>Property type</li>
							{!isCompactMobile && <li>Optional details (year built, square footage)</li>}
						</ul>

						<BridgeStatement style={{ marginTop: '14px' }}>
							Clear takeaway: this becomes the single place for future repairs, tasks, and service history.
						</BridgeStatement>
					</div>
				),
				actionLabel: 'Add My Property →',
				action: () => {
					navigate('/properties?openCreate=onboarding');
					setCurrentStepIndex(currentStepIndex + 1);
				},
				skipLabel: 'Skip This Step',
			},

			// Step 3: Wait for Property Creation
			{
				id: 'wait_property_creation',
				type: 'waiting',
				title: 'Go ahead and add your property.',
				description:
					"Take your time. I'll stay in the background and pop back in once it's ready.",
				waitCondition: () => properties.length > 0,
				autoAdvance: true,
			},

			// Step 4: Property Created Celebration
			{
				id: 'property_celebration',
				type: 'celebration',
				title: 'Your first property is live. 🎉',
				description:
					"You now have a permanent home for every repair and service record for this property.",
				content: (
					<VisualPayoffGrid>
						<VisualPayoffCard>
							<div className='header'>Record</div>
							<div className='title'>{createdPropertyAddress} profile created</div>
							<div className='meta'>History starts now and grows with every completed job.</div>
						</VisualPayoffCard>
						<VisualPayoffCard>
							<div className='header'>Timeline</div>
							<div className='title'>{createdPropertyMonthYear}: Property added</div>
							<div className='meta'>Next entries appear automatically as work gets logged.</div>
						</VisualPayoffCard>
						<VisualPayoffCard>
							<div className='header'>Payoff</div>
							<div className='title'>Ready for one complete history</div>
							<div className='meta'>Everything is ready to be attached here as future services and repairs happen.</div>
						</VisualPayoffCard>
					</VisualPayoffGrid>
				),
			},
		];

		// Navigation and detail page guidance
		steps.push(
			{
				id: 'click_property_instruction',
				type: 'waiting',
				title: 'Now that your property is set up, open it.',
				description:
					'This is where appliances, tasks, and maintenance history come together.',
				waitCondition: () => location.pathname.includes('/property/'),
				autoAdvance: true,
			},
			{
				id: 'property_detail_page_guide',
				type: 'page_guide',
				title: 'Your Property Command Center',
				description:
					'Everything for this property lives here: tasks, appliances, contractors, and history.',
				content: (
					<BridgeStatement>
						We are moving from property setup to the core systems and work inside the property.
					</BridgeStatement>
				),
				actionLabel: 'Got it →',
				action: () => {
					setCurrentStepIndex(currentStepIndex + 1);
				},
			},
		);

		// Property setup assistant steps
		steps.push(
			{
				id: 'wait_setup_assistant',
				type: 'waiting',
				title: 'Property Setup Assistant.',
				description:
					"Complete the Property Setup Assistant to start your maintenance journey.",
				waitCondition: () => hasSetupAssistantProgress,
				autoAdvance: true,
				skipLabel: 'Skip Tour',
			},
		);

		if (isPropertyManager) {
			steps.push({
				id: 'advanced_features_manager',
				type: 'instruction',
				title: 'Built for teams too.',
				description: 'As your portfolio grows, maintenance history and accountability stay intact.',
				content: (
					<div style={{ textAlign: 'left', marginTop: '20px' }}>
						<div style={{ marginBottom: '18px' }}>
							<h4 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700' }}>
								👥 Team Management
							</h4>
							<p style={{ margin: '0 0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
								Invite team members, assign tasks, and keep shared records. Everyone works from the same source of truth.
							</p>
						</div>
						<div style={{ marginBottom: '18px' }}>
							<h4 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700' }}>
								🏘️ Tenant Access
							</h4>
							<p style={{ margin: '0 0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
								Give tenants limited access to submit maintenance requests directly. Faster communication, automatic documentation.
							</p>
						</div>
						<div>
							<h4 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700' }}>
								🏢 Property-Level Management
							</h4>
							<p style={{ margin: '0 0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
								Manage appliances, tasks, and history from a single property record.
							</p>
						</div>
					</div>
				),
				actionLabel: 'Got it →',
				action: () => {
					setCurrentStepIndex(currentStepIndex + 1);
				},
			});
		}

		steps.push({
			id: 'homeowner_complete',
			type: 'instruction',
			title: "You're already ahead of most property owners.",
			description:
				'Your property setup has started. Maintley can now connect appliances, tasks, and future maintenance history.',
			content: (
				<>
					<PayoffPreview>
						<PayoffPreviewTitle>What's waiting for you</PayoffPreviewTitle>
						<PayoffItems>
							<PayoffItem>
								<span className="icon">✅</span>
								<div className="text">
									<strong>Your property setup is underway</strong>
									<span>
										{hasSuggestedTaskAutomation
											? 'Appliances and suggested tasks now have a starting point'
											: 'Appliances and core property details now have a starting point'}
									</span>
								</div>
							</PayoffItem>
							<PayoffItem>
								<span className="icon">🏠</span>
								<div className="text">
									<strong>Your property dashboard is ready</strong>
									<span>Review appliances, tasks, and history as you go</span>
								</div>
							</PayoffItem>
							{!isCompactMobile && (
								<PayoffItem>
									<span className="icon">🛡️</span>
									<div className="text">
										<strong>Your maintenance record has started</strong>
										<span>Every completed task adds to a history you'll actually use</span>
									</div>
								</PayoffItem>
							)}
						</PayoffItems>
					</PayoffPreview>
					{!isCompactMobile && (
						<VisualPayoffGrid>
							<VisualPayoffCard>
								<div className='header'>Next</div>
								<div className='title'>Review starter tasks</div>
								<div className='meta'>Adjust due dates, assignments, and notes as needed.</div>
							</VisualPayoffCard>
							<VisualPayoffCard>
								<div className='header'>Later</div>
								<div className='title'>Complete maintenance tasks</div>
								<div className='meta'>Finished work becomes property history.</div>
							</VisualPayoffCard>
							<VisualPayoffCard>
								<div className='header'>Anytime</div>
								<div className='title'>Export clear maintenance history</div>
								<div className='meta'>Useful for claims, taxes, resale, and team handoff.</div>
							</VisualPayoffCard>
						</VisualPayoffGrid>
					)}
				</>
			),
			actionLabel: 'Finish Tour',
			action: () => {
				onComplete();
			},
		});

		return steps;
	};

	const steps = getSteps();
	const currentStep = steps[currentStepIndex];
	const currentStepId = currentStep?.id;
	const currentStepType = currentStep?.type;
	const currentStepAutoAdvance = currentStep?.autoAdvance;
	const currentStepWaitCondition = currentStep?.waitCondition;

	// Check if we've completed all steps
	useEffect(() => {
		if (currentStepIndex >= steps.length) {
			onComplete();
		}
	}, [currentStepIndex, steps.length, onComplete]);

	// Handle step skipping
	const skipOnboarding = () => {
		onSkip();
	};

	// Check for auto-advancement conditions
	useEffect(() => {
		if (currentStepAutoAdvance && currentStepWaitCondition) {
			if (currentStepWaitCondition()) {
				advanceToNextStep();
			}
		}
	}, [
		properties,
		hasSetupAssistantProgress,
		location.pathname,
		currentStepId,
		currentStepAutoAdvance,
		currentStepWaitCondition,
		advanceToNextStep,
	]);

	// Handle celebration steps
	useEffect(() => {
		const shouldShowCelebration = currentStepType === 'celebration';
		setShowCelebration((previous) =>
			previous === shouldShowCelebration ? previous : shouldShowCelebration,
		);
	}, [currentStepType]);

	useEffect(() => {
		if (currentStep?.type !== 'waiting') {
			setWaitingModalMinimized(false);
		}
	}, [currentStep?.type]);

	// Render different modal types
	if (showCelebration) {
		return (
			<CelebrationModal>
				<CelebrationContent>
					<CelebrationIcon>✅</CelebrationIcon>
					<CelebrationTitle>{currentStep.title}</CelebrationTitle>
					<CelebrationMessage>{currentStep.description}</CelebrationMessage>
					{currentStep.content}

					<CelebrationActions style={{ marginTop: '20px' }}>
						<PrimaryButton onClick={advanceToNextStep}>Keep going →</PrimaryButton>
					</CelebrationActions>
				</CelebrationContent>
			</CelebrationModal>
		);
	}

	// Handle waiting steps
	if (currentStep?.type === 'waiting') {
		if (
			waitingModalMinimized &&
			(currentStep.id === 'wait_property_creation' ||
				currentStep.id === 'wait_setup_assistant')
		) {
			const minimizedWaitingMessage =
				currentStep.id === 'wait_setup_assistant'
					? 'Listening for Property Setup Assistant progress. I will pop back in as soon as setup starts.'
					: 'Listening for your property to be created. I will pop back in when it is ready.';

			return (
				<MinimizedWaitingModal>
					<MinimizedWaitingContent>
						<MinimizedWaitingText>
							{minimizedWaitingMessage}
						</MinimizedWaitingText>
						<MinimizedWaitingActions>
							<MinimizedWaitingButton
								onClick={() => setWaitingModalMinimized(false)}
								aria-label={minimizedWaitingMessage}>
								<span className='indicator' style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', color: 'white' }}>
									<FontAwesomeIcon icon={faChevronUp} size='lg' aria-hidden='true' style={{ color: 'white', background: 'transparent' }} />
								</span>
							</MinimizedWaitingButton>
						</MinimizedWaitingActions>
					</MinimizedWaitingContent>
				</MinimizedWaitingModal>
			);
		}

		return (
			<OnboardingOverlay>
				<OnboardingModal>
					<OnboardingHeader>
						<h1>Your maintenance system is taking shape.</h1>
						<p>
							{currentStepIndex + 1} of {steps.length} steps complete
						</p>
					</OnboardingHeader>

					<StepIndicator>
						{steps.map((_, index) => (
							<StepDot
								key={index}
								active={index === currentStepIndex}
								completed={index < currentStepIndex}
							/>
						))}
					</StepIndicator>

					<StepContent>
						<h2>{currentStep.title}</h2>
						<p>{currentStep.description}</p>
						{currentStep.content}
					</StepContent>

					<ActionButtons>
						{currentStep.id === 'wait_setup_assistant' && hasSetupAssistantProgress ? (
							<>
								<PrimaryButton onClick={advanceToNextStep}>
									Continue
								</PrimaryButton>
								<SkipButton onClick={skipOnboarding}>
									{currentStep.skipLabel || 'Skip Tour'}
								</SkipButton>
							</>
						) : currentStep.id === 'wait_setup_assistant' ? (
							<>
								<PrimaryButton onClick={() => setWaitingModalMinimized(true)}>
									Ok
								</PrimaryButton>
								<SkipButton onClick={skipOnboarding}>
									{currentStep.skipLabel || 'Skip Tour'}
								</SkipButton>
							</>
						) : currentStep.id === 'wait_property_creation' ? (
							<>
								<PrimaryButton onClick={() => setWaitingModalMinimized(true)}>
									Ok
								</PrimaryButton>
								<SkipButton onClick={skipOnboarding}>
									{currentStep.skipLabel || 'Skip Tour'}
								</SkipButton>
							</>
						) : (
							<SkipButton onClick={skipOnboarding}>
								{currentStep.skipLabel || 'Skip Tour'}
							</SkipButton>
						)}
					</ActionButtons>
				</OnboardingModal>
			</OnboardingOverlay>
		);
	}

	// If we've completed all steps, don't render anything
	if (!currentStep) {
		return null;
	}

	// Main instruction modal
	return (
		<OnboardingOverlay>
			<OnboardingModal>
				<OnboardingHeader>
					<h1>
						{currentStepIndex <= 1
							? 'Welcome to Maintley'
							: 'Your maintenance system is taking shape.'}
					</h1>
					<p>
						{currentStepIndex <= 1
							? 'A few quick questions to get you set up right.'
							: `${currentStepIndex + 1} of ${steps.length} steps complete`}
					</p>
				</OnboardingHeader>

				<StepIndicator>
					{steps.map((_, index) => (
						<StepDot
							key={index}
							active={index === currentStepIndex}
							completed={index < currentStepIndex}
						/>
					))}
				</StepIndicator>

				<StepContent>
					<h2>{currentStep.title}</h2>
					<p>{currentStep.description}</p>
					{currentStep.content}
				</StepContent>

				<ActionButtons>
					{currentStep.actionLabel && (
						<PrimaryButton onClick={currentStep.action}>
							{currentStep.actionLabel}
						</PrimaryButton>
					)}
					<SkipButton onClick={skipOnboarding}>
						{currentStepIndex === steps.length - 1
							? ''
							: currentStep.skipLabel || 'Skip Tour'}
					</SkipButton>
				</ActionButtons>
			</OnboardingModal>
		</OnboardingOverlay>
	);
};
