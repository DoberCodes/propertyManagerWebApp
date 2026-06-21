import styled from 'styled-components';
import { COLORS } from '../../../constants/colors';

export const FilterBackdrop = styled.button<{ $open: boolean }>`
	position: fixed;
	inset: 0;
	display: ${({ $open }) => ($open ? 'block' : 'none')};
	border: none;
	background: rgba(15, 23, 42, 0.18);
	backdrop-filter: blur(2px);
	z-index: 1090;
	cursor: default;

	@media (min-width: 1025px) {
		display: none;
	}
`;

export const FilterTrigger = styled.button<{ $open: boolean }>`
	position: fixed;
	top: max(50px, calc(env(safe-area-inset-top) + 72px));
	right: max(18px, env(safe-area-inset-right));
	display: ${({ $open }) => ($open ? 'none' : 'flex')};
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border: 1px solid rgba(16, 185, 129, 0.3);
	border-radius: 50%;
	background: ${COLORS.gradientPrimary};
	opacity: 0.7;
	color: #ffffff;
	font-size: 20px;
	box-shadow: 0 14px 28px rgba(5, 150, 105, 0.3);
	cursor: pointer;
	z-index: 500;
	transition: transform 150ms ease, box-shadow 150ms ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 18px 32px rgba(5, 150, 105, 0.36);
	}

	&:focus-visible {
		outline: 3px solid rgba(16, 185, 129, 0.24);
		outline-offset: 3px;
	}

	@media (max-width: 1024px) {
		top: max(120px, calc(env(safe-area-inset-top) + 66px));
		width: 48px;
		height: 48px;
	}

	@media (min-width: 1025px) {
		display: none;
	}
`;

export const AdditionalSettingsMenuWrap = styled.div`
	position: fixed;
	top: max(175px, calc(env(safe-area-inset-top) + 121px));
	right: max(18px, env(safe-area-inset-right));
	z-index: 505;

	@media (min-width: 1025px) {
		display: none;
	}
`;

export const AdditionalSettingsTrigger = styled.button<{ $open: boolean }>`
	display: ${({ $open }) => ($open ? 'none' : 'flex')};
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border: 1px solid rgba(16, 185, 129, 0.3);
	border-radius: 50%;
	background: ${COLORS.gray500};
	opacity: 0.6;
	color: #ffffff;
	font-size: 20px;
	cursor: pointer;
	transition: transform 150ms ease, box-shadow 150ms ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 18px 32px rgba(5, 150, 105, 0.36);
	}

	&:focus-visible {
		outline: 3px solid rgba(16, 185, 129, 0.24);
		outline-offset: 3px;
	}

	@media (max-width: 1024px) {
		width: 40px;
		height: 40px;
		font-size: 16px;
	}
`;

export const AdditionalSettingsMenu = styled.div`
	position: absolute;
	top: calc(100% + 8px);
	right: 0;
	width: min(270px, calc(100vw - 36px));
	padding: 6px;
	border: 1px solid #dbe5e1;
	border-radius: 14px;
	background: #ffffff;
	box-shadow: 0 18px 38px rgba(15, 23, 42, 0.18);
`;

export const AdditionalSettingsMenuItem = styled.button`
	width: 100%;
	padding: 10px 12px;
	border: none;
	border-radius: 10px;
	background: transparent;
	text-align: left;
	cursor: pointer;

	&:hover {
		background: #f0fdf4;
	}

	strong,
	span {
		display: block;
	}

	strong {
		color: #0f172a;
		font-size: 13px;
	}

	span {
		margin-top: 2px;
		color: #64748b;
		font-size: 11px;
		line-height: 1.35;
	}
`;

export const ActiveFilterBadge = styled.span`
	position: absolute;
	top: -5px;
	right: -3px;
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 22px;
	height: 22px;
	padding: 0 6px;
	border: 2px solid #ffffff;
	border-radius: 999px;
	background: #0f172a;
	color: #ffffff;
	font-size: 11px;
	font-weight: 800;
`;

export const FilterPanel = styled.aside<{ $open: boolean }>`
	position: fixed;
	top: max(72px, calc(env(safe-area-inset-top) + 62px));
	right: max(16px, env(safe-area-inset-right));
	width: min(920px, calc(100vw - 64px));
	max-height: min(72vh, 560px);
	padding: 20px;
	border: 1px solid #dbe5e1;
	border-radius: 20px;
	background: rgba(255, 255, 255, 0.98);
	box-shadow: 0 24px 60px rgba(15, 23, 42, 0.22);
	z-index: 1100;
	overflow: visible;
	opacity: ${({ $open }) => ($open ? 1 : 0)};
	transform: ${({ $open }) =>
		$open ? 'translateX(0) scaleX(1)' : 'translateX(48px) scaleX(0.72)'};
	transform-origin: right top;
	pointer-events: ${({ $open }) => ($open ? 'auto' : 'none')};
	transition: opacity 160ms ease, transform 190ms ease;

	@media (max-width: 1024px) {
		top: max(68px, calc(env(safe-area-inset-top) + 60px));
		right: max(10px, env(safe-area-inset-right));
		width: calc(100vw - 20px);
		max-height: calc(100dvh - 154px - env(safe-area-inset-bottom));
		padding: 16px;
		border-radius: 16px;
		overflow-y: auto;
	}

	@media (min-width: 1025px) {
		display: none;
	}
`;

export const CollapseButton = styled.button`
	position: absolute;
	top: 18px;
	left: -46px;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border: 1px solid #dbe5e1;
	border-radius: 12px 0 0 12px;
	background: #ffffff;
	color: #334155;
	font-size: 16px;
	box-shadow: -8px 10px 22px rgba(15, 23, 42, 0.1);
	cursor: pointer;

	&:hover {
		color: ${COLORS.primaryDark};
		background: #f0fdf4;
	}

	@media (max-width: 1024px) {
		position: static;
		width: 40px;
		height: 40px;
		border-radius: 10px;
		box-shadow: none;
	}
`;

export const FilterPanelHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 16px;
`;

export const FilterPanelTitleBlock = styled.div`
	min-width: 0;

	h2 {
		margin: 0;
		color: #0f172a;
		font-size: 18px;
		font-weight: 800;
	}

	p {
		margin: 4px 0 0;
		color: #64748b;
		font-size: 13px;
		line-height: 1.4;
	}
`;

export const FilterPanelBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;

	input[type='search'] {
		min-height: 48px;
	}
`;

export const FilterPanelActions = styled.div`
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	margin-top: 18px;
	padding-top: 14px;
	border-top: 1px solid #e2e8f0;

	@media (max-width: 480px) {
		display: grid;
		grid-template-columns: 1fr 1fr;
	}
`;

export const ClearDraftButton = styled.button`
	min-height: 42px;
	padding: 9px 16px;
	border: 1px solid #cbd5e1;
	border-radius: 10px;
	background: #ffffff;
	color: #475569;
	font-size: 13px;
	font-weight: 750;
	cursor: pointer;
`;

export const ApplyFilterButton = styled.button`
	min-height: 42px;
	padding: 9px 20px;
	border: none;
	border-radius: 10px;
	background: ${COLORS.gradientPrimary};
	color: #ffffff;
	font-size: 13px;
	font-weight: 800;
	box-shadow: 0 8px 18px rgba(5, 150, 105, 0.22);
	cursor: pointer;
`;
