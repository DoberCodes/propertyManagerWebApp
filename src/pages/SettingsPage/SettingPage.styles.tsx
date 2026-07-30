import { COLORS } from "constants/colors";
import styled, { css, keyframes } from "styled-components";


export const Container = styled.div`
    width: 100%;
    background: ${COLORS.bgWhite};
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
    overflow-x: hidden;

    &, * {
        box-sizing: border-box;
    }

    @media (max-width: 768px) {
        margin: 0;
        border-radius: 0;
        box-shadow: none;
    }
    
`;

export const Title = styled.h2`
    font-size: 2rem;
    margin-bottom: 24px;

    @media (max-width: 768px) {
        font-size: 1.6rem;
        margin-bottom: 18px;
    }
`;

export const SubscriptionSection = styled.div`
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    background: ${COLORS.bgLight};
    min-width: 0;
    overflow: hidden;

    @media (max-width: 768px) {
        padding: 16px;
        margin-bottom: 16px;
    }

    @media (max-width: 480px) {
        padding: 14px;
    }
`;

export const SubscriptionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;

    @media (max-width: 640px) {
        align-items: flex-start;
        flex-direction: column;
    }
`;

export const PlanName = styled.h3`
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
    color: ${COLORS.textPrimary};
    min-width: 0;

    @media (max-width: 640px) {
        font-size: 1.25rem;
    }
`;

export const PlanStatus = styled.span<{ status: string }>`
    display: inline-flex;
    max-width: 100%;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    ${({ status }) => {
        switch (status) {
            case 'free':
                return `
                        background: ${COLORS.successLight};
                        color: ${COLORS.successDark};
                    `;
            case 'trial':
                return `
                        background: #fef3c7;
                        color: #d97706;
                    `;
            case 'active':
                return `
                        background: ${COLORS.successLight};
                        color: ${COLORS.successDark};
                    `;
            case 'granted':
                return `
                        background: #d1fae5;
                        color: #047857;
                    `;
            case 'cancelled':
                return `
                        background: #fee2e2;
                        color: #dc2626;
                    `;
            default:
                return `
                        background: ${COLORS.gray200};
                        color: ${COLORS.textSecondary};
                    `;
        }
    }}
`;

export const PlanDetails = styled.div`
    margin-bottom: 16px;
`;

export const GrantedAccessCard = styled.div`
    display: grid;
    gap: 6px;
    margin: 0 0 16px;
    padding: 14px 16px;
    border: 1px solid #86efac;
    border-radius: 10px;
    background: #f0fdf4;
    color: #14532d;
`;

export const GrantedAccessHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
`;

export const GrantedAccessTitle = styled.strong`
    font-size: 1rem;
    color: #065f46;
`;

export const GrantedAccessBadge = styled.span`
    display: inline-flex;
    padding: 4px 9px;
    border-radius: 999px;
    background: #d1fae5;
    color: #047857;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
`;

export const GrantedAccessText = styled.p`
    margin: 0;
    color: #166534;
    font-size: 0.875rem;
    line-height: 1.45;
`;

export const BillingPlanSummary = styled.p`
    margin: 0 0 12px;
    color: ${COLORS.textSecondary};
    font-size: 0.875rem;
`;

export const PlanPrice = styled.p`
    font-size: 1.125rem;
    font-weight: 600;
    color: ${COLORS.primary};
    margin: 8px 0;
`;

export const PlanFeatures = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

export const PlanFeature = styled.li`
    font-size: 0.875rem;
    color: ${COLORS.textSecondary};
    margin-bottom: 4px;
    overflow-wrap: anywhere;
    &::before {
        content: '✓';
        color: ${COLORS.primary};
        margin-right: 8px;
    }
`;

export const TrialInfo = styled.div`
    background: #fef3c7;
    border: 1px solid #f59e0b;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 16px;
`;

export const TrialText = styled.p`
    margin: 0;
    color: #92400e;
    font-size: 0.875rem;
    overflow-wrap: anywhere;
`;

export const FreePlanInfo = styled(TrialInfo)`
    background: ${COLORS.primaryLight};
    border: 1px solid ${COLORS.primaryHover};
`;

export const FreePlanText = styled(TrialText)`
    color: ${COLORS.primaryDark};
`;

export const LinkButton = styled.button`
    display: inline-block;
    margin: 16px 0;
    padding: 12px 24px;
    background: ${COLORS.bgWhite};
    color: ${COLORS.primaryDark};
    border: 1px solid ${COLORS.primaryHover};
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    cursor: pointer;
    white-space: normal;
    text-align: center;
    &:hover {
        background: ${COLORS.primaryLight};
        border-color: ${COLORS.primaryHover};
    }

    @media (max-width: 640px) {
        width: 100%;
        margin: 8px 0 0;
        padding: 12px 14px;
    }
`;

export const UpgradeButton = styled(LinkButton)`
    background: ${COLORS.gradientPrimary};
    color: ${COLORS.white};
    border: none;
    &:hover {
        background: ${COLORS.gradientPrimary};
    }
`;

export const BillingPortalButton = styled(LinkButton)`
    margin: 0;
`;

export const ButtonContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-top: 16px;

    @media (max-width: 640px) {
        align-items: stretch;
        gap: 8px;
    }
`;

export const CancelButton = styled(LinkButton)`
    background: transparent;
    color: #b91c1c;
    margin: 0;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    font-size: 0.9rem;
    &:hover {
        background: transparent;
        color: #991b1b;
    }

    @media (max-width: 640px) {
        width: auto;
        padding: 0;
        margin: 0;
        text-align: left;
    }
`;

export const Section = styled.div`
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;
    background: ${COLORS.bgLight};
    height: fit-content;
    overflow: visible;
    min-width: 0;

    @media (max-width: 768px) {
        padding: 16px;
        margin-bottom: 16px;
    }

    @media (max-width: 480px) {
        padding: 14px;
    }
`;

export const SectionTitle = styled.h3`
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0 0 16px 0;
    color: ${COLORS.textPrimary};
    overflow-wrap: anywhere;

    @media (max-width: 640px) {
        font-size: 1.1rem;
    }
`;

export const AccountActions = styled.div`
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
        flex-direction: column;
        gap: 8px;
    }
`;

export const ResourceButtons = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    @media (max-width: 640px) {
        align-items: stretch;
    }
`;

export const AccountButton = styled.button<{ disabled?: boolean }>`
    padding: 12px 24px;
    width: fit-content;
    background: ${COLORS.bgWhite};
    color: ${COLORS.primaryDark};
    border: 1px solid ${COLORS.primaryHover};
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s;
    cursor: pointer;
    white-space: normal;
    text-align: center;
    min-width: 0;

    &:hover {
        background: ${COLORS.primaryLight};
        border-color: ${COLORS.primaryHover};
    }

    &:disabled {
        background: #9ca3af;
        cursor: not-allowed;
        opacity: 0.6;

        &:hover {
            background: #9ca3af;
        }
    }

    @media (max-width: 640px) {
        width: 100%;
        padding: 12px 14px;
    }
`;

export const FamilyMembersList = styled.div`
    margin-bottom: 16px;
`;

export const FamilyMembersLabel = styled.h4`
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    color: ${COLORS.gray700};
`;

export const FamilyMemberCard = styled.div`
    display: flex;
    gap: 12px;
    padding: 24px;
    background: ${COLORS.bgWhite};
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    margin-bottom: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);

    @media (max-width: 640px) {
        flex-direction: row;
        justify-content: center;
    }
`;

export const FamilyMemberInfo = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 10px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
        justify-content: center;
        align-items: center;
        }
`;

export const FamilyMemberName = styled.span`
    font-weight: 600;
    color: ${COLORS.gray900};
`;

export const FamilyMemberEmail = styled.span`
    color: ${COLORS.textSecondary};
    word-break: break-word;
    overflow-wrap: anywhere;
`;

export const FamilyMemberRole = styled.span`
    color: #1e375f;
    width: fit-content;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 999px;
    background: #eef2ff;
`;

export const ActionsToolbar = styled.div`
    display: flex;
    flex-direction: row;
    gap: 8px;
    justify-content: flex-end;
    font-size: 10px;
`;



export const DeleteAccountButton = styled(AccountButton)`
    background: #dc2626;
    &:hover:not(:disabled) {
        background: #b91c1c;
    }
    &:disabled {
        background: #9ca3af;
    }
`;

export const ErrorMessage = styled.div`
    background-color: #fee2e2;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
    border-left: 4px solid #dc2626;
    overflow-wrap: anywhere;
`;

export const SuccessMessage = styled.div`
    background-color: ${COLORS.successLight};
    color: ${COLORS.successDark};
    padding: 12px 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 14px;
    border-left: 4px solid ${COLORS.successDark};
    overflow-wrap: anywhere;
`;

export const PasswordHelp = styled.div`
    font-size: 12px;
    color: ${COLORS.textSecondary};
    margin-top: 8px;
    font-style: italic;
`;

export const SettingsLayout = styled.div`
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 20px;
    min-width: 0;

    @media (max-width: 1024px) {
        display: block;
    }
`;

export const CategorySidebar = styled.aside`
    position: sticky;
    top: 16px;
    height: fit-content;
    background: ${COLORS.bgLight};
    border: 1px solid ${COLORS.border};
    border-radius: 10px;
    padding: 10px;

    @media (max-width: 1024px) {
        display: none;
    }
`;

export const CategoryNavButton = styled.button<{ active?: boolean }>`
    width: 100%;
    text-align: left;
    border: 1px solid ${({ active }) => (active ? COLORS.primary : 'transparent')};
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 4px;
    background: ${({ active }) =>
        active ? COLORS.gradientPrimary : 'transparent'};
    color: ${({ active }) => (active ? COLORS.white : COLORS.gray700)};
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${({ active }) =>
        active ? COLORS.gradientPrimary : COLORS.primaryLight};
        border-color: ${COLORS.primaryHover};
    }

    &:last-child {
        margin-bottom: 0;
    }
`;

export const MobileCategoryPicker = styled.div`
    display: none;
    margin-bottom: 16px;

    @media (max-width: 1024px) {
        display: block;
    }

    @media (max-width: 640px) {
        margin-bottom: 12px;
    }
`;

export const CategorySelect = styled.select`
    width: 100%;
    padding: 10px 12px;
    border: 1px solid ${COLORS.gray300};
    border-radius: 8px;
    background: ${COLORS.bgWhite};
    color: ${COLORS.textPrimary};
    font-weight: 600;
    min-width: 0;

    @media (max-width: 640px) {
        font-size: 16px;
        min-height: 44px;
    }
`;

export const CategoryContent = styled.div`
    min-width: 0;
    width: 100%;
`;

export const CategoryPanel = styled.section`
    min-height: 68vh;
    overflow-y: auto;
    padding-right: 6px;

    /* Prevent extra trailing gap from section bottom margins */
    & > *:last-child {
        margin-bottom: 0;
    }

    @media (max-width: 1024px) {
        min-height: 56vh;
        max-height: none;
        overflow-y: visible;
        padding-right: 0;
    }

    @media (max-width: 640px) {
        min-height: 0;
    }
`;

export const SupportTicketList = styled.div`
    display: grid;
    gap: 12px;
    margin-top: 14px;
`;

export const SupportTicketFilterGroup = styled.div`
    display: inline-flex;
    align-items: center;
    background: ${COLORS.gray100};
    border: 1px solid ${COLORS.border};
    border-radius: 999px;
    padding: 2px;
`;

export const SupportTicketHeaderBar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 12px;
`;

export const SupportTicketFilterLabel = styled.span`
    font-size: 0.8rem;
    font-weight: 700;
    color: ${COLORS.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

export const SupportTicketFilterButton = styled.button<{ active?: boolean }>`
    border: 0;
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 0.82rem;
    font-weight: 700;
    cursor: pointer;
    background: ${({ active }) =>
        active ? COLORS.gradientPrimary : 'transparent'};
    color: ${({ active }) => (active ? COLORS.white : COLORS.gray600)};

    &:hover {
        background: ${({ active }) =>
        active ? COLORS.gradientPrimary : COLORS.primaryLight};
    }
`;

export const refreshSpin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

export const SupportTicketRefreshButton = styled.button<{ $isRefreshing?: boolean }>`
    border: 0;
    background: transparent;
    color: ${COLORS.textSecondary};
    cursor: pointer;
    padding: 4px;
    line-height: 1;
    font-size: 1.05rem;
    ${({ $isRefreshing }) => $isRefreshing && css`animation: ${refreshSpin} 1s linear infinite;`}


    &:hover {
        color: ${COLORS.gray900};
    }
`;



export const SupportTicketCard = styled.div`
    border: 1px solid ${COLORS.border};
    border-left: 4px solid #4f46e5;
    border-radius: 12px;
    padding: 14px;
    background: ${COLORS.bgWhite};
    box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04);
`;

export const SupportTicketHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
`;

export const SupportTicketSubject = styled.h4`
    margin: 0;
    font-size: 0.98rem;
    color: ${COLORS.gray900};
`;

export const SupportTicketStatus = styled.span`
    padding: 4px 10px;
    border-radius: 999px;
    background: #ede9fe;
    border: 1px solid #ddd6fe;
    color: #4f46e5;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
`;

export const SupportTicketMeta = styled.p`
    margin: 8px 0 0;
    font-size: 0.84rem;
    color: ${COLORS.textSecondary};
`;

export const SupportTicketMetaGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 10px;

    @media (max-width: 860px) {
        grid-template-columns: 1fr;
    }
`;

export const SupportTicketMetaBlock = styled.div`
    padding: 8px 10px;
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    background: ${COLORS.bgLight};
`;

export const SupportTicketMetaLabel = styled.span`
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
`;

export const SupportTicketMetaValue = styled.span`
    display: block;
    margin-top: 3px;
    font-size: 0.86rem;
    color: ${COLORS.textPrimary};
`;

export const SupportTicketSection = styled.div<{ resolutionNotes?: string }>`
    border: ${({ resolutionNotes }) => (resolutionNotes ? `1px solid ${COLORS.border}` : 'none')};
    padding: ${({ resolutionNotes }) => (resolutionNotes ? '12px' : '0')};
    border-radius: 8px;
    background: ${({ resolutionNotes }) => (resolutionNotes ? COLORS.bgLight : 'transparent')};
    margin-top: 12px;
    border-radius: 8px;
    margin-top: 10px;
`;

export const SupportTicketSectionLabel = styled.h5`
    margin: 0 0 4px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: ${COLORS.textSecondary};
`;

export const SupportTicketMessage = styled.p`
    margin: 8px 0 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: ${COLORS.gray700};
    white-space: pre-wrap;
    word-break: break-word;
`;

export const SupportAttachmentList = styled.ul`
    margin: 0;
    padding-left: 16px;
    font-size: 0.85rem;
    color: ${COLORS.gray600};
`;


// Notifications styles

export const SectionBody = styled.div`
    margin-top: 16px;
`;

export const PresetActions = styled.div`
    display: flex;
    justify-content: flex-start;
    margin-bottom: 16px;
`;

export const PresetButton = styled.button`
    background: ${COLORS.bgWhite};
    color: ${COLORS.primaryDark};
    border: 1px solid ${COLORS.primaryHover};
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${COLORS.primaryLight};
        border-color: ${COLORS.primaryHover};
    }
`;

export const PreferencesGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 12px;
    margin-top: 12px;
    margin-bottom: 16px;

    @media (max-width: 640px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const PreferencePanel = styled.div`
    grid-column: 1 / -1;
    border: 1px solid ${COLORS.border};
    border-radius: 8px;
    padding: 14px;
    background: ${COLORS.bgLight};
    margin-top: 12px;
    min-width: 0;
`;

export const NestedPreferenceControls = styled.div`
    margin-top: 12px;
    display: grid;
    gap: 12px;
`;

export const RecipientGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;

    @media (max-width: 640px) {
        grid-template-columns: minmax(0, 1fr);
    }
`;

export const RecipientOption = styled.label`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px;
    border: 1px solid ${COLORS.border};
    border-radius: 6px;
    background: ${COLORS.bgWhite};
    font-size: 14px;
    color: ${COLORS.gray700};
    cursor: pointer;
    min-width: 0;
`;

export const PreferenceOption = styled.label`
    padding: 12px;
    border: 1px solid ${COLORS.border};
    border-radius: 6px;
    background: ${COLORS.bgWhite};
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: ${COLORS.gray700};

    cursor: pointer;
`;

export const PreferenceText = styled.span`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const FilterButton = styled.button<{ active?: boolean, leftRounded?: boolean, rightRounded?: boolean }>`
    border: 0;
    padding: 6px 12px;
    font-size: 0.82rem;
    border-radius: ${({ leftRounded, rightRounded }) => `${leftRounded ? '6px' : '0'} ${rightRounded ? '6px' : '0'} ${rightRounded ? '6px' : '0'} ${leftRounded ? '6px' : '0'}`};
    font-weight: 700;
    cursor: pointer;
    background: ${({ active }) => (active ? '#4f46e5' : 'transparent')};
    color: ${({ active }) => (active ? '#ffffff' : '#4b5563')};
    &:hover {
        background: ${({ active }) => (active ? '#4338ca' : '#e5e7eb')};
    }
`;

export const EnableAllButton = styled.button`
    background: transparent;
    border: 1px solid ${COLORS.primary};
    color: ${COLORS.primary};
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: normal;
    text-align: center;
    &:hover {
        background: ${COLORS.primary};
        color: #ffffff;
    }

    @media (max-width: 640px) {
        width: 100%;
        padding: 10px 12px;
    }
`;

export const DisableAllButton = styled.button`
    color: ${COLORS.error};
    background: transparent;
    border: 1px solid ${COLORS.error};
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    white-space: normal;
    text-align: center;

    &:hover {
        background: ${COLORS.error};
        color: #ffffff;
    }

    @media (max-width: 640px) {
        width: 100%;
        padding: 10px 12px;
    }
`;
