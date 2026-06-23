import styled, { css, keyframes } from 'styled-components';
import { COLORS } from 'constants/colors';

export const Portal = styled.div`
	width: 100%;
	max-width: 1180px;
	margin: 0 auto;
	padding-bottom: 24px;
	color: ${COLORS.gray800};
`;

export const Hero = styled.section`
	position: relative;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 28px;
	padding: 34px;
	border-radius: 20px;
	background:
		radial-gradient(circle at 92% 12%, rgba(255, 255, 255, 0.2), transparent 32%),
		linear-gradient(135deg, #065f46 0%, #059669 58%, #10b981 100%);
	box-shadow: 0 16px 34px rgba(5, 150, 105, 0.18);
	color: #ffffff;

	@media (max-width: 700px) {
		align-items: flex-start;
		flex-direction: column;
		padding: 24px 20px;
		border-radius: 16px;
	}
`;

export const HeroCopy = styled.div`
	max-width: 660px;
`;

export const Eyebrow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 10px;
	font-size: 0.78rem;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.8);
`;

export const HeroTitle = styled.h1`
	margin: 0;
	font-size: clamp(1.85rem, 4vw, 2.75rem);
	line-height: 1.08;
	color: #ffffff;
`;

export const HeroText = styled.p`
	max-width: 590px;
	margin: 12px 0 0;
	font-size: 1rem;
	line-height: 1.6;
	color: rgba(255, 255, 255, 0.88);
`;

export const HeroButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 9px;
	flex: 0 0 auto;
	min-height: 46px;
	padding: 12px 18px;
	border: 1px solid rgba(255, 255, 255, 0.5);
	border-radius: 12px;
	background: #ffffff;
	color: #065f46;
	font: inherit;
	font-weight: 800;
	cursor: pointer;
	box-shadow: 0 8px 18px rgba(6, 95, 70, 0.18);

	&:hover {
		background: #ecfdf5;
		transform: translateY(-1px);
	}

	@media (max-width: 700px) {
		width: 100%;
	}
`;

export const PortalNav = styled.nav`
	display: flex;
	gap: 8px;
	margin: 18px 0;
	padding: 5px;
	width: fit-content;
	max-width: 100%;
	overflow-x: auto;
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	background: #ffffff;
	box-shadow: ${COLORS.shadow};
`;

export const PortalNavButton = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	min-height: 40px;
	padding: 9px 14px;
	border: 0;
	border-radius: 8px;
	background: ${({ $active }) => ($active ? COLORS.primaryLight : 'transparent')};
	color: ${({ $active }) => ($active ? '#065f46' : COLORS.gray600)};
	font: inherit;
	font-size: 0.9rem;
	font-weight: 750;
	white-space: nowrap;
	cursor: pointer;

	&:hover {
		background: ${({ $active }) => ($active ? COLORS.primaryLight : COLORS.gray100)};
	}
`;

export const ActionGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 16px;
	margin-bottom: 18px;

	@media (max-width: 850px) {
		grid-template-columns: 1fr;
	}

	@media (max-width: 600px) {
		display: none;
	}
`;

export const ActionCard = styled.button`
	display: flex;
	align-items: flex-start;
	gap: 14px;
	padding: 20px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 16px;
	background: #ffffff;
	text-align: left;
	font: inherit;
	cursor: pointer;
	box-shadow: ${COLORS.shadow};
	transition:
		transform 0.18s ease,
		box-shadow 0.18s ease,
		border-color 0.18s ease;

	&:hover {
		transform: translateY(-2px);
		border-color: #a7f3d0;
		box-shadow: ${COLORS.shadowMd};
	}
`;

export const ActionIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 42px;
	height: 42px;
	border-radius: 12px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 1rem;
`;

export const ActionContent = styled.span`
	display: block;
	min-width: 0;
	flex: 1;
`;

export const ActionTitle = styled.span`
	display: block;
	font-weight: 800;
	color: ${COLORS.gray900};
`;

export const ActionText = styled.span`
	display: block;
	margin-top: 5px;
	font-size: 0.86rem;
	line-height: 1.45;
	color: ${COLORS.gray500};
`;

export const ActionArrow = styled.span`
	margin-left: auto;
	color: ${COLORS.gray400};
`;

export const ContentGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1.65fr) minmax(260px, 0.75fr);
	gap: 18px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`;

export const Panel = styled.section`
	min-width: 0;
	padding: 22px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 16px;
	background: #ffffff;
	box-shadow: ${COLORS.shadow};

	@media (max-width: 600px) {
		padding: 17px;
		border-radius: 14px;
	}
`;

export const PanelHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	margin-bottom: 16px;
`;

export const PanelTitle = styled.h2`
	margin: 0;
	font-size: 1.2rem;
	color: ${COLORS.gray900};
`;

export const PanelText = styled.p`
	margin: 6px 0 0;
	color: ${COLORS.gray500};
	font-size: 0.9rem;
	line-height: 1.55;
`;

export const TextButton = styled.button`
	border: 0;
	padding: 5px;
	background: transparent;
	color: ${COLORS.primaryDark};
	font: inherit;
	font-size: 0.85rem;
	font-weight: 800;
	cursor: pointer;
`;

export const Metrics = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;
`;

export const Metric = styled.div`
	padding: 16px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	background: ${COLORS.gray50};
`;

export const MetricValue = styled.div`
	font-size: 1.55rem;
	font-weight: 850;
	color: ${COLORS.gray900};
`;

export const MetricLabel = styled.div`
	margin-top: 3px;
	font-size: 0.78rem;
	font-weight: 700;
	color: ${COLORS.gray500};
`;

export const SupportDetails = styled.div`
	display: grid;
	gap: 12px;
`;

export const SupportDetail = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 11px;
	font-size: 0.88rem;
	line-height: 1.45;
	color: ${COLORS.gray600};

	svg {
		margin-top: 3px;
		color: ${COLORS.primaryDark};
	}

	strong {
		display: block;
		color: ${COLORS.gray800};
	}
`;

export const TicketToolbar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;

	@media (max-width: 600px) {
		align-items: stretch;
		flex-direction: column;
	}
`;

export const FilterGroup = styled.div`
	display: inline-flex;
	align-items: center;
	width: fit-content;
	padding: 3px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 999px;
	background: ${COLORS.gray100};
`;

export const FilterButton = styled.button<{ $active: boolean }>`
	border: 0;
	border-radius: 999px;
	padding: 7px 14px;
	background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
	color: ${({ $active }) => ($active ? COLORS.gray900 : COLORS.gray500)};
	font: inherit;
	font-size: 0.82rem;
	font-weight: 800;
	cursor: pointer;
	box-shadow: ${({ $active }) => ($active ? COLORS.shadow : 'none')};
`;

const spin = keyframes`
	to { transform: rotate(360deg); }
`;

export const RefreshButton = styled.button<{ $refreshing: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 9px;
	padding: 8px 11px;
	background: #ffffff;
	color: ${COLORS.gray600};
	font: inherit;
	font-size: 0.82rem;
	font-weight: 750;
	cursor: pointer;

	svg {
		${({ $refreshing }) =>
			$refreshing &&
			css`
				animation: ${spin} 0.9s linear infinite;
			`}
	}
`;

export const TicketList = styled.div`
	display: grid;
	gap: 12px;
`;

export const TicketCard = styled.details`
	overflow: hidden;
	border: 1px solid ${COLORS.gray200};
	border-radius: 13px;
	background: #ffffff;

	&[open] {
		border-color: #a7f3d0;
		box-shadow: 0 5px 16px rgba(15, 23, 42, 0.06);
	}
`;

export const TicketSummary = styled.summary`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 15px;
	list-style: none;
	cursor: pointer;

	&::-webkit-details-marker {
		display: none;
	}
`;

export const TicketSummaryCopy = styled.div`
	min-width: 0;
	flex: 1;
`;

export const TicketNumber = styled.div`
	font-size: 0.75rem;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: ${COLORS.gray500};
`;

export const TicketSubject = styled.div`
	margin-top: 3px;
	overflow: hidden;
	font-size: 0.95rem;
	font-weight: 800;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: ${COLORS.gray900};
`;

export const TicketDate = styled.div`
	margin-top: 4px;
	font-size: 0.78rem;
	color: ${COLORS.gray500};
`;

export const StatusBadge = styled.span<{ $closed: boolean }>`
	flex: 0 0 auto;
	padding: 5px 9px;
	border: 1px solid ${({ $closed }) => ($closed ? '#d1d5db' : '#a7f3d0')};
	border-radius: 999px;
	background: ${({ $closed }) => ($closed ? COLORS.gray100 : COLORS.primaryLight)};
	color: ${({ $closed }) => ($closed ? COLORS.gray600 : '#047857')};
	font-size: 0.7rem;
	font-weight: 850;
	text-transform: uppercase;
`;

export const TicketBody = styled.div`
	padding: 0 15px 15px;
	border-top: 1px solid ${COLORS.gray100};
`;

export const TicketMetaGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 8px;
	padding-top: 14px;

	@media (max-width: 650px) {
		grid-template-columns: 1fr;
	}
`;

export const TicketMeta = styled.div`
	padding: 9px 10px;
	border-radius: 8px;
	background: ${COLORS.gray50};

	span {
		display: block;
		font-size: 0.7rem;
		font-weight: 800;
		text-transform: uppercase;
		color: ${COLORS.gray500};
	}

	strong {
		display: block;
		margin-top: 3px;
		font-size: 0.84rem;
		color: ${COLORS.gray800};
	}
`;

export const TicketSection = styled.div<{ $highlight?: boolean }>`
	margin-top: 13px;
	padding: ${({ $highlight }) => ($highlight ? '12px' : '0')};
	border: ${({ $highlight }) => ($highlight ? '1px solid #a7f3d0' : '0')};
	border-radius: 9px;
	background: ${({ $highlight }) => ($highlight ? '#ecfdf5' : 'transparent')};

	h3 {
		margin: 0 0 5px;
		font-size: 0.74rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: ${COLORS.gray500};
	}

	p {
		margin: 0;
		font-size: 0.88rem;
		line-height: 1.55;
		white-space: pre-wrap;
		word-break: break-word;
		color: ${COLORS.gray700};
	}

	ul {
		margin: 6px 0 0;
		padding-left: 18px;
	}
`;

export const EmptyState = styled.div`
	padding: 32px 18px;
	border: 1px dashed ${COLORS.gray300};
	border-radius: 12px;
	background: ${COLORS.gray50};
	text-align: center;
	color: ${COLORS.gray500};

	svg {
		margin-bottom: 10px;
		font-size: 1.5rem;
		color: ${COLORS.gray400};
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		color: ${COLORS.gray800};
	}

	p {
		margin: 7px 0 0;
		font-size: 0.86rem;
	}
`;

export const ErrorState = styled(EmptyState)`
	border-color: #fecaca;
	background: #fef2f2;
	color: #b91c1c;
`;

export const FaqList = styled.div`
	display: grid;
	gap: 10px;
`;

export const FaqItem = styled.details`
	border: 1px solid ${COLORS.gray200};
	border-radius: 11px;
	background: #ffffff;

	&[open] {
		border-color: #a7f3d0;
	}

	summary {
		padding: 14px 15px;
		font-weight: 800;
		color: ${COLORS.gray800};
		cursor: pointer;
	}

	p {
		margin: 0;
		padding: 0 15px 15px;
		font-size: 0.9rem;
		line-height: 1.6;
		color: ${COLORS.gray600};
	}
`;

export const Checklist = styled.ul`
	margin: 10px 0 0;
	padding-left: 20px;
	color: ${COLORS.gray600};
	font-size: 0.9rem;
	line-height: 1.7;
`;

export const InlineLink = styled.a`
	color: ${COLORS.primaryDark};
	font-weight: 750;
`;

export const UpdatesPanel = styled(Panel)`
	margin-top: 18px;
`;

export const UpdateList = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 850px) {
		grid-template-columns: 1fr;
	}
`;

export const UpdateItem = styled.article`
	position: relative;
	padding: 16px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	background: ${COLORS.gray50};

	&::before {
		content: '';
		position: absolute;
		top: 16px;
		left: 0;
		width: 3px;
		height: 34px;
		border-radius: 0 999px 999px 0;
		background: ${COLORS.primary};
	}
`;

export const UpdateMeta = styled.div`
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	font-size: 0.72rem;
	font-weight: 800;
	color: ${COLORS.gray500};
`;

export const VersionBadge = styled.span`
	padding: 3px 7px;
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	color: #047857;
`;

export const UpdateTitle = styled.h3`
	margin: 10px 0 5px;
	font-size: 0.95rem;
	color: ${COLORS.gray900};
`;

export const UpdateText = styled.p`
	margin: 0;
	font-size: 0.84rem;
	line-height: 1.5;
	color: ${COLORS.gray600};
`;

export const ArticleGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 12px;

	@media (max-width: 700px) {
		grid-template-columns: 1fr;
	}
`;

export const ArticleCard = styled.button`
	display: block;
	width: 100%;
	overflow: hidden;
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	background: #ffffff;
	font: inherit;
	text-align: left;
	cursor: pointer;
	transition:
		transform 0.18s ease,
		border-color 0.18s ease,
		box-shadow 0.18s ease;

	&:hover {
		transform: translateY(-2px);
		border-color: #a7f3d0;
		box-shadow: ${COLORS.shadow};
	}
`;

export const ArticleSummary = styled.span`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 16px;
`;

export const ArticleIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 38px;
	height: 38px;
	border-radius: 10px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
`;

export const ArticleSummaryCopy = styled.span`
	display: block;
	min-width: 0;
	flex: 1;
`;

export const ArticleTitle = styled.span`
	display: block;
	font-size: 0.94rem;
	font-weight: 800;
	color: ${COLORS.gray900};
`;

export const ArticleDescription = styled.span`
	display: block;
	margin-top: 5px;
	font-size: 0.82rem;
	line-height: 1.45;
	color: ${COLORS.gray500};
`;

export const ArticleReadTime = styled.span`
	display: block;
	margin-top: 7px;
	font-size: 0.72rem;
	font-weight: 750;
	color: ${COLORS.primaryDark};
`;

export const ArticleArrow = styled.span`
	align-self: center;
	color: ${COLORS.gray400};
`;

export const ArticlePageShell = styled.article`
	width: 100%;
	max-width: 900px;
	margin: 0 auto;
	padding-bottom: 24px;
`;

export const ArticleBackButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
	padding: 8px 4px;
	border: 0;
	background: transparent;
	color: ${COLORS.primaryDark};
	font: inherit;
	font-size: 0.88rem;
	font-weight: 800;
	cursor: pointer;
`;

export const ArticleHero = styled.header`
	padding: 30px;
	border-radius: 18px;
	background: linear-gradient(135deg, #065f46 0%, #059669 100%);
	color: #ffffff;
	box-shadow: 0 14px 30px rgba(5, 150, 105, 0.16);

	@media (max-width: 600px) {
		padding: 22px 18px;
		border-radius: 15px;
	}
`;

export const ArticlePageMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 0.76rem;
	font-weight: 800;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.75);
`;

export const ArticlePageTitle = styled.h1`
	max-width: 720px;
	margin: 10px 0 0;
	font-size: clamp(1.8rem, 4vw, 2.6rem);
	line-height: 1.12;
	color: #ffffff;
`;

export const ArticlePageIntro = styled.p`
	max-width: 720px;
	margin: 14px 0 0;
	font-size: 1rem;
	line-height: 1.65;
	color: rgba(255, 255, 255, 0.88);
`;

export const ArticlePageContent = styled.div`
	display: grid;
	gap: 16px;
	margin-top: 18px;
`;

export const FounderNote = styled.aside`
	position: relative;
	padding: 24px 24px 24px 68px;
	border: 1px solid #a7f3d0;
	border-radius: 15px;
	background: linear-gradient(135deg, #ecfdf5 0%, #f8fffb 100%);
	box-shadow: ${COLORS.shadow};

	@media (max-width: 600px) {
		padding: 58px 18px 18px;
	}
`;

export const FounderNoteIcon = styled.span`
	position: absolute;
	top: 24px;
	left: 22px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 34px;
	height: 34px;
	border-radius: 50%;
	background: #047857;
	color: #ffffff;

	@media (max-width: 600px) {
		top: 17px;
		left: 18px;
	}
`;

export const FounderNoteLabel = styled.div`
	margin-bottom: 8px;
	font-size: 0.76rem;
	font-weight: 850;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	color: #047857;
`;

export const FounderNoteText = styled.p`
	margin: 0 0 10px;
	font-size: 0.95rem;
	line-height: 1.7;
	color: #065f46;

	&:last-child {
		margin-bottom: 0;
	}
`;

export const FounderSignature = styled.div`
	margin-top: 14px;
	font-size: 0.84rem;
	font-weight: 800;
	font-style: italic;
	text-align: right;
	color: #047857;
`;

export const ArticleLibraryHeader = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 18px;
	margin-bottom: 18px;

	@media (max-width: 600px) {
		align-items: stretch;
		flex-direction: column;
	}
`;

export const ArticleSection = styled.section`
	padding: 24px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 15px;
	background: #ffffff;
	box-shadow: ${COLORS.shadow};

	h2 {
		margin: 0 0 12px;
		font-size: 1.2rem;
		color: ${COLORS.gray900};
	}

	p {
		margin: 0 0 12px;
		font-size: 0.94rem;
		line-height: 1.7;
		color: ${COLORS.gray600};
	}

	p:last-child {
		margin-bottom: 0;
	}

	ol,
	ul {
		margin: 10px 0 0;
		padding-left: 22px;
		font-size: 0.92rem;
		line-height: 1.7;
		color: ${COLORS.gray600};
	}

	@media (max-width: 600px) {
		padding: 18px;
	}
`;

export const ArticleTips = styled.div`
	margin-top: 16px;
	padding: 14px 16px;
	border: 1px solid #a7f3d0;
	border-radius: 10px;
	background: ${COLORS.primaryLight};

	strong {
		color: #065f46;
	}

	ul {
		margin-top: 7px;
		color: #047857;
	}
`;

export const ArticleFooter = styled.section`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin-top: 18px;
	padding: 20px;
	border: 1px solid ${COLORS.gray200};
	border-radius: 14px;
	background: ${COLORS.gray50};

	h2 {
		margin: 0;
		font-size: 1.05rem;
		color: ${COLORS.gray900};
	}

	p {
		margin: 5px 0 0;
		font-size: 0.86rem;
		color: ${COLORS.gray500};
	}

	@media (max-width: 600px) {
		align-items: stretch;
		flex-direction: column;
	}
`;

export const ArticlePrimaryAction = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	flex: 0 0 auto;
	min-height: 42px;
	padding: 10px 14px;
	border: 0;
	border-radius: 10px;
	background: ${COLORS.primaryDark};
	color: #ffffff;
	font: inherit;
	font-size: 0.86rem;
	font-weight: 800;
	cursor: pointer;
`;
