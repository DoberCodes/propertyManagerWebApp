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
	height: 100%;
	overflow-y: auto;
	background-color: #fafafa;
	padding-bottom: var(--mobile-bottom-nav-offset, 0px);
`;

const ContentContainer = styled.div<{ $contentMaxWidth: string }>`
	flex: 1;
	padding: 20px;
	max-width: ${(props) => props.$contentMaxWidth};
	width: 100%;
	margin: 0 auto;

	@media (max-width: 640px) {
		padding: 12px;
	}
`;

const StickyTabsShell = styled.div`
	/* position: sticky; */
	top: 0;
	z-index: 5;
	margin: -6px -6px 12px;
	padding: 6px;
	border-radius: 12px;
	background: rgba(250, 250, 250, 0.92);
	backdrop-filter: blur(6px);

	@supports not (backdrop-filter: blur(6px)) {
		background: #fafafa;
	}

	box-shadow: 0 10px 24px -20px rgba(15, 23, 42, 0.5);
	border: 1px solid #e2e8f0;

	@media (max-width: 640px) {
		margin: 0 0 14px;
		padding: 10px;
		border-radius: 16px;
		box-shadow: none;
		background: #ffffff;
	}
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
				<StickyTabsShell>
					<TabControlsContainer>
						<TabButtonsWrapper>
							{tabs.map((tab) => (
								<TabButton
									key={tab.id}
									isActive={activeTab === tab.id}
									onClick={() => onTabChange(tab.id)}>
									{tab.label}
									{tab.count !== undefined && ` (${tab.count})`}
								</TabButton>
							))}
						</TabButtonsWrapper>
					</TabControlsContainer>
				</StickyTabsShell>

				{children}
			</ContentContainer>
		</Wrapper>
	);
};
