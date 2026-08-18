import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { RootState } from '../../Redux/store/store';
import { useGetPropertiesQuery } from '../../Redux/API/propertySlice';
import {
	selectCanAccessProperties,
	selectIsHomeowner,
} from '../../Redux/selectors/permissionSelectors';
import { COLORS } from '../../constants/colors';

const Overlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 11000;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	background: rgba(15, 23, 42, 0.72);

	@media (max-width: 640px) {
		align-items: flex-end;
		padding: 10px;
	}
`;

const Panel = styled.section`
	width: min(520px, 100%);
	max-height: calc(100dvh - 20px);
	overflow-y: auto;
	padding: 32px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 18px;
	background: ${COLORS.bgWhite};
	box-shadow: 0 24px 70px rgba(15, 23, 42, 0.3);

	@media (max-width: 640px) {
		padding: 22px 18px;
		border-radius: 16px;
	}
`;

const Eyebrow = styled.p`
	margin: 0 0 8px;
	color: ${COLORS.primary};
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

const Title = styled.h1`
	margin: 0;
	color: ${COLORS.textPrimary};
	font-size: clamp(24px, 5vw, 32px);
	line-height: 1.15;
`;

const Description = styled.p`
	margin: 14px 0 0;
	color: ${COLORS.textSecondary};
	font-size: 16px;
	line-height: 1.55;
`;

const Outcome = styled.div`
	margin-top: 20px;
	padding: 14px 16px;
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 12px;
	background: rgba(0, 158, 113, 0.08);
	color: ${COLORS.textPrimary};
	font-size: 14px;
	line-height: 1.5;

	strong {
		display: block;
		margin-bottom: 3px;
		color: ${COLORS.primary};
	}
`;

const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-top: 24px;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

const PrimaryButton = styled.button`
	min-height: 44px;
	padding: 11px 20px;
	border: none;
	border-radius: 9px;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.white};
	font-size: 15px;
	font-weight: 750;
	cursor: pointer;

	:hover:not(:disabled) {
		filter: brightness(0.96);
	}

	:disabled {
		opacity: 0.6;
		cursor: wait;
	}
`;

const SecondaryButton = styled.button`
	min-height: 44px;
	padding: 10px 16px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 9px;
	background: ${COLORS.bgWhite};
	color: ${COLORS.textSecondary};
	font-size: 14px;
	font-weight: 650;
	cursor: pointer;

	:hover {
		background: ${COLORS.bgLight};
	}
`;

const WaitingCard = styled.aside`
	position: fixed;
	right: 18px;
	bottom: 18px;
	z-index: 10990;
	display: flex;
	align-items: center;
	gap: 12px;
	max-width: min(420px, calc(100vw - 24px));
	padding: 12px 14px;
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 12px;
	background: ${COLORS.bgWhite};
	box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
	color: ${COLORS.textSecondary};
	font-size: 13px;

	@media (max-width: 640px) {
		left: 12px;
		right: 12px;
		bottom: 76px;
		align-items: stretch;
		flex-direction: column;
	}
`;

interface OnboardingFlowProps {
	onComplete: () => void;
	onSkip: () => void;
}

type OnboardingStage = 'welcome' | 'waiting_for_property' | 'property_created';

const getPropertyKey = (property: any): string =>
	String(property?.slug || property?.id || '').trim();

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
	onComplete,
	onSkip,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isHomeowner = useSelector(selectIsHomeowner);
	const canAccessProperties = useSelector(selectCanAccessProperties);
	const { data: properties = [], isLoading } = useGetPropertiesQuery();
	const initialPropertyCount = useRef<number | null>(null);
	const initialPropertyKeys = useRef<Set<string> | null>(null);
	const [stage, setStage] = useState<OnboardingStage>('welcome');

	useEffect(() => {
		if (!isLoading && initialPropertyCount.current === null) {
			initialPropertyCount.current = properties.length;
			initialPropertyKeys.current = new Set(properties.map(getPropertyKey));
		}
	}, [isLoading, properties]);

	useEffect(() => {
		if (
			stage === 'waiting_for_property' &&
			initialPropertyCount.current !== null &&
			properties.length > initialPropertyCount.current
		) {
			setStage('property_created');
		}
	}, [properties.length, stage]);

	const newestProperty = useMemo(
		() =>
			properties.find(
				(property) => !initialPropertyKeys.current?.has(getPropertyKey(property)),
			) || properties[properties.length - 1],
		[properties],
	);
	const hasExistingProperty = !isLoading && properties.length > 0;
	const recordLabel = isHomeowner ? 'home' : 'property';
	const recordTitle = isHomeowner ? 'Home' : 'Property';
	const isPropertyManager = Boolean(currentUser && canAccessProperties && !isHomeowner);

	const beginPropertyCreation = () => {
		setStage('waiting_for_property');
		navigate('/properties?openCreate=onboarding');
	};

	const finishAtToday = () => {
		onComplete();
		navigate('/dashboard');
	};

	const continueSetup = () => {
		const propertyKey = getPropertyKey(newestProperty);
		onComplete();
		navigate(propertyKey ? `/property/${propertyKey}?setup=1` : '/properties');
	};

	if (stage === 'waiting_for_property') {
		if (new URLSearchParams(location.search).get('openCreate') === 'onboarding') {
			return null;
		}

		return (
			<WaitingCard aria-live='polite'>
				<span>Create your {recordLabel} when you are ready. Maintley will confirm when it is saved.</span>
				<PrimaryButton type='button' onClick={beginPropertyCreation}>
					Add {recordTitle}
				</PrimaryButton>
				<SecondaryButton type='button' onClick={onSkip}>
					Finish later
				</SecondaryButton>
			</WaitingCard>
		);
	}

	if (stage === 'property_created') {
		return (
			<Overlay>
				<Panel aria-labelledby='onboarding-success-title'>
					<Eyebrow>{recordTitle} created</Eyebrow>
					<Title id='onboarding-success-title'>Your maintenance record is ready.</Title>
					<Description>
						Repairs, equipment, documents, and completed work now have one place to build over time.
					</Description>
					<Outcome>
						<strong>Recommended next step</strong>
						Add the basics you already know. You can leave setup at any time and return later.
					</Outcome>
					<Actions>
						<PrimaryButton type='button' onClick={continueSetup}>Continue setup</PrimaryButton>
						<SecondaryButton type='button' onClick={finishAtToday}>Go to Today</SecondaryButton>
					</Actions>
				</Panel>
			</Overlay>
		);
	}

	return (
		<Overlay>
			<Panel aria-labelledby='onboarding-title'>
				<Eyebrow>Welcome to Maintley</Eyebrow>
				<Title id='onboarding-title'>
					{hasExistingProperty
						? `Your ${recordLabel} record is ready to use.`
						: isPropertyManager
							? 'Bring property maintenance into one clear record.'
							: 'Stay ahead of home maintenance.'}
				</Title>
				<Description>
					{hasExistingProperty
						? 'Start with what needs attention, then add details as maintenance happens.'
						: `Add your first ${recordLabel} to begin preserving tasks, equipment, and service history.`}
				</Description>
				<Outcome>
					<strong>Built to grow with the property</strong>
					You only need the basic property information to begin. Everything else can be added when it becomes useful.
				</Outcome>
				<Actions>
					<PrimaryButton
						type='button'
						disabled={isLoading}
						onClick={hasExistingProperty ? finishAtToday : beginPropertyCreation}>
						{isLoading ? 'Loading...' : hasExistingProperty ? 'Go to Today' : `Add My ${recordTitle}`}
					</PrimaryButton>
					<SecondaryButton type='button' onClick={onSkip}>Explore on my own</SecondaryButton>
				</Actions>
			</Panel>
		</Overlay>
	);
};
