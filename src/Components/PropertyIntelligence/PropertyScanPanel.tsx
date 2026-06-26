import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { GenericModal } from '../Library';
import {
	PropertyScanSnapshot,
	useGetLatestPropertyScanSnapshotQuery,
	useSavePropertyScanSnapshotMutation,
} from '../../Redux/API/propertyIntelligenceSlice';
import { Device, Property } from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import {
	getQuickPropertyScanPremiumPreview,
	getQuickPropertyScanRecommendations,
	PropertyScanActionType,
	PropertyScanCategory,
	PropertyScanRecommendation,
	runPropertyScanV1,
	shouldShowPropertyScanRecommendationForPlan,
} from '../../utils/propertyIntelligenceScan';
import {
	getEffectiveSubscriptionPlanId,
	SubscriptionData,
} from '../../utils/subscriptionUtils';
import { RootState } from '../../Redux/store/store';
import { COLORS } from '../../constants/colors';
import {
	getDeviceAssetVariant,
	getDeviceAssetType,
} from '../../utils/systemTypes';

interface PropertyScanPanelProps {
	property: Property;
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	canRunScan: boolean;
	showSetupPrompt?: boolean;
	subscription?: SubscriptionData | null;
	onRecommendationAction: (
		actionType: PropertyScanActionType,
		recommendation: PropertyScanRecommendation,
	) => void;
}

const CATEGORY_ORDER: PropertyScanCategory[] = [
	'Overdue Work',
	'Missing Information',
	'Maintenance Opportunities',
	'Documentation Gaps',
	'Suggested Next Steps',
];

const DEFAULT_VISIBLE_RECOMMENDATIONS = 3;

const getDismissedStorageKey = (propertyId: string): string =>
	`maintley:property-scan-v1:dismissed:${propertyId}`;

const getEducationStorageKey = (accountId: string): string =>
	`maintley:property-scan-v1:education-seen:${accountId}`;

const formatScanDate = (value?: string): string => {
	if (!value) return 'No scan run yet';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return 'No scan run yet';
	return parsed.toLocaleString();
};

const getPlanLabel = (planId: string): string => {
	switch (planId) {
		case 'homeowner_plus':
			return 'Homeowner+';
		case 'property':
			return 'Property';
		case 'portfolio':
			return 'Portfolio';
		case 'team':
			return 'Team';
		case 'tenant':
			return 'Tenant';
		case 'guest':
			return 'Guest';
		case 'homeowner':
		default:
			return 'Free';
	}
};

const getQuickScanSummary = (recommendations: PropertyScanRecommendation[]) => ({
	active: recommendations.length,
	high: recommendations.filter((item) => item.severity === 'high').length,
	overdue: recommendations.filter((item) => item.category === 'Overdue Work').length,
});

const getAssetDisplayName = (asset?: Device): string =>
	asset
		? [
			asset.brand,
			getDeviceAssetVariant(asset) || getDeviceAssetType(asset),
			asset.model,
		]
			.filter(Boolean)
			.join(' ')
			.trim() ||
		getDeviceAssetType(asset) ||
		'System record'
		: 'System record';

const getRecommendationDialogTitle = (
	recommendation: PropertyScanRecommendation,
): string => recommendation.title.replace(/\.$/, '');

const shouldOpenAffectedDialog = (
	recommendation: PropertyScanRecommendation,
): boolean =>
	Boolean(
		(recommendation.relatedSystemIds?.length ||
			recommendation.relatedTaskIds?.length) &&
		(recommendation.suggestedActionType === 'open_systems' ||
			recommendation.suggestedActionType === 'open_task'),
	);

const getRecommendationPrimaryLabel = (
	recommendation: PropertyScanRecommendation,
): string => {
	if (!shouldOpenAffectedDialog(recommendation)) {
		return recommendation.suggestedActionLabel;
	}
	if (recommendation.relatedTaskIds?.length) {
		return 'Review Tasks';
	}
	if (recommendation.relatedSystemIds?.length) {
		return 'Review Systems';
	}
	return recommendation.suggestedActionLabel;
};

const getRecommendationImpact = (
	recommendation: PropertyScanRecommendation,
): string => {
	switch (recommendation.ruleId) {
		case 'overdue-tasks-exist':
			return 'Reviewing these recorded tasks helps keep maintenance visible and prevents it from slipping further behind.';
		case 'safety-systems-missing-maintenance-history':
			return 'Recording safety checks now makes routine testing and battery changes easier to remember later.';
		case 'systems-missing-actionable-maintenance-coverage':
		case 'premium-recurring-maintenance-opportunity':
			return 'When recurring maintenance is recorded, service intervals are easier to keep visible over time.';
		case 'baseline-maintenance-cadence-overdue':
			return 'Reviewing recorded cadence gaps helps catch routine care before it fades from the property history.';
		case 'systems-missing-maintenance-history':
			return 'Starting the history now gives the property a clearer record of what was serviced and when.';
		case 'systems-missing-important-identification':
			return 'Adding these details now makes future warranty claims, manuals, and replacement parts easier to find.';
		case 'knowledge-pack-record-details-missing':
			return 'Adding these maintenance details now makes future parts, supplies, and routine care easier to manage.';
		case 'major-systems-missing-install-dates':
			return 'Recording install dates makes warranty tracking, service planning, and future replacements much easier.';
		default:
			if (recommendation.category === 'Missing Information') {
				return 'Completing this now makes the property record more useful when decisions need to be made.';
			}
			if (recommendation.category === 'Maintenance Opportunities') {
				return 'Addressing this now helps turn property history into a clearer maintenance plan.';
			}
			if (recommendation.category === 'Overdue Work') {
				return 'Reviewing this now helps keep urgent maintenance visible.';
			}
			return 'Taking this step helps the property history become more useful over time.';
	}
};

const getRecommendationEvidence = (
	recommendation: PropertyScanRecommendation,
): string => {
	switch (recommendation.ruleId) {
		case 'overdue-tasks-exist':
			return 'Maintley found recorded maintenance tasks with due dates that have passed.';
		case 'safety-systems-missing-maintenance-history':
			return 'Maintley found smoke or carbon monoxide detector records without saved maintenance history.';
		case 'systems-missing-actionable-maintenance-coverage':
			return 'Maintley found systems without linked recurring maintenance tasks.';
		case 'premium-recurring-maintenance-opportunity':
			return 'Maintley found systems where recurring maintenance could be recorded with Homeowner+.';
		case 'baseline-maintenance-cadence-overdue':
			return 'Maintley compared saved maintenance history against Maintley baseline care intervals.';
		case 'systems-missing-maintenance-history':
			return 'Maintley found systems without saved maintenance history.';
		case 'systems-missing-important-identification':
			return 'Maintley found systems without recorded make or model details.';
		case 'knowledge-pack-record-details-missing':
			return 'Maintley compared saved system details against Maintley knowledge packs and found useful maintenance details that have not been recorded yet.';
		case 'major-systems-missing-install-dates':
			return 'Maintley found systems without recorded install dates.';
		default:
			if (recommendation.relatedTaskIds?.length) {
				return 'Maintley found related task records connected to this recommendation.';
			}
			if (recommendation.relatedSystemIds?.length) {
				return 'Maintley found related system records connected to this recommendation.';
			}
			return '';
	}
};

const getRecommendationSourceLabel = (
	recommendation: PropertyScanRecommendation,
): string => {
	switch (recommendation.source) {
		case 'knowledge_pack':
			return 'Maintley Knowledge';
		case 'history_inference':
			return 'History Intelligence';
		case 'context':
			return 'Context Intelligence';
		case 'property_memory':
		default:
			return 'Property Memory';
	}
};

const delay = (milliseconds: number) =>
	new Promise((resolve) => setTimeout(resolve, milliseconds));

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

const getMutationErrorMessage = (error: unknown): string => {
	if (typeof error === 'string') return error;
	if (!error || typeof error !== 'object') {
		return 'The scan finished, but Maintley could not save it. Please try again.';
	}

	const maybeError = error as {
		status?: number | string;
		data?: unknown;
		error?: string;
	};

	if (typeof maybeError.error === 'string' && maybeError.error.trim()) {
		return maybeError.error;
	}

	if (
		maybeError.data &&
		typeof maybeError.data === 'object' &&
		'message' in (maybeError.data as Record<string, unknown>) &&
		typeof (maybeError.data as Record<string, unknown>).message === 'string'
	) {
		return String((maybeError.data as Record<string, unknown>).message);
	}

	if (maybeError.status === 'FETCH_ERROR') {
		return 'Maintley could not reach Firestore from this browser session. Please disable blockers for firestore.googleapis.com and try again.';
	}

	return 'The scan finished, but Maintley could not save it. Please try again.';
};

const getSnapshotSummary = (recommendations: PropertyScanRecommendation[]) => ({
	recommendations: recommendations.length,
	overdue: recommendations.filter((item) => item.category === 'Overdue Work')
		.length,
	high: recommendations.filter((item) => item.severity === 'high').length,
	medium: recommendations.filter((item) => item.severity === 'medium').length,
	low: recommendations.filter((item) => item.severity === 'low').length,
});

export const PropertyScanPanel: React.FC<PropertyScanPanelProps> = ({
	property,
	systems,
	tasks,
	maintenanceHistory,
	canRunScan,
	showSetupPrompt = false,
	subscription,
	onRecommendationAction,
}) => {
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [dismissedIds, setDismissedIds] = useState<string[]>([]);
	const [lastScanSnapshot, setLastScanSnapshot] =
		useState<PropertyScanSnapshot | null>(null);
	const [showAllRecommendations, setShowAllRecommendations] = useState(false);
	const [isRunningScan, setIsRunningScan] = useState(false);
	const [scanProgressMessage, setScanProgressMessage] = useState('');
	const [scanSaveError, setScanSaveError] = useState('');
	const [showQuickScanEducation, setShowQuickScanEducation] = useState(false);
	const [isQuickScanInfoOpen, setIsQuickScanInfoOpen] = useState(false);
	const [detailRecommendation, setDetailRecommendation] =
		useState<PropertyScanRecommendation | null>(null);
	const {
		data: persistedLatestScan,
		isLoading: isLoadingLatestScan,
	} = useGetLatestPropertyScanSnapshotQuery(property.id, {
		skip: !canRunScan || !property.id,
	});
	const [savePropertyScanSnapshot] = useSavePropertyScanSnapshotMutation();
	const currentPlanId = getEffectiveSubscriptionPlanId(subscription, 'homeowner');
	const educationAccountId = getPropertyAccountId(
		property,
		String((currentUser as any)?.accountId || '').trim(),
		String(currentUser?.id || '').trim(),
	);

	useEffect(() => {
		if (typeof window === 'undefined') {
			setLastScanSnapshot(null);
			setScanSaveError('');
			return;
		}
		try {
			const storedValue = window.localStorage.getItem(getDismissedStorageKey(property.id));
			const parsedValue = storedValue ? JSON.parse(storedValue) : [];
			setDismissedIds(Array.isArray(parsedValue) ? parsedValue.map(String) : []);
		} catch {
			setDismissedIds([]);
		}
		setShowAllRecommendations(false);
		setIsRunningScan(false);
		setScanProgressMessage('');
		setScanSaveError('');
		setDetailRecommendation(null);
	}, [property.id]);

	useEffect(() => {
		if (typeof window === 'undefined' || !educationAccountId) {
			setShowQuickScanEducation(false);
			return;
		}

		setShowQuickScanEducation(
			window.localStorage.getItem(getEducationStorageKey(educationAccountId)) !== 'true',
		);
	}, [educationAccountId]);

	useEffect(() => {
		if (!isRunningScan) {
			setLastScanSnapshot(persistedLatestScan || null);
		}
	}, [isRunningScan, persistedLatestScan]);

	const displayedRecommendations = useMemo(() => {
		return (lastScanSnapshot?.recommendations || []).filter(
			(recommendation) =>
				recommendation.status !== 'dismissed' &&
				!dismissedIds.includes(recommendation.id) &&
				shouldShowPropertyScanRecommendationForPlan(
					recommendation,
					currentPlanId,
				),
		);
	}, [currentPlanId, dismissedIds, lastScanSnapshot]);
	const displayedSummary = useMemo(
		() => getQuickScanSummary(displayedRecommendations),
		[displayedRecommendations],
	);
	const displayedSystemsReviewed = lastScanSnapshot?.systemsReviewed ?? systems.length;
	const hasSavedSnapshot = Boolean(lastScanSnapshot);
	const visibleRecommendations = showAllRecommendations
		? displayedRecommendations
		: displayedRecommendations.slice(0, DEFAULT_VISIBLE_RECOMMENDATIONS);
	const hiddenRecommendationCount =
		displayedRecommendations.length - visibleRecommendations.length;
	const premiumPreview =
		currentPlanId === 'homeowner'
			? lastScanSnapshot?.premiumPreview || null
			: null;
	const canShowMore = hiddenRecommendationCount > 0 || Boolean(premiumPreview);
	const shouldShowPremiumPreview = showAllRecommendations && Boolean(premiumPreview);

	const groupedRecommendations = useMemo(() => {
		return CATEGORY_ORDER.map((category) => ({
			category,
			recommendations: visibleRecommendations.filter(
				(recommendation) => recommendation.category === category,
			),
		})).filter((group) => group.recommendations.length > 0);
	}, [visibleRecommendations]);

	const handleRunScan = async () => {
		if (isRunningScan) return;
		const accountId = getPropertyAccountId(
			property,
			String((currentUser as any)?.accountId || '').trim(),
			String(currentUser?.id || '').trim(),
		);
		if (!accountId) {
			setScanSaveError('Maintley could not identify the account for this property.');
			return;
		}

		setIsRunningScan(true);
		setShowAllRecommendations(false);
		setDetailRecommendation(null);
		setScanSaveError('');

		const progressMessages = [
			'Reviewing this property record...',
			`Reviewing ${systems.length} ${systems.length === 1 ? 'system' : 'systems'}`,
			'Checking maintenance coverage',
			'Finding what is worth attention',
		];

		for (const message of progressMessages) {
			setScanProgressMessage(message);
			await delay(450);
		}

		const createdAt = new Date().toISOString();
		const nextScanResult = runPropertyScanV1({
			property,
			systems,
			tasks,
			maintenanceHistory,
			dismissedRecommendationIds: dismissedIds,
			createdAt,
		});
		const recommendations = getQuickPropertyScanRecommendations(
			nextScanResult.activeRecommendations,
			undefined,
			{
				planId: currentPlanId,
			},
		);
		const premiumPreview = getQuickPropertyScanPremiumPreview(
			nextScanResult.activeRecommendations,
			currentPlanId,
		);
		const nextSnapshot: PropertyScanSnapshot = {
			accountId,
			propertyId: property.id,
			scanType: 'quick_property_scan_v1',
			schemaVersion: 2,
			planId: currentPlanId,
			createdAt,
			updatedAt: createdAt,
			recommendations,
			premiumPreview: premiumPreview || undefined,
			systemsReviewed: systems.length,
			summary: getSnapshotSummary(recommendations),
		};
		try {
			const savedSnapshot = await savePropertyScanSnapshot(nextSnapshot).unwrap();
			setLastScanSnapshot(savedSnapshot || nextSnapshot);
			setScanProgressMessage('');
			setIsRunningScan(false);
		} catch (error) {
			setScanSaveError(getMutationErrorMessage(error));
			setScanProgressMessage('');
			setIsRunningScan(false);
		}
	};

	const handleDismissQuickScanEducation = () => {
		setShowQuickScanEducation(false);
		if (typeof window !== 'undefined' && educationAccountId) {
			window.localStorage.setItem(
				getEducationStorageKey(educationAccountId),
				'true',
			);
		}
	};

	const handleOpenQuickScanInfo = () => {
		handleDismissQuickScanEducation();
		setIsQuickScanInfoOpen(true);
	};

	const handleViewPlanOptions = () => {
		onRecommendationAction('view_plan_options', {
			id: `maintley:property-scan:premium-preview:${property.id}`,
			propertyId: property.id,
			category: 'Maintenance Opportunities',
			severity: 'medium',
			priority: 'medium',
			source: 'knowledge_pack',
			title: 'More Maintley Intelligence is available with Homeowner+.',
			description:
				'Homeowner+ includes equipment-specific recommendations, history-based insights, and personalized maintenance guidance.',
			reason:
				'Maintley found additional Intelligence guidance that is available with Homeowner+.',
			suggestedActionLabel: 'Learn More',
			suggestedActionType: 'view_plan_options',
			requiredPlan: 'homeowner_plus',
			createdAt: lastScanSnapshot?.createdAt || new Date().toISOString(),
			status: 'active',
		});
	};

	const handleRecommendationPrimaryAction = (
		recommendation: PropertyScanRecommendation,
	) => {
		if (shouldOpenAffectedDialog(recommendation)) {
			setDetailRecommendation(recommendation);
			return;
		}
		onRecommendationAction(recommendation.suggestedActionType, recommendation);
	};

	const handleOpenRelatedSystem = (
		recommendation: PropertyScanRecommendation,
		system: Device,
	) => {
		setDetailRecommendation(null);
		onRecommendationAction('edit_system', {
			...recommendation,
			systemId: system.id,
		});
	};

	const handleOpenRelatedTasks = (recommendation: PropertyScanRecommendation) => {
		setDetailRecommendation(null);
		onRecommendationAction('open_task', recommendation);
	};

	const handleDismiss = (recommendationId: string) => {
		const nextDismissedIds = Array.from(new Set([...dismissedIds, recommendationId]));
		setDismissedIds(nextDismissedIds);
		if (typeof window !== 'undefined') {
			window.localStorage.setItem(
				getDismissedStorageKey(property.id),
				JSON.stringify(nextDismissedIds),
			);
		}
	};

	if (!canRunScan) {
		return null;
	}

	const detailRelatedSystems = detailRecommendation
		? (detailRecommendation.relatedSystemIds || [])
			.map((systemId) => systems.find((item) => item.id === systemId))
			.filter((item): item is Device => Boolean(item))
		: [];
	const detailRelatedTasks = detailRecommendation
		? (detailRecommendation.relatedTaskIds || [])
			.map((taskId) => tasks.find((task) => task.id === taskId))
			.filter((item): item is Task => Boolean(item))
		: [];
	const detailAffectedCount = detailRelatedSystems.length || detailRelatedTasks.length;
	const detailAffectedLabel = detailRelatedTasks.length
		? `${detailRelatedTasks.length} ${detailRelatedTasks.length === 1 ? 'task' : 'tasks'} affected`
		: `${detailRelatedSystems.length} ${detailRelatedSystems.length === 1 ? 'system' : 'systems'
		} affected`;

	return (
		<ScanPanel aria-label='Property Quick Scan'>
			<ScanHeader>
				<ScanTitleBlock>
					<ScanEyebrow>Maintley Intelligence</ScanEyebrow>
					<ScanTitle>Property Quick Scan</ScanTitle>
					<ScanText>
						Maintley reviews your property's history, systems, maintenance
						records, and documents to identify the few items most likely to
						improve your records or reduce future maintenance surprises.
						Maintley Intelligence provides recommendations based on the
						information recorded for your property. It does not inspect your
						property, verify system condition, or replace professional
						maintenance advice or inspections.
					</ScanText>
				</ScanTitleBlock>
				<ScanActions>
					<InfoButton
						type='button'
						onClick={handleOpenQuickScanInfo}
						title='How Quick Scan Works'>
						<FontAwesomeIcon icon={faCircleInfo} aria-hidden='true' />
						<span>How Quick Scan Works</span>
					</InfoButton>
					<PrimaryButton
						type='button'
						onClick={handleRunScan}
						disabled={isRunningScan}>
						{isRunningScan ? 'Running...' : hasSavedSnapshot ? 'Run Again' : 'Run Scan'}
					</PrimaryButton>
				</ScanActions>
			</ScanHeader>
			<ScanMeta>
				Last scan: {formatScanDate(lastScanSnapshot?.createdAt)}
			</ScanMeta>
			{showQuickScanEducation ? (
				<QuickScanEducation>
					<div>
						<strong>New to Property Quick Scan?</strong>
						<span>
							Maintley Intelligence combines your property records with maintenance
							knowledge to help you plan ahead.
						</span>
					</div>
					<EducationActions>
						<EducationButton type='button' onClick={handleOpenQuickScanInfo}>
							Learn More
						</EducationButton>
						<EducationDismissButton
							type='button'
							onClick={handleDismissQuickScanEducation}>
							Not now
						</EducationDismissButton>
					</EducationActions>
				</QuickScanEducation>
			) : null}
			{scanSaveError ? <ErrorResult>{scanSaveError}</ErrorResult> : null}

			{isLoadingLatestScan ? (
				<PromptRow>
					<PromptText>Loading latest scan...</PromptText>
				</PromptRow>
			) : hasSavedSnapshot ? (
				<>
					<SummaryGrid>
						<SummaryItem>
							<SummaryValue>{displayedSummary.active}</SummaryValue>
							<SummaryLabel>opportunities</SummaryLabel>
						</SummaryItem>
						<SummaryItem>
							<SummaryValue>{displayedSystemsReviewed}</SummaryValue>
							<SummaryLabel>systems analyzed</SummaryLabel>
						</SummaryItem>
						<SummaryItem>
							<SummaryValue>{displayedSummary.overdue}</SummaryValue>
							<SummaryLabel>immediate actions</SummaryLabel>
						</SummaryItem>
					</SummaryGrid>

					{displayedRecommendations.length === 0 && !shouldShowPremiumPreview ? (
						<>
							<EmptyResult>
								Maintley reviewed this property record and did not find any
								immediate high-value items that need your attention.
							</EmptyResult>
							{canShowMore ? (
								<ShowMoreButton
									type='button'
									onClick={() =>
										setShowAllRecommendations((currentValue) => !currentValue)
									}>
									{showAllRecommendations
										? 'Show Fewer'
										: 'Explore More Maintley Intelligence'}
								</ShowMoreButton>
							) : null}
						</>
					) : (
						<RecommendationWrap>
							{displayedRecommendations.length > 0 ? (
								<RecommendationIntro>
									What Maintley Found
								</RecommendationIntro>
							) : null}
							{groupedRecommendations.map((group) => (
								<CategoryGroup key={group.category}>
									<CategoryTitle>{group.category}</CategoryTitle>
									{group.recommendations.map((recommendation) => {
										const system = recommendation.systemId
											? systems.find((item) => item.id === recommendation.systemId)
											: null;
										const systemLabel = system ? getAssetDisplayName(system) : '';
										const relatedSystems = (recommendation.relatedSystemIds || [])
											.map((systemId) =>
												systems.find((item) => item.id === systemId),
											)
											.filter((item): item is Device => Boolean(item));
										const relatedTasks = (recommendation.relatedTaskIds || [])
											.map((taskId) => tasks.find((task) => task.id === taskId))
											.filter((item): item is Task => Boolean(item));
										const affectedCount =
											relatedSystems.length || relatedTasks.length || 0;
										const hasAffectedDetails = affectedCount > 0;
										const affectedLabel = relatedTasks.length
											? `${relatedTasks.length} ${relatedTasks.length === 1 ? 'task' : 'tasks'} affected`
											: `${relatedSystems.length} ${relatedSystems.length === 1 ? 'system' : 'systems'} affected`;
										const evidenceText = getRecommendationEvidence(recommendation);
										const sourceLabel =
											getRecommendationSourceLabel(recommendation);
										const evidenceItems = relatedTasks.length
											? relatedTasks.map((task) => task.title)
											: relatedSystems.map((item) => getAssetDisplayName(item));
										const visibleEvidenceItems = evidenceItems.slice(0, 5);
										const hiddenEvidenceItemCount =
											evidenceItems.length - visibleEvidenceItems.length;

										return (
											<RecommendationItem key={recommendation.id}>
												<RecommendationBody>
													<RecommendationTitleRow>
														<SeverityPill $severity={recommendation.severity}>
															{recommendation.recommendationType ===
																'premium_opportunity'
																? 'Opportunity'
																: recommendation.severity}
														</SeverityPill>
														<RecommendationTitle>
															{recommendation.title}
														</RecommendationTitle>
													</RecommendationTitleRow>
													{systemLabel ? (
														<SystemLine>System: {systemLabel}</SystemLine>
													) : null}
													<RecommendationDescription>
														{recommendation.description}
													</RecommendationDescription>
													<RecommendationImpact>
														{getRecommendationImpact(recommendation)}
													</RecommendationImpact>
													{hasAffectedDetails ? (
														<AffectedHint>{affectedLabel}</AffectedHint>
													) : null}
													{evidenceText ? (
														<EvidenceDetails>
															<EvidenceSummary>
																Why this recommendation?
															</EvidenceSummary>
															<EvidenceText>
																Based on: {sourceLabel}
															</EvidenceText>
															<EvidenceText>{evidenceText}</EvidenceText>
															{visibleEvidenceItems.length > 0 ? (
																<EvidenceList>
																	{visibleEvidenceItems.map((item, index) => (
																		<li key={`${item}-${index}`}>{item}</li>
																	))}
																	{hiddenEvidenceItemCount > 0 ? (
																		<li>{hiddenEvidenceItemCount} more affected records</li>
																	) : null}
																</EvidenceList>
															) : null}
														</EvidenceDetails>
													) : null}
												</RecommendationBody>
												<RecommendationActions>
													<ActionButton
														type='button'
														onClick={() =>
															handleRecommendationPrimaryAction(
																recommendation,
															)
														}>
														{getRecommendationPrimaryLabel(recommendation)}
													</ActionButton>
													<DismissButton
														type='button'
														onClick={() => handleDismiss(recommendation.id)}>
														Dismiss
													</DismissButton>
												</RecommendationActions>
											</RecommendationItem>
										);
									})}
								</CategoryGroup>
							))}
							{canShowMore ? (
								<ShowMoreButton
									type='button'
									onClick={() =>
										setShowAllRecommendations((currentValue) => !currentValue)
									}>
									{showAllRecommendations
										? 'Show Fewer'
										: hiddenRecommendationCount > 0
											? `Show ${hiddenRecommendationCount} More`
											: 'Explore More Maintley Intelligence'}
								</ShowMoreButton>
							) : null}
							{shouldShowPremiumPreview && premiumPreview ? (
								<PremiumPreview>
									<PremiumPreviewEyebrow>
										More available with Homeowner+
									</PremiumPreviewEyebrow>
									<PremiumPreviewTitle>
										As your property's records grow, Maintley can help with more
										maintenance guidance and planning.
									</PremiumPreviewTitle>
									<PremiumPreviewText>
										Homeowner+ adds equipment-specific recommendations based on the
										property information you have recorded.
									</PremiumPreviewText>
									<PremiumPreviewList>
										{premiumPreview.examples.map((example) => (
											<li key={example}>{example}</li>
										))}
									</PremiumPreviewList>
									<PremiumPreviewFooter>
										<span>Available with Homeowner+</span>
										<PremiumPreviewButton type='button' onClick={handleViewPlanOptions}>
											Learn More
										</PremiumPreviewButton>
									</PremiumPreviewFooter>
								</PremiumPreview>
							) : null}
						</RecommendationWrap>
					)}
				</>
			) : (
				<PromptRow>
					<PromptText>
						{showSetupPrompt
							? 'Setup is saved. Run a quick scan so Maintley can review the property record and highlight what is worth your attention.'
							: 'After setup, run a quick scan so Maintley can review the property record and highlight what is worth your attention.'}
					</PromptText>
				</PromptRow>
			)}
			{isRunningScan ? (
				<ScanLoadingOverlay aria-live='polite' role='status'>
					<ScanLoadingCard>
						<ScanLoadingHome aria-hidden='true'>
							<ScanLoadingRoof />
							<ScanLoadingHomeBody>
								<ScanLoadingBlock $delay='0s' $slot='one' />
								<ScanLoadingBlock $delay='0.14s' $slot='two' />
								<ScanLoadingBlock $delay='0.28s' $slot='three' />
								<ScanLoadingBlock $delay='0.42s' $slot='four' />
							</ScanLoadingHomeBody>
						</ScanLoadingHome>
						<ScanLoadingTitle>
							{scanProgressMessage || 'Reviewing this property record...'}
						</ScanLoadingTitle>
						<ScanLoadingList>
							<li>
								Reviewing {systems.length}{' '}
								{systems.length === 1 ? 'system' : 'systems'}
							</li>
							<li>Checking maintenance coverage</li>
							<li>Finding what is worth attention</li>
						</ScanLoadingList>
					</ScanLoadingCard>
				</ScanLoadingOverlay>
			) : null}
			<GenericModal
				isOpen={isQuickScanInfoOpen}
				title='How Property Quick Scan Works'
				onClose={() => setIsQuickScanInfoOpen(false)}
				compact>
				<QuickScanInfoBody>
					<QuickScanInfoLead>
						Maintley reviews the information you have saved about your property to
						identify opportunities to improve your records and reduce future
						maintenance surprises.
					</QuickScanInfoLead>
					<IntelligenceSource $tone='records'>
						<strong>Property Memory</strong>
						<span>
							Based on information that has not been recorded yet, such as install
							dates, overdue tasks, and maintenance history.
						</span>
					</IntelligenceSource>
					<IntelligenceSource $tone='knowledge'>
						<strong>Maintley Knowledge</strong>
						<span>
							Based on general maintenance knowledge for recognized asset types,
							such as filter details and recurring maintenance.
						</span>
					</IntelligenceSource>
					<IntelligenceSource $tone='history'>
						<strong>Property History</strong>
						<span>
							Based on patterns Maintley recognizes in your own recorded maintenance
							history.
						</span>
					</IntelligenceSource>
					<IntelligenceSource $tone='context'>
						<strong>Seasonal &amp; Context</strong>
						<span>
							Based on time of year, weather, or property location when that context
							is available.
						</span>
					</IntelligenceSource>
					<PlanExplanation>
						<strong>Your Plan</strong>
						<PlanName>{getPlanLabel(currentPlanId)}</PlanName>
						<span>
							{currentPlanId === 'homeowner'
								? 'Free includes Property Record recommendations. Homeowner+ adds Maintley Knowledge, history-based insights, and personalized context guidance.'
								: 'Your plan includes Property Records, Maintley Knowledge, history-based insights, and personalized context guidance.'}
						</span>
						{currentPlanId === 'homeowner' ? (
							<PlanUpgradeButton type='button' onClick={handleViewPlanOptions}>
								Explore Homeowner+
							</PlanUpgradeButton>
						) : null}
					</PlanExplanation>
					<QuickScanInfoNote>
						Maintley does not inspect your property or verify equipment condition.
						Recommendations are based only on recorded information and applicable
						knowledge.
					</QuickScanInfoNote>
				</QuickScanInfoBody>
			</GenericModal>
			{detailRecommendation ? (
				<GenericModal
					isOpen={Boolean(detailRecommendation)}
					title={getRecommendationDialogTitle(detailRecommendation)}
					onClose={() => setDetailRecommendation(null)}
					compact>
					<DetailDialogBody>
						<DetailCount>{detailAffectedCount ? detailAffectedLabel : 'No affected records listed'}</DetailCount>
						<DetailSection>
							<DetailSectionLabel>Why this matters</DetailSectionLabel>
							<DetailReason>{detailRecommendation.description}</DetailReason>
						</DetailSection>
						<DetailSection>
							<DetailSectionLabel>Why this appeared</DetailSectionLabel>
							<DetailReason>{detailRecommendation.reason}</DetailReason>
						</DetailSection>
						{detailRelatedSystems.length > 0 ? (
							<DetailList>
								{detailRelatedSystems.map((relatedSystem) => (
									<DetailRow key={relatedSystem.id}>
										<span>{getAssetDisplayName(relatedSystem)}</span>
										<DetailOpenButton
											type='button'
											onClick={() =>
												handleOpenRelatedSystem(
													detailRecommendation,
													relatedSystem,
												)
											}>
											Open
										</DetailOpenButton>
									</DetailRow>
								))}
							</DetailList>
						) : null}
						{detailRelatedTasks.length > 0 ? (
							<DetailList>
								{detailRelatedTasks.map((relatedTask) => (
									<DetailRow key={relatedTask.id}>
										<span>{relatedTask.title}</span>
										<DetailOpenButton
											type='button'
											onClick={() =>
												handleOpenRelatedTasks(detailRecommendation)
											}>
											Open Task
										</DetailOpenButton>
									</DetailRow>
								))}
							</DetailList>
						) : null}
					</DetailDialogBody>
				</GenericModal>
			) : null}
		</ScanPanel>
	);
};

const ScanPanel = styled.section`
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

const ScanHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 18px;

	@media (max-width: 720px) {
		flex-direction: column;
	}
`;

const ScanTitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`;

const ScanEyebrow = styled.div`
	color: #0f766e;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const ScanTitle = styled.h2`
	margin: 0;
	color: #172033;
	font-size: 22px;
	line-height: 1.2;
`;

const ScanText = styled.p`
	margin: 0;
	max-width: 760px;
	color: #475569;
	font-size: 14px;
	line-height: 1.55;
`;

const ScanMeta = styled.div`
	border-top: 1px solid #e2e8f0;
	padding-top: 10px;
	color: #64748b;
	font-size: 13px;
`;

const ScanActions = styled.div`
	display: flex;
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

const QuickScanEducation = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	border-left: 3px solid #0f766e;
	background: #f0fdfa;
	padding: 12px 14px;
	color: #134e4a;

	> div:first-child {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 13px;
		line-height: 1.45;
	}

	@media (max-width: 640px) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const EducationActions = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`;

const EducationButton = styled.button`
	border: 0;
	background: transparent;
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 700;
	padding: 4px 0;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}
`;

const EducationDismissButton = styled(EducationButton)`
	color: #475569;
	font-weight: 600;
`;

const QuickScanInfoBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const QuickScanInfoLead = styled.p`
	margin: 0;
	color: #334155;
	font-size: 14px;
	line-height: 1.55;
`;

const IntelligenceSource = styled.div<{
	$tone: 'records' | 'knowledge' | 'history' | 'context';
}>`
	border-left: 3px solid
		${({ $tone }) =>
		$tone === 'records'
			? '#16a34a'
			: $tone === 'knowledge'
				? '#2563eb'
				: $tone === 'history'
					? '#7c3aed'
					: '#ea580c'};
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

const PlanExplanation = styled.div`
	border-top: 1px solid #e2e8f0;
	padding-top: 14px;
	display: flex;
	flex-direction: column;
	gap: 4px;
	color: #475569;
	font-size: 13px;
	line-height: 1.5;

	strong {
		color: #172033;
		font-size: 14px;
	}
`;

const PlanName = styled.span`
	color: #0f766e;
	font-size: 15px;
	font-weight: 800;
`;

const PlanUpgradeButton = styled.button`
	align-self: flex-start;
	border: 1px solid #0f766e;
	border-radius: 8px;
	background: #0f766e;
	color: #ffffff;
	font-size: 13px;
	font-weight: 700;
	padding: 8px 11px;
	cursor: pointer;

	&:hover {
		background: #115e59;
	}

	&:focus-visible {
		outline: 2px solid #0f766e;
		outline-offset: 2px;
	}
`;

const QuickScanInfoNote = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 12px;
	line-height: 1.45;
`;

const PrimaryButton = styled.button`
	border: 0;
	border-radius: 8px;
	background: #16a34a;
	color: #ffffff;
	font-weight: 700;
	font-size: 14px;
	padding: 10px 14px;
	cursor: pointer;
	min-height: 40px;
	transition: all 0.2s ease;
	box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);

	&:hover {
		background: #15803d;
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(22, 163, 74, 0.3);
	}

	&:disabled {
		cursor: wait;
		opacity: 0.75;
		transform: none;
		box-shadow: none;
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}

	@media (max-width: 720px) {
		width: 100%;
	}
`;

const ScanLoadingOverlay = styled.div`
	position: fixed;
	inset: 0;
	z-index: 10002;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20px;
	background: rgba(15, 23, 42, 0.58);
`;

const ScanLoadingCard = styled.div`
	width: min(420px, 100%);
	border-radius: 18px;
	background: #ffffff;
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34);
	padding: 28px;
`;

const ScanLoadingHome = styled.div`
	position: relative;
	width: 72px;
	height: 62px;
	margin: 0 auto 18px;
`;

const ScanLoadingRoof = styled.div`
	position: absolute;
	left: 12px;
	top: 1px;
	width: 48px;
	height: 48px;
	background: #0f766e;
	transform: rotate(45deg);
	border-radius: 6px 6px 2px 6px;
	animation: property-scan-build-roof 1.8s ease-in-out infinite;

	@keyframes property-scan-build-roof {
		0%,
		34% {
			opacity: 0;
			transform: translateY(-16px) rotate(45deg) scale(0.88);
		}

		58%,
		86% {
			opacity: 1;
			transform: translateY(0) rotate(45deg) scale(1);
		}

		100% {
			opacity: 0.55;
			transform: translateY(0) rotate(45deg) scale(1);
		}
	}
`;

const ScanLoadingHomeBody = styled.div`
	position: absolute;
	left: 10px;
	bottom: 0;
	width: 52px;
	height: 38px;
	border-radius: 8px;
	background: #f0fdfa;
	border: 1px solid #99f6e4;
	overflow: hidden;
`;

const ScanLoadingBlock = styled.div<{
	$delay: string;
	$slot: 'one' | 'two' | 'three' | 'four';
}>`
	position: absolute;
	width: 19px;
	height: 13px;
	border-radius: 4px;
	background: #0f766e;
	left: ${({ $slot }) =>
		$slot === 'one' || $slot === 'three' ? '6px' : '27px'};
	top: ${({ $slot }) =>
		$slot === 'one' || $slot === 'two' ? '6px' : '21px'};
	animation: property-scan-build-block 1.8s ease-in-out infinite;
	animation-delay: ${({ $delay }) => $delay};
	transform-origin: center;

	@keyframes property-scan-build-block {
		0% {
			opacity: 0;
			transform: translateY(24px) scale(0.88);
		}

		28%,
		78% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}

		100% {
			opacity: 0.45;
			transform: translateY(0) scale(1);
		}
	}
`;

const ScanLoadingTitle = styled.div`
	color: #0f172a;
	font-size: 20px;
	font-weight: 900;
	line-height: 1.3;
	text-align: center;
`;

const ScanLoadingList = styled.ul`
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
		background: #0f766e;
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

const EmptyResult = styled.div`
	border: 1px solid #bbf7d0;
	border-radius: 8px;
	background: #f0fdf4;
	color: #166534;
	padding: 14px;
	font-size: 14px;
	line-height: 1.5;
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

const RecommendationWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

const RecommendationIntro = styled.div`
	color: #172033;
	font-size: 15px;
	font-weight: 700;
`;

const CategoryGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const CategoryTitle = styled.h3`
	margin: 0;
	color: #334155;
	font-size: 13px;
	font-weight: 800;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const RecommendationItem = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) auto;
	gap: 14px;
	align-items: start;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 14px;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`;

const RecommendationBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`;

const RecommendationTitleRow = styled.div`
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
		$severity === 'high' ? '#991b1b' : $severity === 'medium' ? '#92400e' : '#155e75'};
	background: ${({ $severity }) =>
		$severity === 'high' ? '#fee2e2' : $severity === 'medium' ? '#fef3c7' : '#cffafe'};
`;

const RecommendationTitle = styled.h4`
	margin: 0;
	color: #172033;
	font-size: 15px;
	line-height: 1.35;
`;

const SystemLine = styled.div`
	color: #0f766e;
	font-size: 13px;
	font-weight: 700;
`;

const RecommendationDescription = styled.p`
	margin: 0;
	color: #475569;
	font-size: 14px;
	line-height: 1.45;
`;

const RecommendationImpact = styled.p`
	margin: 0;
	color: #334155;
	font-size: 13px;
	font-weight: 600;
	line-height: 1.45;
`;

const AffectedHint = styled.div`
	color: #64748b;
	font-size: 13px;
`;

const EvidenceDetails = styled.details`
	margin-top: 2px;
	color: #475569;
	font-size: 13px;
	line-height: 1.45;

	&[open] {
		margin-top: 4px;
	}
`;

const EvidenceSummary = styled.summary`
	color: ${COLORS.primaryDark};
	cursor: pointer;
	font-weight: 700;
	list-style-position: inside;

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
		border-radius: 4px;
	}
`;

const EvidenceText = styled.p`
	margin: 6px 0 0;
	color: #475569;
`;

const EvidenceList = styled.ul`
	margin: 6px 0 0;
	padding-left: 18px;
	color: #334155;

	li {
		margin: 2px 0;
	}
`;

const RecommendationActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	justify-content: flex-end;

	@media (max-width: 760px) {
		justify-content: stretch;
	}
`;

const ActionButton = styled.button`
	border: 0;
	border-radius: 8px;
	background: #16a34a;
	color: #ffffff;
	font-size: 13px;
	font-weight: 700;
	padding: 9px 12px;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.2s ease;
	box-shadow: 0 4px 12px rgba(22, 163, 74, 0.22);

	&:hover {
		background: #15803d;
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(22, 163, 74, 0.28);
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}

	@media (max-width: 760px) {
		flex: 1 1 180px;
	}
`;

const DismissButton = styled.button`
	border: 1px solid ${COLORS.primary};
	border-radius: 8px;
	background: #ffffff;
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 700;
	padding: 9px 12px;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.2s ease;

	&:hover {
		background: ${COLORS.primaryLight};
		border-color: ${COLORS.primaryDark};
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}

	@media (max-width: 760px) {
		flex: 1 1 120px;
	}
`;

const ShowMoreButton = styled.button`
	align-self: flex-start;
	border: 1px solid ${COLORS.primary};
	border-radius: 8px;
	background: #ffffff;
	color: ${COLORS.primaryDark};
	font-size: 13px;
	font-weight: 800;
	padding: 9px 12px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: ${COLORS.primaryLight};
		border-color: ${COLORS.primaryDark};
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}
`;

const PremiumPreview = styled.section`
	border: 1px solid #bfdbfe;
	background: #eff6ff;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const PremiumPreviewEyebrow = styled.div`
	color: #1d4ed8;
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const PremiumPreviewTitle = styled.h4`
	margin: 0;
	color: #172033;
	font-size: 15px;
	line-height: 1.4;
`;

const PremiumPreviewText = styled.p`
	margin: 0;
	color: #334155;
	font-size: 13px;
	line-height: 1.5;
`;

const PremiumPreviewList = styled.ul`
	margin: 0;
	padding-left: 18px;
	color: #334155;
	font-size: 13px;
	line-height: 1.5;

	li + li {
		margin-top: 3px;
	}
`;

const PremiumPreviewFooter = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding-top: 4px;
	color: #1d4ed8;
	font-size: 13px;
	font-weight: 700;

	@media (max-width: 560px) {
		align-items: flex-start;
		flex-direction: column;
	}
`;

const PremiumPreviewButton = styled.button`
	border: 1px solid #2563eb;
	border-radius: 8px;
	background: #2563eb;
	color: #ffffff;
	font-size: 13px;
	font-weight: 700;
	padding: 8px 11px;
	cursor: pointer;

	&:hover {
		background: #1d4ed8;
	}

	&:focus-visible {
		outline: 2px solid #1d4ed8;
		outline-offset: 2px;
	}
`;

const DetailDialogBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

const DetailCount = styled.div`
	color: #172033;
	font-size: 16px;
	font-weight: 800;
`;

const DetailSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

const DetailSectionLabel = styled.div`
	color: #0f766e;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0;
	text-transform: uppercase;
`;

const DetailReason = styled.p`
	margin: 0;
	color: #475569;
	font-size: 14px;
	line-height: 1.5;
`;

const DetailList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

const DetailRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 10px;
	color: #334155;
	font-size: 14px;

	@media (max-width: 520px) {
		align-items: stretch;
		flex-direction: column;
	}
`;

const DetailOpenButton = styled.button`
	border: 0;
	border-radius: 8px;
	background: #16a34a;
	color: #ffffff;
	font-size: 13px;
	font-weight: 700;
	padding: 8px 10px;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.2s ease;
	box-shadow: 0 4px 12px rgba(22, 163, 74, 0.22);

	&:hover {
		background: #15803d;
		transform: translateY(-1px);
		box-shadow: 0 8px 18px rgba(22, 163, 74, 0.28);
	}

	&:focus-visible {
		outline: 2px solid ${COLORS.primary};
		outline-offset: 2px;
	}
`;
