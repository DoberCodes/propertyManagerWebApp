import styled from 'styled-components';

export const GlanceGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 12px;
	margin-bottom: 18px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	@media (max-width: 640px) {
		display: none;
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
		/* position: sticky; */
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
	border: 1px solid #e8edf3;
	border-radius: 14px;
	padding: 16px;
	box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);

	@media (max-width: 480px) {
		padding: 14px;
		border-radius: 13px;
	}
`;

export const PreviewHeader = styled.h3`
	margin: 0 0 12px 0;
	font-size: 0.98rem;
	font-weight: 700;
	color: #111827;
`;

export const PreviewList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const PreviewItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 8px;
	padding: 10px 12px;
	border-radius: 10px;
	background: #f8fafc;
	border: 1px solid #edf2f7;

	@media (max-width: 480px) {
		padding: 10px;
		gap: 8px;
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
		flex-direction: column;
		align-items: flex-start;
		margin-left: 0;
	}
`;

export const PreviewItemTitle = styled.div`
	font-size: 0.84rem;
	font-weight: 600;
	color: #1f2937;
	flex: 1;
	min-width: 0;
	white-space: normal;
	overflow: visible;
	text-overflow: clip;
	line-height: 1.4;
`;

export const PreviewItemMeta = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #64748b;
	min-width: 56px;
	text-align: right;
	white-space: nowrap;

	@media (max-width: 480px) {
		font-size: 0.72rem;
		min-width: 0;
		text-align: left;
	}
`;

export const PreviewEmptyAction = styled.button`
	align-self: flex-start;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	background: #ffffff;
	color: #334155;
	font-size: 0.78rem;
	font-weight: 700;
	padding: 0.45rem 0.7rem;
	cursor: pointer;

	&:hover {
		background: #f1f5f9;
	}
`;

export const TimelineList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const TimelineItem = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	padding: 11px 12px;
	border-radius: 10px;
	background: #f8fafc;
	border: 1px solid #edf2f7;

	@media (max-width: 480px) {
		padding: 10px;
	}
`;

export const TimelineBadge = styled.span<{
	$type: 'maintenance' | 'task-overdue' | 'task-due';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 3px 7px;
	border-radius: 999px;
	font-size: 0.68rem;
	font-weight: 700;
	letter-spacing: 0.03em;
	text-transform: uppercase;
	white-space: nowrap;
	background: ${(p) =>
		p.$type === 'task-overdue'
			? '#fef2f2'
			: p.$type === 'task-due'
				? '#fffbeb'
				: '#ecfdf3'};
	color: ${(p) =>
		p.$type === 'task-overdue'
			? '#b91c1c'
			: p.$type === 'task-due'
				? '#92400e'
				: '#166534'};
	border: 1px solid
		${(p) =>
			p.$type === 'task-overdue'
				? '#fecaca'
				: p.$type === 'task-due'
					? '#fcd34d'
					: '#bbf7d0'};
`;

export const TimelineBody = styled.div`
	min-width: 0;
	flex: 1;
`;

export const TimelineTitle = styled.div`
	font-size: 0.83rem;
	font-weight: 700;
	color: #1f2937;
	line-height: 1.35;
	white-space: normal;
	overflow: visible;
	text-overflow: clip;
`;

export const TimelineMeta = styled.div`
	font-size: 0.75rem;
	font-weight: 600;
	color: #64748b;
	margin-top: 2px;
`;
