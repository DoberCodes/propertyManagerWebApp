import React from 'react';
import styled from 'styled-components';

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const HeroShell = styled.div<{
	$imageUrl?: string;
	$backgroundSize: string;
	$theme: 'green' | 'slate';
}>`
	position: relative;
	min-height: 200px;
	display: flex;
	flex-direction: column;
	justify-content: flex-end;
	flex-shrink: 0;
	border-radius: 0 0 24px 24px;
	overflow: hidden;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	background: ${({ $imageUrl, $theme }) =>
		$imageUrl
			? `url(${$imageUrl})`
			: $theme === 'slate'
				? 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)'
				: 'linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%)'};
	background-size: ${({ $imageUrl, $backgroundSize }) =>
		$imageUrl ? $backgroundSize : 'auto'};
	background-repeat: no-repeat;
	background-position: center;
	background-color: #e2e8f0;

	&::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(0, 0, 0, 0.3) 0%,
			rgba(0, 0, 0, 0.5) 50%,
			rgba(0, 0, 0, 0.7) 100%
		);
		border-radius: 0 0 24px 24px;
		pointer-events: none;
	}

	@media (max-width: 1024px) {
		min-height: 180px;
		border-radius: 0 0 20px 20px;
	}

	@media (max-width: 480px) {
		min-height: 140px;
		border-radius: 0 0 16px 16px;
	}
`;

export const HeroBackButton = styled.button`
	position: absolute;
	top: 20px;
	left: 20px;
	color: white;
	background-color: transparent;
	border: none;
	padding: 10px 16px;
	border-radius: 4px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;
	z-index: 3;

	&:hover {
		background-color: rgba(0, 0, 0, 0.7);
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
	}
`;

const TopRight = styled.div`
	position: absolute;
	top: 20px;
	right: 20px;
	z-index: 3;
	display: flex;
	align-items: center;
	gap: 8px;
`;

const BottomContent = styled.div`
	position: relative;
	z-index: 2;
	padding: 0 20px 30px;
	display: flex;
	justify-content: space-between;
	align-items: flex-end;
	gap: 16px;
	flex-wrap: wrap;

	@media (max-width: 1024px) {
		padding: 0 15px 20px;
		gap: 12px;
		align-items: center;
	}

	@media (max-width: 480px) {
		padding: 0 10px 16px;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
`;

const TitleGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`;

export const HeroTitle = styled.h1`
	margin: 0;
	font-size: 2.5rem;
	font-weight: 800;
	color: white;
	text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
	letter-spacing: -0.025em;
	line-height: 1.1;

	@media (max-width: 1024px) {
		font-size: 2rem;
	}

	@media (max-width: 480px) {
		font-size: 1.45rem;
	}
`;

export const HeroSubtitle = styled.p`
	margin: 0;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.85);
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

	@media (max-width: 480px) {
		font-size: 13px;
	}
`;

export const HeroActionButton = styled.button`
	background-color: transparent;
	color: white;
	border: 1px solid rgba(255, 255, 255, 0.5);
	padding: 12px 20px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.1s ease;
	position: relative;
	z-index: 2;
	white-space: nowrap;

	&:hover {
		background-color: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.8);
	}

	&:active {
		transform: scale(0.98);
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
		width: 100%;
		text-align: center;
	}
`;

const ActionsGroup = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	position: relative;
	z-index: 2;

	@media (max-width: 480px) {
		width: 100%;
	}
`;

const MiddleSlot = styled.div`
	position: relative;
	z-index: 2;
`;

// ---------------------------------------------------------------------------
// PageHero component
// ---------------------------------------------------------------------------

export interface PageHeroProps {
	/** URL for the background image. Falls back to gradient if omitted. */
	headerImageUrl?: string;
	/** CSS background-size when an image is supplied. Defaults to 'cover'. */
	backgroundSize?: string;
	/** Colour scheme when no image is supplied. Defaults to 'green'. */
	headerTheme?: 'green' | 'slate';

	/** Text/label for the back button. Defaults to '←'. */
	backLabel?: string;
	/** Called when the back button is clicked. */
	onBack: () => void;

	/**
	 * Content rendered in the absolute top-right corner (badge, mobile menu, etc.).
	 * Anything you pass will be wrapped in a right-aligned container.
	 */
	topRight?: React.ReactNode;

	/**
	 * Primary heading – accepts a ReactNode so callers can inject an editable
	 * input or a styled span as needed.
	 */
	title: React.ReactNode;
	/** Optional subtitle displayed below the title. */
	subtitle?: string;

	/**
	 * Action buttons rendered to the right of the title (bottom of hero).
	 * Pass a fragment of `<HeroActionButton>` elements.
	 */
	actions?: React.ReactNode;

	/**
	 * Extra content inserted between the top-bar and the bottom title row.
	 * Use for upload progress banners, error messages, hidden file inputs, etc.
	 */
	children?: React.ReactNode;
}

export const PageHero: React.FC<PageHeroProps> = ({
	headerImageUrl,
	backgroundSize = 'cover',
	headerTheme = 'green',
	backLabel = '←',
	onBack,
	topRight,
	title,
	subtitle,
	actions,
	children,
}) => {
	return (
		<HeroShell
			$imageUrl={headerImageUrl}
			$backgroundSize={backgroundSize}
			$theme={headerTheme}>
			{/* Absolute back button — top left */}
			<HeroBackButton onClick={onBack}>{backLabel}</HeroBackButton>

			{/* Absolute top-right slot: badge, mobile menu, etc. */}
			{topRight && <TopRight>{topRight}</TopRight>}

			{/* Middle slot: progress banners, error messages, hidden inputs */}
			{children && <MiddleSlot>{children}</MiddleSlot>}

			{/* Bottom row: title + subtitle left, actions right */}
			<BottomContent>
				<TitleGroup>
					{typeof title === 'string' ? <HeroTitle>{title}</HeroTitle> : title}
					{subtitle && <HeroSubtitle>{subtitle}</HeroSubtitle>}
				</TitleGroup>
				{actions && <ActionsGroup>{actions}</ActionsGroup>}
			</BottomContent>
		</HeroShell>
	);
};
