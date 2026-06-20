import React from "react"
import { ActionsToolbar, FamilyMemberCard, FamilyMemberInfo, FamilyMemberName, FamilyMemberRole, FamilyMembersLabel, FamilyMembersList, Section, SectionTitle, SuccessMessage } from "./SettingPage.styles"
import { RootState } from "Redux/store/store";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPencil, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { IconWrapper, ToolbarItem } from "global.styles";

interface FamilyManagementProps {
    handleRemoveFamilyMember: (memberId: string) => void;
    handleEditFamilyMember: (member: any) => void;
    handleAddFamilyMember: () => void;
    handleResendFamilyPasswordSetup: (memberId: string) => void;
    canManageFamilyRoles: boolean;
    familyMembers: any[];
    familyMemberSuccess: string;
    isLoadingFamilyMembers: boolean;
}

export const FamilyManagement: React.FC<FamilyManagementProps> = ({ handleRemoveFamilyMember, handleEditFamilyMember, handleAddFamilyMember, handleResendFamilyPasswordSetup, familyMembers, familyMemberSuccess, isLoadingFamilyMembers }) => {
    const currentUser = useSelector((state: RootState) => state.user.currentUser);
    const nonOwnerFamilyMembers = familyMembers.filter(
        (member) => member.id !== currentUser?.id,
    );
    const occupiedFamilySeats = nonOwnerFamilyMembers.length;

    const canAddMoreFamilyMembers = occupiedFamilySeats < 2;


    return (
        <Section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <SectionTitle>Family Members</SectionTitle>
                {canAddMoreFamilyMembers && (
                    <IconWrapper onClick={handleAddFamilyMember}>
                        <FontAwesomeIcon icon={faPlus} />
                    </IconWrapper>
                )}
            </div>
            <p style={{ marginBottom: '16px', color: '#6b7280' }}>
                Add family members to share your subscription. They get full
                account access based on the role you assign.
            </p>
            {
                familyMemberSuccess && (
                    <SuccessMessage>{familyMemberSuccess}</SuccessMessage>
                )
            }

            {
                nonOwnerFamilyMembers.length > 0 && (
                    <FamilyMembersList>
                        <FamilyMembersLabel>Current Family Members:</FamilyMembersLabel>
                        {nonOwnerFamilyMembers.map((member) => (
                            <FamilyMemberCard key={member.id}>
                                <FamilyMemberInfo>
                                    <FamilyMemberName>
                                        {member.firstName} {member.lastName}
                                    </FamilyMemberName>
                                    <FamilyMemberRole>
                                        {String(member.role || 'member')}
                                    </FamilyMemberRole>
                                </FamilyMemberInfo>
                                <ActionsToolbar>
                                    {member.id !== currentUser?.accountId && (
                                        <ToolbarItem onClick={() => handleEditFamilyMember(member)}>
                                            <FontAwesomeIcon icon={faPencil} />
                                        </ToolbarItem>
                                    )}
                                    <ToolbarItem onClick={() => handleResendFamilyPasswordSetup(member.id)}>
                                        <FontAwesomeIcon icon={faEnvelope} />
                                    </ToolbarItem>
                                    {member.id !== currentUser?.accountId && (
                                        <ToolbarItem onClick={() => handleRemoveFamilyMember(member.id)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </ToolbarItem>
                                    )}
                                </ActionsToolbar>
                            </FamilyMemberCard>
                        ))}
                    </FamilyMembersList>
                )
            }


            {
                !canAddMoreFamilyMembers && (
                    <p
                        style={{
                            color: '#6b7280',
                            fontSize: '14px',
                            marginTop: '8px',
                        }}>
                        Family accounts are limited to 2 family members (plus the
                        account owner).
                    </p>
                )
            }

            {
                isLoadingFamilyMembers && (
                    <p
                        style={{
                            color: '#6b7280',
                            fontSize: '14px',
                            marginTop: '8px',
                        }}>
                        Loading family account details...
                    </p>
                )
            }
        </Section>
    )
}