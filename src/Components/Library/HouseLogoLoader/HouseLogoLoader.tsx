import React from 'react';
import styled, { css } from 'styled-components';
import { COLORS } from '../../../constants/colors';

type HouseLogoLoaderVariant = 'assemble' | 'deconstruct';

interface HouseLogoLoaderProps {
	variant?: HouseLogoLoaderVariant;
	size?: number;
	ariaLabel?: string;
	className?: string;
}

const LoaderSvg = styled.svg<{
	$variant: HouseLogoLoaderVariant;
	$size: number;
}>`
	width: ${({ $size }) => $size}px;
	height: ${({ $size }) => Math.round($size * 0.88)}px;
	overflow: visible;

	.house-roof,
	.house-block {
		transform-box: fill-box;
		transform-origin: center;
	}

	.house-body {
		animation: maintley-house-body-pulse 1.8s ease-in-out infinite;
	}

	.house-block {
		animation-duration: 1.8s;
		animation-iteration-count: infinite;
		animation-timing-function: ease-in-out;
		animation-delay: var(--block-delay, 0s);
	}

	.house-block-one {
		--block-delay: 0s;
		--assemble-y: 18px;
		--deconstruct-y: 18px;
	}

	.house-block-two {
		--block-delay: 0.16s;
		--assemble-y: 18px;
		--deconstruct-y: 18px;
	}

	.house-block-three {
		--block-delay: 0.32s;
		--assemble-y: 24px;
		--deconstruct-y: 24px;
	}

	.house-block-four {
		--block-delay: 0.48s;
		--assemble-y: 24px;
		--deconstruct-y: 24px;
	}

	${({ $variant }) =>
		$variant === 'deconstruct'
			? css`
					.house-roof {
						animation-name: maintley-house-deconstruct-roof;
						animation-duration: 1.8s;
						animation-iteration-count: infinite;
						animation-timing-function: ease-in-out;
					}

					.house-block {
						animation-name: maintley-house-deconstruct-block;
					}
				`
			: css`
					.house-roof {
						animation-name: maintley-house-assemble-roof;
						animation-duration: 1.8s;
						animation-iteration-count: infinite;
						animation-timing-function: ease-in-out;
					}

					.house-block {
						animation-name: maintley-house-assemble-block;
					}
				`}

	@keyframes maintley-house-assemble-roof {
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

	@keyframes maintley-house-assemble-block {
		0% {
			opacity: 0;
			transform: translateY(var(--assemble-y)) scale(0.82);
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

	@keyframes maintley-house-deconstruct-roof {
		0%,
		42% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}

		100% {
			opacity: 0;
			transform: translateY(-16px) scale(0.9);
		}
	}

	@keyframes maintley-house-deconstruct-block {
		0%,
		38% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}

		100% {
			opacity: 0;
			transform: translateY(var(--deconstruct-y)) scale(0.82);
		}
	}

	@keyframes maintley-house-body-pulse {
		0%,
		100% {
			stroke: rgba(0, 158, 113, 0.46);
		}

		50% {
			stroke: rgba(4, 120, 87, 0.66);
		}
	}
`;

export const HouseLogoLoader = ({
	variant = 'assemble',
	size = 86,
	ariaLabel,
	className,
}: HouseLogoLoaderProps) => (
	<LoaderSvg
		$size={size}
		$variant={variant}
		viewBox='0 0 86 76'
		role={ariaLabel ? 'img' : undefined}
		aria-label={ariaLabel}
		aria-hidden={ariaLabel ? undefined : true}
		className={className}>
		<g className='house-roof'>
			<path
				d='M16 37 L43 14 L70 37 L64 43 L43 25 L22 43 Z'
				fill={COLORS.primary}
			/>
		</g>
		<rect
			className='house-body'
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
			className='house-block house-block-one'
			x='28'
			y='41'
			width='14'
			height='10'
			rx='3'
			fill={COLORS.primary}
		/>
		<rect
			className='house-block house-block-two'
			x='45'
			y='41'
			width='14'
			height='10'
			rx='3'
			fill={COLORS.primary}
		/>
		<rect
			className='house-block house-block-three'
			x='28'
			y='55'
			width='14'
			height='10'
			rx='3'
			fill={COLORS.primary}
		/>
		<rect
			className='house-block house-block-four'
			x='45'
			y='55'
			width='14'
			height='10'
			rx='3'
			fill={COLORS.primary}
		/>
	</LoaderSvg>
);
