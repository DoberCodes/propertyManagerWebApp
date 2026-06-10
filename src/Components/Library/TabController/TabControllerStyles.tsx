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

	@media (max-width: 640px) {
		border-bottom: none;
		border-radius: 12px;
		background: transparent;
	}
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

	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
		overflow-x: visible;
		width: 100%;
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

	@media (max-width: 1024px) {
		padding: 10px 12px;
		font-size: 13px;
	}

	@media (max-width: 640px) {
		padding: 14px 12px;
		font-size: 15px;
		font-weight: 800;
		min-height: 58px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		white-space: normal;
		line-height: 1.2;
		border: 1px solid ${(props) => (props.isActive ? '#16a34a' : '#cbd5e1')};
		border-bottom: 1px solid ${(props) => (props.isActive ? '#16a34a' : '#cbd5e1')};
		border-radius: 14px;
		background: ${(props) => (props.isActive ? '#dcfce7' : '#ffffff')};
		color: ${(props) => (props.isActive ? '#15803d' : '#0f172a')};
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	}
`;

export const TabsContainer = styled.div`
	display: flex;
	flex-direction: column;
	flex: 1;
	min-height: 100%;
	width: 100%;

	@media (max-width: 1024px) {
		width: 100%;
	}
	@media (max-width: 480px) {
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}
`;

export const TabContent = styled.div`
	flex: 1;
	overflow-y: auto;
	padding: 20px;
	background-color: #ffffff;
	width: 100%;

	@media (max-width: 1024px) {
		padding: 15px;
	}

	@media (max-width: 480px) {
		padding: 16px;
	}
`;
