import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	flex: 0 0 auto;
	min-height: 100%;
	width: 100%;
	overflow: visible;
	background-color: ${COLORS.bgLight};

	&::after {
		content: '';
		display: block;
		width: 100%;
		height: max(16px, calc(var(--mobile-bottom-nav-offset, 0px) + 16px));
		flex: 0 0 auto;
	}

	@media (max-width: 1024px) {
		&::after {
			height: calc(var(--mobile-bottom-nav-offset, 0px) + 18px);
		}
	}

	@media (max-width: 480px) {
		&::after {
			height: calc(var(--mobile-bottom-nav-offset, 0px) + 16px);
		}
	}
`;

export const Container = styled.div`
	background: ${COLORS.bgWhite};
	margin: 0;
	padding: 2rem;
	width: 100%;
	max-width: 100%;
	position: relative;
	z-index: 1;
	box-shadow: none;
	border-radius: 0;
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;

	@media (max-width: 1024px) {
		padding: 1.5rem;
	}

	@media (max-width: 480px) {
		padding: 1rem;
	}
`;

export const UserProfileHeader = styled.div`
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 16px;

	@media (max-width: 480px) {
		gap: 12px;
	}
`;

export const FormContentWrapper = styled.div`
	width: 100%;
	max-width: 800px;
`;

export const PageHeader = styled.div`
	position: relative;
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	align-content: flex-end;

`;

export const PageTitle = styled.h1`
	font-size: 1.75rem;
	color: ${COLORS.textPrimary};
	margin: 0;
	font-weight: 600;

	@media (max-width: 480px) {
		font-size: 1.875rem;
	}
`;

export const FormSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1.5rem;
	margin-bottom: 2rem;
`;

export const ImageUploadSection = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	align-items: center;
	padding: 2rem 0;
`;

export const ImagePreview = styled.img`
	width: 120px;
	height: 120px;
	border-radius: 50%;
	object-fit: cover;
	border: 3px solid ${COLORS.primary};
	box-shadow: 0 0 0 4px ${COLORS.primaryLight};
`;

export const ImageView = styled.img`
	width: 75%;
	height: auto;
	border-radius: 100%;
	object-fit: cover;
	border: 2px solid ${COLORS.gray300};
	box-shadow: 0 0 0 2px ${COLORS.gray100};
`;

export const ImageUploadInput = styled.input`
	display: none;
`;

export const ImageUploadButton = styled.button`
	padding: 0.75rem 1.25rem;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 6px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;
	width: fit-content;
	box-shadow: ${COLORS.shadowMd};

	&:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: ${COLORS.shadowLg};
	}

	&:disabled {
		background: ${COLORS.gray300};
		cursor: not-allowed;
	}
`;

export const StatusPill = styled.div`
	padding: 0.25rem 0.75rem;
	background-color: ${COLORS.gray300};
	color: ${COLORS.textPrimary};
	border-radius: 9999px;
	font-size: 0.75rem;
	font-weight: 600;
	text-transform: uppercase;
`;

export const AccountSummaryCard = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 1.25rem 2rem;
	padding: 1.25rem;
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	box-shadow: ${COLORS.shadow};
	margin-bottom: 1.5rem;

	@media (max-width: 480px) {
		gap: 1rem;
		padding: 1rem;
	}
`;

export const AccountSummaryMetric = styled.div`
	display: grid;
	grid-template-columns: 34px minmax(0, 1fr);
	align-items: center;
	gap: 0.75rem;
	min-width: 0;
`;

export const AccountSummaryIcon = styled.div`
	width: 34px;
	height: 34px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 10px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 16px;
`;

export const AccountSummaryValue = styled.div`
	color: ${COLORS.gray900};
	font-size: 1rem;
	font-weight: 800;
	line-height: 1.1;
`;

export const AccountSummaryLabel = styled.div`
	margin-top: 0.25rem;
	color: ${COLORS.gray500};
	font-size: 0.75rem;
	font-weight: 500;
	line-height: 1.25;
`;

export const ProfileSectionHeader = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin: 1.5rem 0 0.75rem;
`;

export const ProfileSectionTitle = styled.h2`
	margin: 0;
	color: ${COLORS.gray900};
	font-size: 1rem;
	font-weight: 700;
`;

export const ProfileSectionLink = styled.a`
	color: ${COLORS.primaryDark};
	font-size: 0.875rem;
	font-weight: 600;
	text-decoration: none;

	&:hover {
		text-decoration: underline;
	}
`;

export const ProfileListCard = styled.div`
	overflow: hidden;
	background: ${COLORS.bgWhite};
	border: 1px solid ${COLORS.gray200};
	border-radius: 12px;
	box-shadow: ${COLORS.shadow};
`;

export const ActivityRow = styled.div`
	display: grid;
	grid-template-columns: 36px minmax(0, 1fr) auto;
	align-items: center;
	gap: 0.75rem;
	padding: 0.9rem 1rem;

	& + & {
		border-top: 1px solid ${COLORS.gray100};
	}
`;

export const ActivityIcon = styled.div`
	width: 36px;
	height: 36px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 10px;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
`;

export const ActivityTitle = styled.div`
	color: ${COLORS.gray900};
	font-size: 0.875rem;
	font-weight: 700;
	line-height: 1.3;
`;

export const ActivityDetail = styled.div`
	margin-top: 0.15rem;
	overflow: hidden;
	color: ${COLORS.gray500};
	font-size: 0.75rem;
	line-height: 1.3;
	text-overflow: ellipsis;
	white-space: nowrap;
`;

export const ActivityTime = styled.div`
	color: ${COLORS.gray400};
	font-size: 0.75rem;
	white-space: nowrap;
`;

export const TeamGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`;

export const TeamMemberRow = styled.div`
	display: grid;
	grid-template-columns: 42px minmax(0, 1fr);
	align-items: center;
	gap: 0.75rem;
	padding: 1rem;
	border-bottom: 1px solid ${COLORS.gray100};

	&:nth-child(odd) {
		border-right: 1px solid ${COLORS.gray100};
	}

	@media (max-width: 560px) {
		&:nth-child(odd) {
			border-right: 0;
		}
	}
`;

export const TeamMemberAvatar = styled.div`
	width: 42px;
	height: 42px;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border-radius: 50%;
	background: ${COLORS.primaryLight};
	color: ${COLORS.primaryDark};
	font-size: 0.875rem;
	font-weight: 800;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
`;

export const EmptyProfileSection = styled.div`
	padding: 1.25rem;
	color: ${COLORS.gray500};
	font-size: 0.875rem;
	text-align: center;
`;

export const ButtonGroup = styled.div`
	display: flex;
	gap: 0.75rem;
	align-items: center;

	@media (max-width: 480px) {
		flex-direction: row;
		justify-content: flex-end;
	}
`;

export const CancelButton = styled.button`
	padding: 0.625rem 1.25rem;
	background-color: ${COLORS.bgWhite};
	color: ${COLORS.textPrimary};
	border: 1px solid ${COLORS.border};
	border-radius: 6px;
	font-weight: 600;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: ${COLORS.gray100};
		border-color: ${COLORS.gray300};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 0.75rem 1.25rem;
		font-size: 16px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
`;

export const SaveButton = styled.button`
	padding: 0.625rem 1.5rem;
	background: ${COLORS.gradientPrimary};
	color: ${COLORS.bgWhite};
	border: none;
	border-radius: 6px;
	font-weight: 600;
	font-size: 14px;
	cursor: pointer;
	transition: all 0.2s;
	box-shadow: ${COLORS.shadowMd};

	&:hover:not(:disabled) {
		background: linear-gradient(
			135deg,
			${COLORS.primaryDark} 0%,
			${COLORS.primaryDarker} 100%
		);
		box-shadow: ${COLORS.shadowLg};
	}

	&:disabled {
		background: ${COLORS.gray300};
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		padding: 0.75rem 1.5rem;
		font-size: 16px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}
`;

export const ErrorMessage = styled.div`
	background-color: #fef2f2;
	color: ${COLORS.error};
	padding: 1rem;
	border-radius: 6px;
	border-left: 4px solid ${COLORS.error};
	font-size: 0.95rem;
`;

export const SuccessMessage = styled.div`
	background-color: #f0fdf4;
	color: ${COLORS.success};
	padding: 1rem;
	border-radius: 6px;
	border-left: 4px solid ${COLORS.success};
	font-size: 0.95rem;
`;

export const LoadingOverlay = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(255, 255, 255, 0.7);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10;

	&::after {
		content: '';
		width: 40px;
		height: 40px;
		border: 4px solid ${COLORS.primaryLight};
		border-top-color: ${COLORS.primary};
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
`;
