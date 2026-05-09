import styled from 'styled-components';

export const GlanceGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;
	margin-bottom: 18px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 480px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 360px) {
		grid-template-columns: 1fr;
	}
`;

export const GlanceCard = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 10px;
	padding: 12px;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
`;

export const GlanceLabel = styled.div`
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	color: #6b7280;
	margin-bottom: 6px;
`;

export const GlanceValue = styled.div`
	font-size: 1.35rem;
	font-weight: 800;
	color: #111827;
`;

export const QuickActionsBar = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 20px;

	@media (max-width: 1024px) {
		position: sticky;
		top: 8px;
		z-index: 20;
		background: rgba(255, 255, 255, 0.96);
		backdrop-filter: blur(6px);
		padding: 8px;
		border-radius: 10px;
		border: 1px solid #e5e7eb;
	}

	@media (max-width: 480px) {
		gap: 8px;
	}
`;

export const QuickActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
	height: 38px;
	padding: 0 12px;
	border-radius: 9px;
	border: 1px solid
		${(props) => (props.$variant === 'secondary' ? '#cbd5e1' : '#16a34a')};
	background: ${(props) => (props.$variant === 'secondary' ? '#f8fafc' : '#22c55e')};
	color: ${(props) => (props.$variant === 'secondary' ? '#334155' : '#ffffff')};
	font-size: 0.84rem;
	font-weight: 700;
	cursor: pointer;

	@media (max-width: 480px) {
		flex: 1 1 calc(50% - 4px);
		min-width: 0;
	}
`;

export const PreviewGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 14px;
	margin-top: 16px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
	}
`;

export const PreviewCard = styled.div`
	background: #ffffff;
	border: 1px solid #e5e7eb;
	border-radius: 12px;
	padding: 14px;
	box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
`;

export const PreviewHeader = styled.h3`
	margin: 0 0 10px 0;
	font-size: 0.98rem;
	font-weight: 700;
	color: #111827;
`;

export const PreviewList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const PreviewItem = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 10px;
	border-radius: 8px;
	background: #f8fafc;

	@media (max-width: 480px) {
		padding: 7px 8px;
		gap: 6px;
	}
`;

export const PreviewItemTrailing = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	margin-left: auto;
	flex-shrink: 0;
	min-width: 0;

	@media (max-width: 480px) {
		gap: 6px;
	}
`;

export const PreviewItemTitle = styled.div`
	font-size: 0.84rem;
	font-weight: 600;
	color: #1f2937;
	flex: 1;
	min-width: 0;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const PreviewItemMeta = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #64748b;
	min-width: 62px;
	text-align: right;
	white-space: nowrap;

	@media (max-width: 480px) {
		font-size: 0.72rem;
		min-width: 0;
	}
`;
