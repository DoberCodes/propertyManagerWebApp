import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faArrowRight,
	faBookOpen,
	faBell,
	faCheckCircle,
	faCircleQuestion,
	faClock,
	faEnvelope,
	faFileLines,
	faHeadset,
	faHouse,
	faLayerGroup,
	faNewspaper,
	faPaperPlane,
	faRotate,
	faScrewdriverWrench,
	faTicket,
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'Redux/store/store';
import { GenericModal } from 'Components/Library';
import { FeedbackForm } from 'Components/FeedbackForm';
import { useGetMyFeedbackTicketsQuery, MyFeedbackTicket } from 'Redux/API/apiSlice';
import { hasMaintleyAdminAccess } from 'utils/maintleyRole';
import { COLORS } from '../../constants/colors';
import {
	ActionArrow,
	ActionCard,
	ActionContent,
	ActionGrid,
	ActionIcon,
	ActionText,
	ActionTitle,
	ArticleArrow,
	ArticleCard,
	ArticleDescription,
	ArticleGrid,
	ArticleIcon,
	ArticleReadTime,
	ArticleSummary,
	ArticleSummaryCopy,
	ArticleTitle,
	Checklist,
	ContentGrid,
	EmptyState,
	ErrorState,
	Eyebrow,
	FaqItem,
	FaqList,
	FilterButton,
	FilterGroup,
	Hero,
	HeroButton,
	HeroCopy,
	HeroText,
	HeroTitle,
	InlineLink,
	Metric,
	MetricLabel,
	Metrics,
	MetricValue,
	Panel,
	PanelHeader,
	PanelText,
	PanelTitle,
	Portal,
	PortalNav,
	PortalNavButton,
	RefreshButton,
	StatusBadge,
	SupportDetail,
	SupportDetails,
	TextButton,
	TicketBody,
	TicketCard,
	TicketDate,
	TicketList,
	TicketMeta,
	TicketMetaGrid,
	TicketNumber,
	TicketSection,
	TicketSubject,
	TicketSummary,
	TicketSummaryCopy,
	TicketToolbar,
	UpdateItem,
	UpdateList,
	UpdateMeta,
	UpdatesPanel,
	UpdateText,
	UpdateTitle,
	VersionBadge,
} from './SupportPage.styles';
import {
	bugReportChecklist,
	helpfulArticles,
	recentMaintleyUpdates,
	supportFaqItems,
	supportKnownIssues,
} from './SupportContent';

type SupportView = 'overview' | 'requests' | 'help';
type TicketFilter = 'open' | 'closed';

const SUPPORT_UPDATE_PREVIEW_LIMIT = 5;

const normalizeStatus = (value?: string) =>
	String(value || '')
		.toLowerCase()
		.replaceAll(' ', '_')
		.trim();

const isClosedTicket = (ticket: MyFeedbackTicket): boolean => {
	const status = normalizeStatus(ticket.status);
	const publicStatus = normalizeStatus(ticket.publicStatus);
	return (
		status === 'closed' ||
		publicStatus === 'closed' ||
		Boolean(ticket.closedAt)
	);
};

const getDisplayStatus = (ticket: MyFeedbackTicket): string => {
	if (isClosedTicket(ticket)) return 'Closed';
	const status = normalizeStatus(ticket.status);
	const publicStatus = normalizeStatus(ticket.publicStatus);
	if (status === 'resolved' || publicStatus === 'testing' || publicStatus === 'fixed') {
		return 'Testing Fix';
	}
	const displayStatus = ticket.publicStatus || ticket.status || 'Received';
	return String(displayStatus)
		.replaceAll('_', ' ')
		.replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatType = (value?: string): string =>
	String(value || 'feedback')
		.replaceAll('_', ' ')
		.replace(/\b\w/g, (character) => character.toUpperCase());

const formatDate = (value?: string): string => {
	if (!value) return 'Not available';
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return value;
	return parsed.toLocaleString();
};

const ensureAbsoluteUrl = (value?: string): string | null => {
	const raw = String(value || '').trim();
	if (!raw) return null;
	if (/^https?:\/\//i.test(raw)) return raw;
	if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(raw)) return `https://${raw}`;
	return null;
};

const renderLinkedText = (value?: string): React.ReactNode => {
	const text = String(value || '');
	if (!text) return null;

	const urlRegex =
		/(https?:\/\/[^\s)]+|(?:[\w-]+\.)+[\w-]{2,}(?:\/[^\s)]*)?)/gi;
	const parts: React.ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	let keyIndex = 0;

	while ((match = urlRegex.exec(text)) !== null) {
		const matched = match[0];
		if (match.index > lastIndex) {
			parts.push(text.slice(lastIndex, match.index));
		}
		const href = ensureAbsoluteUrl(matched);
		parts.push(
			href ? (
				<a
					key={`support-link-${keyIndex++}`}
					href={href}
					target='_blank'
					rel='noopener noreferrer'>
					{matched}
				</a>
			) : (
				matched
			),
		);
		lastIndex = match.index + matched.length;
	}

	if (lastIndex < text.length) parts.push(text.slice(lastIndex));
	return parts.length > 0 ? parts : text;
};

const getLatestCustomerNote = (ticket: MyFeedbackTicket) =>
	Array.isArray(ticket.adminNotes)
		? [...ticket.adminNotes]
				.filter(
					(note) => normalizeStatus(note?.visibility) === 'customer',
				)
				.sort(
					(a, b) =>
						new Date(b.createdAt || b.date || 0).getTime() -
						new Date(a.createdAt || a.date || 0).getTime(),
				)[0]
		: undefined;

export const getArticleIcon = (articleSlug: string) => {
	switch (articleSlug) {
		case 'build-a-useful-property-record':
			return faHouse;
		case 'how-tasks-become-maintenance-history':
			return faCheckCircle;
		case 'track-appliances-and-home-systems':
			return faScrewdriverWrench;
		case 'keep-property-documents-organized':
			return faFileLines;
		case 'set-up-maintenance-reminders':
			return faBell;
		case 'organize-properties-with-groups':
			return faLayerGroup;
		default:
			return faBookOpen;
	}
};

export const SupportPage: React.FC = () => {
	const navigate = useNavigate();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [searchParams, setSearchParams] = useSearchParams();
	const requestedView = searchParams.get('view');
	const activeView: SupportView =
		requestedView === 'requests' || requestedView === 'help'
			? requestedView
			: 'overview';
	const [ticketFilter, setTicketFilter] = useState<TicketFilter>('open');
	const [showRequestModal, setShowRequestModal] = useState(
		searchParams.get('action') === 'new',
	);

	const {
		data: tickets = [],
		isLoading,
		isFetching,
		error,
		refetch,
	} = useGetMyFeedbackTicketsQuery({ limit: 50 });

	const openTickets = useMemo(
		() => tickets.filter((ticket) => !isClosedTicket(ticket)),
		[tickets],
	);
	const closedTickets = useMemo(
		() => tickets.filter(isClosedTicket),
		[tickets],
	);
	const filteredTickets =
		ticketFilter === 'open' ? openTickets : closedTickets;
	const recentTickets = useMemo(
		() =>
			[...tickets]
				.sort(
					(a, b) =>
						new Date(b.updatedAt || b.createdAt || 0).getTime() -
						new Date(a.updatedAt || a.createdAt || 0).getTime(),
				)
				.slice(0, 3),
		[tickets],
	);
	const visibleMaintleyUpdates = recentMaintleyUpdates.slice(
		0,
		SUPPORT_UPDATE_PREVIEW_LIMIT,
	);
	const canAccessAdmin = hasMaintleyAdminAccess(
		currentUser?.maintley_role ?? null,
	);

	const setView = (view: SupportView) => {
		setSearchParams(view === 'overview' ? {} : { view });
	};

	const openRequestModal = () => {
		setShowRequestModal(true);
		const next = new URLSearchParams(searchParams);
		next.set('action', 'new');
		setSearchParams(next, { replace: true });
	};

	const closeRequestModal = () => {
		setShowRequestModal(false);
		const next = new URLSearchParams(searchParams);
		next.delete('action');
		setSearchParams(next, { replace: true });
		void refetch();
	};

	const renderTicket = (ticket: MyFeedbackTicket) => {
		const closed = isClosedTicket(ticket);
		const latestNote = getLatestCustomerNote(ticket);
		const displayNumber =
			ticket.ticketNumber || `Ticket ${ticket.id.slice(-6).toUpperCase()}`;

		return (
			<TicketCard key={ticket.id}>
				<TicketSummary>
					<TicketSummaryCopy>
						<TicketNumber>{displayNumber}</TicketNumber>
						<TicketSubject>{ticket.subject || 'Support request'}</TicketSubject>
						<TicketDate>
							Updated {formatDate(ticket.updatedAt || ticket.createdAt)}
						</TicketDate>
					</TicketSummaryCopy>
					<StatusBadge $closed={closed}>{getDisplayStatus(ticket)}</StatusBadge>
				</TicketSummary>
				<TicketBody>
					<TicketMetaGrid>
						<TicketMeta>
							<span>Type</span>
							<strong>{formatType(ticket.type)}</strong>
						</TicketMeta>
						<TicketMeta>
							<span>Submitted</span>
							<strong>{formatDate(ticket.createdAt)}</strong>
						</TicketMeta>
						<TicketMeta>
							<span>Last updated</span>
							<strong>{formatDate(ticket.updatedAt || ticket.createdAt)}</strong>
						</TicketMeta>
					</TicketMetaGrid>
					<TicketSection>
						<h3>Your message</h3>
						<p>{renderLinkedText(ticket.message)}</p>
					</TicketSection>
					{latestNote ? (
						<TicketSection $highlight>
							<h3>
								Latest Maintley update ·{' '}
								{formatDate(latestNote.createdAt || latestNote.date)}
							</h3>
							<p>{renderLinkedText(latestNote.note)}</p>
						</TicketSection>
					) : null}
					{ticket.attachments?.length ? (
						<TicketSection>
							<h3>Attachments</h3>
							<ul>
								{ticket.attachments.map((attachment, index) => {
									const href = ensureAbsoluteUrl(attachment.attachmentUrl);
									const label =
										attachment.filename || `Attachment ${index + 1}`;
									return (
										<li key={`${ticket.id}-attachment-${index}`}>
											{href ? (
												<a
													href={href}
													target='_blank'
													rel='noopener noreferrer'>
													{label}
												</a>
											) : (
												label
											)}
										</li>
									);
								})}
							</ul>
						</TicketSection>
					) : null}
				</TicketBody>
			</TicketCard>
		);
	};

	return (
		<Portal>
			<Hero>
				<HeroCopy>
					<Eyebrow>
						<FontAwesomeIcon icon={faHeadset} />
						Maintley Support
					</Eyebrow>
					<HeroTitle>How can we help?</HeroTitle>
					<HeroText>
						Find answers, send feedback, report a problem, and follow your
						requests from one place.
					</HeroText>
				</HeroCopy>
				<HeroButton type='button' onClick={openRequestModal}>
					<FontAwesomeIcon icon={faPaperPlane} />
					New support request
				</HeroButton>
			</Hero>

			<PortalNav aria-label='Support Center'>
				<PortalNavButton
					type='button'
					$active={activeView === 'overview'}
					onClick={() => setView('overview')}>
					<FontAwesomeIcon icon={faHeadset} />
					Overview
				</PortalNavButton>
				<PortalNavButton
					type='button'
					$active={activeView === 'requests'}
					onClick={() => setView('requests')}>
					<FontAwesomeIcon icon={faTicket} />
					My requests
				</PortalNavButton>
				<PortalNavButton
					type='button'
					$active={activeView === 'help'}
					onClick={() => setView('help')}>
					<FontAwesomeIcon icon={faCircleQuestion} />
					Guides & FAQs
				</PortalNavButton>
			</PortalNav>

			{activeView === 'overview' ? (
				<>
					<ActionGrid>
						<ActionCard type='button' onClick={openRequestModal}>
							<ActionIcon>
								<FontAwesomeIcon icon={faPaperPlane} />
							</ActionIcon>
							<ActionContent>
								<ActionTitle>Start a request</ActionTitle>
								<ActionText>
									Report a problem, suggest an improvement, or ask for help.
								</ActionText>
							</ActionContent>
							<ActionArrow>
								<FontAwesomeIcon icon={faArrowRight} />
							</ActionArrow>
						</ActionCard>
						<ActionCard type='button' onClick={() => setView('requests')}>
							<ActionIcon>
								<FontAwesomeIcon icon={faTicket} />
							</ActionIcon>
							<ActionContent>
								<ActionTitle>Track your requests</ActionTitle>
								<ActionText>
									Review statuses and the latest updates from Maintley.
								</ActionText>
							</ActionContent>
							<ActionArrow>
								<FontAwesomeIcon icon={faArrowRight} />
							</ActionArrow>
						</ActionCard>
						<ActionCard type='button' onClick={() => setView('help')}>
							<ActionIcon>
								<FontAwesomeIcon icon={faBookOpen} />
							</ActionIcon>
							<ActionContent>
								<ActionTitle>Find an answer</ActionTitle>
								<ActionText>
									Browse Maintley Guides and common questions.
								</ActionText>
							</ActionContent>
							<ActionArrow>
								<FontAwesomeIcon icon={faArrowRight} />
							</ActionArrow>
						</ActionCard>
					</ActionGrid>

					<ContentGrid>
						<Panel>
							<PanelHeader>
								<div>
									<PanelTitle>Recent requests</PanelTitle>
									<PanelText>Your latest conversations with Maintley.</PanelText>
								</div>
								<TextButton type='button' onClick={() => setView('requests')}>
									View all
								</TextButton>
							</PanelHeader>
							{isLoading ? (
								<EmptyState>
									<FontAwesomeIcon icon={faRotate} spin />
									<h3>Loading requests</h3>
								</EmptyState>
							) : error ? (
								<ErrorState>
									<h3>We could not load your requests</h3>
									<p>Please refresh and try again.</p>
								</ErrorState>
							) : recentTickets.length ? (
								<TicketList>{recentTickets.map(renderTicket)}</TicketList>
							) : (
								<EmptyState>
									<FontAwesomeIcon icon={faTicket} />
									<h3>No requests yet</h3>
									<p>Your support and feedback requests will appear here.</p>
								</EmptyState>
							)}
						</Panel>

						<Panel>
							<PanelHeader>
								<div>
									<PanelTitle>Request summary</PanelTitle>
									<PanelText>A quick look at your support history.</PanelText>
								</div>
							</PanelHeader>
							<Metrics>
								<Metric>
									<MetricValue>{openTickets.length}</MetricValue>
									<MetricLabel>Open requests</MetricLabel>
								</Metric>
								<Metric>
									<MetricValue>{closedTickets.length}</MetricValue>
									<MetricLabel>Closed requests</MetricLabel>
								</Metric>
							</Metrics>
							<SupportDetails style={{ marginTop: 18 }}>
								<SupportDetail>
									<FontAwesomeIcon icon={faClock} />
									<div>
										<strong>Typical review time</strong>
										Most requests are reviewed within 24–48 hours.
									</div>
								</SupportDetail>
								<SupportDetail>
									<FontAwesomeIcon icon={faEnvelope} />
									<div>
										<strong>Account access trouble?</strong>
										Email{' '}
										<InlineLink href='mailto:maintleyapp@gmail.com?subject=Maintley%20Account%20Support'>
											maintleyapp@gmail.com
										</InlineLink>
									</div>
								</SupportDetail>
								{canAccessAdmin ? (
									<SupportDetail>
										<FontAwesomeIcon icon={faHeadset} />
										<div>
											<strong>Maintley administrator</strong>
											<TextButton type='button' onClick={() => navigate('/admin')}>
												Open the admin inbox
											</TextButton>
										</div>
									</SupportDetail>
								) : null}
							</SupportDetails>
						</Panel>
					</ContentGrid>

					<UpdatesPanel>
						<PanelHeader>
							<div>
								<PanelTitle>Feature & major updates</PanelTitle>
								<PanelText>
									Meaningful new capabilities and major experience changes.
								</PanelText>
							</div>
							<FontAwesomeIcon icon={faNewspaper} color={COLORS.primary} />
						</PanelHeader>
						<UpdateList>
							{visibleMaintleyUpdates.map((update) => (
								<UpdateItem key={update.version}>
									<UpdateMeta>
										<VersionBadge>v{update.version}</VersionBadge>
										<span>{update.type}</span>
										<span>{update.date}</span>
									</UpdateMeta>
									<UpdateTitle>{update.title}</UpdateTitle>
									<UpdateText>{update.description}</UpdateText>
								</UpdateItem>
							))}
						</UpdateList>
					</UpdatesPanel>
				</>
			) : null}

			{activeView === 'requests' ? (
				<Panel>
					<PanelHeader>
						<div>
							<PanelTitle>My requests</PanelTitle>
							<PanelText>
								Open a request to read its details and the latest Maintley update.
							</PanelText>
						</div>
						<TextButton type='button' onClick={openRequestModal}>
							New request
						</TextButton>
					</PanelHeader>
					<TicketToolbar>
						<FilterGroup>
							<FilterButton
								type='button'
								$active={ticketFilter === 'open'}
								onClick={() => setTicketFilter('open')}>
								Open ({openTickets.length})
							</FilterButton>
							<FilterButton
								type='button'
								$active={ticketFilter === 'closed'}
								onClick={() => setTicketFilter('closed')}>
								Closed ({closedTickets.length})
							</FilterButton>
						</FilterGroup>
						<RefreshButton
							type='button'
							$refreshing={isFetching}
							onClick={() => void refetch()}>
							<FontAwesomeIcon icon={faRotate} />
							Refresh
						</RefreshButton>
					</TicketToolbar>
					{isLoading ? (
						<EmptyState>
							<FontAwesomeIcon icon={faRotate} spin />
							<h3>Loading requests</h3>
						</EmptyState>
					) : error ? (
						<ErrorState>
							<h3>We could not load your requests</h3>
							<p>Please refresh and try again.</p>
						</ErrorState>
					) : filteredTickets.length ? (
						<TicketList>{filteredTickets.map(renderTicket)}</TicketList>
					) : (
						<EmptyState>
							<FontAwesomeIcon
								icon={ticketFilter === 'closed' ? faCheckCircle : faTicket}
							/>
							<h3>
								No {ticketFilter === 'open' ? 'open' : 'closed'} requests
							</h3>
							<p>
								{ticketFilter === 'open'
									? 'When you contact Maintley, your active requests will appear here.'
									: 'Resolved requests will remain here for your records.'}
							</p>
						</EmptyState>
					)}
				</Panel>
			) : null}

			{activeView === 'help' ? (
				<div style={{ display: 'grid', gap: 18 }}>
					<Panel>
						<PanelHeader>
							<div>
								<PanelTitle>Maintley Guides</PanelTitle>
								<PanelText>
									Step-by-step Maintley Guides for building better property records.
								</PanelText>
							</div>
							<TextButton
								type='button'
								onClick={() => navigate('/support/articles')}>
								View all guides
							</TextButton>
						</PanelHeader>
						<ArticleGrid>
							{helpfulArticles.slice(0, 4).map((article) => (
								<ArticleCard
									key={article.slug}
									type='button'
									onClick={() =>
										navigate(`/support/articles/${article.slug}`)
									}>
									<ArticleSummary>
										<ArticleIcon>
											<FontAwesomeIcon icon={getArticleIcon(article.slug)} />
										</ArticleIcon>
										<ArticleSummaryCopy>
											<ArticleTitle>{article.title}</ArticleTitle>
											<ArticleDescription>
												{article.summary}
											</ArticleDescription>
											<ArticleReadTime>
												Maintley Guide - {article.readTime}
											</ArticleReadTime>
										</ArticleSummaryCopy>
										<ArticleArrow>
											<FontAwesomeIcon icon={faArrowRight} />
										</ArticleArrow>
									</ArticleSummary>
								</ArticleCard>
							))}
						</ArticleGrid>
					</Panel>

					<ContentGrid>
						<Panel>
							<PanelHeader>
								<div>
									<PanelTitle>Frequently asked questions</PanelTitle>
									<PanelText>Quick answers to common Maintley questions.</PanelText>
								</div>
							</PanelHeader>
							<FaqList>
								{supportFaqItems.map((item) => (
									<FaqItem key={item.question}>
										<summary>{item.question}</summary>
										<p>{item.answer}</p>
									</FaqItem>
								))}
							</FaqList>
						</Panel>
						<div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
						<Panel>
							<PanelTitle>What to include in a bug report</PanelTitle>
							<Checklist>
								{bugReportChecklist.map((item) => (
									<li key={item}>{item}</li>
								))}
							</Checklist>
						</Panel>
						<Panel>
							<PanelTitle>Known issues</PanelTitle>
							<Checklist>
								{supportKnownIssues.map((item) => (
									<li key={item}>{item}</li>
								))}
							</Checklist>
						</Panel>
						<Panel>
							<PanelTitle>Still need help?</PanelTitle>
							<PanelText>
								Start a request so you can track the response here in the
								Support Center.
							</PanelText>
							<TextButton
								type='button'
								onClick={openRequestModal}
								style={{ marginTop: 8 }}>
								New support request
							</TextButton>
						</Panel>
						</div>
					</ContentGrid>
				</div>
			) : null}

			<GenericModal
				isOpen={showRequestModal}
				title='New Support Request'
				showActions={false}
				onClose={closeRequestModal}>
				<FeedbackForm onClose={closeRequestModal} />
			</GenericModal>
		</Portal>
	);
};
