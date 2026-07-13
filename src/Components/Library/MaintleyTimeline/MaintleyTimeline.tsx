import React from 'react';
import {
	Timeline,
	TimelineBody,
	TimelineDot,
	TimelineItem,
	TimelineItemHeader,
	TimelineItemMeta,
	TimelineItemTitle,
	TimelineMetadata,
	TimelineMetadataItem,
	TimelineMetadataLabel,
	TimelineMetadataValue,
} from './MaintleyTimeline.styles';

export type MaintleyTimelineItemKind =
	| 'created'
	| 'completed'
	| 'service_record'
	| 'document'
	| 'note'
	| 'scheduled';

export type MaintleyTimelineItem = {
	id: string;
	date?: string;
	title: string;
	description?: string;
	kind: MaintleyTimelineItemKind;
	href?: string;
	metadata?: Array<{ label: string; value: string }>;
};

type MaintleyTimelineProps = {
	items: MaintleyTimelineItem[];
	emptyMessage?: string;
	onNavigate?: (href: string) => void;
};

const formatTimelineDate = (value?: string): string => {
	if (!value) return 'Date not recorded';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

export const MaintleyTimeline: React.FC<MaintleyTimelineProps> = ({
	items,
	emptyMessage = 'Timeline events will appear here as records are added.',
	onNavigate,
}) => {
	if (items.length === 0) {
		return <TimelineBody>{emptyMessage}</TimelineBody>;
	}

	return (
		<Timeline>
			{items.map((item) => {
				const clickable = Boolean(item.href && onNavigate);
				return (
					<TimelineItem
						key={item.id}
						$kind={item.kind}
						$clickable={clickable}
						role={clickable ? 'button' : undefined}
						tabIndex={clickable ? 0 : undefined}
						onClick={() => {
							if (item.href && onNavigate) onNavigate(item.href);
						}}
						onKeyDown={(event) => {
							if (!clickable || !item.href || !onNavigate) return;
							if (event.key === 'Enter' || event.key === ' ') {
								event.preventDefault();
								onNavigate(item.href);
							}
						}}>
						<TimelineDot $kind={item.kind} />
						<TimelineItemHeader>
							<TimelineItemTitle>{item.title}</TimelineItemTitle>
							<TimelineItemMeta>{formatTimelineDate(item.date)}</TimelineItemMeta>
						</TimelineItemHeader>
						{item.description && (
							<TimelineBody>{item.description}</TimelineBody>
						)}
						{item.metadata && item.metadata.length > 0 && (
							<TimelineMetadata>
								{item.metadata.map((meta) => (
									<TimelineMetadataItem key={`${item.id}-${meta.label}`}>
										<TimelineMetadataLabel>{meta.label}</TimelineMetadataLabel>
										<TimelineMetadataValue>{meta.value}</TimelineMetadataValue>
									</TimelineMetadataItem>
								))}
							</TimelineMetadata>
						)}
					</TimelineItem>
				);
			})}
		</Timeline>
	);
};
