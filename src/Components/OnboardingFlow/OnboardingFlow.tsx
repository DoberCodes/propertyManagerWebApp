import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../Redux/store/store';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import { useGetTasksQuery } from '../../Redux/API/taskSlice';
import {
	selectIsHomeowner,
	selectCanAccessProperties,
	selectCanAccessTeam,
} from '../../Redux/selectors/permissionSelectors';

const OnboardingOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.8);
	z-index: 1000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
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
`;

const StepIndicator = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 32px;
	gap: 8px;
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
`;

const ActionButtons = styled.div`
	display: flex;
	gap: 16px;
	justify-content: center;

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: center;
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
	z-index: 1001;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	animation: fadeIn 0.5s ease;
`;

const CelebrationContent = styled.div`
	background: white;
	border-radius: 20px;
	padding: 60px 40px;
	max-width: 500px;
	width: 100%;
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
`;

const CelebrationTitle = styled.h1`
	font-size: 32px;
	font-weight: 700;
	color: ${COLORS.primary};
	margin: 0 0 16px 0;
`;

const CelebrationMessage = styled.p`
	font-size: 18px;
	color: #64748b;
	line-height: 1.6;
	margin: 0 0 32px 0;
`;

const CelebrationActions = styled.div`
	display: flex;
	justify-content: center;
	gap: 16px;
`;

// Page Guide Modal (for explaining specific pages)
const PageGuideModal = styled.div`
	position: fixed;
	top: 20px;
	right: 20px;
	background: white;
	border-radius: 16px;
	padding: 24px;
	max-width: 350px;
	width: 100%;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	z-index: 1001;
	animation: slideIn 0.4s ease;

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	@media (max-width: 1024px) {
		position: fixed;
		top: auto;
		bottom: 20px;
		right: 20px;
		left: 20px;
		max-width: none;
	}
`;

const PageGuideHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	margin-bottom: 16px;
`;

const PageGuideTitle = styled.h3`
	font-size: 20px;
	font-weight: 600;
	color: ${COLORS.primary};
	margin: 0;
`;

const PageGuideClose = styled.button`
	background: none;
	border: none;
	color: #64748b;
	cursor: pointer;
	padding: 4px;
	border-radius: 4px;
	transition: color 0.2s ease;

	&:hover {
		color: #475569;
	}
`;

const PageGuideContent = styled.div`
	font-size: 16px;
	color: #475569;
	line-height: 1.6;
	margin-bottom: 20px;
`;

const PageGuideActions = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
`;

// Minimized Waiting Modal (non-blocking)
const MinimizedWaitingModal = styled.div<{ $visible: boolean }>`
	position: fixed;
	top: 20px;
	right: 20px;
	background: #f8fafc;
	border: 2px solid ${COLORS.primary};
	border-radius: 12px;
	padding: 16px 20px;
	box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
	z-index: 999;
	max-width: 300px;
	opacity: ${({ $visible }) => ($visible ? 1 : 0)};
	transform: ${({ $visible }) =>
		$visible ? 'translateY(0)' : 'translateY(-20px)'};
	transition: all 0.3s ease;
	pointer-events: ${({ $visible }) => ($visible ? 'auto' : 'none')};

	@media (max-width: 1024px) {
		top: 20px;
		right: 20px;
		left: 20px;
		max-width: none;
	}
`;

const MinimizedWaitingContent = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
`;

const MinimizedWaitingText = styled.div`
	flex: 1;
	font-size: 14px;
	color: #475569;
	line-height: 1.4;
`;

const MinimizedWaitingActions = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;
`;

const HelpButton = styled.button`
	background: #16a34a;
	color: white;
	border: none;
	padding: 6px 12px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: #15803d;
		transform: translateY(-1px);
	}
`;

// Role selection
const RoleGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin-top: 24px;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
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
	const { data: tasks = [] } = useGetTasksQuery();

	const [currentStepIndex, setCurrentStepIndex] = useState(0);
	const [showCelebration, setShowCelebration] = useState(false);
	const [showPageGuide, setShowPageGuide] = useState(false);
	const [userPersona, setUserPersona] = useState<'homeowner' | 'landlord' | 'manager' | null>(null);
	const [pageGuideContent, setPageGuideContent] = useState<{
		title: string;
		content: string;
		actionLabel?: string;
		onAction?: () => void;
	} | null>(null);
	const [waitingModalMinimized, setWaitingModalMinimized] = useState(false);

	// Functions to control modal visibility
	const restoreWaitingModal = () => {
		setWaitingModalMinimized(false);
	};

	const minimizeWaitingModal = () => {
		setWaitingModalMinimized(true);
	};

	// Handle step advancement
	const advanceToNextStep = useCallback(() => {
		setCurrentStepIndex((prev) => prev + 1);
	}, []);

	// Determine user type and permissions (use selectors)
	const isHomeowner = useSelector(selectIsHomeowner);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const isPropertyManager =
		!!currentUser && canAccessProperties && !isHomeowner;
	const canManageTeam = useSelector(selectCanAccessTeam);

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
				? "We'll help you stay ahead of repairs, track every service, and never forget an important maintenance task again."
				: userPersona === 'landlord'
				? "Track devices, repairs, contractors, and service history across all your properties in one place."
				: userPersona === 'manager'
				? "Manage tasks, tenants, contractors, and maintenance records across your entire portfolio."
				: "Track devices, repairs, tasks, and service history in one place — so nothing falls through the cracks.";

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
				description: "This takes about 2 minutes and starts your long-term maintenance record.",
				content: (
					<div style={{ textAlign: 'left', marginTop: '20px' }}>
						<p style={{ marginBottom: '12px', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
							You only need:
						</p>
						<ul style={{ paddingLeft: '20px', margin: '0', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
							<li>Property address</li>
							<li>Property type</li>
							<li>Optional details (year built, square footage)</li>
						</ul>
						<BridgeStatement>
							Clear takeaway: this becomes the single place for future repairs, tasks, and service history.
						</BridgeStatement>
					</div>
				),
				actionLabel: 'Add My Property →',
				action: () => {
					navigate('/properties');
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
							<div className='title'>123 Main St profile created</div>
							<div className='meta'>History starts now and grows with every completed job.</div>
						</VisualPayoffCard>
						<VisualPayoffCard>
							<div className='header'>Timeline</div>
							<div className='title'>May 2026: Property added</div>
							<div className='meta'>Next entries appear automatically as work gets logged.</div>
						</VisualPayoffCard>
						<VisualPayoffCard>
							<div className='header'>Payoff</div>
							<div className='title'>No more scattered records</div>
							<div className='meta'>Everything is now attached to one property history.</div>
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
					"This is where systems, tasks, and maintenance continuity come together.",
				waitCondition: () => location.pathname.includes('/property/'),
				autoAdvance: true,
			},
			{
				id: 'property_detail_page_guide',
				type: 'page_guide',
				title: 'Your Property Command Center',
				description:
					'Everything for this property lives here: tasks, devices, contractors, and history.',
				content: (
					<div style={{ textAlign: 'left', marginTop: '16px' }}>
						<BridgeStatement>
							Bridge: now we move from property setup to the systems and work inside that property.
						</BridgeStatement>

						<p style={{ marginBottom: '12px', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
							Tabs to explore:
						</p>
						<ul style={{ paddingLeft: '20px', margin: '0', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
							<li><strong>Devices</strong> — your home systems, appliances, and components</li>
							<li><strong>Tasks</strong> — scheduled work, overdue items, recurring reminders</li>
							<li><strong>Maintenance History</strong> — a permanent record of every service</li>
							<li><strong>Contractors</strong> — your trusted service providers</li>
						</ul>
					</div>
				),
				actionLabel: 'Got it →',
				action: () => {
					setCurrentStepIndex(currentStepIndex + 1);
				},
			},
		);

		// Task creation steps
		steps.push(
			{
				id: 'create_task_instruction',
				type: 'instruction',
				title: 'Next, create one recurring task.',
				description:
					'Tasks prevent missed maintenance and build continuity over time.',
				content: (
					<div style={{ textAlign: 'left', marginTop: '20px' }}>
						<p style={{ marginBottom: '12px', fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>
							One task gives you:
						</p>
						<ul style={{ paddingLeft: '20px', margin: '0', color: '#475569', fontSize: '14px', lineHeight: '2' }}>
							<li>Automatic reminders before due dates</li>
							<li>Recurring scheduling (HVAC filters, inspections)</li>
							<li>A logged record once work is completed</li>
						</ul>
						<div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d', fontSize: '13px', color: '#92400e' }}>
							💡 <strong>Tip:</strong> Start with something you know is coming up — a filter change, an inspection, or a seasonal check.
						</div>
						<BridgeStatement>
							Now that the property exists, we track the systems and work inside it.
						</BridgeStatement>
					</div>
				),
				actionLabel: 'Understood →',
				action: () => {
					setCurrentStepIndex(currentStepIndex + 1);
				},
				skipLabel: 'Skip Task Creation',
			},

			{
				id: 'wait_task_creation',
				type: 'waiting',
				title: "Create your first maintenance task.",
				description:
					"I'll stay out of your way — minimize me and explore freely. I'll pop back in when your first task is created.",
				waitCondition: () => tasks.length > 0,
				autoAdvance: true,
			},

			{
				id: 'task_celebration',
				type: 'celebration',
				title: 'Your maintenance system is taking shape. 🎯',
				description:
					"Your first task is live. Reminders are automatic, and completion becomes permanent history.",
				content: (
					<VisualPayoffGrid>
						<VisualPayoffCard>
							<div className='header'>Future Reminder</div>
							<div className='title'>HVAC Filter Change</div>
							<div className='meta'>Due in 90 days • Reminder 7 days before</div>
						</VisualPayoffCard>
						<VisualPayoffCard>
							<div className='header'>Maintenance Timeline</div>
							<div className='title'>May 2026: Task created</div>
							<div className='meta'>Aug 2026: Completed and logged to history</div>
						</VisualPayoffCard>
						<VisualPayoffCard>
							<div className='header'>Device History</div>
							<div className='title'>HVAC service record</div>
							<div className='meta'>Cost, notes, and docs stay attached over time</div>
						</VisualPayoffCard>
					</VisualPayoffGrid>
				),
			},
		);

		// Advanced features
		steps.push({
			id: 'advanced_features',
			type: 'instruction',
			title: "There's more when you're ready.",
			description:
				'You have the core system. These tools increase continuity and visibility.',
			content: (
				<div style={{ textAlign: 'left', marginTop: '20px' }}>
					<div style={{ marginBottom: '18px' }}>
						<h4 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span>🔧</span>
							Devices & Home Systems
						</h4>
						<p style={{ margin: '0 0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
							Track system history, warranties, and recurring service in one timeline.
						</p>
					</div>

					<div style={{ marginBottom: '18px' }}>
						<h4 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span>📤</span>
							Property Sharing
						</h4>
						<p style={{ margin: '0 0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
							Keep everyone on the same records, without repeated calls or lost context.
						</p>
					</div>

					<div>
						<h4 style={{ color: '#0f172a', margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
							<span>📊</span>
							Reports & Export
						</h4>
						<p style={{ margin: '0 0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
							Export a clean history for insurance, tax, and sale documentation.
						</p>
					</div>
				</div>
			),
			actionLabel: 'Good to know →',
			action: () => {
				setCurrentStepIndex(currentStepIndex + 1);
			},
		});

		if (isPropertyManager) {
			steps.push({
				id: 'advanced_features_manager',
				type: 'instruction',
				title: 'Built for teams too.',
				description: 'As your portfolio grows, continuity and accountability stay intact.',
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
								🏢 Unit-Level Management
							</h4>
							<p style={{ margin: '0 0 0 28px', fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
								For multi-family properties, manage each unit independently — separate devices, tasks, and history per unit.
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
				'Your property and first task are live. From now on, your maintenance continuity builds automatically.',
			content: (
				<>
				<PayoffPreview>
					<PayoffPreviewTitle>What's waiting for you</PayoffPreviewTitle>
					<PayoffItems>
						<PayoffItem>
							<span className="icon">✅</span>
							<div className="text">
								<strong>Your first task is active</strong>
								<span>You'll be reminded automatically when it's due</span>
							</div>
						</PayoffItem>
						<PayoffItem>
							<span className="icon">🏠</span>
							<div className="text">
								<strong>Your property dashboard is ready</strong>
								<span>Add devices, contractors, and history as you go</span>
							</div>
						</PayoffItem>
						<PayoffItem>
							<span className="icon">🛡️</span>
							<div className="text">
								<strong>Your maintenance record has started</strong>
								<span>Every future repair adds to a history you'll actually use</span>
							</div>
						</PayoffItem>
					</PayoffItems>
				</PayoffPreview>
				<VisualPayoffGrid>
					<VisualPayoffCard>
						<div className='header'>30 Days</div>
						<div className='title'>You complete your first recurring task</div>
						<div className='meta'>Timeline grows with dates, notes, and files.</div>
					</VisualPayoffCard>
					<VisualPayoffCard>
						<div className='header'>90 Days</div>
						<div className='title'>Second reminder triggers automatically</div>
						<div className='meta'>No memory burden. The system keeps continuity.</div>
					</VisualPayoffCard>
					<VisualPayoffCard>
						<div className='header'>Anytime</div>
						<div className='title'>Export clear maintenance history</div>
						<div className='meta'>Useful for claims, taxes, resale, and team handoff.</div>
					</VisualPayoffCard>
				</VisualPayoffGrid>
				</>
			),
			actionLabel: 'Take me to my property →',
			action: () => {
				navigate('/dashboard');
				onComplete();
			},
			skipLabel: 'Finish Setup',
		});

		return steps;
	};

	const steps = getSteps();
	const currentStep = steps[currentStepIndex];

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
		if (currentStep?.autoAdvance && currentStep?.waitCondition) {
			if (currentStep.waitCondition()) {
				advanceToNextStep();
			}
		}
	}, [properties, tasks, location.pathname, currentStep, advanceToNextStep]);

	// Handle celebration steps
	useEffect(() => {
		if (currentStep?.type === 'celebration') {
			setShowCelebration(true);
		} else {
			setShowCelebration(false);
		}
	}, [currentStep]);

	// Handle page-specific guides
	useEffect(() => {
		if (
			currentStep?.type === 'page_guide' &&
			location.pathname.includes('/properties/')
		) {
			setPageGuideContent({
				title: 'Property Details Page',
				content:
					'This is your property command center! Here you can manage units, tenants, tasks, and all property-related information. Click "Add Task" to create your first maintenance task.',
				actionLabel: 'Create Task',
				onAction: () => {
					setShowPageGuide(false);
					setCurrentStepIndex(currentStepIndex + 1);
				},
			});
			setShowPageGuide(true);
		}
	}, [location.pathname, currentStep, currentStepIndex]);

	// Handle waiting modal minimization
	useEffect(() => {
		let minimizeTimer: NodeJS.Timeout | null = null;

		if (currentStep?.type === 'waiting') {
			// Reset minimized state when entering a waiting step
			setWaitingModalMinimized(false);

			// // Minimize the modal after 3 seconds
			// minimizeTimer = setTimeout(() => {
			// 	setWaitingModalMinimized(true);
			// }, 3000);
		} else {
			// Reset when not in waiting state
			setWaitingModalMinimized(false);
		}

		return () => {
			if (minimizeTimer) {
				clearTimeout(minimizeTimer);
			}
		};
	}, [currentStepIndex]);

	// Render different modal types
	if (showCelebration) {
		return (
			<CelebrationModal>
				<CelebrationContent>
					<CelebrationIcon>✅</CelebrationIcon>
					<CelebrationTitle>{currentStep.title}</CelebrationTitle>
					<CelebrationMessage>{currentStep.description}</CelebrationMessage>
					{currentStep.content}
					<div style={{ marginBottom: '24px', padding: '14px 18px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid rgba(22,163,74,0.2)', fontSize: '14px', color: '#166534', textAlign: 'center' }}>
						<strong>You're building your property history.</strong> Every step makes your records more complete and valuable.
					</div>
					<CelebrationActions>
						<PrimaryButton onClick={advanceToNextStep}>Keep going →</PrimaryButton>
					</CelebrationActions>
				</CelebrationContent>
			</CelebrationModal>
		);
	}

	if (showPageGuide && pageGuideContent) {
		return (
			<PageGuideModal>
				<PageGuideHeader>
					<PageGuideTitle>{pageGuideContent.title}</PageGuideTitle>
					<PageGuideClose onClick={() => setShowPageGuide(false)}>
						✕
					</PageGuideClose>
				</PageGuideHeader>
				<PageGuideContent>{pageGuideContent.content}</PageGuideContent>
				{pageGuideContent.actionLabel && (
					<PageGuideActions>
						<PrimaryButton onClick={pageGuideContent.onAction}>
							{pageGuideContent.actionLabel}
						</PrimaryButton>
					</PageGuideActions>
				)}
			</PageGuideModal>
		);
	}

	// Handle waiting steps with minimization
	if (currentStep?.type === 'waiting') {
		if (waitingModalMinimized) {
			return (
				<MinimizedWaitingModal $visible={true}>
					<MinimizedWaitingContent>
						<MinimizedWaitingText>
							<strong>
								Waiting for you to{' '}
								{currentStep.title
									.toLowerCase()
									.replace('go ahead and ', '')
									.replace('!', '')}
								...
							</strong>
						</MinimizedWaitingText>
						<MinimizedWaitingActions>
							<HelpButton onClick={restoreWaitingModal}>Help</HelpButton>
							<SkipButton
								onClick={skipOnboarding}
								style={{ padding: '4px 8px', fontSize: '12px' }}>
								Skip
							</SkipButton>
						</MinimizedWaitingActions>
					</MinimizedWaitingContent>
				</MinimizedWaitingModal>
			);
		} else {
			// Full waiting modal with minimize option
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
							{currentStep.id === 'wait_task_creation' && tasks.length > 0 ? (
								<PrimaryButton onClick={advanceToNextStep}>
									Continue
								</PrimaryButton>
							) : currentStep.id === 'click_property_instruction' ||
							  currentStep.id === 'wait_property_creation' ? (
								<>
									<PrimaryButton onClick={minimizeWaitingModal}>
										Let me work - minimize this
									</PrimaryButton>
									<SkipButton onClick={skipOnboarding}>
										{currentStep.skipLabel || 'Skip Tour'}
									</SkipButton>
								</>
							) : (
								<>
									<PrimaryButton onClick={minimizeWaitingModal}>
										Let me work - minimize this
									</PrimaryButton>
									<SkipButton onClick={skipOnboarding}>
										{currentStep.skipLabel || 'Skip Tour'}
									</SkipButton>
								</>
							)}
						</ActionButtons>
					</OnboardingModal>
				</OnboardingOverlay>
			);
		}
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
							? 'Finish Tour'
							: currentStep.skipLabel || 'Skip Tour'}
					</SkipButton>
				</ActionButtons>
			</OnboardingModal>
		</OnboardingOverlay>
	);
};
