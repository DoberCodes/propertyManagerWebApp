import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { COLORS } from '../../constants/colors';

const SurfaceCard = styled.div`
    border: 1px solid ${COLORS.border};
    border-radius: 14px;
    background: ${COLORS.white};
    padding: 14px;
`;

const DevicePrimary = styled.div`
    font-size: 1.05rem;
    font-weight: 800;
    color: ${COLORS.textPrimary};
    line-height: 1.22;
`;

const IdentityTopRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
`;

const OpenProfileCue = styled.span`
    flex-shrink: 0;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: ${COLORS.textMuted};
    transition: color 0.18s ease, transform 0.18s ease;
`;

const TechnicalSubtitle = styled.div`
    margin-top: 4px;
    font-size: 0.88rem;
    font-weight: 700;
    color: ${COLORS.gray700};
    line-height: 1.35;
`;

const ContextLinks = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
`;

const ContextLink = styled(Link)`
    font-size: 0.8rem;
    font-weight: 600;
    color: ${COLORS.info};
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ContextArrow = styled.span`
    font-size: 0.78rem;
    color: ${COLORS.textMuted};
`;

const StatusPill = styled.span<{ $status: string }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    border: 1px solid
        ${(p) =>
            p.$status === 'Broken'
                ? COLORS.errorLight
                : p.$status === 'Maintenance'
                    ? COLORS.warningLight
                    : p.$status === 'Decommissioned'
                        ? COLORS.gray300
                    : COLORS.successLight};
    background: ${(p) =>
        p.$status === 'Broken'
            ? COLORS.errorLight
            : p.$status === 'Maintenance'
                ? COLORS.warningLight
                : p.$status === 'Decommissioned'
                    ? COLORS.bgLight
                : COLORS.successLight};
    color: ${(p) =>
        p.$status === 'Broken'
            ? COLORS.errorDark
            : p.$status === 'Maintenance'
                ? COLORS.warningDark
                : p.$status === 'Decommissioned'
                    ? COLORS.gray600
                : COLORS.successDark};
`;

const HubFeedGrid = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 0.9fr);
    gap: 12px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
`;

const FeedSectionTitle = styled.h2`
    margin: 0 0 4px;
    font-size: 1rem;
    font-weight: 800;
    color: ${COLORS.textPrimary};
`;

const FeedSectionText = styled.p`
    margin: 0 0 12px;
    font-size: 0.86rem;
    line-height: 1.5;
    color: ${COLORS.textSecondary};
`;

const ActivityList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const ActivityItem = styled.div`
    padding: 12px 14px;
    border: 1px solid ${COLORS.border};
    border-radius: 12px;
    background: linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.bgLight} 100%);
`;

const ActivityHeaderRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 3px;
`;

const ActivityIconBadge = styled.span<{ $color: string; $background: string }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 7px;
    color: ${(props) => props.$color};
    background: ${(props) => props.$background};
    font-size: 0.72rem;
    flex-shrink: 0;
`;

const ActivityMeta = styled.div`
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${COLORS.primary};
    margin-bottom: 4px;
`;

const ActivityTitle = styled.div`
    font-size: 0.92rem;
    font-weight: 800;
    color: ${COLORS.textPrimary};
    margin-bottom: 3px;
`;

const ActivityDescription = styled.div`
    font-size: 0.84rem;
    color: ${COLORS.textSecondary};
    line-height: 1.45;
`;

const ActivityContext = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    flex-wrap: wrap;
`;

const ActivityContextLink = styled(Link)`
    font-size: 0.78rem;
    font-weight: 600;
    color: ${COLORS.info};
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ActivityContextSep = styled.span`
    font-size: 0.72rem;
    color: ${COLORS.textMuted};
`;

const AttentionPriorityBadge = styled.span<{ $color: string; $background: string; $border: string }>`
    display: inline-flex;
    align-items: center;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${(p) => p.$color};
    background: ${(p) => p.$background};
    border: 1px solid ${(p) => p.$border};
`;

const AttentionHeaderRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
`;

const AttentionReason = styled.div`
    font-size: 0.83rem;
    color: ${COLORS.gray600};
    line-height: 1.4;
    margin-bottom: 6px;
`;

const AttentionContext = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
`;

const AttentionContextLink = styled(Link)`
    font-size: 0.78rem;
    font-weight: 600;
    color: ${COLORS.info};
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const AttentionContextSep = styled.span`
    font-size: 0.72rem;
    color: ${COLORS.textMuted};
`;

const FilterBar = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;

    @media (max-width: 1024px) {
        display: none;
    }
`;

const CompactFilterResultCount = styled.div`
    display: none;
    padding-right: 58px;
    color: ${COLORS.textSecondary};
    font-size: 0.8rem;
    font-weight: 700;

    @media (max-width: 1024px) {
        display: block;
    }
`;

const HubFilterFields = styled.div`
    display: grid;
    grid-template-columns: minmax(220px, 1.4fr) minmax(220px, 1fr);
    gap: 12px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

const HubFilterField = styled.label`
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: ${COLORS.gray600};
    font-size: 12px;
    font-weight: 800;

    > input,
    > select {
        width: 100%;
        max-width: none;
    }
`;

const SearchInput = styled.input`
    flex: 1;
    min-width: 180px;
    max-width: 320px;
    height: 36px;
    padding: 0 12px;
    border: 1px solid ${COLORS.gray300};
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 500;
    color: ${COLORS.textPrimary};
    background: ${COLORS.white};
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder {
        color: ${COLORS.textMuted};
    }

    &:focus {
        border-color: ${COLORS.primary};
        box-shadow: 0 0 0 3px ${COLORS.primaryLight};
    }
`;

const FilterGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
`;

const FilterButton = styled.button<{ $active: boolean }>`
    height: 34px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid ${(p) => (p.$active ? COLORS.primary : COLORS.border)};
    background: ${(p) => (p.$active ? COLORS.successLight : COLORS.white)};
    color: ${(p) => (p.$active ? COLORS.successDark : COLORS.gray600)};
    font-size: 0.82rem;
    font-weight: ${(p) => (p.$active ? 700 : 600)};
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;

    &:hover {
        border-color: ${COLORS.primary};
        color: ${COLORS.successDark};
        background: ${COLORS.successLight};
    }
`;

const PropertySelect = styled.select`
    height: 36px;
    padding: 0 10px;
    border: 1px solid ${COLORS.gray300};
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    color: ${COLORS.gray700};
    background: ${COLORS.white};
    cursor: pointer;
    outline: none;
    max-width: 200px;
    transition: border-color 0.15s ease;

    &:focus {
        border-color: ${COLORS.primary};
    }
`;

const FilterResultCount = styled.span`
    margin-left: auto;
    font-size: 0.8rem;
    font-weight: 600;
    color: ${COLORS.textSecondary};
    white-space: nowrap;
`;

const Header = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;

    h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 800;
        color: ${COLORS.textPrimary};
    }

    p {
        margin: 0;
        font-size: 0.97rem;
        color: ${COLORS.textSecondary};
    }
`;

const SummaryRow = styled.div`
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
        display: none;
    }
`;

const MetricCard = styled.div`
    border: 1px solid ${COLORS.border};
    border-radius: 14px;
    background: linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.bgLight} 100%);
    padding: 14px 15px;
    box-shadow: ${COLORS.shadow};
`;

const MetricLabel = styled.div`
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
    margin-bottom: 6px;
`;

const MetricValue = styled.div`
    font-size: 1.55rem;
    font-weight: 800;
    color: ${COLORS.textPrimary};
`;

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const DeviceCard = styled.div`
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1.9fr) minmax(0, 0.8fr) minmax(0, 0.95fr) minmax(0, 1.1fr) minmax(0, 1.2fr) minmax(0, 0.75fr);
    gap: 16px;
    align-items: center;
    border: 1px solid ${COLORS.border};
    background: linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.bgLight} 100%);
    border-radius: 16px;
    padding: 18px 18px;
    color: inherit;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
    box-shadow: ${COLORS.shadowMd};

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 10px;
        bottom: 10px;
        width: 4px;
        border-radius: 999px;
        background: linear-gradient(180deg, ${COLORS.gray300} 0%, ${COLORS.border} 100%);
        transition: background 0.18s ease, opacity 0.18s ease;
        opacity: 0.9;
    }

    > div:not(:first-child) {
        padding-left: 14px;
        border-left: 1px solid ${COLORS.borderLight};
    }

    &:hover {
        border-color: ${COLORS.primary};
        background: linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.successLight} 100%);
        transform: translateY(-2px);
        box-shadow: ${COLORS.shadowLg};

        &::before {
            background: ${COLORS.gradientPrimary};
        }

        ${DevicePrimary} {
            text-decoration: underline;
            text-decoration-color: ${COLORS.primary};
            text-underline-offset: 3px;
        }

        ${OpenProfileCue} {
            color: ${COLORS.primaryHover};
            transform: translateX(2px);
        }
    }

    &:active {
        transform: translateY(-1px);
    }

    @media (max-width: 1120px) {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 16px;

        > div:not(:first-child) {
            padding-left: 0;
            border-left: none;
            padding-top: 8px;
            border-top: 1px solid ${COLORS.borderLight};
        }
    }

    @media (max-width: 640px) {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px 12px;
        align-items: start;
        padding: 14px 14px 13px 16px;
        border-radius: 18px;

        &::before {
            top: 14px;
            bottom: 14px;
            width: 3px;
        }

        > div {
            padding: 0 !important;
            border: 0 !important;
        }

        > div:first-child {
            grid-column: 1 / -1;
        }

        > div:nth-child(2) {
            grid-column: 1;
            grid-row: 2;
        }

        > div:nth-child(3) {
            grid-column: 1 / -1;
            grid-row: 3;
        }

        > div:nth-child(6) {
            grid-column: 2;
            grid-row: 2;
            justify-self: end;
            text-align: right;
        }

        > div:nth-child(4),
        > div:nth-child(5) {
            display: none;
        }

        ${DevicePrimary} {
            font-size: 0.98rem;
        }

        ${OpenProfileCue} {
            width: 28px;
            height: 28px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            background: ${COLORS.successLight};
            color: ${COLORS.primary};
            font-size: 0;

            &::after {
                content: '→';
                font-size: 0.95rem;
                line-height: 1;
            }
        }

        ${TechnicalSubtitle} {
            display: none;
        }

        ${ContextLinks} {
            margin-top: 7px;
            gap: 6px;
        }
    }
`;

const Field = styled.div`
    min-width: 0;
`;

const Label = styled.div`
    font-size: 0.69rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
    margin-bottom: 5px;

    @media (max-width: 640px) {
        display: none;
    }
`;

const Value = styled.div`
    font-size: 0.89rem;
    font-weight: 600;
    color: ${COLORS.gray700};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 640px) {
        font-size: 0.82rem;
        font-weight: 800;
        color: ${COLORS.gray600};
    }
`;

const EmptyState = styled.div`
    border: 1px dashed ${COLORS.gray300};
    border-radius: 12px;
    padding: 36px 20px;
    text-align: center;
    color: ${COLORS.textSecondary};

    button {
        margin-top: 12px;
        border: none;
        border-radius: 8px;
        background: ${COLORS.primaryDark};
        color: ${COLORS.white};
        font-size: 13px;
        font-weight: 700;
        padding: 0.55rem 0.9rem;
        cursor: pointer;
    }

    button:hover {
        background: ${COLORS.primaryHover};
    }
`;


export {    
    SurfaceCard,
    DevicePrimary,
    IdentityTopRow,
    OpenProfileCue,
    TechnicalSubtitle,
    ContextLinks,   
    ContextLink,
    ContextArrow,
    StatusPill, 
    HubFeedGrid,
    FeedSectionTitle,
    FeedSectionText,
    ActivityList,
    ActivityItem,
    ActivityHeaderRow,
    ActivityIconBadge,
    ActivityMeta,
    ActivityTitle,
    ActivityDescription,
    ActivityContext,
    ActivityContextLink,
    ActivityContextSep,
    AttentionPriorityBadge,
    AttentionHeaderRow,
    AttentionReason,
    AttentionContext,
    AttentionContextLink,
    AttentionContextSep,
    FilterBar,
    CompactFilterResultCount,
    HubFilterFields,
    HubFilterField,
    SearchInput,
    FilterGroup,
    FilterButton,
    PropertySelect,
    FilterResultCount,
    Header,
    SummaryRow,
    MetricCard,
    MetricLabel,
    MetricValue,
    List,
    DeviceCard,
    Field,
    Label,
    Value,
    EmptyState,
};
