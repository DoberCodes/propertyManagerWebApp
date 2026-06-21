import styled from "styled-components";

// Styled components for parts management
export const PartsTable = styled.table`
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;

    thead {
        background-color: #f3f4f6;
    }

    th {
        text-align: left;
        padding: 12px;
        font-weight: 600;
        font-size: 14px;
        border-bottom: 2px solid #e5e7eb;
        color: #374151;
    }

    td {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 14px;
    }

    tbody tr:hover {
        background-color: #f9fafb;
    }
`;

export const ActionButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 8px;
    color: #6b7280;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;

    &:hover {
        background-color: #e5e7eb;
        color: #374151;
    }

    &.delete:hover {
        color: #dc2626;
        background-color: #fee2e2;
    }
`;

export const PartsForm = styled.div`
    background-color: #f9fafb;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #e5e7eb;
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
    color: #64748b;
`;

export const FormInput = styled.input`
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
    }
`;

export const FormSelect = styled.select`
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;

    &:focus {
        outline: none;
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
    }
`;

export const FormTextarea = styled.textarea`
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    min-height: 72px;

    &:focus {
        outline: none;
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
    }
`;

export const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
`;

export const SubmitButton = styled.button`
    padding: 8px 16px;
    background-color: #0f766e;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background-color: #0d5d56;
    }
`;

export const CancelButton = styled.button`
    padding: 8px 16px;
    background-color: #e5e7eb;
    color: #374151;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background-color: #d1d5db;
    }
`;

export const ScanButton = styled.button`
    padding: 8px 14px;
    background-color: #ffffff;
    color: #0f766e;
    border: 1px solid #0f766e;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background-color: #ecfeff;
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
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
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
    color: #0f172a;
`;

export const MobileDetailMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.82rem;
    color: #64748b;
`;

export const SummaryCard = styled.div`
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 14px 16px;
`;

export const SummaryLabel = styled.div`
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 6px;
`;

export const SummaryValue = styled.div`
    font-size: 30px;
    line-height: 1;
    font-weight: 700;
    color: #0f172a;
`;

export const QuickActionPanel = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
    padding: 14px;

    @media (max-width: 1024px) {
        display: none;
    }
`;

export const ViewActionsButton = styled.button`
    border: 1px solid #0f766e;
    background: #ffffff;
    color: #0f766e;
    border-radius: 999px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: background-color 0.15s ease, border-color 0.15s ease;

    &:hover {
        background: #ecfeff;
        border-color: #115e59;
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
        color: #0f172a;
    }

    p {
        margin: 0;
        font-size: 0.86rem;
        color: #64748b;
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
    border: 1px solid #dbe3ea;
    background: #ffffff;
    border-radius: 10px;
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, transform 0.15s ease, background-color 0.15s ease;

    strong {
        display: block;
        font-size: 0.92rem;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 4px;
    }

    span {
        display: block;
        font-size: 0.78rem;
        line-height: 1.35;
        color: #64748b;
    }

    &:hover {
        border-color: #16a34a;
        background: #f0fdf4;
        transform: translateY(-1px);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.65;
        border-color: #e2e8f0;
        background: #f8fafc;
        transform: none;
    }
`;

export const QuickActionHint = styled.div`
    font-size: 0.8rem;
    color: #64748b;
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
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

export const TimelineDate = styled.div`
    font-size: 0.8rem;
    font-weight: 800;
    color: #16a34a;
`;

export const TimelineDateSub = styled.div`
    margin-top: 2px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #94a3b8;
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
    color: #0f172a;
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
    color: #334155;
    background: #e2e8f0;
`;

export const TimelineDescription = styled.div`
    font-size: 0.88rem;
    color: #475569;
    line-height: 1.45;
`;

export const TimelineMeta = styled.div`
    margin-top: 6px;
    font-size: 0.76rem;
    color: #64748b;
`;

export const TimelineExpandButton = styled.button`
    margin-top: 8px;
    align-self: flex-start;
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    color: #334155;
    border-radius: 999px;
    padding: 4px 10px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background: #f1f5f9;
        border-color: #94a3b8;
    }
`;

export const TimelineDetailsPanel = styled.div`
    margin-top: 10px;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
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
    color: #64748b;
`;

export const TimelineDetailValue = styled.div`
    font-size: 0.82rem;
    line-height: 1.45;
    color: #334155;
`;

export const TimelineAttachmentList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const TimelineAttachmentLink = styled.a`
    font-size: 0.82rem;
    line-height: 1.4;
    color: #1d4ed8;
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
    background: #f8fafc;
    border: 1px solid #e2e8f0;
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
    color: #64748b;
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
    border: 1px solid #0f766e;
    background: #0f766e;
    color: #ffffff;
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
    border: 1px solid #dc2626;
    background: #ffffff;
    color: #dc2626;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
`;

export const PhotoHelperText = styled.div`
    font-size: 12px;
    color: #64748b;
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
    color: #64748b;
`;

export const SectionTitleStrong = styled.h3`
    margin: 0;
    font-size: 1.08rem;
    font-weight: 800;
    color: #0f172a;
`;

export const SectionDescription = styled.p`
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #475569;
`;

export const UpcomingCareCard = styled.div`
    background: #ffffff;
    border: 1px solid #e5e7eb;
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
    color: #0f172a;
`;

export const UpcomingCareLink = styled.button`
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: #2563eb;
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
            ? '#991b1b'
            : props.$tone === 'success'
                ? '#166534'
                : props.$tone === 'info'
                    ? '#1e40af'
                    : '#475569'};
    background: ${(props) =>
        props.$tone === 'error'
            ? '#fee2e2'
            : props.$tone === 'success'
                ? '#dcfce7'
                : props.$tone === 'info'
                    ? '#dbeafe'
                    : '#f8fafc'};
`;
