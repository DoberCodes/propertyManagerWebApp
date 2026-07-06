import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronDown,
	faChevronUp,
	faCircleInfo,
} from '@fortawesome/free-solid-svg-icons';
import { GenericModal } from '../Library';
import { HouseLogoLoader } from '../Library/HouseLogoLoader';
import {
	PropertyScanSnapshot,
	useGetLatestPropertyIntelligenceSnapshotQuery,
	useSavePropertyAuditSnapshotMutation,
} from '../../Redux/API/propertyIntelligenceSlice';
import {
	runPropertyAudit,
	groupAssetReviewsForPropertyAudit,
	PropertyAuditAssetReview,
	PropertyAuditCategory,
} from '../../intelligence/consumers/propertyAudit';
import { Device, Property } from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import {
	maintleyFindingToPropertyScanRecommendation,
	PropertyScanActionType,
	PropertyScanRecommendation,
} from '../../utils/propertyIntelligenceScan';
import {
	getEffectiveSubscriptionPlanId,
	SubscriptionData,
} from '../../utils/subscriptionUtils';
import { RootState } from '../../Redux/store/store';
import { selectIsHomeowner } from '../../Redux/selectors/permissionSelectors';
import { COLORS } from '../../constants/colors';

interface PropertyAuditPanelProps {
	property: Property;
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	canRunAudit: boolean;
	resolvedRecommendationIds?: string[];
	subscription?: SubscriptionData | null;
	onRecommendationAction: (
		actionType: PropertyScanActionType,
		recommendation: PropertyScanRecommendation,
	) => void;
}

const formatAuditDate = (value?: string): string => {
	if (!value) return 'No review run yet';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return 'No review run yet';
	return parsed.toLocaleString();
};

const getPropertyAccountId = (
	property: Property,
	activeAccountId?: string,
	activeUserId?: string,
): string =>
	String(
		activeAccountId ||
		(property as any).accountId ||
		activeUserId ||
		property.userId ||
		'',
	).trim();

const getSnapshotSummary = (recommendations: PropertyScanRecommendation[]) => ({
	recommendations: recommendations.length,
	overdue: recommendations.filter((item) => item.category === 'Overdue Work')
		.length,
	high: recommendations.filter((item) => item.severity === 'high').length,
	medium: recommendations.filter((item) => item.severity === 'medium').length,
	low: recommendations.filter((item) => item.severity === 'low').length,
});

const getErrorMessage = (error: unknown): string => {
	if (typeof error === 'string') return error;
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof (error as { message?: unknown }).message === 'string'
	) {
		return String((error as { message: string }).message);
	}
	return 'The review finished, but Maintley could not save it. Please try again.';
};

const isAuditCategory = (value: unknown): value is PropertyAuditCategory =>
	Boolean(
		value &&
		typeof value === 'object' &&
		'id' in value &&
		'findings' in value &&
		Array.isArray((value as { findings?: unknown }).findings),
	);

const isAuditAssetReview = (value: unknown): value is PropertyAuditAssetReview =>
	Boolean(
		value &&
		typeof value === 'object' &&
		'assetId' in value &&
		'findings' in value &&
		Array.isArray((value as { findings?: unknown }).findings),
	);

export const PropertyAuditPanel: React.FC<PropertyAuditPanelProps> = ({
	property,
	systems,
	tasks,
	maintenanceHistory,
	canRunAudit,
	resolvedRecommendationIds = [],
	subscription,
	onRecommendationAction,
}) => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const isHomeowner = useSelector(selectIsHomeowner);
	const reviewLanguage = {
		label: isHomeowner ? 'Home Review' : 'Property Review',
		recordNoun: isHomeowner ? 'home record' : 'property record',
		recordPlural: isHomeowner ? 'home records' : 'property records',
		subjectNoun: isHomeowner ? 'home' : 'property',
		timelineNoun: isHomeowner ? 'home timeline' : 'property timeline',
		memoryLabel: isHomeowner ? 'Home Memory' : 'Property Memory',
	};
	const [isCollapsed, setIsCollapsed] = useState(true);
	const [isReviewInfoOpen, setIsReviewInfoOpen] = useState(false);
	const [isRunningAudit, setIsRunningAudit] = useState(false);
	const [auditSaveError, setAuditSaveError] = useState('');
	const [latestAuditSnapshot, setLatestAuditSnapshot] =
		useState<PropertyScanSnapshot | null>(null);
	const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(
		() => new Set(),
	);
	const {
		data: persistedAuditSnapshot,
		isLoading: isLoadingAuditSnapshot,
	} = useGetLatestPropertyIntelligenceSnapshotQuery(
		{
			propertyId: property.id,
			scanType: 'property_audit_v1',
		},
		{
			skip: !canRunAudit || !property.id,
		},
	);
	const [savePropertyAuditSnapshot] = useSavePropertyAuditSnapshotMutation();
	const currentPlanId = getEffectiveSubscriptionPlanId(subscription, 'homeowner');

	useEffect(() => {
		if (!isRunningAudit) {
			setLatestAuditSnapshot(persistedAuditSnapshot || null);
		}
	}, [isRunningAudit, persistedAuditSnapshot]);

	useEffect(() => {
		setAuditSaveError('');
		setIsRunningAudit(false);
		setExpandedAssetIds(new Set());
	}, [property.id]);

	const auditCategories = useMemo(() => {
		const resolvedIds = new Set(resolvedRecommendationIds);
		const storedCategories = (latestAuditSnapshot?.auditCategories || [])
			.filter(isAuditCategory);

		return storedCategories.map((category) => {
			const findings = category.findings.filter(
				(finding) => !resolvedIds.has(finding.id),
			);
			return {
				...category,
				findings,
				summary: {
					total: findings.length,
					high: findings.filter((finding) => finding.severity === 'high').length,
					medium: findings.filter((finding) => finding.severity === 'medium').length,
					low: findings.filter((finding) => finding.severity === 'low').length,
				},
			};
		});
	}, [latestAuditSnapshot, resolvedRecommendationIds]);
	const visibleAuditCategories = auditCategories.filter(
		(category) => category.summary.total > 0,
	);
	const auditAssetReviews = useMemo(
		() => {
			const resolvedIds = new Set(resolvedRecommendationIds);
			const storedAssetReviews = (latestAuditSnapshot?.auditAssetReviews || [])
				.filter(isAuditAssetReview);
			if (storedAssetReviews.length > 0) {
				return groupAssetReviewsForPropertyAudit(
					storedAssetReviews
						.flatMap((assetReview) => assetReview.findings)
						.filter((finding) => !resolvedIds.has(finding.id)),
					systems,
				);
			}

			const categoryFindings = auditCategories.flatMap(
				(category) => category.findings,
			);
			return groupAssetReviewsForPropertyAudit(categoryFindings, systems);
		},
		[
			auditCategories,
			latestAuditSnapshot?.auditAssetReviews,
			resolvedRecommendationIds,
			systems,
		],
	);
	const visibleAssetReviews = auditAssetReviews.filter(
		(assetReview) => assetReview.summary.total > 0,
	);
	const topPriorityAssetReviews = visibleAssetReviews
		.filter((assetReview) => assetReview.summary.high > 0)
		.slice(0, 3);
	const auditSummary = useMemo(() => {
		if (!latestAuditSnapshot) return undefined;
		const findings = auditCategories.flatMap((category) => category.findings);
		return {
			recommendations: findings.length,
			overdue: findings.filter((finding) => finding.category === 'Overdue Work')
				.length,
			high: findings.filter((finding) => finding.severity === 'high').length,
			medium: findings.filter((finding) => finding.severity === 'medium').length,
			low: findings.filter((finding) => finding.severity === 'low').length,
		};
	}, [auditCategories, latestAuditSnapshot]);
	const hasSavedAudit = Boolean(latestAuditSnapshot);

	const handleToggleAssetReview = (assetId: string) => {
		setExpandedAssetIds((currentIds) => {
			const nextIds = new Set(currentIds);
			if (nextIds.has(assetId)) {
				nextIds.delete(assetId);
			} else {
				nextIds.add(assetId);
			}
			return nextIds;
		});
	};

	const handleRunAudit = async () => {
		if (isRunningAudit) return;
		const accountId = getPropertyAccountId(
			property,
			String((currentUser as any)?.accountId || '').trim(),
			String(currentUser?.id || '').trim(),
		);
		if (!accountId) {
			setAuditSaveError(`Maintley could not identify the account for this ${reviewLanguage.subjectNoun}.`);
			return;
		}

		setIsRunningAudit(true);
		setAuditSaveError('');

		const createdAt = new Date().toISOString();
		const audit = runPropertyAudit(
			{
				property,
				systems,
				tasks,
				maintenanceHistory,
				createdAt,
			},
			{
				planId: currentPlanId,
			},
		);
		const recommendations = audit.findings.map((finding) =>
			maintleyFindingToPropertyScanRecommendation(finding),
		);
		const nextSnapshot: PropertyScanSnapshot = {
			accountId,
			propertyId: property.id,
			scanType: 'property_audit_v1',
			schemaVersion: 2,
			planId: currentPlanId,
			createdAt,
			updatedAt: createdAt,
			recommendations,
			auditCategories: audit.categories,
			auditAssetReviews: audit.assetReviews,
			systemsReviewed: audit.systemsReviewed,
			tasksReviewed: audit.tasksReviewed,
			baselineVersion: audit.baselineVersion,
			summary: getSnapshotSummary(recommendations),
		};

		try {
			const savedSnapshot = await savePropertyAuditSnapshot(nextSnapshot).unwrap();
			setLatestAuditSnapshot(savedSnapshot || nextSnapshot);
			setIsCollapsed(false);
		} catch (error) {
			setAuditSaveError(getErrorMessage(error));
		} finally {
			setIsRunningAudit(false);
		}
	};

	if (!canRunAudit) {
		return null;
	}

	return (
		<AuditPanel aria-label={reviewLanguage.label}>
			<AuditHeader>
				<AuditTitleBlock>
					<AuditEyebrow>Maintley Intelligence</AuditEyebrow>
					<AuditTitleRow>
						<AuditTitle>{reviewLanguage.label}</AuditTitle>
						<CollapseButton
							type='button'
							aria-expanded={!isCollapsed}
							aria-label={isCollapsed ? `Expand ${reviewLanguage.label}` : `Collapse ${reviewLanguage.label}`}
							onClick={() => setIsCollapsed((currentValue) => !currentValue)}>
							<FontAwesomeIcon
								icon={isCollapsed ? faChevronDown : faChevronUp}
								aria-hidden='true'
							/>
						</CollapseButton>
					</AuditTitleRow>
					<AuditText>
						A broader review of saved {reviewLanguage.recordPlural}, maintenance coverage,
						and equipment details, organized by {isHomeowner ? 'equipment' : 'system'} so you can improve the
						{reviewLanguage.subjectNoun} memory over time.
					</AuditText>
				</AuditTitleBlock>
				<AuditActions>
					<InfoButton
						type='button'
						onClick={() => setIsReviewInfoOpen(true)}
						title={`How ${reviewLanguage.label} Works`}>
						<FontAwesomeIcon icon={faCircleInfo} aria-hidden='true' />
						<span>How {reviewLanguage.label} Works</span>
					</InfoButton>
					<PrimaryButton
						type='button'
						onClick={handleRunAudit}
						disabled={isRunningAudit}>
						{isRunningAudit ? 'Reviewing...' : hasSavedAudit ? 'Run Again' : 'Run Review'}
					</PrimaryButton>
				</AuditActions>
			</AuditHeader>

			{isCollapsed ? null : (
				<AuditBody>
					<AuditMeta>
						Last review: {formatAuditDate(latestAuditSnapshot?.createdAt)}
					</AuditMeta>
					{auditSaveError ? <ErrorResult>{auditSaveError}</ErrorResult> : null}
					{isRunningAudit ? (
						<AuditLoadingOverlay aria-live='polite' role='status'>
							<AuditLoadingCard>
								<AuditLoadingMark>
									<HouseLogoLoader variant='assemble' />
								</AuditLoadingMark>
								<AuditLoadingTitle>
									Reviewing this {reviewLanguage.recordNoun}...
								</AuditLoadingTitle>
								<AuditLoadingList>
									<li>
										Reviewing {systems.length}{' '}
										{systems.length === 1
											? isHomeowner ? 'equipment record' : 'system'
											: isHomeowner ? 'equipment records' : 'systems'}
									</li>
									<li>Organizing opportunities by record</li>
									<li>Building the review summary</li>
								</AuditLoadingList>
							</AuditLoadingCard>
						</AuditLoadingOverlay>
					) : isLoadingAuditSnapshot ? (
						<PromptRow>
							<PromptText>Loading latest review...</PromptText>
						</PromptRow>
					) : hasSavedAudit ? (
						<>
							<SummaryGrid>
								<SummaryItem>
									<SummaryValue>{auditSummary?.recommendations || 0}</SummaryValue>
									<SummaryLabel>opportunities</SummaryLabel>
								</SummaryItem>
								<SummaryItem>
									<SummaryValue>{auditSummary?.high || 0}</SummaryValue>
									<SummaryLabel>high priority</SummaryLabel>
								</SummaryItem>
								<SummaryItem>
									<SummaryValue>{latestAuditSnapshot?.systemsReviewed || 0}</SummaryValue>
									<SummaryLabel>{isHomeowner ? 'equipment reviewed' : 'systems reviewed'}</SummaryLabel>
								</SummaryItem>
							</SummaryGrid>
							{visibleAssetReviews.length > 0 ? (
								<>
									{topPriorityAssetReviews.length > 0 && (
										<AuditSection>
											<SectionTitle>Top Priorities</SectionTitle>
											<TopPriorityList>
												{topPriorityAssetReviews.map((assetReview) => (
													<TopPriorityButton
														key={assetReview.assetId}
														type='button'
														onClick={() => handleToggleAssetReview(assetReview.assetId)}>
														<span>{assetReview.assetTitle}</span>
														<strong>{assetReview.summary.high} high priority</strong>
													</TopPriorityButton>
												))}
											</TopPriorityList>
										</AuditSection>
									)}

									{visibleAuditCategories.length > 0 && (
										<AuditSection>
											<SectionTitle>Browse Categories</SectionTitle>
											<CategoryPillList>
												{visibleAuditCategories.map((category) => (
													<CategoryPill key={category.id}>
														<span>{category.title}</span>
														<strong>{category.summary.total}</strong>
													</CategoryPill>
												))}
											</CategoryPillList>
										</AuditSection>
									)}

									<AuditSection>
										<SectionTitle>Asset Reviews</SectionTitle>
										<AssetReviewList>
											{visibleAssetReviews.map((assetReview) => {
												const isExpanded = expandedAssetIds.has(assetReview.assetId);
												return (
													<AssetReviewCard key={assetReview.assetId}>
														<AssetReviewHeader
															type='button'
															aria-expanded={isExpanded}
															onClick={() =>
																handleToggleAssetReview(assetReview.assetId)
															}>
															<AssetReviewTitleBlock>
																<AssetReviewTitle>{assetReview.assetTitle}</AssetReviewTitle>
																<AssetReviewMeta>
																	{assetReview.summary.total}{' '}
																	{assetReview.summary.total === 1 ? 'opportunity' : 'opportunities'}
																	{assetReview.summary.high > 0
																		? ` - ${assetReview.summary.high} high priority`
																		: ''}
																</AssetReviewMeta>
															</AssetReviewTitleBlock>
															<AssetReviewChevron>
																<FontAwesomeIcon
																	icon={isExpanded ? faChevronUp : faChevronDown}
																	aria-hidden='true'
																/>
															</AssetReviewChevron>
														</AssetReviewHeader>

														<CategorySummaryList>
															{assetReview.categorySummaries.map((summary) => (
																<CategorySummaryPill key={summary.id}>
																	<span>{summary.title}</span>
																	<strong>{summary.total}</strong>
																</CategorySummaryPill>
															))}
														</CategorySummaryList>

														{isExpanded && (
															<AssetFindingGroupList>
																{(assetReview.categoryGroups || []).map((group) => (
																	<AssetFindingGroup key={group.id}>
																		<AssetFindingGroupHeader>
																			<span>{group.title}</span>
																			<strong>{group.summary.total}</strong>
																		</AssetFindingGroupHeader>
																		<FindingList>
																			{group.findings.map((finding) => {
																				const recommendation =
																					maintleyFindingToPropertyScanRecommendation(finding);
																				return (
																					<FindingRow key={finding.id}>
																						<FindingText>
																							<strong>{finding.title}</strong>
																							<span>{finding.whyItMatters}</span>
																						</FindingText>
																						<FindingAction
																							type='button'
																							onClick={() =>
																								onRecommendationAction(
																									recommendation.suggestedActionType,
																									recommendation,
																								)
																							}>
																							{recommendation.resolution?.actionLabel ||
																								recommendation.suggestedActionLabel}
																						</FindingAction>
																					</FindingRow>
																				);
																			})}
																		</FindingList>
																	</AssetFindingGroup>
																))}
															</AssetFindingGroupList>
														)}
													</AssetReviewCard>
												);
											})}
										</AssetReviewList>
									</AuditSection>
								</>
							) : (
								<EmptyResult>
									Maintley reviewed this {reviewLanguage.recordNoun} and did not find active
									review items.
								</EmptyResult>
							)}
						</>
					) : (
						<PromptRow>
							<PromptText>
								Run a {reviewLanguage.label} when you want a broader look at saved
								records, grouped by {isHomeowner ? 'equipment' : 'system'}, documentation, and maintenance coverage.
							</PromptText>
						</PromptRow>
					)}
				</AuditBody>
			)}
			<GenericModal
				isOpen={isReviewInfoOpen}
				title={`How ${reviewLanguage.label} Works`}
				onClose={() => setIsReviewInfoOpen(false)}
				compact>
				<ReviewInfoBody>
					<ReviewInfoLead>
						{reviewLanguage.label} looks across the records saved for this {reviewLanguage.subjectNoun} and
						groups opportunities by {isHomeowner ? 'equipment' : 'system'}, documentation, and maintenance
						coverage.
					</ReviewInfoLead>
					<ReviewInfoItem $tone='records'>
						<strong>{reviewLanguage.memoryLabel}</strong>
						<span>
							Checks saved records for useful details such as install dates,
							make, model, service notes, and supporting documents.
						</span>
					</ReviewInfoItem>
					<ReviewInfoItem $tone='maintenance'>
						<strong>Maintenance Coverage</strong>
						<span>
							Looks for recurring care and maintenance history that would make the{' '}
							long-term {reviewLanguage.timelineNoun} more useful.
						</span>
					</ReviewInfoItem>
					<ReviewInfoItem $tone='assets'>
						<strong>Asset Reviews</strong>
						<span>
							Organizes opportunities by system so you can improve one record at
							a time instead of sorting through a long flat list.
						</span>
					</ReviewInfoItem>
					<ReviewInfoNote>
						Maintley does not inspect the {reviewLanguage.subjectNoun}{' '}
						or verify equipment condition.
						{reviewLanguage.label} is based on recorded information and general
						maintenance knowledge.
					</ReviewInfoNote>
				</ReviewInfoBody>
			</GenericModal>
		</AuditPanel>
	);
};

const AuditPanel = styled.section`
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

const AuditHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 18px;

	@media (max-width: 720px) {
		flex-direction: column;
	}
`;

const AuditTitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;

	@media (max-width: 720px) {
		width: 100%;
	}
`;

const AuditTitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;

	@media (max-width: 720px) {
		justify-content: space-between;
		width: 100%;
	}
`;

const AuditEyebrow = styled.div`
	color: ${COLORS.primaryDark};
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const AuditTitle = styled.h2`
	margin: 0;
	color: #172033;
	font-size: 22px;
	line-height: 1.2;
`;

const CollapseButton = styled.button`
	border: 1px solid #d9e2ec;
	border-radius: 8px;
	background: #ffffff;
	color: ${COLORS.primaryDark};
	width: 34px;
	height: 34px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	cursor: pointer;

	&:hover {
		background: ${COLORS.primaryLight};
		border-color: ${COLORS.primary};
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}
`;

const AuditText = styled.p`
	margin: 0;
	max-width: 760px;
	color: #475569;
	font-size: 14px;
	line-height: 1.55;
`;

const AuditActions = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 720px) {
		width: 100%;
	}
`;

const InfoButton = styled.button`
	border: 0;
	background: transparent;
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 700;
	padding: 10px 4px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	white-space: nowrap;

	&:hover {
		color: ${COLORS.primary};
		text-decoration: underline;
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
		border-radius: 4px;
	}
`;

const AuditBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const AuditMeta = styled.div`
	border-top: 1px solid #e2e8f0;
	padding-top: 10px;
	color: #64748b;
	font-size: 13px;
`;

const PrimaryButton = styled.button`
	border: 0;
	border-radius: 8px;
	background: ${COLORS.primary};
	color: ${COLORS.white};
	font-weight: 700;
	font-size: 14px;
	padding: 10px 14px;
	cursor: pointer;
	min-height: 40px;
	box-shadow: 0 4px 12px rgba(0, 158, 113, 0.22);

	&:hover {
		background: ${COLORS.primaryHover};
	}

	&:disabled {
		cursor: wait;
		opacity: 0.75;
		box-shadow: none;
	}

	@media (max-width: 720px) {
		width: 100%;
	}
`;

const SummaryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

const SummaryItem = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 12px;
	background: #f8fafc;
`;

const SummaryValue = styled.div`
	color: #172033;
	font-size: 24px;
	font-weight: 800;
	line-height: 1;
`;

const SummaryLabel = styled.div`
	margin-top: 5px;
	color: #64748b;
	font-size: 13px;
`;

const PromptRow = styled.div`
	border-top: 1px solid #e2e8f0;
	padding-top: 12px;
`;

const PromptText = styled.p`
	margin: 0;
	color: #475569;
	font-size: 14px;
`;

const AuditLoadingOverlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 10002;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	background: rgba(15, 23, 42, 0.58);
`;

const AuditLoadingCard = styled.div`
	width: min(420px, 100%);
	border-radius: 18px;
	background: #ffffff;
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34);
	padding: 28px;
`;

const AuditLoadingMark = styled.div`
	display: flex;
	justify-content: center;
	margin-bottom: 18px;
`;

const AuditLoadingTitle = styled.div`
	color: #0f172a;
	font-size: 20px;
	font-weight: 900;
	line-height: 1.3;
	text-align: center;
`;

const AuditLoadingList = styled.ul`
	display: grid;
	gap: 8px;
	margin: 16px 0 0;
	padding: 0;
	list-style: none;
	color: #475569;
	font-size: 14px;
	line-height: 1.4;

	li {
		position: relative;
		padding-left: 18px;
	}

	li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.55em;
		width: 7px;
		height: 7px;
		border-radius: 999px;
		background: ${COLORS.primaryDark};
	}
`;

const ErrorResult = styled.div`
	border: 1px solid #fecaca;
	border-radius: 8px;
	background: #fef2f2;
	color: #991b1b;
	padding: 14px;
	font-size: 14px;
	line-height: 1.5;
`;

const EmptyResult = styled.div`
	border: 1px solid rgba(0, 158, 113, 0.36);
	border-radius: 8px;
	background: ${COLORS.successLight};
	color: ${COLORS.successDark};
	padding: 14px;
	font-size: 14px;
	line-height: 1.5;
`;

const ReviewInfoBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const ReviewInfoLead = styled.p`
	margin: 0;
	color: #334155;
	font-size: 14px;
	line-height: 1.55;
`;

const ReviewInfoItem = styled.div<{
	$tone: 'records' | 'maintenance' | 'assets';
}>`
	border-left: 3px solid
		${({ $tone }) =>
		$tone === 'records'
			? COLORS.primary
			: $tone === 'maintenance'
				? COLORS.primaryHover
				: COLORS.primaryDark};
	padding-left: 12px;
	display: flex;
	flex-direction: column;
	gap: 3px;
	color: #475569;
	font-size: 13px;
	line-height: 1.45;

	strong {
		color: #172033;
		font-size: 14px;
	}
`;

const ReviewInfoNote = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 12px;
	line-height: 1.45;
`;

const AuditSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const SectionTitle = styled.h3`
	margin: 0;
	color: #172033;
	font-size: 14px;
	line-height: 1.35;
`;

const TopPriorityList = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`;

const TopPriorityButton = styled.button`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #fff7ed;
	color: #172033;
	padding: 12px;
	text-align: left;
	display: flex;
	flex-direction: column;
	gap: 5px;
	cursor: pointer;

	span {
		font-size: 14px;
		font-weight: 800;
	}

	strong {
		color: #9a3412;
		font-size: 12px;
	}

	&:hover {
		border-color: #fed7aa;
		background: #ffedd5;
	}
`;

const CategoryPillList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
`;

const CategoryPill = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 999px;
	background: #f8fafc;
	color: #475569;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 7px 10px;
	font-size: 13px;

	strong {
		color: #172033;
	}
`;

const AssetReviewList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const AssetReviewCard = styled.section`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #ffffff;
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

const AssetReviewHeader = styled.button`
	border: 0;
	background: transparent;
	padding: 0;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;
	text-align: left;
	cursor: pointer;
`;

const AssetReviewTitleBlock = styled.div`
	min-width: 0;
`;

const AssetReviewTitle = styled.h4`
	margin: 0;
	color: #172033;
	font-size: 15px;
	line-height: 1.35;
`;

const AssetReviewMeta = styled.div`
	margin-top: 3px;
	color: #64748b;
	font-size: 12px;
	line-height: 1.4;
`;

const AssetReviewChevron = styled.span`
	border: 1px solid #d9e2ec;
	border-radius: 8px;
	color: ${COLORS.primaryDark};
	width: 30px;
	height: 30px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
`;

const CategorySummaryList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 7px;
`;

const CategorySummaryPill = styled.div`
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 12px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 5px 8px;

	strong {
		color: ${COLORS.primaryDark};
	}
`;

const AssetFindingGroupList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const AssetFindingGroup = styled.section`
	border-top: 1px solid #e2e8f0;
	padding-top: 10px;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const AssetFindingGroupHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	color: #172033;
	font-size: 13px;
	font-weight: 800;

	strong {
		border-radius: 999px;
		background: #f8fafc;
		color: #475569;
		font-size: 12px;
		padding: 4px 8px;
	}
`;

const FindingList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const FindingRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 12px;
	border-top: 1px solid #e2e8f0;
	padding-top: 10px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`;

const FindingText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	color: #475569;
	font-size: 13px;
	line-height: 1.45;

	strong {
		color: #172033;
		font-size: 14px;
	}
`;

const FindingAction = styled.button`
	border: 1px solid ${COLORS.primary};
	border-radius: 8px;
	background: #ffffff;
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 700;
	padding: 8px 10px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: ${COLORS.primaryLight};
	}
`;
