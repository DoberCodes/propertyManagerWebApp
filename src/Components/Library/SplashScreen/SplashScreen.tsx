import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

interface SplashScreenProps {
	title?: string;
	message?: string;
	steps?: string[];
	variant?: 'screen' | 'overlay';
}

const SplashShell = styled.div<{ $variant: 'screen' | 'overlay' }>`
	position: ${(props) => (props.$variant === 'overlay' ? 'fixed' : 'relative')};
	inset: ${(props) => (props.$variant === 'overlay' ? '0' : 'auto')};
	z-index: ${(props) => (props.$variant === 'overlay' ? '10000' : 'auto')};
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	min-height: 100vh;
	padding: 24px;
	background:
		radial-gradient(circle at top, rgba(0, 158, 113, 0.22), transparent 34%),
		${COLORS.gradientPrimary};
	color: ${COLORS.white};

	@supports (min-height: 100dvh) {
		min-height: 100dvh;
	}
`;

const SplashCard = styled.div`
	width: min(420px, 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18px;
	padding: 34px 28px;
	border-radius: 22px;
	background: rgba(255, 255, 255, 0.94);
	box-shadow: 0 26px 80px rgba(3, 97, 81, 0.32);
	text-align: center;
`;

const SplashWordmark = styled.div`
	color: ${COLORS.primary};
	font-size: clamp(34px, 8vw, 48px);
	font-weight: 700;
	line-height: 1;
`;

const BuildingHouse = styled.svg`
	width: 86px;
	height: 76px;
	overflow: visible;

	.roof {
		animation: maintley-splash-roof 1.8s ease-in-out infinite;
		transform-box: fill-box;
		transform-origin: center;
	}

	.block {
		animation: maintley-splash-block 1.8s ease-in-out infinite;
		transform-box: fill-box;
		transform-origin: center;
	}

	.block-two {
		animation-delay: 0.14s;
	}

	.block-three {
		animation-delay: 0.28s;
	}

	.block-four {
		animation-delay: 0.42s;
	}

	@keyframes maintley-splash-roof {
		0%,
		34% {
			opacity: 0;
			transform: translateY(-14px) scale(0.88);
		}

		58%,
		86% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}

		100% {
			opacity: 0.55;
			transform: translateY(0) scale(1);
		}
	}

	@keyframes maintley-splash-block {
		0% {
			opacity: 0;
			transform: translateY(18px) scale(0.88);
		}

		28%,
		78% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}

		100% {
			opacity: 0.45;
			transform: translateY(0) scale(1);
		}
	}
`;

const SplashTitle = styled.div`
	color: ${COLORS.textPrimary};
	font-size: 18px;
	font-weight: 900;
`;

const SplashText = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 14px;
	line-height: 1.45;
	max-width: 300px;
	min-height: 40px;
	transition: opacity 180ms ease;
`;

const StepDots = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	margin-top: -6px;
`;

const StepDot = styled.span<{ $active: boolean }>`
	width: ${(props) => (props.$active ? '18px' : '6px')};
	height: 6px;
	border-radius: 999px;
	background: ${(props) =>
		props.$active ? COLORS.primary : 'rgba(4, 120, 87, 0.2)'};
	transition:
		width 180ms ease,
		background 180ms ease;
`;

export const SplashScreen = ({
	title = 'Getting Maintley ready',
	message = 'Loading your properties, tasks, and maintenance history.',
	steps,
	variant = 'screen',
}: SplashScreenProps) => {
	const narratedSteps = steps && steps.length > 0 ? steps : [message];
	const narratedStepsKey = narratedSteps.join('\u001f');
	const [activeStepIndex, setActiveStepIndex] = useState(0);

	useEffect(() => {
		setActiveStepIndex((current) => (current === 0 ? current : 0));
	}, [narratedStepsKey]);

	useEffect(() => {
		if (narratedSteps.length <= 1) {
			return;
		}

		const interval = window.setInterval(() => {
			setActiveStepIndex((current) =>
				current >= narratedSteps.length - 1 ? current : current + 1,
			);
		}, 1400);

		return () => window.clearInterval(interval);
	}, [narratedSteps.length, narratedStepsKey]);

	const activeMessage = narratedSteps[activeStepIndex] || message;

	return (
		<SplashShell $variant={variant}>
			<SplashCard>
				<SplashWordmark aria-label='Maintley'>Maintley</SplashWordmark>
				<BuildingHouse
					viewBox='0 0 86 76'
					role='img'
					aria-label='Building property records'>
					<g className='roof'>
						<path
							d='M16 37 L43 14 L70 37 L64 43 L43 25 L22 43 Z'
							fill={COLORS.primary}
						/>
					</g>
					<rect
						x='21'
						y='34'
						width='44'
						height='34'
						rx='8'
						fill='#effcf5'
						stroke='rgba(0, 158, 113, 0.46)'
						strokeWidth='1.5'
					/>
					<rect
						className='block block-one'
						x='28'
						y='41'
						width='14'
						height='10'
						rx='3'
						fill={COLORS.primary}
					/>
					<rect
						className='block block-two'
						x='45'
						y='41'
						width='14'
						height='10'
						rx='3'
						fill={COLORS.primary}
					/>
					<rect
						className='block block-three'
						x='28'
						y='55'
						width='14'
						height='10'
						rx='3'
						fill={COLORS.primary}
					/>
					<rect
						className='block block-four'
						x='45'
						y='55'
						width='14'
						height='10'
						rx='3'
						fill={COLORS.primary}
					/>
				</BuildingHouse>
				<SplashTitle>{title}</SplashTitle>
				<SplashText aria-live='polite'>{activeMessage}</SplashText>
				{narratedSteps.length > 1 && (
					<StepDots aria-hidden='true'>
						{narratedSteps.slice(0, 6).map((step, index) => (
							<StepDot
								key={`${step}-${index}`}
								$active={index === Math.min(activeStepIndex, 5)}
							/>
						))}
					</StepDots>
				)}
			</SplashCard>
		</SplashShell>
	);
};
