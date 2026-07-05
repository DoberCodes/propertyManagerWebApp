import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetContractorsByPropertyQuery } from '../Redux/API/contractorSlice';
import { useGetPropertyQuery } from '../Redux/API/propertySlice';
import { useGetTeamMembersQuery } from '../Redux/API/teamSlice';
import { useGetUserByIdQuery } from '../Redux/API/userSlice';
import type { RootState } from '../Redux/store/store';
import { getFamilyMembers } from '../services/authService';
import {
	buildTaskAssigneeOptions,
	type TaskAssigneeOption,
} from './taskAssignment';

type UseTaskAssigneeOptionsInput = {
	propertyId?: string | null;
	currentUser?: any | null;
	additionalOptions?: Array<Partial<TaskAssigneeOption> | null | undefined>;
	includeCurrentUser?: boolean;
	includePropertyOwner?: boolean;
	includeTeamMembers?: boolean;
	includeFamilyMembers?: boolean;
	includeContractors?: boolean;
};

export const useTaskAssigneeOptions = ({
	propertyId,
	currentUser,
	additionalOptions = [],
	includeCurrentUser = true,
	includePropertyOwner = true,
	includeTeamMembers = true,
	includeFamilyMembers = true,
	includeContractors = true,
}: UseTaskAssigneeOptionsInput): TaskAssigneeOption[] => {
	const storeCurrentUser = useSelector(
		(state: RootState) => state.user.currentUser,
	);
	const effectiveCurrentUser = currentUser || storeCurrentUser;
	const scopedPropertyId = String(propertyId || '').trim();
	const teamGroups = useSelector((state: RootState) => state.team.groups);
	const { data: firebaseTeamMembers = [] } = useGetTeamMembersQuery(undefined, {
		skip: !includeTeamMembers,
	});
	const { data: contractors = [] } = useGetContractorsByPropertyQuery(
		scopedPropertyId,
		{ skip: !includeContractors || !scopedPropertyId },
	);
	const { data: property } = useGetPropertyQuery(scopedPropertyId, {
		skip: !includePropertyOwner || !scopedPropertyId,
	});
	const { data: propertyOwner } = useGetUserByIdQuery(property?.userId || '', {
		skip: !includePropertyOwner || !property?.userId,
	});
	const [familyMembers, setFamilyMembers] = useState<any[]>([]);

	const reduxTeamMembers = useMemo(
		() => teamGroups.flatMap((group) => group.members || []),
		[teamGroups],
	);
	const teamMembers = useMemo(
		() =>
			(firebaseTeamMembers.length > 0 ? firebaseTeamMembers : reduxTeamMembers)
				.filter(Boolean),
		[firebaseTeamMembers, reduxTeamMembers],
	);

	useEffect(() => {
		let cancelled = false;
		const accountId = effectiveCurrentUser?.accountId;
		const isTeamMemberAccount = Boolean(
			effectiveCurrentUser?.isTeamMemberAccount,
		);

		if (!includeFamilyMembers || !accountId || isTeamMemberAccount) {
			setFamilyMembers([]);
			return;
		}

		getFamilyMembers(accountId)
			.then((members) => {
				if (!cancelled) {
					setFamilyMembers(Array.isArray(members) ? members : []);
				}
			})
			.catch((error) => {
				console.error('Failed to load task assignee family members:', error);
				if (!cancelled) {
					setFamilyMembers([]);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [
		effectiveCurrentUser?.accountId,
		effectiveCurrentUser?.isTeamMemberAccount,
		includeFamilyMembers,
	]);

	return useMemo(
		() =>
			buildTaskAssigneeOptions({
				currentUser: effectiveCurrentUser,
				teamMembers,
				familyMembers,
				contractors,
				propertyOwner,
				propertyId: scopedPropertyId,
				additionalOptions,
				includeCurrentUser,
				includePropertyOwner,
				includeTeamMembers,
				includeFamilyMembers,
				includeContractors,
			}),
		[
			additionalOptions,
			contractors,
			effectiveCurrentUser,
			familyMembers,
			includeContractors,
			includeCurrentUser,
			includeFamilyMembers,
			includePropertyOwner,
			includeTeamMembers,
			propertyOwner,
			scopedPropertyId,
			teamMembers,
		],
	);
};
