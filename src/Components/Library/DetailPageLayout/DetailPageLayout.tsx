/**
 * Shared DetailPageLayout component
 * Provides consistent layout for Property, Unit, and Suite detail pages
 */

import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import {
	GradientHeader,
	HeaderContent,
	HeaderTopRow,
	HeaderBadge,
	HeaderBackButton,
	HeaderTitle,
	HeaderSubtitleMuted,
} from '../Headers/HeaderStyles';
import {
	TabControlsContainer,
	TabButtonsWrapper,
	TabButton,
} from '../TabController/TabControllerStyles';
import { BreadcrumbItem, TabConfig } from '../../../types/DetailPage.types';

const HeaderShell = styled.div<{
	$headerImageUrl?: string;
	$headerTheme: 'green' | 'slate';
}>`
	position: relative;
	flex-shrink: 0;
	border-radius: 0 0 18px 18px;
	overflow: hidden;
	background: ${(props) =>
		props.$headerImageUrl
			? `linear-gradient(135deg, rgba(15, 23, 42, 0.28), rgba(15, 23, 42, 0.48)), url(${props.$headerImageUrl})`
			: props.$headerTheme === 'slate'
				? 'linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #334155 100%)'
				: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'};
	background-size: cover;
	background-position: center;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: ${(props) =>
			props.$headerImageUrl
				? 'linear-gradient(180deg, rgba(2, 6, 23, 0.12), rgba(2, 6, 23, 0.58))'
				: 'transparent'};
	}
`;

const HeaderInner = styled.div<{ $headerImageUrl?: string }>`
	position: relative;
	z-index: 1;

	& > div {
		background: ${(props) => (props.$headerImageUrl ? 'transparent' : undefined)};
	}
`;

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	height: 100%;
	overflow-y: auto;
	background-color: #fafafa;
`;

const ContentContainer = styled.div<{ $contentMaxWidth: string }>`
	flex: 1;
	padding: 20px;
	max-width: ${(props) => props.$contentMaxWidth};
	width: 100%;
	margin: 0 auto;
`;

interface DetailPageLayoutProps {
	title: string;
	subtitle?: string;
	breadcrumbs?: BreadcrumbItem[];
	badge?: string;
	backPath: string;
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
	headerImageUrl,
	headerTheme = 'green',
	contentMaxWidth = '1200px',
	tabs,
	activeTab,
	onTabChange,
	children,
}) => {
	const navigate = useNavigate();

	return (
		<Wrapper>
			<HeaderShell $headerImageUrl={headerImageUrl} $headerTheme={headerTheme}>
				<HeaderInner $headerImageUrl={headerImageUrl}>
					<GradientHeader>
						<HeaderContent>
							<HeaderTopRow>
								{badge && <HeaderBadge>{badge}</HeaderBadge>}
								<HeaderBackButton onClick={() => navigate(backPath)}>
									← Back to Property
								</HeaderBackButton>
							</HeaderTopRow>
							<HeaderTitle>{title}</HeaderTitle>
							{subtitle && <HeaderSubtitleMuted>{subtitle}</HeaderSubtitleMuted>}
						</HeaderContent>
					</GradientHeader>
				</HeaderInner>
			</HeaderShell>

			<ContentContainer $contentMaxWidth={contentMaxWidth}>
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

				{children}
			</ContentContainer>
		</Wrapper>
	);
};
