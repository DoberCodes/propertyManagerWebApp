import styled from 'styled-components';

export const CarouselContainer = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 20px;
	padding: 20px;
	background: #f9fafb;
	border-radius: 12px;

	@media (max-width: 768px) {
		padding: 16px;
		gap: 16px;
	}
`;

export const CarouselViewport = styled.div`
	width: 100%;
	overflow: hidden;
	border-radius: 8px;
`;

export const CarouselTrack = styled.div`
	display: flex;
	transition: transform 0.3s ease-out;

	/* Allow smooth scrolling on mobile */
	-webkit-touch-callout: none;
	-webkit-user-select: none;
	user-select: none;
`;

export const TaskCard = styled.div<{ $overdue?: boolean }>`
	min-width: 100%;
	flex: 0 0 100%;
	background: white;
	border: 1px solid ${(props) => (props.$overdue ? 'rgba(239, 68, 68, 0.35)' : '#e5e7eb')};
	border-left: ${(props) => (props.$overdue ? '4px solid #ef4444' : undefined)};
	border-radius: 12px;
	padding: 20px;
	box-shadow: ${(props) =>
		props.$overdue
			? '0 1px 3px rgba(239, 68, 68, 0.12)'
			: '0 1px 3px rgba(0, 0, 0, 0.1)'};
	background-color: ${(props) =>
		props.$overdue ? 'rgba(239, 68, 68, 0.02)' : 'white'};
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-right: 16px;

	@media (max-width: 768px) {
		padding: 16px;
		gap: 14px;
		margin-right: 12px;
	}

	&:hover {
		box-shadow: ${(props) =>
			props.$overdue
				? '0 4px 12px rgba(239, 68, 68, 0.2)'
				: '0 4px 12px rgba(0, 0, 0, 0.15)'};
		border-color: ${(props) => (props.$overdue ? '#ef4444' : '#3b82f6')};
	}

	&:active {
		transform: scale(0.98);
	}
`;

export const CardHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	border-bottom: 1px solid #f3f4f6;
	padding-bottom: 12px;

	@media (max-width: 768px) {
		gap: 10px;
		padding-bottom: 10px;
	}
`;

export const CardTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	font-weight: 600;
	color: #1f2937;
	flex: 1;
	word-break: break-word;

	@media (max-width: 768px) {
		font-size: 16px;
	}
`;

export const CardProperty = styled.div`
	font-size: 14px;
	color: #6366f1;
	font-weight: 500;
	padding: 8px 12px;
	background: #eef2ff;
	border-radius: 6px;
	width: fit-content;

	@media (max-width: 768px) {
		font-size: 12px;
		padding: 6px 10px;
	}
`;

export const CardContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	flex: 1;

	@media (max-width: 768px) {
		gap: 10px;
	}
`;

export const CardMeta = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;

	@media (max-width: 360px) {
		grid-template-columns: 1fr;
	}

	@media (max-width: 768px) {
		gap: 10px;
	}
`;

export const MetaItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 8px;
	background: #f9fafb;
	border-radius: 6px;

	@media (max-width: 768px) {
		padding: 10px;
		gap: 6px;
	}
`;

export const MetaLabel = styled.span`
	font-size: 11px;
	color: #9ca3af;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.3px;

	@media (max-width: 768px) {
		font-size: 12px;
	}
`;

export const MetaValue = styled.span`
	font-size: 14px;
	font-weight: 500;
	color: #374151;

	@media (max-width: 768px) {
		font-size: 15px;
	}
`;

export const CardActions = styled.div`
	display: flex;
	gap: 8px;
	border-top: 1px solid #f3f4f6;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		gap: 10px;
	}
`;

export const ActionButton = styled.button`
	flex: 1;
	min-width: 80px;
	padding: 10px 12px;
	border: none;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 4px;
	min-height: 44px; /* Better touch target */

	@media (max-width: 768px) {
		min-width: 90px;
		padding: 12px 16px;
		font-size: 14px;
		min-height: 48px; /* Larger touch target on mobile */
	}

	&:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
	}
`;

export const IndicatorDots = styled.div`
	display: flex;
	justify-content: center;
	gap: 8px;
	padding: 5px 0;

	@media (max-width: 768px) {
		gap: 10px;
		padding: 5px 0;
	}
`;

export const Dot = styled.button<{ $active: boolean }>`
	width: 10px;
	height: 10px;
	border-radius: 50%;
	border: none;
	cursor: pointer;
	background: ${(props) => (props.$active ? '#3b82f6' : '#d1d5db')};
	transition: all 0.2s ease;
	padding: 0;
	display: flex;
	align-items: center;
	justify-content: center;

	&:hover {
		background: ${(props) => (props.$active ? '#2563eb' : '#9ca3af')};
	}
`;

export const NoTasks = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 60px 20px;
	background: white;
	border: 2px dashed #d1d5db;
	border-radius: 12px;
	color: #6b7280;
	font-size: 16px;
	font-weight: 500;

	@media (max-width: 768px) {
		padding: 40px 16px;
		font-size: 18px;
	}
`;
