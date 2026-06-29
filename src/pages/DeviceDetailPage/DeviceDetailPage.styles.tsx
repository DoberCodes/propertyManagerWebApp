import styled from "styled-components";
import { COLORS } from '../../constants/colors';

// Styled components for parts management
export const PartsTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;

    thead {
        background-color: ${COLORS.borderLight};
    }

    th {
        text-align: left;
        padding: 12px;
        font-weight: 600;
        font-size: 14px;
        border-bottom: 2px solid ${COLORS.border};
        color: ${COLORS.gray700};
    }

    td {
        padding: 12px;
        border-bottom: 1px solid ${COLORS.border};
        font-size: 14px;
    }

    tbody tr:hover {
        background-color: ${COLORS.bgLight};
    }
`;

export const ActionButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 8px;
    color: ${COLORS.textSecondary};
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;

    &:hover {
        background-color: ${COLORS.border};
        color: ${COLORS.gray700};
    }

    &.delete:hover {
        color: ${COLORS.errorDark};
        background-color: ${COLORS.errorLight};
    }
`;

export const PartsForm = styled.div`
    background-color: ${COLORS.bgLight};
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid ${COLORS.border};
`;

export const FormRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 12px;
    align-items: flex-end;
    margin-bottom: 12px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const DynamicFieldsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 12px;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const FormField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const FormLabel = styled.label`
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
`;

export const FormInput = styled.input`
    padding: 8px 12px;
    border: 1px solid ${COLORS.gray300};
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: ${COLORS.primaryDark};
        box-shadow: 0 0 0 3px ${COLORS.primaryLight};
    }
`;

export const FormSelect = styled.select`
    padding: 8px 12px;
    border: 1px solid ${COLORS.gray300};
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: ${COLORS.primaryDark};
        box-shadow: 0 0 0 3px ${COLORS.primaryLight};
    }
`;

export const FormTextarea = styled.textarea`
    padding: 8px 12px;
    border: 1px solid ${COLORS.gray300};
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    min-height: 72px;

    &:focus {
        outline: none;
        border-color: ${COLORS.primaryDark};
        box-shadow: 0 0 0 3px ${COLORS.primaryLight};
    }
`;

export const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
`;

export const SubmitButton = styled.button`
    padding: 8px 16px;
    background-color: ${COLORS.primaryDark};
    color: ${COLORS.white};
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background-color: ${COLORS.primaryHover};
    }
`;

export const CancelButton = styled.button`
    padding: 8px 16px;
    background-color: ${COLORS.border};
    color: ${COLORS.gray700};
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background-color: ${COLORS.gray300};
    }
`;

export const ScanButton = styled.button`
    padding: 8px 14px;
    background-color: ${COLORS.white};
    color: ${COLORS.primaryDark};
    border: 1px solid ${COLORS.primaryDark};
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background-color: ${COLORS.primaryLight};
    }
`;

export const CombinedHistoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

export const PageStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 1280px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
        display: none;
    }
`;

export const MobileCardStack = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const MobileDetailCard = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    background: ${COLORS.white};
`;

export const MobileDetailHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
`;

export const MobileDetailTitle = styled.div`
    font-size: 0.95rem;
    font-weight: 800;
    line-height: 1.35;
    color: ${COLORS.textPrimary};
`;

export const MobileDetailMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.82rem;
    color: ${COLORS.textSecondary};
`;

export const SummaryCard = styled.div`
    background: ${COLORS.white};
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    padding: 14px 16px;
`;

export const SummaryLabel = styled.div`
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
    margin-bottom: 6px;
`;

export const SummaryValue = styled.div`
    font-size: 30px;
    line-height: 1;
    font-weight: 700;
    color: ${COLORS.textPrimary};
`;

export const QuickActionPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    background: linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.bgLight} 100%);
    padding: 14px;

    @media (max-width: 1024px) {
        display: none;
    }
`;

export const ViewActionsButton = styled.button`
    border: 1px solid ${COLORS.primaryDark};
    background: ${COLORS.white};
    color: ${COLORS.primaryDark};
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover {
        background: ${COLORS.primaryLight};
        border-color: ${COLORS.primaryHover};
    }

    @media (max-width: 480px) {
        padding: 8px 10px;
        font-size: 11px;
    }
`;

export const QuickActionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;

    div {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    h3 {
        margin: 0;
        font-size: 1.02rem;
        font-weight: 800;
        color: ${COLORS.textPrimary};
    }

    p {
        margin: 0;
        font-size: 0.86rem;
        color: ${COLORS.textSecondary};
    }
`;

export const QuickActionGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

export const QuickActionButton = styled.button`
    border: 1px solid ${COLORS.border};
    background: ${COLORS.white};
    border-radius: 10px;
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;

    strong {
        display: block;
        font-size: 0.92rem;
        font-weight: 800;
        color: ${COLORS.textPrimary};
        margin-bottom: 4px;
    }

    span {
        display: block;
        font-size: 0.78rem;
        line-height: 1.35;
        color: ${COLORS.textSecondary};
    }

    &:hover {
        border-color: ${COLORS.primary};
        background: ${COLORS.successLight};
        transform: translateY(-1px);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.65;
        border-color: ${COLORS.border};
        background: ${COLORS.bgLight};
        transform: none;
    }
`;

export const QuickActionHint = styled.div`
    font-size: 0.8rem;
    color: ${COLORS.textSecondary};
`;

export const TimelineList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const TimelineItem = styled.div`
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    background: ${COLORS.white};

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

export const TimelineDate = styled.div`
    font-size: 0.8rem;
    font-weight: 800;
    color: ${COLORS.primary};
`;

export const TimelineDateSub = styled.div`
    margin-top: 2px;
    font-size: 0.72rem;
    font-weight: 600;
    color: ${COLORS.textMuted};
`;

export const TimelineContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const TimelineTitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;

export const TimelineIconBadge = styled.span<{ $color: string; $background: string }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 8px;
    color: ${(props) => props.$color};
    background: ${(props) => props.$background};
    font-size: 0.75rem;
    flex-shrink: 0;
`;

export const TimelineTitle = styled.div`
    font-size: 0.95rem;
    font-weight: 800;
    color: ${COLORS.textPrimary};
    margin-bottom: 4px;
`;

export const TimelineEventBadge = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: ${COLORS.gray700};
    background: ${COLORS.border};
`;

export const TimelineDescription = styled.div`
    font-size: 0.88rem;
    color: ${COLORS.gray600};
    line-height: 1.45;
`;

export const TimelineMeta = styled.div`
    margin-top: 6px;
    font-size: 0.76rem;
    color: ${COLORS.textSecondary};
`;

export const TimelineExpandButton = styled.button`
    margin-top: 8px;
    align-self: flex-start;
    border: 1px solid ${COLORS.gray300};
    background: ${COLORS.bgLight};
    color: ${COLORS.gray700};
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background: ${COLORS.borderLight};
        border-color: ${COLORS.textMuted};
    }
`;

export const TimelineDetailsPanel = styled.div`
    margin-top: 10px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid ${COLORS.border};
    background: ${COLORS.bgLight};
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

export const TimelineDetailBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const TimelineDetailLabel = styled.div`
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
`;

export const TimelineDetailValue = styled.div`
    font-size: 0.82rem;
    line-height: 1.45;
    color: ${COLORS.gray700};
`;

export const TimelineAttachmentList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const TimelineAttachmentLink = styled.a`
    font-size: 0.82rem;
    line-height: 1.4;
    color: ${COLORS.infoDark};
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

export const PhotoSection = styled.div`
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 16px;
    margin-bottom: 16px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

export const DevicePhotoCard = styled.div`
    background: ${COLORS.bgLight};
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    padding: 10px;
    min-height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const DevicePhotoImg = styled.img`
    width: 100%;
    height: 220px;
    object-fit: cover;
    border-radius: 8px;
`;

export const PhotoPlaceholder = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: ${COLORS.textSecondary};
    text-align: center;
    padding: 0 12px;
`;

export const PhotoActions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
`;

export const PhotoActionButton = styled.button`
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${COLORS.primaryDark};
    background: ${COLORS.primaryDark};
    color: ${COLORS.white};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }
`;

export const RemovePhotoButton = styled.button`
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid ${COLORS.errorDark};
    background: ${COLORS.white};
    color: ${COLORS.errorDark};
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
`;

export const PhotoHelperText = styled.div`
    font-size: 12px;
    color: ${COLORS.textSecondary};
`;

export const SectionBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 6px 0 14px;
`;

export const SectionEyebrow = styled.span`
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
`;

export const SectionTitleStrong = styled.h3`
    margin: 0;
    font-size: 1.08rem;
    font-weight: 800;
    color: ${COLORS.textPrimary};
`;

export const SectionDescription = styled.p`
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: ${COLORS.gray600};
`;

export const UpcomingCareCard = styled.div`
    background: ${COLORS.white};
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    padding: 14px 18px;
    margin-top: 12px;
`;

export const UpcomingCareHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
`;

export const UpcomingCareTitle = styled.h4`
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: ${COLORS.textPrimary};
`;

export const UpcomingCareLink = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: ${COLORS.info};
    &:hover { text-decoration: underline; }
`;

export const UpcomingCareRows = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const UpcomingCareRow = styled.div<{ $tone?: 'error' | 'success' | 'info' | 'neutral' }>`
    font-size: 0.88rem;
    padding: 6px 10px;
    border-radius: 6px;
    color: ${(props) =>
        props.$tone === 'error'
            ? COLORS.errorDark
            : props.$tone === 'success'
                ? COLORS.successDark
                : props.$tone === 'info'
                    ? COLORS.infoDark
                    : COLORS.gray600};
    background: ${(props) =>
        props.$tone === 'error'
            ? COLORS.errorLight
            : props.$tone === 'success'
                ? COLORS.successLight
                : props.$tone === 'info'
                    ? COLORS.infoLight
                    : COLORS.bgLight};
`;
