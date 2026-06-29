import { styled } from 'styled-components';
import { COLORS } from '../../../constants/colors';

export const ActiveFilterChips = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	margin: 10px 0 12px;
`;

export const ActiveFilterChip = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	height: 28px;
	padding: 0 10px;
	border-radius: 999px;
	border: 1px solid #cbd5e1;
	background: #f8fafc;
	color: #334155;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
`;

export const ActiveFilterChipClear = styled.button`
	height: 30px;
	padding: 0 10px;
	border-radius: 999px;
	border: 1px dashed #94a3b8;
	background: #ffffff;
	color: #475569;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
`;

export const DesktopFilterArea = styled.div`
	@media (max-width: 1024px) {
		display: none;
	}
`;

export const CompactFilterResultCount = styled.div`
	display: none;
	padding-right: 58px;
	margin: 0 0 12px;
	color: #64748b;
	font-size: 0.8rem;
	font-weight: 700;

	@media (max-width: 1024px) {
		display: block;
	}
`;

export const DesktopCreateAction = styled.div`
	display: contents;

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const CardMoreDetails = styled.details`
	position: relative;
	flex: 1;
	min-width: 120px;
`;

export const CardMoreSummary = styled.summary`
	list-style: none;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	border: 1px solid #d1d5db;
	background: #f8fafc;
	color: #334155;
	text-align: center;

	&::-webkit-details-marker {
		display: none;
	}

	@media (max-width: 480px) {
		padding: 12px 16px;
		font-size: 16px;
		min-height: 44px;
	}
`;

export const CardMoreMenu = styled.div`
	position: absolute;
	right: 0;
	bottom: calc(100% + 6px);
	min-width: 140px;
	padding: 6px;
	border-radius: 8px;
	border: 1px solid #e2e8f0;
	background: #ffffff;
	box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
	z-index: 15;
	display: flex;
	flex-direction: column;
	gap: 4px;
`;

export const CardMoreMenuItem = styled.button`
	border: 1px solid transparent;
	background: #ffffff;
	color: #1f2937;
	font-size: 13px;
	font-weight: 600;
	text-align: left;
	padding: 8px 10px;
	border-radius: 6px;
	cursor: pointer;

	&:hover {
		background: #f1f5f9;
	}
`;

export const MobileFabButton = styled.button`
	display: none;

	@media (max-width: 1024px) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: fixed;
		right: 18px;
		bottom: calc(78px + env(safe-area-inset-bottom));
		height: 52px;
		padding: 0 18px;
		border: 1px solid ${COLORS.primary};
		border-radius: 999px;
		background: ${COLORS.primary};
		color: ${COLORS.white};
		font-size: 15px;
		font-weight: 800;
		box-shadow: 0 10px 22px rgba(4, 120, 87, 0.28);
		z-index: 25;
		cursor: pointer;
	}
`;
