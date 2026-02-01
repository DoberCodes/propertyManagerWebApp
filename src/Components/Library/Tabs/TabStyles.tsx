import styled from 'styled-components';

/**
 * Shared tab control styles used across PropertyDetailPage, UnitDetailPage, SuiteDetailPage
 * These components handle the visual container and button styles for tab navigation
 */

export const TabControlsContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 0;
	background-color: white;
	border-bottom: 2px solid #e5e7eb;
	border-radius: 8px 8px 0 0;
	padding: 0 16px;
`;

export const TabButtonsWrapper = styled.div`
	display: flex;
	gap: 0;
	flex: 1;
	overflow-x: auto;

	&::-webkit-scrollbar {
		height: 4px;
	}

	&::-webkit-scrollbar-thumb {
		background: #c0c0c0;
		border-radius: 2px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}
`;

interface TabButtonProps {
	isActive: boolean;
}

export const TabButton = styled.button<TabButtonProps>`
	background: none;
	border: none;
	padding: 12px 16px;
	cursor: pointer;
	font-size: 14px;
	font-weight: 500;
	color: ${(props) => (props.isActive ? '#22c55e' : '#6b7280')};
	border-bottom: 3px solid
		${(props) => (props.isActive ? '#22c55e' : 'transparent')};
	white-space: nowrap;
	transition: all 0.2s ease;

	&:hover {
		color: #22c55e;
		background-color: rgba(34, 197, 94, 0.05);
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	@media (max-width: 768px) {
		padding: 10px 12px;
		font-size: 13px;
	}
`;

export const TabsContainer = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 0;
`;

export const TabContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 20px;
	background-color: #ffffff;

	@media (max-width: 768px) {
		padding: 15px;
	}

	@media (max-width: 480px) {
		padding: 10px;
	}
`;
