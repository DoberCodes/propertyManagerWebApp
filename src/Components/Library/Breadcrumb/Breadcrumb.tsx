import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

const BreadcrumbContainer = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 0;
	margin-bottom: 16px;
	font-size: 14px;
`;

const BreadcrumbItem = styled.span`
	display: flex;
	align-items: center;
	color: #6b7280;

	&:hover {
		color: ${COLORS.primary};
	}
`;

const BreadcrumbLink = styled.button`
	background: none;
	border: none;
	color: ${COLORS.primary};
	cursor: pointer;
	font-size: 14px;
	padding: 0;
	text-decoration: none;
	font-weight: 500;

	&:hover {
		color: ${COLORS.primaryHover};
		text-decoration: underline;
	}
`;

const Separator = styled.span`
	color: #d1d5db;
	margin: 0 4px;
`;

export interface BreadcrumbData {
	label: string;
	path?: string;
}

interface BreadcrumbProps {
	items: BreadcrumbData[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
	const navigate = useNavigate();

	const handleNavigate = (path?: string) => {
		if (path) {
			navigate(path);
		}
	};

	return (
		<BreadcrumbContainer>
			{items.map((item, index) => (
				<React.Fragment key={index}>
					{index > 0 && <Separator>/</Separator>}
					<BreadcrumbItem>
						{item.path ? (
							<BreadcrumbLink onClick={() => handleNavigate(item.path)}>
								{item.label}
							</BreadcrumbLink>
						) : (
							<span>{item.label}</span>
						)}
					</BreadcrumbItem>
				</React.Fragment>
			))}
		</BreadcrumbContainer>
	);
};
