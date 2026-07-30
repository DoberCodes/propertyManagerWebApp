import { useEffect, useState } from 'react';
// Weather fetching disabled; external libs not required here.
import {
	Container,
	ZeroStateContainer,
	ViewButton,
	TipsContainer,
	TipsHeader,
	CardGrid,
	Card,
	CompactTeaser,
	CompactTeaserMain,
	CompactTeaserSide,
	CompactTeaserTitle,
	CompactTeaserSummary,
	CompactTeaserList,
	CompactTeaserMeta,
	CompactTeaserFooter,
	CompactPager,
	CompactActionButton,
	CompactSideActions,
	SnoozeButton,
	SnoozedEmptyState,
	CompactTopRow,
	CompactSeasonTag,
	CompactCardBody,
	OverlayBadge,
	PriorityPill,
	CardTitle,
	CardList,
	FooterRow,
	SmallBadge,
	Controls,
	PageBadge,
	CardImageWrapper,
} from './SeasonalMaintenance.styles';

import seasonalTipCards, { SeasonalCard } from '../data/seasonalTipCards';

// require.context is a webpack-only API. In Jest it is not available so we
// fall back to an empty module map so tests that import this component do not crash.
const tipImageContext: ((path: string) => string) | null = (() => {
	try {
		return (require as any).context(
			'../Assets/TipsImages',
			false,
			/\.(png|jpe?g|webp|avif)$/i,
		);
	} catch {
		return null;
	}
})();

const resolveTipImage = (imagePath?: string): string | null => {
	if (!imagePath) {
		return null;
	}

	if (imagePath.startsWith('/') || imagePath.startsWith('http')) {
		return imagePath;
	}

	const imageName = imagePath.split('/').pop();
	if (!imageName) {
		return null;
	}

	try {
		if (!tipImageContext) return null;
		return tipImageContext(`./${imageName}`);
	} catch {
		return null;
	}
};

const shuffleSeasonalCards = (cards: SeasonalCard[]) => {
	const shuffledCards = [...cards];
	for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		const currentCard = shuffledCards[index];
		shuffledCards[index] = shuffledCards[swapIndex];
		shuffledCards[swapIndex] = currentCard;
	}
	return shuffledCards;
};

interface SeasonalMaintenanceProps {
	location?: { latitude: number; longitude: number } | null;
	compact?: boolean;
	onAddTipAsTask?: (card: SeasonalCard) => void;
	getAddTipTaskState?: (card: SeasonalCard) => {
		disabled: boolean;
		label: string;
		helperText?: string;
	};
}

export const SeasonalMaintenance = ({
	location,
	compact = false,
	onAddTipAsTask,
	getAddTipTaskState,
}: SeasonalMaintenanceProps) => {
	const [cards, setCards] = useState<SeasonalCard[]>(seasonalTipCards);
	const [snoozedIds, setSnoozedIds] = useState<Set<string>>(() => {
		try {
			const raw = localStorage.getItem('seasonal_tips_snoozed');
			if (!raw) return new Set();
			const parsed: Record<string, number> = JSON.parse(raw);
			const now = Date.now();
			const active: Record<string, number> = {};
			const activeIds: string[] = [];
			for (const [id, expiry] of Object.entries(parsed)) {
				if (expiry > now) {
					active[id] = expiry;
					activeIds.push(id);
				}
			}
			// Prune expired entries from storage
			if (Object.keys(active).length !== Object.keys(parsed).length) {
				localStorage.setItem('seasonal_tips_snoozed', JSON.stringify(active));
			}
			return new Set(activeIds);
		} catch {
			return new Set();
		}
	});

	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [pageIndex, setPageIndex] = useState<number>(0);
	const [cardsPerPage, setCardsPerPage] = useState<number>(3);

	useEffect(() => {
		setCards(shuffleSeasonalCards(seasonalTipCards));
		setPageIndex(0);
		setLoading(false);
		setError(null);
	}, [location]);

	const getCurrentSeason = (): 'spring' | 'summer' | 'fall' | 'winter' => {
		const month = new Date().getMonth(); // 0-based
		if (month >= 2 && month <= 4) return 'spring';  // Mar–May
		if (month >= 5 && month <= 7) return 'summer';  // Jun–Aug
		if (month >= 8 && month <= 10) return 'fall';   // Sep–Nov
		return 'winter';                                 // Dec–Feb
	};

	// Returns the urgency level for the timing text, if any
	const getTimingUrgency = (card: SeasonalCard): 'warning' | 'danger' | undefined => {
		const phase = getSeasonPhase();
		if (card.priorityLevel === 'high' && phase === 1) return 'warning';
		if (card.priorityLevel === 'high' && phase === 2) return 'danger';
		return undefined;
	};

	// Returns how far into the current season we are: 0 = early, 1 = mid, 2 = late
	const getSeasonPhase = (): 0 | 1 | 2 => {
		const month = new Date().getMonth();
		// Each season spans 3 months; find position within that span
		const seasonStart: Record<string, number> = { spring: 2, summer: 5, fall: 8, winter: 11 };
		const season = getCurrentSeason();
		const start = seasonStart[season];
		const offset = ((month - start) + 12) % 12; // 0, 1, or 2
		return offset as 0 | 1 | 2;
	};

	const getTimingText = (card: SeasonalCard): string => {
		const season = card.season ?? getCurrentSeason();
		const seasonLabel = season.charAt(0).toUpperCase() + season.slice(1);
		const phase = getSeasonPhase();

		if (card.priorityLevel === 'high') {
			if (phase === 0) return `Take care of this early in ${seasonLabel}.`;
			if (phase === 1) return `This is overdue — tackle it this week.`;
			return `Don't delay — ${seasonLabel} is almost over.`;
		}
		if (card.priorityLevel === 'medium') {
			if (phase === 0) return `Schedule this sometime this ${seasonLabel}.`;
			if (phase === 1) return `Good time to get this done now.`;
			return `Fit this in before ${seasonLabel} ends.`;
		}
		// low
		if (phase === 2) return `Wrap this up before ${seasonLabel} ends.`;
		return `Add this to your ${seasonLabel} checklist.`;
	};

	const getSeasonEnd = (): number => {
		const now = new Date();
		const year = now.getFullYear();
		const season = getCurrentSeason();
		// Return midnight on the first day after the season ends
		const ends: Record<string, Date> = {
			spring: new Date(year, 5, 1),   // Jun 1
			summer: new Date(year, 8, 1),   // Sep 1
			fall: new Date(year, 11, 1),  // Dec 1
			winter: new Date(year + (now.getMonth() >= 11 ? 1 : 0), 2, 1), // Mar 1
		};
		return ends[season].getTime();
	};

	const snoozeTip = (card: SeasonalCard) => {
		const id = card.id;
		const expiry = getSeasonEnd();
		try {
			const raw = localStorage.getItem('seasonal_tips_snoozed');
			const parsed: Record<string, number> = raw ? JSON.parse(raw) : {};
			parsed[id] = expiry;
			localStorage.setItem('seasonal_tips_snoozed', JSON.stringify(parsed));
		} catch { /* storage unavailable — degrade gracefully */ }
		setSnoozedIds((prev) => new Set([...prev, id]));
		// Advance to next tip so the card doesn't just go blank
		setPageIndex((p) => (p + 1) % Math.max(1, pages));
	};

	const unsnoozeAll = () => {
		try {
			const raw = localStorage.getItem('seasonal_tips_snoozed');
			if (raw) {
				const parsed: Record<string, number> = JSON.parse(raw);
				// Remove only current-season tip IDs
				const currentSeasonIds = new Set(
					seasonalTipCards
						.filter((c) => !c.season || c.season === currentSeason)
						.map((c) => c.id),
				);
				for (const id of currentSeasonIds) delete parsed[id];
				localStorage.setItem('seasonal_tips_snoozed', JSON.stringify(parsed));
			}
		} catch { /* degrade gracefully */ }
		setSnoozedIds(new Set());
		setPageIndex(0);
	};

	const currentSeason = getCurrentSeason();
	const effectiveCards = cards.filter(
		(card) => (!card.season || card.season === currentSeason) && !snoozedIds.has(card.id),
	);

	const pages = Math.max(1, Math.ceil(effectiveCards.length / cardsPerPage));
	const visibleCards = effectiveCards.slice(
		pageIndex * cardsPerPage,
		pageIndex * cardsPerPage + cardsPerPage,
	);
	const renderedCards = compact ? visibleCards.slice(0, 1) : visibleCards;

	// keep pageIndex in range when pages change
	useEffect(() => {
		setPageIndex((p) => Math.min(p, Math.max(0, pages - 1)));
	}, [pages]);

	const prevPage = () => setPageIndex((p) => (p - 1 + pages) % pages);
	const nextPage = () => setPageIndex((p) => (p + 1) % pages);

	// responsive cards per page
	useEffect(() => {
		const update = () => {
			const w = window.innerWidth;
			if (compact) {
				setCardsPerPage(1);
				return;
			}
			// responsive: 1 on small, 3 on medium, 4 on large desktop
			if (w < 900) setCardsPerPage(1);
			else if (w < 1200) setCardsPerPage(2);
			else if (w < 2000) setCardsPerPage(3);
			else setCardsPerPage(4);
		};
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [compact]);

	return (
		<Container>
			{loading && (
				<ZeroStateContainer>
					<span>⏳</span>
					<p>Loading recommendations...</p>
				</ZeroStateContainer>
			)}
			{error && !cards.length && (
				<ZeroStateContainer>
					<span>⚠️</span>
					<p>Unable to load recommendations</p>
				</ZeroStateContainer>
			)}
			{!loading && cards.length > 0 && (
				<TipsContainer $compact={compact}>
					<TipsHeader>
						{compact ? 'Seasonal Maintenance' : 'Seasonal Maintenance Tips'}
					</TipsHeader>
					{compact ? (effectiveCards.length === 0 ? (
						<SnoozedEmptyState>
							<p>
								You've snoozed all{' '}
								{currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}{' '}
								tips. They'll return next season.
							</p>
							<button onClick={unsnoozeAll}>Unsnooze all</button>
						</SnoozedEmptyState>
					) : (renderedCards.map((card, idx) => {
						const priorityText =
							card.priorityLevel === 'high'
								? 'High Priority'
								: card.priorityLevel === 'medium'
									? 'Medium Priority'
									: 'Low Priority';

						const categoryText = card.riskCategory
							? `${card.riskCategory
								.charAt(0)
								.toUpperCase()}${card.riskCategory.slice(1)} Risk`
							: '';
						const serviceText =
							card.serviceLevel === 'professional'
								? 'Professional'
								: card.serviceLevel === 'moderate'
									? 'DIY — Moderate'
									: 'DIY — Basic';
						const taskActionState = getAddTipTaskState?.(card) || {
							disabled: false,
							label: 'Add as Task',
							helperText: 'Create a prefilled task from this tip.',
						};

						return (
							<CompactTeaser key={card.id || `${pageIndex}-${idx}`}>
								<CompactTeaserMain>
									<CompactTopRow>
										<CompactSeasonTag>
											{card.season &&
												card.season.charAt(0).toUpperCase() + card.season.slice(1)}
											{categoryText ? ` • ${categoryText}` : ''}
										</CompactSeasonTag>
										<PriorityPill
											level={
												card.priorityLevel === 'high'
													? 'High'
													: card.priorityLevel === 'medium'
														? 'Moderate'
														: 'Low'
											}
											$season={card.season}>
											{priorityText}
										</PriorityPill>
									</CompactTopRow>
									<CompactTeaserTitle>{card.title}</CompactTeaserTitle>
									<CompactTeaserSummary>
										{card.bullets[0] || 'Stay ahead of seasonal maintenance.'}
									</CompactTeaserSummary>
									<CompactTeaserList>
										{card.bullets.slice(1, 3).map((bullet, bulletIndex) => (
											<li key={bulletIndex}>{bullet}</li>
										))}
									</CompactTeaserList>
									<CompactTeaserFooter>
										<CompactPager>
											<ViewButton onClick={prevPage}>Previous Tip</ViewButton>
											<PageBadge>
												{pageIndex + 1} / {pages}
											</PageBadge>
											<ViewButton onClick={nextPage}>Next Tip</ViewButton>
										</CompactPager>
									</CompactTeaserFooter>
								</CompactTeaserMain>
								<CompactTeaserSide>
									<SmallBadge>{serviceText}</SmallBadge>
									<CompactTeaserMeta $urgency={getTimingUrgency(card)}>{getTimingText(card)}</CompactTeaserMeta>
									{taskActionState.helperText && (
										<CompactTeaserMeta>{taskActionState.helperText}</CompactTeaserMeta>
									)}
									{onAddTipAsTask && (
										<CompactSideActions>
											<CompactActionButton
												disabled={taskActionState.disabled}
												onClick={() => onAddTipAsTask(card)}>
												{taskActionState.label}
											</CompactActionButton>
											{!taskActionState.disabled && (
												<SnoozeButton onClick={() => snoozeTip(card)}>
													Snooze for season
												</SnoozeButton>
											)}
										</CompactSideActions>
									)}
								</CompactTeaserSide>
							</CompactTeaser>
						);
					})
					)
					) : (
						<CardGrid $compact={compact}>
							{renderedCards.map((card, idx) => {
								const imageSrc = resolveTipImage(card.image);

								const priorityText =
									card.priorityLevel === 'high'
										? 'High Priority'
										: card.priorityLevel === 'medium'
											? 'Medium Priority'
											: 'Low Priority';

								const categoryText = card.riskCategory
									? `${card.riskCategory
										.charAt(0)
										.toUpperCase()}${card.riskCategory.slice(1)} Risk`
									: '';
								const serviceText =
									card.serviceLevel === 'professional'
										? 'Professional'
										: card.serviceLevel === 'moderate'
											? 'DIY — Moderate'
											: 'DIY — Basic';

								return (
									<Card key={card.id || `${pageIndex}-${idx}`} $compact={compact}>
										{!compact && (
											<CardImageWrapper $compact={compact}>
												<img
													src={
														imageSrc ||
														'https://via.placeholder.com/600x300?text=No+Image'
													}
													alt={card.title}
												/>
												<OverlayBadge $season={card.season}>
													<div
														style={{
															display: 'flex',
															gap: 10,
															alignItems: 'center',
														}}>
														<span style={{ fontSize: 13, fontWeight: 700 }}>
															{card.season &&
																card.season.charAt(0).toUpperCase() +
																card.season.slice(1)}
														</span>
														{categoryText && (
															<span
																style={{
																	opacity: 0.9,
																	fontSize: 13,
																}}>{` • ${categoryText}`}</span>
														)}
													</div>
													<PriorityPill
														level={
															card.priorityLevel === 'high'
																? 'High'
																: card.priorityLevel === 'medium'
																	? 'Moderate'
																	: 'Low'
														}
														$season={card.season}>
														{priorityText}
													</PriorityPill>
												</OverlayBadge>
											</CardImageWrapper>
										)}
										<CompactCardBody $compact={compact}>
											{compact && (
												<CompactTopRow>
													<CompactSeasonTag>
														{card.season &&
															card.season.charAt(0).toUpperCase() + card.season.slice(1)}
														{categoryText ? ` • ${categoryText}` : ''}
													</CompactSeasonTag>
													<PriorityPill
														level={
															card.priorityLevel === 'high'
																? 'High'
																: card.priorityLevel === 'medium'
																	? 'Moderate'
																	: 'Low'
														}
														$season={card.season}>
														{priorityText}
													</PriorityPill>
												</CompactTopRow>
											)}
											<CardTitle $compact={compact}>{card.title}</CardTitle>
											<CardList $compact={compact}>
												{card.bullets.map((b, i) => (
													compact && i > 1 ? null : (
														<li key={i}>{b}</li>
													)
												))}
											</CardList>
										</CompactCardBody>
										<FooterRow $season={card.season} $compact={compact}>
											<SmallBadge>{serviceText}</SmallBadge>
										</FooterRow>
									</Card>
								);
							})}
						</CardGrid>
					)}
					{!compact && (
						<Controls $compact={compact}>
							<ViewButton onClick={prevPage}>◀ Prev</ViewButton>
							<PageBadge>
								{pageIndex + 1} / {pages}
							</PageBadge>
							<ViewButton onClick={nextPage}>Next ▶</ViewButton>
						</Controls>
					)}
				</TipsContainer>
			)}
		</Container>
	);
};
