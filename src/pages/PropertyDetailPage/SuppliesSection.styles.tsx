import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import {
	AddSpaceButton,
	ArchivedSpacesPanel,
	ArchivedSpacesToggle,
	SpaceActions,
	SpaceCard,
	SpaceCardHeader,
	SpaceDetailEmpty,
	SpaceDetailItem,
	SpaceDetailList,
	SpaceFormError,
	SpaceFormHint,
	SpaceLinkedCount,
	SpaceNotes,
	SpacesContainer,
	SpacesEmptyState,
	SpacesGrid,
	SpacesHeader,
	SpacesHeading,
	SpacesStatus,
	SpaceTypeBadge,
} from './SpacesSection.styles';

export const SuppliesContainer = SpacesContainer;
export const SuppliesHeader = SpacesHeader;
export const SuppliesHeading = SpacesHeading;
export const AddSupplyButton = AddSpaceButton;
export const SuppliesGrid = SpacesGrid;
export const SupplyCard = SpaceCard;
export const SupplyCardHeader = SpaceCardHeader;
export const SupplyTypeBadge = SpaceTypeBadge;
export const SupplyNotes = SpaceNotes;
export const ArchivedSuppliesToggle = ArchivedSpacesToggle;
export const ArchivedSuppliesPanel = ArchivedSpacesPanel;
export const SupplyLinkedCount = SpaceLinkedCount;
export const SupplyActions = SpaceActions;
export const SuppliesEmptyState = SpacesEmptyState;
export const SupplyFormHint = SpaceFormHint;
export const SupplyFormError = SpaceFormError;
export const SuppliesStatus = SpacesStatus;
export const SupplyDetailList = SpaceDetailList;
export const SupplyDetailItem = SpaceDetailItem;
export const SupplyDetailEmpty = SpaceDetailEmpty;

export const SupplyMetadata = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem 0.75rem;
	color: ${COLORS.textSecondary};
	font-size: 0.82rem;
`;

export const SupplyConnectionFields = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 0.5rem;
	padding-top: 1rem;
	border-top: 1px solid ${COLORS.gray200};
`;

export const SupplyConnectionSummary = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 0.45rem;
	margin: 0 0 1rem;

	span {
		padding: 0.3rem 0.55rem;
		border-radius: 999px;
		background: ${COLORS.gray100};
		color: ${COLORS.textSecondary};
		font-size: 0.78rem;
		font-weight: 700;
	}
`;
