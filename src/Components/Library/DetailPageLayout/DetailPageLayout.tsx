import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHero } from '../PageHero/PageHero';
import { HeaderBadge } from '../Headers/HeaderStyles';
import {
	TabControlsContainer,
	TabButtonsWrapper,
	TabButton,
} from '../TabController/TabControllerStyles';
import { BreadcrumbItem, TabConfig } from '../../../types/DetailPage.types';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	min-height: 100%;
	overflow: visible;
	background-color: #fafafa;
`;

const ContentContainer = styled.div<{ $contentMaxWidth: string }>`
	flex: 1;
	padding: 20px;
	max-width: ${(props) => props.$contentMaxWidth};
	width: 100%;
	margin: 0 auto;

	&::after {
		content: '';
		display: block;
		width: 100%;
		height: max(16px, calc(var(--mobile-bottom-nav-offset, 0px) + 16px));
	}

	@media (max-width: 640px) {
		padding: 12px;

		&::after {
			height: calc(var(--mobile-bottom-nav-offset, 0px) + 14px);
		}
	}
`;

const StickyTabsShell = styled.div<{ $compactTabs: boolean }>`
	/* position: sticky; */
	top: 0;
	z-index: 5;
	margin: ${(props) => (props.$compactTabs ? '0 0 12px' : '-6px -6px 12px')};
	padding: ${(props) => (props.$compactTabs ? '0' : '6px')};
	border-radius: ${(props) => (props.$compactTabs ? '0' : '12px')};
	background: ${(props) =>
		props.$compactTabs ? 'transparent' : 'rgba(250, 250, 250, 0.92)'};
	backdrop-filter: blur(6px);

	@supports not (backdrop-filter: blur(6px)) {
		background: #fafafa;
	}

	box-shadow: ${(props) =>
		props.$compactTabs
			? 'none'
			: '0 10px 24px -20px rgba(15, 23, 42, 0.5)'};
	border: ${(props) =>
		props.$compactTabs ? 'none' : '1px solid #e2e8f0'};

	@media (max-width: 640px) {
		margin: 0 0 ${(props) => (props.$compactTabs ? '10px' : '14px')};
		padding: ${(props) => (props.$compactTabs ? '2px 4px' : '10px')};
		border-radius: ${(props) => (props.$compactTabs ? '0' : '16px')};
		box-shadow: none;
		background: ${(props) => (props.$compactTabs ? 'transparent' : '#ffffff')};
	}
`;

const DetailTabControls = styled(TabControlsContainer)<{
	$compactTabs: boolean;
}>`
	${(props) =>
		props.$compactTabs &&
		`
			border-radius: 0;
			border-bottom: 1px solid #e2e8f0;
			background: transparent;

			@media (max-width: 1024px) {
				border-bottom: none;
			}
		`}
`;

const DetailTabButtons = styled(TabButtonsWrapper)<{
	$compactTabs: boolean;
}>`
	${(props) =>
		props.$compactTabs &&
		`
			gap: 8px;

			@media (max-width: 1024px) {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
				gap: 8px;
				overflow-x: visible;
			}
		`}
`;

const DetailTabButton = styled(TabButton)<{
	$compactTabs: boolean;
}>`
	${(props) =>
		props.$compactTabs &&
		`
			padding: 8px 16px;
			border-bottom-width: 2px;
			font-weight: ${props.isActive ? 700 : 500};
			color: ${props.isActive ? '#0f172a' : '#64748b'};

			@media (max-width: 1024px) {
				height: 38px;
				min-height: 38px;
				padding: 0 10px;
				border-radius: 10px;
				border: 1px solid ${props.isActive ? '#15803d' : '#d1d5db'};
				background: ${props.isActive ? '#dcfce7' : '#ffffff'};
				color: ${props.isActive ? '#15803d' : '#334155'};
				font-size: 0.82rem;
				font-weight: 700;
				line-height: 1;
				white-space: nowrap;
			}
		`}
`;

interface DetailPageLayoutProps {
	title: string;
	subtitle?: string;
	breadcrumbs?: BreadcrumbItem[];
	badge?: string;
	backPath: string;
	backLabel?: string;
	headerImageUrl?: string;
	headerTheme?: 'green' | 'slate';
	contentMaxWidth?: string;
	compactTabs?: boolean;
	tabs: TabConfig[];
	activeTab: string;
	onTabChange: (tab: string) => void;
	children: React.ReactNode;
}

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
	title,
	subtitle,
	badge,
	backPath,
	backLabel = 'Back to Property',
	headerImageUrl,
	headerTheme = 'green',
	contentMaxWidth = '1200px',
	compactTabs = false,
	tabs,
	activeTab,
	onTabChange,
	children,
}) => {
	const navigate = useNavigate();
	const location = useLocation();
	const wrapperRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		wrapperRef.current?.scrollTo({
			top: 0,
			left: 0,
			behavior: 'auto',
		});

		wrapperRef.current?.parentElement?.scrollTo({
			top: 0,
			left: 0,
			behavior: 'auto',
		});
	}, [location.pathname, location.search, activeTab]);

	return (
		<Wrapper ref={wrapperRef}>
			<PageHero
				headerImageUrl={headerImageUrl}
				headerTheme={headerTheme}
				backLabel={backLabel}
				onBack={() => navigate(backPath)}
				topRight={badge ? <HeaderBadge>{badge}</HeaderBadge> : undefined}
				title={title}
				subtitle={subtitle}
			/>

			<ContentContainer $contentMaxWidth={contentMaxWidth}>
				<StickyTabsShell $compactTabs={compactTabs}>
					<DetailTabControls $compactTabs={compactTabs}>
						<DetailTabButtons $compactTabs={compactTabs}>
							{tabs.map((tab) => (
								<DetailTabButton
									key={tab.id}
									$compactTabs={compactTabs}
									isActive={activeTab === tab.id}
									onClick={() => onTabChange(tab.id)}>
									{tab.label}
									{tab.count !== undefined && ` (${tab.count})`}
								</DetailTabButton>
							))}
						</DetailTabButtons>
					</DetailTabControls>
				</StickyTabsShell>

				{children}
			</ContentContainer>
		</Wrapper>
	);
};
