import styled from 'styled-components';
import { DialogContent as BaseDialogContent } from '../../Components/Library';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
	width: 100%;
	min-height: 0;
	flex: 0 0 auto;
	box-sizing: border-box;
	overflow: visible;

	&::after {
		content: '';
		display: block;
		width: 100%;
		height: max(16px, calc(var(--mobile-bottom-nav-offset, 0px) + 16px));
		flex: 0 0 auto;
	}

	@media (max-width: 1024px) {
		gap: 15px;

		&::after {
			height: calc(var(--mobile-bottom-nav-offset, 0px) + 18px);
		}
	}

	@media (max-width: 480px) {
		gap: 12px;

		&::after {
			height: calc(var(--mobile-bottom-nav-offset, 0px) + 16px);
		}
	}
`;

export const HeaderActions = styled.div`
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	align-items: center;
	justify-content: flex-end;

	@media (max-width: 768px) {
		display: none;
	}
`;

export const MobileTeamGroupActions = styled.div`
	display: none;

	@media (max-width: 768px) {
		position: fixed;
		top: max(188px, calc(env(safe-area-inset-top) + 134px));
		right: max(18px, env(safe-area-inset-right));
		z-index: 505;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
		pointer-events: none;
	}
`;

export const FloatingTeamGroupButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	padding: 0;
	border: 1px solid rgba(4, 120, 87, 0.38);
	border-radius: 50%;
	background: #6b7280;
	opacity: 0.6;
	color: ${COLORS.white};
	font-size: 16px;
	box-shadow: none;
	cursor: pointer;
	pointer-events: auto;
	transition: transform 150ms ease, box-shadow 150ms ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 18px 32px rgba(4, 120, 87, 0.36);
	}

	&:focus-visible {
		outline: 3px solid ${COLORS.primaryLight};
		outline-offset: 3px;
	}
`;

export const TeamHero = styled.section`
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
	gap: 18px;
	align-items: stretch;
	padding: 24px;
	border: 1px solid ${COLORS.primaryLight};
	border-radius: 24px;
	background:
		linear-gradient(135deg, rgba(4, 120, 87, 0.96), rgba(0, 158, 113, 0.9)),
		${COLORS.maintleyGreen};
	box-shadow: 0 24px 70px rgba(4, 120, 87, 0.18);
	color: ${COLORS.white};

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		padding: 20px;
		border-radius: 20px;
	}

	@media (max-width: 768px) {
		padding: 18px;
		box-shadow: 0 18px 46px rgba(4, 120, 87, 0.16);
	}
`;

export const TeamHeroContent = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 12px;
	max-width: 720px;
`;

export const TeamHeroEyebrow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	width: fit-content;
	padding: 7px 10px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.14);
	border: 1px solid rgba(255, 255, 255, 0.24);
	color: ${COLORS.white};
	font-size: 12px;
	font-weight: 800;
	letter-spacing: 0.08em;
	text-transform: uppercase;
`;

export const TeamHeroTitle = styled.h2`
	margin: 0;
	font-size: clamp(24px, 4vw, 38px);
	line-height: 1.05;
	font-weight: 850;
	letter-spacing: -0.04em;
`;

export const TeamHeroText = styled.p`
	max-width: 620px;
	margin: 0;
	color: rgba(255, 255, 255, 0.82);
	font-size: 15px;
	line-height: 1.6;
`;

export const TeamStatsGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;

	@media (max-width: 768px) {
		display: none;
	}
`;

export const TeamStatCard = styled.div`
	padding: 16px;
	border-radius: 18px;
	background: rgba(255, 255, 255, 0.94);
	color: ${COLORS.primaryDark};
	box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
`;

export const TeamStatValue = styled.div`
	font-size: 28px;
	font-weight: 850;
	line-height: 1;
`;

export const TeamStatLabel = styled.div`
	margin-top: 6px;
	color: ${COLORS.primary};
	font-size: 12px;
	font-weight: 800;
	line-height: 1.25;
`;

export const PageHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	padding-bottom: 20px;
	border-bottom: 2px solid #e5e7eb;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		gap: 10px;
		padding-bottom: 15px;
	}
`;

export const PageTitle = styled.h1`
	font-size: 32px;
	font-weight: 800;
	color: #1f2937;
	margin: 0;
	letter-spacing: 0.5px;

	@media (max-width: 1024px) {
		font-size: 28px;
	}

	@media (max-width: 480px) {
		font-size: 24px;
	}
`;

export const AddTeamGroupButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.white};
	border: 1px solid rgba(4, 120, 87, 0.3);
	padding: 11px 16px;
	border-radius: 999px;
	font-size: 14px;
	font-weight: 800;
	cursor: pointer;
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		background 0.2s ease;
	white-space: nowrap;
	box-shadow: 0 10px 24px rgba(4, 120, 87, 0.22);

	&:hover {
		background: ${COLORS.gradientPrimary};
		transform: translateY(-1px);
		box-shadow: 0 14px 30px rgba(4, 120, 87, 0.28);
	}

	&:disabled {
		background-color: #d1d5db;
		cursor: not-allowed;
	}

	@media (max-width: 1024px) {
		padding: 10px 16px;
		font-size: 12px;
	}

	@media (max-width: 480px) {
		padding: 11px 12px;
		font-size: 12px;
		width: 100%;
	}
`;

export const TeamGroupSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const TeamGroupHeader = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	padding: 16px 18px;
	background: rgba(255, 255, 255, 0.92);
	border: 1px solid #e2e8f0;
	border-radius: 18px;
	box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
	flex-wrap: wrap;
	margin-bottom: 12px;

	@media (max-width: 1024px) {
		padding: 12px 16px;
		gap: 12px;
	}

	@media (max-width: 480px) {
		padding: 14px;
	}
`;

export const TeamGroupTitleBlock = styled.div`
	display: flex;
	flex: 1;
	min-width: 0;
	flex-direction: column;
	gap: 4px;
`;

export const TeamGroupTitle = styled.h2`
	font-size: 20px;
	font-weight: 850;
	color: #0f172a;
	margin: 0;
	letter-spacing: -0.02em;

	@media (max-width: 1024px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const TeamGroupNameInput = styled.input`
	font-size: 20px;
	font-weight: 700;
	color: #1f2937;
	margin: 0;
	flex: 1;
	letter-spacing: 0.3px;
	border: 2px solid ${COLORS.primaryHover};
	border-radius: 6px;
	padding: 6px 12px;
	background-color: ${COLORS.primaryLight};
	font-family: inherit;

	&:focus {
		outline: none;
		border-color: ${COLORS.primary};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}

	@media (max-width: 1024px) {
		font-size: 18px;
	}

	@media (max-width: 480px) {
		font-size: 16px;
	}
`;

export const TeamGroupActions = styled.div`
	display: flex;
	gap: 8px;
	align-items: center;

	@media (max-width: 768px) {
		display: none;
	}
`;

export const TeamGroupActionButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	min-height: 34px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 999px;
	color: #64748b;
	font-size: 0;
	font-weight: 800;
	cursor: pointer;
	padding: 0 10px;
	transition:
		background 0.2s ease,
		border-color 0.2s ease,
		color 0.2s ease,
		transform 0.2s ease;

	svg {
		font-size: 14px;
	}

	&::after {
		content: attr(aria-label);
		font-size: 12px;
	}

	&:hover {
		background: ${COLORS.primaryLight};
		border-color: ${COLORS.primaryHover};
		color: ${COLORS.primary};
		transform: translateY(-1px);
	}

	@media (max-width: 480px) {
		min-height: 38px;
	}
`;

export const TeamMembersGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: 14px;
	padding: 0 0 10px;

	@media (max-width: 1024px) {
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 12px;
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 12px;
		padding: 0;
	}
`;

export const TeamGroupMeta = styled.div`
	color: #64748b;
	font-size: 13px;
	font-weight: 700;
`;

export const TeamMemberCard = styled.div`
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	gap: 14px;
	padding: 16px;
	background: rgba(255, 255, 255, 0.96);
	border: 1px solid #e2e8f0;
	border-radius: 18px;
	box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
	cursor: pointer;
	transition:
		box-shadow 0.2s ease,
		border-color 0.2s ease,
		transform 0.2s ease;

	&:hover {
		border-color: #bbf7d0;
		box-shadow: 0 18px 42px rgba(15, 118, 110, 0.12);
		transform: translateY(-2px);
	}

	@media (max-width: 1024px) {
		padding: 12px;
		gap: 8px;
	}

	@media (max-width: 480px) {
		align-items: stretch;
		padding: 14px;
		gap: 12px;
	}
`;

export const TeamMemberIdentity = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	min-width: 0;
`;

export const TeamMemberAvatarWrap = styled.div`
	flex: 0 0 auto;
`;

export const TeamMemberImage = styled.img`
	width: 54px;
	height: 54px;
	border-radius: 50%;
	object-fit: cover;
	background-color: ${COLORS.successLight};
	border: 2px solid ${COLORS.successLight};

	@media (max-width: 1024px) {
		width: 50px;
		height: 50px;
	}

	@media (max-width: 480px) {
		width: 48px;
		height: 48px;
	}
`;

export const TeamMemberImagePlaceholder = styled.div`
	width: 54px;
	height: 54px;
	border-radius: 50%;
	background: ${COLORS.gradientPrimary};
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	color: ${COLORS.white};
	font-weight: 850;
	line-height: 1;
	text-align: center;
	word-break: break-all;
	border: 2px solid ${COLORS.primaryHover};

	@media (max-width: 1024px) {
		width: 50px;
		height: 50px;
		font-size: 17px;
	}

	@media (max-width: 480px) {
		width: 48px;
		height: 48px;
		font-size: 16px;
	}
`;

export const TeamMemberDetails = styled.div`
	display: flex;
	min-width: 0;
	flex: 1;
	flex-direction: column;
	align-items: flex-start;
	gap: 5px;
`;

export const TeamMemberName = styled.h3`
	font-size: 15px;
	font-weight: 850;
	color: #0f172a;
	margin: 0;
	text-align: left;
	word-break: break-word;
	line-height: 1.2;

	@media (max-width: 1024px) {
		font-size: 14px;
	}

	@media (max-width: 480px) {
		font-size: 14px;
	}
`;

export const TeamMemberTitle = styled.p`
	font-size: 12px;
	color: #64748b;
	margin: 0;
	text-align: left;
	line-height: 1.3;
`;

export const TeamMemberProperties = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin-top: 2px;
`;

export const TeamMemberPropertiesLabel = styled.div`
	font-size: 10px;
	font-weight: 700;
	color: #64748b;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	text-align: left;
`;

export const TeamMemberPropertyList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
	justify-content: flex-start;

	@media (max-width: 480px) {
		justify-content: flex-start;
	}
`;

export const TeamMemberPropertyChip = styled.span<{ $muted?: boolean }>`
	max-width: 100%;
	padding: 4px 8px;
	border-radius: 999px;
	background: ${({ $muted }) => ($muted ? COLORS.gray50 : COLORS.primaryLight)};
	border: 1px solid ${({ $muted }) => ($muted ? COLORS.gray200 : COLORS.primaryHover)};
	color: ${({ $muted }) => ($muted ? COLORS.textSecondary : COLORS.primary)};
	font-size: 11px;
	font-weight: 700;
	line-height: 1.2;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`;

export const TeamMemberInviteToken = styled.div`
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	padding: 8px;
	border-radius: 6px;
	background: #f8fafc;
	border: 1px solid #e2e8f0;
	font-size: 11px;
	color: #475569;
	text-align: center;
`;

export const TeamMemberInviteCode = styled.code`
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
	font-size: 12px;
	font-weight: 800;
	color: #0f172a;
	word-break: break-all;
`;

export const AccessPill = styled.div<{
	$status: 'pending' | 'accepted' | 'revoked' | 'none';
}>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	width: fit-content;
	max-width: 100%;
	padding: 5px 8px;
	border-radius: 999px;
	background: ${({ $status }) => {
		if ($status === 'revoked') return '#fef2f2';
		if ($status === 'pending') return '#fffbeb';
		return COLORS.primaryLight;
	}};
	border: 1px solid
		${({ $status }) => {
			if ($status === 'revoked') return '#fecaca';
			if ($status === 'pending') return '#fde68a';
			return COLORS.primaryHover;
		}};
	color: ${({ $status }) => {
		if ($status === 'revoked') return '#b91c1c';
		if ($status === 'pending') return '#92400e';
		return COLORS.primary;
	}};
	font-size: 11px;
	font-weight: 800;
	line-height: 1.2;
`;

export const AccessControlToggle = styled.label`
	display: flex;
	align-items: flex-start;
	gap: 8px;
	margin-bottom: 12px;
	font-size: 13px;
	line-height: 1.35;
	color: #374151;

	input {
		margin-top: 2px;
		flex: 0 0 auto;
	}
`;

export const AccessControlPanel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-top: 8px;
`;

export const AccessStatusRow = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
`;

export const AccessStatusBadge = styled.div<{ $status: 'active' | 'revoked' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 700;
	color: ${({ $status }) => ($status === 'active' ? COLORS.primary : '#b91c1c')};
	background-color: ${({ $status }) =>
		$status === 'active' ? COLORS.successLight : '#fee2e2'};
`;

export const AccessStatusMeta = styled.div`
	font-size: 12px;
	color: #64748b;
	line-height: 1.35;
`;

export const AccessActionRow = styled.div`
	display: flex;
	align-items: stretch;
	gap: 10px;
	flex-wrap: wrap;
`;

export const AccessActionButton = styled.button<{
	$variant?: 'primary' | 'danger' | 'ghost';
}>`
	border: ${({ $variant }) =>
		$variant === 'ghost' ? `1px solid ${COLORS.primaryLight}` : 'none'};
	background: ${({ $variant }) => {
		if ($variant === 'danger') return '#dc3545';
		if ($variant === 'ghost') return COLORS.primaryLight;
		return '#007bff';
	}};
	color: ${({ $variant }) => ($variant === 'ghost' ? COLORS.primary : COLORS.white)};
	padding: 8px 12px;
	border-radius: 6px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;
	transition: background-color 0.2s ease, border-color 0.2s ease;

	&:hover {
		background: ${({ $variant }) => {
			if ($variant === 'danger') return '#b91c1c';
			if ($variant === 'ghost') return COLORS.successLight;
			return '#0056b3';
		}};
	}

	@media (max-width: 480px) {
		width: 100%;
	}
`;

export const AddTeamMemberCard = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	min-height: 154px;
	padding: 18px;
	background: ${COLORS.primaryLight};
	border: 1.5px dashed ${COLORS.primaryHover};
	border-radius: 18px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: ${COLORS.successLight};
		border-color: ${COLORS.primary};
		color: ${COLORS.primary};
		transform: translateY(-1px);
	}

	@media (max-width: 640px) {
		min-height: 120px;
		padding: 18px 14px;
		width: 100%;
	}
`;

export const AddIcon = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 999px;
	background: ${COLORS.bgWhite};
	color: ${COLORS.primary};
	font-size: 18px;
	box-shadow: 0 10px 22px rgba(4, 120, 87, 0.16);
`;

export const AddText = styled.p`
	font-size: 13px;
	font-weight: 850;
	color: ${COLORS.primary};
	margin: 0;
	text-align: center;
`;

// Keep TeamPage-specific Dialog components that differ from Library
export const TeamDialogContent = styled(BaseDialogContent)`
	border-radius: 24px;
	overflow: hidden;

	@media (max-width: 1024px) {
		width: min(94vw, 720px);
		max-width: 94vw;
		height: 88dvh;
		min-height: 0;
	}

	@media (max-width: 640px) {
		width: 100vw;
		max-width: 100vw;
		height: 100dvh;
		max-height: 100dvh;
		border-radius: 0;
	}
`;

export const TeamGroupDialogContent = styled(BaseDialogContent)`
	width: min(680px, calc(100vw - 32px));
	max-height: min(82vh, 720px);
	border-radius: 24px;
	overflow: hidden;

	@media (max-width: 640px) {
		width: 100vw;
		max-width: 100vw;
		height: 100dvh;
		max-height: 100dvh;
		border-radius: 0;
	}
`;

export const TeamGroupManagementIntro = styled.p`
	margin: 0;
	padding: 0 24px 18px;
	border-bottom: 1px solid #e2e8f0;
	color: #64748b;
	font-size: 14px;
	line-height: 1.5;

	@media (max-width: 640px) {
		padding: 0 16px 14px;
		font-size: 13px;
	}
`;

export const TeamGroupManagementList = styled.div`
	display: flex;
	flex: 1;
	min-height: 0;
	flex-direction: column;
	gap: 12px;
	padding: 18px 24px;
	overflow-y: auto;

	@media (max-width: 640px) {
		padding: 14px 16px;
	}
`;

export const TeamGroupManagementToolbar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 2px 2px 4px;
`;

export const TeamGroupManagementTitle = styled.h3`
	margin: 0;
	color: #0f172a;
	font-size: 15px;
	font-weight: 850;
	letter-spacing: -0.01em;
`;

export const TeamGroupManagementAddButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	line-height: 1;
	min-height: 38px;
	padding: 0 12px;
	border: 1px solid rgba(4, 120, 87, 0.32);
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primary};
	font-size: 12px;
	font-weight: 850;
	cursor: pointer;
	transition:
		background 0.16s ease,
		border-color 0.16s ease,
		transform 0.16s ease;

	svg {
		display: block;
		flex: 0 0 auto;
		width: 12px;
		height: 12px;
	}

	&:hover {
		background: ${COLORS.successLight};
		border-color: #86efac;
		transform: translateY(-1px);
	}

	@media (max-width: 420px) {
		width: 38px;
		height: 38px;
		min-height: 38px;
		padding: 0;
		font-size: 0;
		gap: 0;

		svg {
			width: 14px;
			height: 14px;
			font-size: 14px;
		}
	}
`;

export const TeamGroupManagementRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	padding: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 16px;
	background: ${COLORS.bgWhite};
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);

	@media (max-width: 640px) {
		align-items: stretch;
		flex-direction: column;
	}
`;

export const TeamGroupManagementInfo = styled.div`
	display: flex;
	min-width: 0;
	flex: 1;
	flex-direction: column;
	gap: 6px;
`;

export const TeamGroupManagementNameInput = styled.input`
	width: 100%;
	min-height: 42px;
	padding: 0 12px;
	border: 1px solid #cbd5e1;
	border-radius: 12px;
	background: #f8fafc;
	color: #0f172a;
	font: inherit;
	font-size: 14px;
	font-weight: 800;

	&:focus {
		outline: none;
		border-color: ${COLORS.primaryHover};
		box-shadow: 0 0 0 3px ${COLORS.primaryLight};
	}
`;

export const TeamGroupManagementMeta = styled.div`
	color: #64748b;
	font-size: 12px;
	font-weight: 700;
	line-height: 1.35;
`;

export const TeamGroupManagementActions = styled.div`
	display: flex;
	flex: 0 0 auto;
	gap: 8px;

	@media (max-width: 640px) {
		width: 100%;
	}
`;

export const TeamGroupManagementButton = styled.button<{
	$variant?: 'danger' | 'default';
}>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 40px;
	padding: 0 12px;
	border: 1px solid
		${({ $variant }) => ($variant === 'danger' ? '#fecaca' : '#dbe5e1')};
	border-radius: 999px;
	background: ${({ $variant }) =>
		$variant === 'danger' ? '#fef2f2' : '#f8fafc'};
	color: ${({ $variant }) => ($variant === 'danger' ? '#b91c1c' : '#334155')};
	font-size: 12px;
	font-weight: 850;
	cursor: pointer;

	&:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	&:hover:not(:disabled) {
		background: ${({ $variant }) =>
			$variant === 'danger' ? '#fee2e2' : COLORS.primaryLight};
	}

	@media (max-width: 640px) {
		width: 100%;
	}
`;

export const DialogTitle = styled.h2`
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

export const DialogCloseButton = styled.button`
	background: none;
	border: none;
	font-size: 0;
	cursor: pointer;
	color: #6b7280;
	padding: 0;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 999px;

	span {
		font-size: 24px;
		line-height: 1;
	}

	&:hover {
		background: #f1f5f9;
		color: #1f2937;
	}
`;

export const DialogIntro = styled.p`
	margin: 0;
	padding: 0 24px 18px;
	color: #64748b;
	font-size: 14px;
	line-height: 1.5;
	border-bottom: 1px solid #e2e8f0;

	@media (max-width: 640px) {
		padding: 0 16px 14px;
	}
`;

export const DialogBody = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 18px;
	padding: 24px;
	overflow-y: auto;
	overflow-x: hidden;
	flex: 1;
	min-height: 0;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr;
		gap: 20px;
		padding: 16px;
		align-content: start;
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
		gap: 15px;
		padding: 12px;
		-webkit-overflow-scrolling: touch;
	}
`;

export const DialogSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 16px;
	border: 1px solid #e2e8f0;
	border-radius: 18px;
	background: ${COLORS.bgWhite};
	box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);

	@media (max-width: 640px) {
		padding: 14px;
		border-radius: 16px;
	}
`;

export const CollapsibleDialogSection = styled.details`
	display: flex;
	flex-direction: column;
	padding: 16px;
	border: 1px solid #e2e8f0;
	border-radius: 18px;
	background: ${COLORS.bgWhite};
	box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);

	&[open] {
		border-color: rgba(4, 120, 87, 0.28);
	}

	@media (max-width: 640px) {
		padding: 14px;
		border-radius: 16px;
	}
`;

export const CollapsibleDialogSummary = styled.summary`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	list-style: none;
	cursor: pointer;
	color: inherit;

	&::-webkit-details-marker {
		display: none;
	}
`;

export const CollapsibleDialogBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding-top: 14px;
`;

export const DialogSectionSummaryActions = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8px;
	flex: 0 0 auto;
`;

export const DialogSectionBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	align-self: flex-start;
	min-height: 24px;
	padding: 0 9px;
	border-radius: 999px;
	background: #f1f5f9;
	color: #475569;
	font-size: 11px;
	font-weight: 850;
	white-space: nowrap;

	@media (max-width: 420px) {
		display: none;
	}
`;

export const DialogSectionChevron = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	width: 30px;
	height: 30px;
	border-radius: 999px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primary};
	font-size: 12px;
	line-height: 1;
	transition:
		background 0.18s ease,
		color 0.18s ease;

	svg {
		display: block;
		width: 12px;
		height: 12px;
	}

	details[open] & {
		background: ${COLORS.successLight};
	}
`;

export const DialogSectionHeader = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
`;

export const DialogSectionTitle = styled.h3`
	margin: 0;
	color: #0f172a;
	font-size: 15px;
	font-weight: 850;
	letter-spacing: -0.01em;
`;

export const DialogSectionText = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 12px;
	line-height: 1.45;
`;

export const InlineHelpText = styled.p`
	margin: 0;
	color: #64748b;
	font-size: 13px;
	line-height: 1.45;
`;

export const LeftColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;

	@media (max-width: 480px) {
		gap: 15px;
	}
`;

export const RightColumn = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;

	@media (max-width: 1024px) {
		gap: 15px;
	}

	@media (max-width: 640px) {
		gap: 15px;
	}
`;

export const ImageUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12px;
	padding-bottom: 4px;
`;

export const ImagePreview = styled.img`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	object-fit: cover;
	background-color: #e5e7eb;
`;

export const ImageUploadInput = styled.input`
	display: none;
`;

export const ImageUploadButton = styled.label`
	background-color: ${COLORS.primaryHover};
	color: ${COLORS.white};
	border: none;
	padding: 10px 16px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: ${COLORS.primary};
	}
`;

export const SectionTitle = styled.h3`
	font-size: 13px;
	font-weight: 600;
	color: #374151;
	margin: 0;
	padding-top: 8px;
`;

export const PropertyMultiSelect = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 14px;
	padding: 8px;
	max-height: 260px;
	overflow-y: auto;
	background-color: #f8fafc;

	@media (max-width: 1024px) {
		max-height: 240px;
	}

	@media (max-width: 640px) {
		max-height: 220px;
	}

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;

		&:hover {
			background: #94a3b8;
		}
	}
`;

export const PropertyCheckbox = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 4px;

	@media (max-width: 640px) {
		padding: 10px 4px;
	}

	input[type='checkbox'] {
		cursor: pointer;
		width: 16px;
		height: 16px;

		@media (max-width: 640px) {
			width: 20px;
			height: 20px;
		}
	}

	label {
		cursor: pointer;
		font-size: 13px;
		color: #334155;
		margin: 0;
		flex: 1;
		font-weight: 650;

		@media (max-width: 640px) {
			font-size: 14px;
		}
	}
`;

export const QuickTaskHistory = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	max-height: 180px;
	overflow-y: auto;

	&::-webkit-scrollbar {
		width: 6px;
	}

	&::-webkit-scrollbar-track {
		background: #f1f5f9;
		border-radius: 3px;
	}

	&::-webkit-scrollbar-thumb {
		background: #cbd5e1;
		border-radius: 3px;

		&:hover {
			background: #94a3b8;
		}
	}
`;

export const TaskHistoryItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8px;
	padding: 8px;
	background-color: #f9fafb;
	border-radius: 4px;
	font-size: 12px;

	span {
		color: #6b7280;
	}
`;
export const FileUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`;

export const FileUploadInput = styled.input`
	display: none;
`;

export const FileUploadButton = styled.label`
	background-color: #6b7280;
	color: ${COLORS.white};
	border: none;
	padding: 10px 16px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: #4b5563;
	}
`;

export const FileList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	max-height: 140px;
	overflow-y: auto;
`;

export const FileItem = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 8px;
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	font-size: 12px;
	color: #6b7280;
	gap: 10px;

	a,
	span {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	button {
		background: none;
		border: none;
		color: #ef4444;
		cursor: pointer;
		font-size: 14px;

		&:hover {
			color: #dc2626;
		}
	}
`;

export const DialogFooter = styled.div`
	padding: 20px 24px;
	border-top: 1px solid #e5e7eb;
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	flex-shrink: 0;

	@media (max-width: 640px) {
		padding: 12px;
		gap: 8px;
		background: #fff;
		position: sticky;
		bottom: 0;
		flex-wrap: nowrap;
	}
`;

export const RemoveFileButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	flex: 0 0 auto;
	border: 1px solid #fecaca;
	border-radius: 999px;
	background: #fef2f2;
	color: #dc2626;
	cursor: pointer;
	font-size: 0;

	svg {
		font-size: 12px;
	}

	&:hover {
		background: #fee2e2;
		color: #b91c1c;
	}
`;

export const DialogButton = styled.button`
	padding: 10px 20px;
	border-radius: 6px;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 640px) {
		flex: 1;
		min-height: 44px;
		padding: 10px 12px;
	}
`;

export const CancelButton = styled(DialogButton)`
	background-color: #e5e7eb;
	color: #374151;

	&:hover:not(:disabled) {
		background-color: #d1d5db;
	}

	@media (max-width: 640px) {
		flex: 0 0 auto;
		min-width: 72px;
		border: none;
		background: transparent;
		color: #64748b;
		text-decoration: underline;
		text-underline-offset: 3px;

		&:hover:not(:disabled) {
			background: transparent;
			color: #374151;
		}
	}
`;

export const DeleteMemberButton = styled(DialogButton)`
	margin-right: auto;
	background-color: #fef2f2;
	border-color: #fecaca;
	color: #b91c1c;

	&:hover:not(:disabled) {
		background-color: #fee2e2;
		border-color: #fca5a5;
	}

	@media (max-width: 640px) {
		flex: 0 0 auto;
	}
`;

export const SaveButton = styled(DialogButton)`
	background-color: ${COLORS.primary};
	color: ${COLORS.white};

	&:hover:not(:disabled) {
		background-color: ${COLORS.primaryHover};
	}

	@media (max-width: 640px) {
		flex: 1 1 auto;
	}
`;

export const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 40px 20px;
	background-color: ${COLORS.white};
	border-radius: 8px;
	border: 1px solid #e5e7eb;
	color: #6b7280;
	text-align: center;

	p {
		margin: 0;
		font-size: 14px;
	}
`;
