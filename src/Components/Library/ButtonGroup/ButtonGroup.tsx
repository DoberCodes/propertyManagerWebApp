import styled from 'styled-components';

/**
 * Reusable ButtonGroup component for grouping action buttons
 * Provides consistent spacing and responsive behavior across the app
 *
 * Props:
 * - justify: 'flex-start' | 'center' | 'flex-end' | 'space-between' (default: 'flex-end')
 * - gap: CSS gap value (default: '12px')
 * - marginTop: CSS margin-top value (default: '0')
 * - responsive: Enable mobile responsive behavior (default: false)
 */

interface ButtonGroupProps {
	justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
	gap?: string;
	marginTop?: string;
	responsive?: boolean;
}

export const ButtonGroup = styled.div<ButtonGroupProps>`
	display: flex;
	gap: ${(props) => props.gap || '12px'};
	justify-content: ${(props) => props.justify || 'flex-end'};
	align-items: center;
	margin-top: ${(props) => props.marginTop || '0'};

	${(props) =>
		props.responsive &&
		`
		@media (max-width: 480px) {
			flex-direction: column;
			gap: 8px;
		}
	`}
`;
