import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';
import { HouseLogoLoader } from '../HouseLogoLoader';

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
				<HouseLogoLoader
					variant='assemble'
					ariaLabel='Building property records'
				/>
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
