import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';
import type { MaintleyTimelineItemKind } from './MaintleyTimeline';

const getKindColor = (kind: MaintleyTimelineItemKind): string => {
	switch (kind) {
		case 'completed':
		case 'service_record':
			return COLORS.primary;
		case 'scheduled':
			return COLORS.warning;
		case 'document':
			return COLORS.info;
		case 'note':
			return COLORS.gray500;
		case 'created':
		default:
			return COLORS.gray600;
	}
};

export const Timeline = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding-left: 18px;

	&::before {
		content: '';
		position: absolute;
		left: 5px;
		top: 8px;
		bottom: 8px;
		width: 2px;
		border-radius: 999px;
		background: ${COLORS.border};
	}
`;

export const TimelineItem = styled.article<{
	$kind: MaintleyTimelineItemKind;
	$clickable?: boolean;
}>`
	position: relative;
	padding: 14px 14px 14px 16px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
	box-shadow: ${COLORS.shadow};
	cursor: ${(props) => (props.$clickable ? 'pointer' : 'default')};

	&:hover {
		border-color: ${(props) =>
			props.$clickable ? getKindColor(props.$kind) : COLORS.border};
	}
`;

export const TimelineDot = styled.span<{ $kind: MaintleyTimelineItemKind }>`
	position: absolute;
	left: -18px;
	top: 20px;
	width: 12px;
	height: 12px;
	border-radius: 999px;
	background: ${(props) => getKindColor(props.$kind)};
	box-shadow: 0 0 0 4px ${COLORS.white};
`;

export const TimelineItemHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
`;

export const TimelineItemTitle = styled.h4`
	margin: 0;
	color: ${COLORS.textPrimary};
	font-size: 0.96rem;
	font-weight: 850;
	line-height: 1.3;
`;

export const TimelineItemMeta = styled.div`
	flex: 0 0 auto;
	color: ${COLORS.textSecondary};
	font-size: 0.78rem;
	font-weight: 750;
	white-space: nowrap;
`;

export const TimelineBody = styled.div`
	margin-top: 6px;
	color: ${COLORS.textSecondary};
	font-size: 0.86rem;
	line-height: 1.45;
`;

export const TimelineMetadata = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 8px;
	margin-top: 10px;
`;

export const TimelineMetadataItem = styled.div`
	padding: 8px;
	border-radius: 10px;
	background: ${COLORS.bgLight};
`;

export const TimelineMetadataLabel = styled.div`
	color: ${COLORS.textSecondary};
	font-size: 0.68rem;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`;

export const TimelineMetadataValue = styled.div`
	margin-top: 2px;
	color: ${COLORS.textPrimary};
	font-size: 0.82rem;
	font-weight: 800;
`;
