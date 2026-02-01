/**
 * Shared DetailPageLayout component
 * Provides consistent layout for Property, Unit, and Suite detail pages
 */

import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../Breadcrumb';
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
} from '../Tabs/TabStyles';
import { BreadcrumbItem, TabConfig } from '../../../types/DetailPage.types';

const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	height: 100%;
	overflow-y: auto;
	background-color: #fafafa;
`;

const ContentContainer = styled.div`
	flex: 1;
	padding: 20px;
	max-width: 1200px;
	width: 100%;
	margin: 0 auto;
`;

interface DetailPageLayoutProps {
	title: string;
	subtitle?: string;
	breadcrumbs: BreadcrumbItem[];
	badge?: string;
	backPath: string;
	tabs: TabConfig[];
	activeTab: string;
	onTabChange: (tab: string) => void;
	children: React.ReactNode;
}

export const DetailPageLayout: React.FC<DetailPageLayoutProps> = ({
	title,
	subtitle,
	breadcrumbs,
	badge,
	backPath,
	tabs,
	activeTab,
	onTabChange,
	children,
}) => {
	const navigate = useNavigate();

	return (
		<Wrapper>
			<GradientHeader>
				<HeaderContent>
					<Breadcrumb items={breadcrumbs} />
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

			<ContentContainer>
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
