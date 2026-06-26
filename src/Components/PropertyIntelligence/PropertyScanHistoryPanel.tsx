import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { GenericModal } from '../Library';
import {
	PropertyScanSnapshot,
	useGetPropertyScanSnapshotsQuery,
} from '../../Redux/API/propertyIntelligenceSlice';
import { PropertyScanRecommendation } from '../../utils/propertyIntelligenceScan';
import { COLORS } from '../../constants/colors';

interface PropertyScanHistoryPanelProps {
	propertyId: string;
	accountId?: string;
	canRunScan: boolean;
}

const formatScanDate = (value?: string): string => {
	if (!value) return 'Date not recorded';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return 'Date not recorded';
	return parsed.toLocaleString();
};

const formatTimelineDate = (value?: string): string => {
	if (!value) return 'Date not recorded';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return 'Date not recorded';
	return parsed.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
	});
};

const getScanTypeLabel = (scanType?: string): string => {
	switch (scanType) {
		case 'quick_property_scan_v1':
			return 'Quick Scan';
		default:
			return scanType ? scanType.replace(/_/g, ' ') : 'Intelligence Scan';
	}
};

const getSourceLabel = (source?: PropertyScanRecommendation['source']): string => {
	switch (source) {
		case 'knowledge_pack':
			return 'Maintley Knowledge';
		case 'history_inference':
			return 'Property History';
		case 'context':
			return 'Seasonal & Context';
		case 'property_memory':
			return 'Property Memory';
		default:
			return 'Not recorded';
	}
};

const getRecommendationCount = (snapshot: PropertyScanSnapshot): number =>
	snapshot.summary?.recommendations ?? snapshot.recommendations?.length ?? 0;

const getImmediateActionCount = (snapshot: PropertyScanSnapshot): number =>
	snapshot.summary?.overdue ??
	(snapshot.recommendations || []).filter(
		(recommendation) => recommendation.category === 'Overdue Work',
	).length;

const getSnapshotSources = (snapshot: PropertyScanSnapshot): string[] => {
	const sources = (snapshot.recommendations || [])
		.map((recommendation) => recommendation.source)
		.filter(Boolean)
		.map((source) => getSourceLabel(source));
	return Array.from(new Set(sources));
};

const getAffectedCount = (recommendation: PropertyScanRecommendation): number =>
	recommendation.relatedTaskIds?.length ||
	recommendation.relatedSystemIds?.length ||
	(recommendation.systemId ? 1 : 0) ||
	0;

export const PropertyScanHistoryPanel: React.FC<
	PropertyScanHistoryPanelProps
> = ({ propertyId, accountId, canRunScan }) => {
	const [selectedSnapshot, setSelectedSnapshot] =
		useState<PropertyScanSnapshot | null>(null);
	const {
		data: snapshots = [],
		isLoading,
		isError,
	} = useGetPropertyScanSnapshotsQuery(
		{ propertyId, accountId },
		{ skip: !canRunScan || !propertyId || !accountId },
	);

	const selectedSources = useMemo(
		() => (selectedSnapshot ? getSnapshotSources(selectedSnapshot) : []),
		[selectedSnapshot],
	);

	if (!canRunScan) {
		return null;
	}

	return (
		<HistoryPanel aria-label='Property Intelligence history'>
			<HistoryHeader>
				<div>
					<HistoryEyebrow>Maintley Intelligence</HistoryEyebrow>
					<HistoryTitle>Intelligence History</HistoryTitle>
				</div>
				<HistoryDescription>
					Review what Maintley understood about this property at earlier points
					in time. These snapshots stay unchanged when property records change.
				</HistoryDescription>
			</HistoryHeader>

			{isLoading ? (
				<HistoryState>Loading scan history...</HistoryState>
			) : isError ? (
				<HistoryError>
					Maintley could not load this property&apos;s Intelligence history.
					Please try again.
				</HistoryError>
			) : snapshots.length === 0 ? (
				<HistoryState>
					Run a Quick Scan to begin building this property&apos;s Intelligence
					history.
				</HistoryState>
			) : (
				<SnapshotList>
					{snapshots.map((snapshot) => (
						<SnapshotCard key={snapshot.id || snapshot.createdAt}>
							<TimelineDateBlock>
								<TimelineDate>{formatTimelineDate(snapshot.createdAt)}</TimelineDate>
							</TimelineDateBlock>
							<SnapshotMain>
								<SnapshotTitle>{getScanTypeLabel(snapshot.scanType)}</SnapshotTitle>
								<SnapshotSummaryLine>
									{getRecommendationCount(snapshot)}{' '}
									{getRecommendationCount(snapshot) === 1
										? 'recommendation'
										: 'recommendations'}
								</SnapshotSummaryLine>
							</SnapshotMain>
							<OpenSnapshotButton
								type='button'
								onClick={() => setSelectedSnapshot(snapshot)}>
								View
							</OpenSnapshotButton>
						</SnapshotCard>
					))}
				</SnapshotList>
			)}

			{selectedSnapshot ? (
				<GenericModal
					isOpen={Boolean(selectedSnapshot)}
					title={`${getScanTypeLabel(selectedSnapshot.scanType)} Snapshot`}
					onClose={() => setSelectedSnapshot(null)}
					compact>
					<SnapshotDetail>
						<DetailIntro>
							Generated {formatScanDate(selectedSnapshot.createdAt)}. This is a
							read-only record of what Maintley showed when the scan was saved.
						</DetailIntro>
						<DetailSummaryGrid>
							<DetailSummaryItem>
								<strong>{getRecommendationCount(selectedSnapshot)}</strong>
								<span>recommendations</span>
							</DetailSummaryItem>
							<DetailSummaryItem>
								<strong>{selectedSnapshot.systemsReviewed ?? 0}</strong>
								<span>systems analyzed</span>
							</DetailSummaryItem>
							<DetailSummaryItem>
								<strong>{getImmediateActionCount(selectedSnapshot)}</strong>
								<span>immediate actions</span>
							</DetailSummaryItem>
						</DetailSummaryGrid>
						<DetailSection>
							<DetailLabel>Sources Used</DetailLabel>
							<DetailText>
								{selectedSources.length
									? selectedSources.join(', ')
									: 'Not recorded'}
							</DetailText>
						</DetailSection>
						<RecommendationSnapshotList>
							{(selectedSnapshot.recommendations || []).map((recommendation) => {
								const affectedCount = getAffectedCount(recommendation);
								return (
									<RecommendationSnapshotCard key={recommendation.id}>
										<RecommendationSnapshotHeader>
											<SeverityPill $severity={recommendation.severity}>
												{recommendation.severity}
											</SeverityPill>
											<SourcePill>
												{getSourceLabel(recommendation.source)}
											</SourcePill>
										</RecommendationSnapshotHeader>
										<RecommendationSnapshotTitle>
											{recommendation.title}
										</RecommendationSnapshotTitle>
										<RecommendationSnapshotText>
											{recommendation.description}
										</RecommendationSnapshotText>
										{recommendation.reason ? (
											<RecommendationSnapshotReason>
												{recommendation.reason}
											</RecommendationSnapshotReason>
										) : null}
										<RecommendationSnapshotFooter>
											<span>{recommendation.category}</span>
											{affectedCount ? (
												<span>
													{affectedCount}{' '}
													{affectedCount === 1
														? 'affected record'
														: 'affected records'}
												</span>
											) : null}
										</RecommendationSnapshotFooter>
									</RecommendationSnapshotCard>
								);
							})}
						</RecommendationSnapshotList>
					</SnapshotDetail>
				</GenericModal>
			) : null}
		</HistoryPanel>
	);
};

const HistoryPanel = styled.section`
	border: 1px solid #d9e2ec;
	border-radius: 8px;
	background: #ffffff;
	padding: 18px;
	display: flex;
	flex-direction: column;
	gap: 16px;

	@media (max-width: 640px) {
		padding: 14px;
	}
`;

const HistoryHeader = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) minmax(220px, 420px);
	gap: 16px;
	align-items: start;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`;

const HistoryEyebrow = styled.div`
	color: #0f766e;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const HistoryTitle = styled.h2`
	margin: 4px 0 0;
	color: #172033;
	font-size: 22px;
	line-height: 1.2;
`;

const HistoryDescription = styled.p`
	margin: 0;
	color: #475569;
	font-size: 14px;
	line-height: 1.55;
`;

const HistoryState = styled.div`
	border: 1px solid #d9e2ec;
	border-radius: 8px;
	background: #f8fafc;
	color: #475569;
	padding: 16px;
	font-size: 14px;
	line-height: 1.5;
`;

const HistoryError = styled(HistoryState)`
	border-color: #fecaca;
	background: #fef2f2;
	color: #991b1b;
`;

const SnapshotList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-height: 560px;
	overflow-y: auto;
	padding-right: 4px;
`;

const SnapshotCard = styled.article`
	display: grid;
	grid-template-columns: 86px minmax(0, 1fr) auto;
	gap: 12px;
	align-items: center;
	position: relative;
	padding: 10px 0 10px 14px;

	&::before {
		content: '';
		position: absolute;
		left: 44px;
		top: 0;
		bottom: 0;
		width: 1px;
		background: #d9e2ec;
	}

	@media (max-width: 680px) {
		grid-template-columns: 72px minmax(0, 1fr);
		align-items: start;
	}
`;

const TimelineDateBlock = styled.div`
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 8px;
	background: #ffffff;
	padding: 4px 0;
`;

const TimelineDate = styled.div`
	border: 1px solid #d9e2ec;
	border-radius: 8px;
	background: #f8fafc;
	color: #172033;
	font-size: 13px;
	font-weight: 800;
	line-height: 1;
	min-width: 58px;
	padding: 8px 9px;
	text-align: center;
`;

const SnapshotMain = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`;

const SnapshotTitle = styled.h3`
	margin: 0;
	color: #172033;
	font-size: 16px;
	line-height: 1.3;
`;

const SnapshotSummaryLine = styled.div`
	color: #475569;
	font-size: 13px;
`;

const SnapshotMetaItem = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
	padding: 8px 10px;
	display: flex;
	flex-direction: column;
	gap: 2px;

	strong {
		color: #172033;
		font-size: 16px;
		line-height: 1;
	}

	span {
		color: #64748b;
		font-size: 12px;
	}
`;

const OpenSnapshotButton = styled.button`
	border: 1px solid ${COLORS.primary};
	border-radius: 8px;
	background: #ffffff;
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 800;
	padding: 9px 12px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: ${COLORS.primaryLight};
		border-color: ${COLORS.primaryDark};
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}

	@media (max-width: 680px) {
		grid-column: 2;
		justify-self: start;
	}
`;

const SnapshotDetail = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const DetailIntro = styled.p`
	margin: 0;
	color: #475569;
	font-size: 14px;
	line-height: 1.55;
`;

const DetailSummaryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`;

const DetailSummaryItem = styled(SnapshotMetaItem)``;

const DetailSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const DetailLabel = styled.div`
	color: #0f766e;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const DetailText = styled.p`
	margin: 0;
	color: #475569;
	font-size: 14px;
	line-height: 1.5;
`;

const RecommendationSnapshotList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-height: 54vh;
	overflow-y: auto;
	padding-right: 4px;
`;

const RecommendationSnapshotCard = styled.article`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 7px;
`;

const RecommendationSnapshotHeader = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

const SeverityPill = styled.span<{ $severity: 'low' | 'medium' | 'high' }>`
	border-radius: 999px;
	padding: 3px 8px;
	font-size: 11px;
	font-weight: 800;
	text-transform: uppercase;
	color: ${({ $severity }) =>
		$severity === 'high'
			? '#991b1b'
			: $severity === 'medium'
				? '#92400e'
				: '#155e75'};
	background: ${({ $severity }) =>
		$severity === 'high'
			? '#fee2e2'
			: $severity === 'medium'
				? '#fef3c7'
				: '#cffafe'};
`;

const SourcePill = styled.span`
	border-radius: 999px;
	background: #ecfeff;
	color: #0e7490;
	font-size: 11px;
	font-weight: 800;
	padding: 3px 8px;
`;

const RecommendationSnapshotTitle = styled.h4`
	margin: 0;
	color: #172033;
	font-size: 15px;
	line-height: 1.35;
`;

const RecommendationSnapshotText = styled.p`
	margin: 0;
	color: #475569;
	font-size: 14px;
	line-height: 1.45;
`;

const RecommendationSnapshotReason = styled.p`
	margin: 0;
	color: #334155;
	font-size: 13px;
	line-height: 1.45;
`;

const RecommendationSnapshotFooter = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px 12px;
	color: #64748b;
	font-size: 12px;
	font-weight: 700;
`;
