import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { GenericModal } from '../Library';
import {
	PropertyScanSnapshot,
	useGetLatestPropertyScanSnapshotQuery,
	useSavePropertyScanSnapshotMutation,
} from '../../Redux/API/propertyIntelligenceSlice';
import { Device, Property } from '../../types/Property.types';
import { Task } from '../../types/Task.types';
import {
	getQuickPropertyScanRecommendations,
	PropertyScanActionType,
	PropertyScanCategory,
	PropertyScanRecommendation,
	runPropertyScanV1,
} from '../../utils/propertyIntelligenceScan';
import { RootState } from '../../Redux/store/store';

interface PropertyScanPanelProps {
	property: Property;
	systems: Device[];
	tasks: Task[];
	maintenanceHistory: any[];
	canRunScan: boolean;
	showSetupPrompt?: boolean;
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

const formatScanDate = (value?: string): string => {
	if (!value) return 'No scan run yet';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return 'No scan run yet';
	return parsed.toLocaleString();
};

const getQuickScanSummary = (recommendations: PropertyScanRecommendation[]) => ({
	active: recommendations.length,
	high: recommendations.filter((item) => item.severity === 'high').length,
	overdue: recommendations.filter((item) => item.category === 'Overdue Work').length,
});

const getSystemDisplayName = (system?: Device): string =>
	system
		? [system.brand, system.type, system.model].filter(Boolean).join(' ').trim() ||
		system.type ||
		'System record'
		: 'System record';

const getRecommendationDialogTitle = (
	recommendation: PropertyScanRecommendation,
): string => recommendation.title.replace(/\.$/, '');

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
	const [detailRecommendation, setDetailRecommendation] =
		useState<PropertyScanRecommendation | null>(null);
	const {
		data: persistedLatestScan,
		isLoading: isLoadingLatestScan,
	} = useGetLatestPropertyScanSnapshotQuery(property.id, {
		skip: !canRunScan || !property.id,
	});
	const [savePropertyScanSnapshot] = useSavePropertyScanSnapshotMutation();

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
		if (!isRunningScan) {
			setLastScanSnapshot(persistedLatestScan || null);
		}
	}, [isRunningScan, persistedLatestScan]);

	const displayedRecommendations = useMemo(() => {
		return (lastScanSnapshot?.recommendations || []).filter(
			(recommendation) =>
				recommendation.status !== 'dismissed' &&
				!dismissedIds.includes(recommendation.id),
		);
	}, [dismissedIds, lastScanSnapshot]);
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
			'Running Property Scan...',
			`Reviewing ${systems.length} ${systems.length === 1 ? 'system' : 'systems'}`,
			'Checking maintenance coverage',
			'Checking documentation completeness',
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
		);
		const nextSnapshot: PropertyScanSnapshot = {
			accountId,
			propertyId: property.id,
			scanType: 'quick_property_scan_v1',
			schemaVersion: 1,
			createdAt,
			updatedAt: createdAt,
			recommendations,
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

	const handleRecommendationPrimaryAction = (
		recommendation: PropertyScanRecommendation,
	) => {
		if (
			(recommendation.relatedSystemIds?.length || recommendation.relatedTaskIds?.length) &&
			recommendation.suggestedActionType === 'open_systems'
		) {
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
		onRecommendationAction('open_tasks', recommendation);
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
						Find the next few record updates and maintenance steps most worth
						your time, based only on what is saved in Maintley. This is not an
						inspection, condition assessment, safety certification, or property grade.
					</ScanText>
				</ScanTitleBlock>
				<ScanActions>
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
							<SummaryLabel>recommendations</SummaryLabel>
						</SummaryItem>
						<SummaryItem>
							<SummaryValue>{displayedSystemsReviewed}</SummaryValue>
							<SummaryLabel>systems reviewed</SummaryLabel>
						</SummaryItem>
						<SummaryItem>
							<SummaryValue>{displayedSummary.overdue}</SummaryValue>
							<SummaryLabel>overdue tasks</SummaryLabel>
						</SummaryItem>
					</SummaryGrid>

					{displayedRecommendations.length === 0 ? (
						<EmptyResult>
							Your saved property records do not show any immediate high-value
							opportunities from this scan.
						</EmptyResult>
					) : (
						<RecommendationWrap>
							<RecommendationIntro>
								Maintley Intelligence Snapshot
							</RecommendationIntro>
							{groupedRecommendations.map((group) => (
								<CategoryGroup key={group.category}>
									<CategoryTitle>{group.category}</CategoryTitle>
									{group.recommendations.map((recommendation) => {
										const system = recommendation.systemId
											? systems.find((item) => item.id === recommendation.systemId)
											: null;
										const systemLabel = system ? getSystemDisplayName(system) : '';
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

										return (
											<RecommendationItem key={recommendation.id}>
												<RecommendationBody>
													<RecommendationTitleRow>
														<SeverityPill $severity={recommendation.severity}>
															{recommendation.severity}
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
													{hasAffectedDetails ? (
														<DetailsButton
															type='button'
															onClick={() =>
																setDetailRecommendation(recommendation)
															}>
															View details
														</DetailsButton>
													) : null}
													{hasAffectedDetails ? (
														<AffectedHint>{affectedLabel}</AffectedHint>
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
														{recommendation.suggestedActionLabel}
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
							{hiddenRecommendationCount > 0 || showAllRecommendations ? (
								<ShowMoreButton
									type='button'
									onClick={() =>
										setShowAllRecommendations((currentValue) => !currentValue)
									}>
									{showAllRecommendations
										? 'Show Fewer'
										: `Show ${hiddenRecommendationCount} More`}
								</ShowMoreButton>
							) : null}
						</RecommendationWrap>
					)}
				</>
			) : (
				<PromptRow>
					<PromptText>
						{showSetupPrompt
							? 'Setup is saved. Run a quick scan to see practical next steps for this property record.'
							: 'After setup, run a quick scan to see practical next steps for this property record.'}
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
							{scanProgressMessage || 'Running Property Scan...'}
						</ScanLoadingTitle>
						<ScanLoadingList>
							<li>
								Reviewing {systems.length}{' '}
								{systems.length === 1 ? 'system' : 'systems'}
							</li>
							<li>Checking maintenance coverage</li>
							<li>Checking documentation completeness</li>
						</ScanLoadingList>
					</ScanLoadingCard>
				</ScanLoadingOverlay>
			) : null}
			{detailRecommendation ? (
				<GenericModal
					isOpen={Boolean(detailRecommendation)}
					title={getRecommendationDialogTitle(detailRecommendation)}
					onClose={() => setDetailRecommendation(null)}
					compact>
					<DetailDialogBody>
						<DetailCount>{detailAffectedCount ? detailAffectedLabel : 'No affected records listed'}</DetailCount>
						<DetailReason>{detailRecommendation.description}</DetailReason>
						{detailRelatedSystems.length > 0 ? (
							<DetailList>
								{detailRelatedSystems.map((relatedSystem) => (
									<DetailRow key={relatedSystem.id}>
										<span>{getSystemDisplayName(relatedSystem)}</span>
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
											Open Tasks
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

const PrimaryButton = styled.button`
	border: 0;
	border-radius: 8px;
	background: #0f766e;
	color: #ffffff;
	font-weight: 700;
	font-size: 14px;
	padding: 10px 14px;
	cursor: pointer;
	min-height: 40px;

	&:hover {
		background: #115e59;
	}

	&:disabled {
		cursor: wait;
		opacity: 0.75;
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

const DetailsButton = styled.button`
	align-self: flex-start;
	border: 0;
	background: none;
	color: #0f766e;
	font-size: 13px;
	font-weight: 800;
	padding: 0;
	cursor: pointer;

	&:hover {
		text-decoration: underline;
	}
`;

const AffectedHint = styled.div`
	color: #64748b;
	font-size: 13px;
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
	background: #172033;
	color: #ffffff;
	font-size: 13px;
	font-weight: 700;
	padding: 9px 12px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: #0f172a;
	}

	@media (max-width: 760px) {
		flex: 1 1 180px;
	}
`;

const DismissButton = styled.button`
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	background: #ffffff;
	color: #475569;
	font-size: 13px;
	font-weight: 700;
	padding: 9px 12px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: #f8fafc;
	}

	@media (max-width: 760px) {
		flex: 1 1 120px;
	}
`;

const ShowMoreButton = styled.button`
	align-self: flex-start;
	border: 1px solid #cbd5e1;
	border-radius: 8px;
	background: #ffffff;
	color: #334155;
	font-size: 13px;
	font-weight: 800;
	padding: 9px 12px;
	cursor: pointer;

	&:hover {
		background: #f8fafc;
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
	background: #172033;
	color: #ffffff;
	font-size: 13px;
	font-weight: 700;
	padding: 8px 10px;
	cursor: pointer;
	white-space: nowrap;

	&:hover {
		background: #0f172a;
	}
`;
