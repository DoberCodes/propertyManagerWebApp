import styled from 'styled-components';
import { Link } from 'react-router-dom';

const SurfaceCard = styled.div`
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #ffffff;
    padding: 14px;
`;

const DevicePrimary = styled.div`
    font-size: 1.05rem;
    font-weight: 800;
    color: #0f172a;
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
    color: #94a3b8;
    transition: color 0.18s ease, transform 0.18s ease;
`;

const TechnicalSubtitle = styled.div`
    margin-top: 4px;
    font-size: 0.88rem;
    font-weight: 700;
    color: #334155;
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
    color: #2563eb;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ContextArrow = styled.span`
    font-size: 0.78rem;
    color: #94a3b8;
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
                ? '#fecaca'
                : p.$status === 'Maintenance'
                    ? '#fcd34d'
                    : p.$status === 'Decommissioned'
                        ? '#cbd5e1'
                    : '#86efac'};
    background: ${(p) =>
        p.$status === 'Broken'
            ? '#fef2f2'
            : p.$status === 'Maintenance'
                ? '#fffbeb'
                : p.$status === 'Decommissioned'
                    ? '#f8fafc'
                : '#f0fdf4'};
    color: ${(p) =>
        p.$status === 'Broken'
            ? '#b91c1c'
            : p.$status === 'Maintenance'
                ? '#92400e'
                : p.$status === 'Decommissioned'
                    ? '#475569'
                : '#166534'};
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
    color: #0f172a;
`;

const FeedSectionText = styled.p`
    margin: 0 0 12px;
    font-size: 0.86rem;
    line-height: 1.5;
    color: #64748b;
`;

const ActivityList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const ActivityItem = styled.div`
    padding: 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
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
    color: #16a34a;
    margin-bottom: 4px;
`;

const ActivityTitle = styled.div`
    font-size: 0.92rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 3px;
`;

const ActivityDescription = styled.div`
    font-size: 0.84rem;
    color: #64748b;
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
    color: #2563eb;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const ActivityContextSep = styled.span`
    font-size: 0.72rem;
    color: #94a3b8;
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
    color: #475569;
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
    color: #2563eb;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

const AttentionContextSep = styled.span`
    font-size: 0.72rem;
    color: #94a3b8;
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
    color: #64748b;
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
    color: #475569;
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
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-size: 0.88rem;
    font-weight: 500;
    color: #0f172a;
    background: #ffffff;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder {
        color: #94a3b8;
    }

    &:focus {
        border-color: #22c55e;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
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
    border: 1px solid ${(p) => (p.$active ? '#22c55e' : '#e2e8f0')};
    background: ${(p) => (p.$active ? '#f0fdf4' : '#ffffff')};
    color: ${(p) => (p.$active ? '#166534' : '#475569')};
    font-size: 0.82rem;
    font-weight: ${(p) => (p.$active ? 700 : 600)};
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;

    &:hover {
        border-color: #22c55e;
        color: #166534;
        background: #f0fdf4;
    }
`;

const PropertySelect = styled.select`
    height: 36px;
    padding: 0 10px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 500;
    color: #334155;
    background: #ffffff;
    cursor: pointer;
    outline: none;
    max-width: 200px;
    transition: border-color 0.15s ease;

    &:focus {
        border-color: #22c55e;
    }
`;

const FilterResultCount = styled.span`
    margin-left: auto;
    font-size: 0.8rem;
    font-weight: 600;
    color: #64748b;
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
        color: #0f172a;
    }

    p {
        margin: 0;
        font-size: 0.97rem;
        color: #64748b;
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
    border: 1px solid #dbe3ea;
    border-radius: 14px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    padding: 14px 15px;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
`;

const MetricLabel = styled.div`
    font-size: 0.74rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 6px;
`;

const MetricValue = styled.div`
    font-size: 1.55rem;
    font-weight: 800;
    color: #0f172a;
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
    border: 1px solid #d7e2ea;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%);
    border-radius: 16px;
    padding: 18px 18px;
    color: inherit;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 10px;
        bottom: 10px;
        width: 4px;
        border-radius: 999px;
        background: linear-gradient(180deg, #cbd5e1 0%, #e2e8f0 100%);
        transition: background 0.18s ease, opacity 0.18s ease;
        opacity: 0.9;
    }

    > div:not(:first-child) {
        padding-left: 14px;
        border-left: 1px solid #edf2f7;
    }

    &:hover {
        border-color: #22c55e;
        background: linear-gradient(180deg, #ffffff 0%, #f6fff8 100%);
        transform: translateY(-2px);
        box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);

        &::before {
            background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
        }

        ${DevicePrimary} {
            text-decoration: underline;
            text-decoration-color: #22c55e;
            text-underline-offset: 3px;
        }

        ${OpenProfileCue} {
            color: #16a34a;
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
            border-top: 1px solid #edf2f7;
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
    color: #64748b;
    margin-bottom: 5px;
`;

const Value = styled.div`
    font-size: 0.89rem;
    font-weight: 600;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const EmptyState = styled.div`
    border: 1px dashed #cbd5e1;
    border-radius: 12px;
    padding: 36px 20px;
    text-align: center;
    color: #64748b;

    button {
        margin-top: 12px;
        border: none;
        border-radius: 8px;
        background: #0f766e;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        padding: 0.55rem 0.9rem;
        cursor: pointer;
    }

    button:hover {
        background: #115e59;
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
