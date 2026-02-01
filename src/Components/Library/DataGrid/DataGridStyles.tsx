/**
 * Reusable data grid/table components
 * Provides consistent styling for tables across the application
 */
import styled from 'styled-components';

export const GridContainer = styled.div`
	overflow-x: auto;
`;

export const GridTable = styled.table`
	width: 100%;
	border-collapse: collapse;
	margin-top: 12px;

	thead {
		background: #f3f4f6;
	}

	th {
		padding: 12px;
		text-align: left;
		font-weight: 600;
		font-size: 13px;
		color: #374151;
		border-bottom: 2px solid #e5e7eb;
	}

	td {
		padding: 12px;
		border-bottom: 1px solid #e5e7eb;
		color: #4b5563;
	}

	tbody tr:hover {
		background: #f9fafb;
	}
`;

export const EmptyState = styled.div`
	text-align: center;
	padding: 40px 20px;
	color: #6b7280;

	p {
		margin: 0;
		font-size: 14px;
	}
`;
