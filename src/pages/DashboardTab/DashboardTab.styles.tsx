import styled from 'styled-components';
import { COLORS } from 'constants/colors';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 30px;
	padding: 40px;

	@media (max-width: 1024px) {
		padding: 0;
		gap: 15px;
	}

	@media (max-width: 480px) {
		padding: 0;
		gap: 10px;
	}
`;

export const DashboardPropertyFilter = styled.label`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 220px;
	color: #475569;
	font-size: 12px;
	font-weight: 800;

	select {
		width: 100%;
		height: 40px;
		padding: 0 12px;
		border: 1px solid #cbd5e1;
		border-radius: 10px;
		background: #ffffff;
		color: #334155;
		font-size: 0.88rem;
		cursor: pointer;
		outline: none;

		&:focus {
			border-color: ${COLORS.primary};
			box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
		}
	}
`;

export const DashboardDesktopPropertyFilter = styled(
	DashboardPropertyFilter,
)`
	@media (max-width: 1024px) {
		display: none;
	}
`;

export const DashboardHeaderActions = styled.div`
	display: flex;
	align-items: flex-end;
	justify-content: flex-end;
	gap: 12px;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		width: 100%;
		justify-content: flex-start;
	}
`;

export const DashboardScopeControl = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(104px, 1fr));
	gap: 3px;
	padding: 3px;
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	background: ${COLORS.gray50};
	min-height: 40px;
`;

export const DashboardScopeButton = styled.button<{ $isActive?: boolean }>`
	min-width: 104px;
	height: 34px;
	padding: 0 10px;
	border: none;
	border-radius: 8px;
	background: ${(props) => (props.$isActive ? COLORS.bgWhite : 'transparent')};
	color: ${(props) =>
		props.$isActive ? COLORS.primaryDark : COLORS.textSecondary};
	box-shadow: ${(props) => (props.$isActive ? COLORS.shadow : 'none')};
	font-size: 0.78rem;
	font-weight: 800;
	cursor: pointer;
	white-space: nowrap;
	transition: background-color 0.15s ease, color 0.15s ease,
		box-shadow 0.15s ease;

	&:hover {
		color: ${COLORS.primaryDark};
	}

	@media (max-width: 480px) {
		min-width: 0;
	}
`;

export const TaskGridSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 15px;
	flex: 1;
	min-height: clamp(240px, 35vh, 400px);

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const TaskGridHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 10px;

	@media (max-width: 480px) {
		gap: 5px;
	}
`;

export const FilterSection = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;
	background: white;
	border: 1px solid #e5e7eb;
	border-radius: 8px;

	label {
		font-size: 14px;
		font-weight: 500;
		color: #374151;
	}

	select {
		padding: 6px 12px;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 14px;
		color: #1f2937;
		background: white;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			border-color: ${COLORS.secondary};
		}

		&:focus {
			outline: none;
			border-color: ${COLORS.secondary};
			box-shadow: 0 0 0 3px ${COLORS.secondaryLight};
		}
	}

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		padding: 10px;
	}
`;

export const TaskGridTitle = styled.h2`
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;

	@media (max-width: 1024px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const ActionButton = styled.button`
	position: relative;
	background-color: transparent;
	color: #999999;
	border: none;
	border-radius: 50%;
	width: 40px;
	height: 40px;
	font-size: 24px;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: color 0.2s ease;

	&:hover {
		color: #666666;
	}

	@media (max-width: 480px) {
		width: 36px;
		height: 36px;
		font-size: 20px;
	}
`;

export const ActionDropdown = styled.div`
	position: absolute;
	top: 100%;
	right: 0;
	background-color: white;
	border: 1px solid #ccc;
	border-radius: 4px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
	z-index: 1000;
	min-width: 150px;
	margin-top: 8px;
	overflow: hidden;

	@media (max-width: 480px) {
		min-width: 130px;
		margin-top: 4px;
	}
`;

export const DropdownItem = styled.button`
	display: block;
	width: 100%;
	padding: 12px 15px;
	background: none;
	border: none;
	color: black;
	text-align: left;
	font-size: 14px;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:first-child {
		border-radius: 4px 4px 0 0;
	}

	&:last-child {
		border-radius: 0 0 4px 4px;
	}

	&:hover {
		background-color: ${COLORS.primaryLight};
		color: ${COLORS.primary};
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
		font-size: 12px;
	}
`;

export const TableWrapper = styled.div`
	overflow-x: auto;
	border: 1px solid #e0e0e0;
	border-radius: 4px;
	flex: 1;

	@media (max-width: 480px) {
		border-radius: 2px;
	}
`;

export const Table = styled.table`
	width: 100%;
	border-collapse: collapse;
	background-color: white;

	thead {
		background-color: #f5f5f5;
		border-bottom: 2px solid #e0e0e0;
		position: sticky;
		top: 0;
	}

	th {
		padding: 12px 16px;
		text-align: left;
		font-weight: 600;
		color: black;
		font-size: 14px;

		@media (max-width: 1024px) {
			padding: 10px 12px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 8px 10px;
			font-size: 11px;
		}
	}

	td {
		padding: 12px 16px;
		border-bottom: 1px solid #e0e0e0;
		color: black;
		font-size: 14px;

		@media (max-width: 1024px) {
			padding: 10px 12px;
			font-size: 12px;
		}

		@media (max-width: 480px) {
			padding: 8px 10px;
			font-size: 11px;
		}
	}

	tr:hover {
		background-color: #fafafa;
	}
`;

export const BottomSectionsWrapper = styled.div`
	display: flex;
	gap: 20px;
	justify-content: center;
	flex-shrink: 0;
	width: 100%;
	@media (max-width: 1024px) {
		gap: 14px;
	}

	@media (max-width: 480px) {
		gap: 10px;
	}
`;

export const TopChartsContainer = styled.div`
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 20px;
	flex-shrink: 0;
	min-height: clamp(200px, 25vh, 320px);

	@media (max-width: 1024px) {
		gap: 16px;
	}

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const Section = styled.div`
	background-color: white;
	border: 1px solid #e0e0e0;
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	height: 100%;
	width: 100%;
	min-height: clamp(200px, 25vh, 320px);

	&.mobile-seasonal {
		display: none;

		@media (max-width: 1024px) {
			display: flex;
		}
	}

	@media (max-width: 1024px) {
		border-radius: 6px;
		min-height: auto;
		height: auto;
	}

	@media (max-width: 480px) {
		border-radius: 4px;
	}
`;

export const SectionTitle = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	font-size: 16px;
	font-weight: 600;
	color: #1f2937;
	margin: 0;
	padding: 16px 20px;
	border-bottom: 1px solid #e0e0e0;
	background: #f9fafb;
	flex-shrink: 0;
	height: 56px;
	flex-wrap: nowrap;
	white-space: nowrap;

	h3 {
		margin: 0;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	@media (max-width: 1024px) {
		font-size: 14px;
		padding: 12px 16px;
		height: 48px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
		padding: 10px 12px;
		height: 44px;
	}
`;
export const TempToggle = styled.div`
	display: flex;
	align-items: center;
	background-color: #e5e7eb;
	border-radius: 20px;
	padding: 3px;
	gap: 0;
	flex-shrink: 0;

	button {
		padding: 4px 10px;
		margin: 0;
		background-color: transparent;
		color: #6b7280;
		border: none;
		border-radius: 18px;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: 500;
		transition: all 0.3s ease;
		white-space: nowrap;

		&:hover {
			color: #4b5563;
		}

		&.active {
			background-color: ${COLORS.primary};
			color: ${COLORS.textInverse};
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		}
	}

	@media (max-width: 1024px) {
		padding: 2px;

		button {
			padding: 3px 8px;
			font-size: 0.7rem;
		}
	}
`;

export const SectionContent = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16px 20px;
	color: #999999;
	font-size: 14px;
	overflow-y: auto;
	min-height: 0;

	@media (max-width: 1024px) {
		font-size: 12px;
		padding: 12px 16px;
	}

	@media (max-width: 480px) {
		font-size: 11px;
		padding: 10px 12px;
	}
`;

export const ZeroState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	gap: 12px;
	padding: 20px;

	svg {
		font-size: 48px;
		opacity: 0.3;
		margin-bottom: 8px;
	}

	p {
		margin: 0;
		font-size: 14px;
		color: #999999;
		font-weight: 500;
	}

	@media (max-width: 1024px) {
		padding: 16px;

		svg {
			font-size: 40px;
		}

		p {
			font-size: 12px;
		}
	}

	/* Center content */
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
`;

export const ActionFirstTopSection = styled.section`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
	gap: 14px;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
		gap: 10px;
	}
`;

export const EmptyDashboardState = styled.section`
	min-height: min(620px, calc(100vh - 180px));
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px 16px;
`;

export const EmptyDashboardCard = styled.div`
	width: min(100%, 520px);
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.border};
	border-radius: 14px;
	box-shadow: ${COLORS.shadow};
	padding: 32px;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;

	h1 {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 800;
		color: ${COLORS.textPrimary};
	}

	p {
		margin: 0;
		max-width: 420px;
		color: ${COLORS.textSecondary};
		font-size: 0.95rem;
		line-height: 1.55;
	}

	button {
		margin-top: 8px;
		border: none;
		border-radius: 9px;
		background: ${COLORS.primary};
		color: ${COLORS.textInverse};
		font-size: 0.9rem;
		font-weight: 800;
		padding: 0.7rem 1rem;
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.15s ease;
	}

	button:hover {
		background: ${COLORS.primaryHover};
		transform: translateY(-1px);
	}
`;

const sharedCard = `
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.border};
	border-radius: 14px;
	box-shadow: ${COLORS.shadow};
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const TodayFocusCard = styled.article`
	${sharedCard}
	background: linear-gradient(135deg, ${COLORS.bgWhite} 0%, ${COLORS.primaryLight} 100%);
`;

export const PortfolioHealthCard = styled.article`
	${sharedCard}
`;

export const DashboardIntelligenceCard = styled.article`
	${sharedCard}
	border-color: rgba(5, 150, 105, 0.22);
	background: linear-gradient(180deg, ${COLORS.bgWhite} 0%, rgba(236, 253, 245, 0.8) 100%);
`;

export const DashboardIntelligenceText = styled.p`
	margin: 0;
	font-size: 0.88rem;
	font-weight: 600;
	line-height: 1.45;
	color: ${COLORS.textPrimary};
`;

export const DashboardIntelligenceContext = styled.p`
	margin: -2px 0 0;
	font-size: 0.78rem;
	font-weight: 800;
	line-height: 1.35;
	color: ${COLORS.primaryDark};
`;

export const DashboardIntelligenceImpact = styled.p`
	margin: 0;
	font-size: 0.82rem;
	font-weight: 500;
	line-height: 1.5;
	color: ${COLORS.textSecondary};
`;

export const DashboardIntelligenceActions = styled.div`
	margin-top: auto;
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
`;

export const CardEyebrow = styled.p`
	margin: 0;
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${COLORS.textSecondary};
`;

export const CardTitle = styled.h3`
	margin: 0;
	font-size: 1.05rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const TodayFocusMessage = styled.p`
	margin: 0;
	font-size: 0.95rem;
	font-weight: 500;
	line-height: 1.4;
	color: ${COLORS.textPrimary};
`;

export const TodayFocusLead = styled.p`
	margin: 0;
	font-size: 1.15rem;
	font-weight: 800;
	line-height: 1.35;
	color: ${COLORS.textPrimary};
`;

export const TodayFocusSupportingText = styled.p`
	margin: 0;
	font-size: 0.88rem;
	font-weight: 600;
	line-height: 1.45;
	color: ${COLORS.textSecondary};
`;

export const TodayFocusTaskCard = styled.div`
	border: 1px solid rgba(5, 150, 105, 0.18);
	background: rgba(255, 255, 255, 0.72);
	border-radius: 12px;
	padding: 12px 14px;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const TaskStatusBadge = styled.span<{ $status: string }>`
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	padding: 3px 8px;
	border-radius: 20px;
	white-space: nowrap;
	background: ${(props) => {
		switch (props.$status) {
			case 'Upcoming':
				return COLORS.successLight;
			case 'Due Soon':
				return COLORS.warningLight;
			case 'Initiated':
				return COLORS.gray100;
			case 'In Progress':
				return COLORS.secondaryLight;
			case 'Overdue':
				return COLORS.errorLight;
			case 'Hold':
				return COLORS.warningLight;
			case 'Awaiting Approval':
				return '#ede9fe';
			default:
				return COLORS.gray100;
		}
	}};
	color: ${(props) => {
		switch (props.$status) {
			case 'Upcoming':
				return COLORS.successDark;
			case 'Due Soon':
				return COLORS.warningDark;
			case 'Initiated':
				return COLORS.textSecondary;
			case 'In Progress':
				return '#1d4ed8';
			case 'Overdue':
				return COLORS.errorDark;
			case 'Hold':
				return COLORS.warningDark;
			case 'Awaiting Approval':
				return '#6d28d9';
			default:
				return COLORS.textSecondary;
		}
	}};
`;

export const TodayFocusTaskName = styled.p`
	margin: 0;
	font-size: 0.95rem;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

export const TodayFocusTaskMeta = styled.p`
	margin: 0;
	font-size: 0.8rem;
	font-weight: 600;
	color: ${COLORS.textSecondary};
`;

export const TodayFocusButtons = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
`;

export const FocusButton = styled.button<{ $variant?: 'primary' | 'secondary' | 'success' }>`
	height: 42px;
	padding: 0 14px;
	border-radius: 10px;
	font-size: 0.9rem;
	font-weight: 700;
	border: 1px solid
		${(props) => {
			if (props.$variant === 'secondary') return COLORS.secondaryDark;
			if (props.$variant === 'success') return COLORS.primaryDark;
			return COLORS.primaryDark;
		}};
	background: ${(props) => {
		if (props.$variant === 'secondary') return COLORS.secondaryLight;
		if (props.$variant === 'success') return COLORS.primaryLight;
		return COLORS.primary;
	}};
	color: ${(props) => {
		if (props.$variant === 'secondary') return COLORS.secondaryDark;
		if (props.$variant === 'success') return COLORS.primaryDark;
		return COLORS.textInverse;
	}};
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: ${COLORS.shadowMd};
	}

	@media (max-width: 480px) {
		flex: 1 1 auto;
		min-width: 130px;
		height: 44px;
	}
`;

export const PortfolioMetrics = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`;

export const PortfolioHeaderText = styled.p`
	margin: 0;
	font-size: 0.82rem;
	font-weight: 600;
	color: ${COLORS.textSecondary};
`;

export const PortfolioMetric = styled.div`
	border: 1px solid ${COLORS.border};
	border-radius: 10px;
	padding: 10px;
	background: ${COLORS.gray50};
`;

export const PortfolioMetricLabel = styled.p`
	margin: 0;
	font-size: 0.75rem;
	color: ${COLORS.textSecondary};
`;

export const PortfolioMetricValue = styled.p`
	margin: 4px 0 0;
	font-size: 1.35rem;
	font-weight: 800;
	color: ${COLORS.textPrimary};
`;

export const RecentActivitySection = styled.section`
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.border};
	border-radius: 14px;
	box-shadow: ${COLORS.shadow};
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
`;

export const RecentActivityHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 10px;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

export const RecentActivitySubtitle = styled.p`
	margin: 6px 0 0;
	font-size: 0.8rem;
	font-weight: 500;
	color: ${COLORS.textSecondary};
`;

export const RecentActivityList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const RecentActivityRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	padding: 12px;
	background: ${COLORS.gray50};

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: flex-start;
	}
`;

export const RecentActivityMain = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const RecentActivityTitle = styled.h4`
	margin: 0;
	font-size: 0.92rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const RecentActivityMeta = styled.p`
	margin: 0;
	font-size: 0.8rem;
	font-weight: 600;
	color: ${COLORS.textSecondary};
`;

export const RecentActivityDate = styled.span`
	font-size: 0.78rem;
	font-weight: 700;
	color: ${COLORS.primaryDark};
	white-space: nowrap;
`;

export const RecentActivityEmpty = styled.div`
	margin: 0;
	font-size: 0.85rem;
	font-weight: 500;
	color: ${COLORS.textSecondary};
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 10px;

	p {
		margin: 0;
		line-height: 1.5;
	}
`;

export const UrgentQueueSection = styled.section`
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.border};
	border-radius: 14px;
	box-shadow: ${COLORS.shadow};
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 14px;
`;

export const UrgentQueueHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

export const QueueHeaderActions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
`;

export const QueueFilterPill = styled.span<{ $tone?: 'neutral' | 'urgent' }>`
	display: inline-flex;
	align-items: center;
	padding: 6px 10px;
	border-radius: 999px;
	background: ${(props) =>
		props.$tone === 'urgent' ? COLORS.errorLight : COLORS.gray100};
	color: ${(props) =>
		props.$tone === 'urgent' ? COLORS.errorDark : COLORS.textSecondary};
	font-size: 0.76rem;
	font-weight: 700;
`;

export const UrgentQueueSubtitle = styled.p`
	margin: 6px 0 0;
	font-size: 0.8rem;
	font-weight: 500;
	color: ${COLORS.textSecondary};
`;

export const UrgentTaskList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const UrgentTaskGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`;

export const UrgentTaskGroupLabel = styled.p`
	margin: 2px 0 0;
	font-size: 0.78rem;
	font-weight: 800;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	color: ${COLORS.textSecondary};
`;

export const UrgentTaskRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	padding: 12px;
	background: ${COLORS.gray50};
	cursor: pointer;
	transition: transform 0.15s ease, box-shadow 0.15s ease,
		border-color 0.15s ease;

	&:hover {
		transform: translateY(-1px);
		border-color: ${COLORS.primary};
		box-shadow: ${COLORS.shadowMd};
	}

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: stretch;
	}
`;

export const UrgentTaskMain = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`;

export const UrgentTaskTitle = styled.h4`
	margin: 0;
	font-size: 0.95rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

export const UrgentTaskContext = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

export const UrgentTaskProperty = styled.span`
	font-size: 0.8rem;
	font-weight: 700;
	color: ${COLORS.textPrimary};
`;

export const UrgentTaskAssignee = styled.span`
	font-size: 0.78rem;
	font-weight: 600;
	color: ${COLORS.textSecondary};
`;

export const UrgentTaskMeta = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
`;

export const UrgentTaskDue = styled.span`
	font-size: 0.82rem;
	font-weight: 600;
	color: ${COLORS.textSecondary};
`;

export const UrgentTaskPriority = styled.span<{ $priority: string }>`
	font-size: 0.76rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	padding: 4px 8px;
	border-radius: 20px;
	background: ${(props) => {
		switch (props.$priority) {
			case 'Urgent':
				return COLORS.errorLight;
			case 'High':
				return COLORS.warningLight;
			case 'Medium':
				return COLORS.secondaryLight;
			default:
				return COLORS.gray100;
		}
	}};
	color: ${(props) => {
		switch (props.$priority) {
			case 'Urgent':
				return COLORS.errorDark;
			case 'High':
				return COLORS.warningDark;
			case 'Medium':
				return COLORS.secondaryDark;
			default:
				return COLORS.textSecondary;
		}
	}};
`;

export const UrgentTaskActions = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;

	@media (max-width: 768px) {
		width: 100%;
	}
`;

export const UrgentActionButton = styled.button<{
	$variant?: 'default' | 'secondary' | 'success';
}>`
	height: 40px;
	padding: 0 12px;
	border-radius: 9px;
	border: 1px solid
		${(props) => {
			switch (props.$variant) {
				case 'secondary':
					return COLORS.secondaryDark;
				case 'success':
					return COLORS.primaryDark;
				default:
					return COLORS.borderDark;
			}
		}};
	background: ${(props) => {
		switch (props.$variant) {
			case 'secondary':
				return COLORS.secondaryLight;
			case 'success':
				return COLORS.primaryLight;
			default:
				return COLORS.bgWhite;
		}
	}};
	color: ${(props) => {
		switch (props.$variant) {
			case 'secondary':
				return COLORS.secondaryDark;
			case 'success':
				return COLORS.primaryDark;
			default:
				return COLORS.textPrimary;
		}
	}};
	font-size: 0.82rem;
	font-weight: 700;
	cursor: pointer;
	transition: background-color 0.15s ease, border-color 0.15s ease,
		color 0.15s ease;

	&:hover {
		background: ${(props) => {
			switch (props.$variant) {
				case 'secondary':
					return COLORS.secondaryLight;
				case 'success':
					return COLORS.primary;
				default:
					return COLORS.gray50;
			}
		}};
		color: ${(props) =>
			props.$variant === 'success' ? COLORS.textInverse : undefined};
	}

	@media (max-width: 768px) {
		flex: 1;
		min-width: 84px;
		height: 42px;
	}
`;

export const UrgentQueueEmpty = styled.p`
	margin: 0;
	font-size: 0.9rem;
	font-weight: 600;
	color: ${COLORS.textSecondary};
	padding: 6px 2px;
`;
