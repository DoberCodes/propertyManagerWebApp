import teamReducer, {
	setTeamGroups,
	addTeamGroup,
	updateTeamGroup,
	updateTeamGroupName,
	toggleTeamGroupEditName,
	deleteTeamGroup,
	addTeamMember,
	updateTeamMember,
	deleteTeamMember,
} from './teamSlice';
import { TeamGroup, TeamMember } from '../../types/Team.types';

describe('teamSlice', () => {
	const initialState = {
		groups: [],
	};

	const mockMember: TeamMember = {
		id: 'member-1',
		name: 'John Doe',
		email: 'john@example.com',
		role: 'contractor',
		groupId: 'group-1',
	};

	const mockGroup: TeamGroup = {
		id: 'group-1',
		name: 'Contractors',
		members: [mockMember],
		isEditingName: false,
		userId: '',
		linkedProperties: [],
	};

	describe('reducers', () => {
		it('should return initial state', () => {
			expect(teamReducer(undefined, { type: 'unknown' })).toEqual(initialState);
		});

		describe('setTeamGroups', () => {
			it('should set all team groups', () => {
				const groups = [mockGroup, { ...mockGroup, id: 'group-2' }];
				const actual = teamReducer(initialState, setTeamGroups(groups));

				expect(actual.groups).toHaveLength(2);
				expect(actual.groups).toEqual(groups);
			});

			it('should replace existing groups', () => {
				const stateWithGroups = { groups: [mockGroup] };
				const newGroups = [{ ...mockGroup, id: 'group-2', name: 'New Group' }];
				const actual = teamReducer(stateWithGroups, setTeamGroups(newGroups));

				expect(actual.groups).toHaveLength(1);
				expect(actual.groups[0].id).toBe('group-2');
			});

			it('should handle empty array', () => {
				const stateWithGroups = { groups: [mockGroup] };
				const actual = teamReducer(stateWithGroups, setTeamGroups([]));

				expect(actual.groups).toEqual([]);
			});
		});

		describe('addTeamGroup', () => {
			it('should add a new team group', () => {
				const actual = teamReducer(initialState, addTeamGroup(mockGroup));

				expect(actual.groups).toHaveLength(1);
				expect(actual.groups[0]).toEqual(mockGroup);
			});

			it('should add group to existing groups', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const newGroup = { ...mockGroup, id: 'group-2', name: 'Managers' };
				const actual = teamReducer(stateWithGroup, addTeamGroup(newGroup));

				expect(actual.groups).toHaveLength(2);
				expect(actual.groups[1]).toEqual(newGroup);
			});
		});

		describe('updateTeamGroup', () => {
			it('should update existing team group', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const updatedGroup = { ...mockGroup, name: 'Updated Contractors' };
				const actual = teamReducer(
					stateWithGroup,
					updateTeamGroup(updatedGroup),
				);

				expect(actual.groups[0].name).toBe('Updated Contractors');
			});

			it('should not add group if id does not exist', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const nonExistentGroup = { ...mockGroup, id: 'group-999' };
				const actual = teamReducer(
					stateWithGroup,
					updateTeamGroup(nonExistentGroup),
				);

				expect(actual.groups).toHaveLength(1);
				expect(actual.groups[0].id).toBe('group-1');
			});
		});

		describe('updateTeamGroupName', () => {
			it('should update group name', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(
					stateWithGroup,
					updateTeamGroupName({ groupId: 'group-1', name: 'New Name' }),
				);

				expect(actual.groups[0].name).toBe('New Name');
			});

			it('should not update if group not found', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(
					stateWithGroup,
					updateTeamGroupName({ groupId: 'group-999', name: 'New Name' }),
				);

				expect(actual.groups[0].name).toBe('Contractors');
			});
		});

		describe('toggleTeamGroupEditName', () => {
			it('should toggle isEditingName from false to true', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(
					stateWithGroup,
					toggleTeamGroupEditName('group-1'),
				);

				expect(actual.groups[0].isEditingName).toBe(true);
			});

			it('should toggle isEditingName from true to false', () => {
				const stateWithGroup = {
					groups: [{ ...mockGroup, isEditingName: true }],
				};
				const actual = teamReducer(
					stateWithGroup,
					toggleTeamGroupEditName('group-1'),
				);

				expect(actual.groups[0].isEditingName).toBe(false);
			});

			it('should not affect other groups', () => {
				const stateWithGroups = {
					groups: [
						mockGroup,
						{ ...mockGroup, id: 'group-2', isEditingName: false },
					],
				};
				const actual = teamReducer(
					stateWithGroups,
					toggleTeamGroupEditName('group-1'),
				);

				expect(actual.groups[0].isEditingName).toBe(true);
				expect(actual.groups[1].isEditingName).toBe(false);
			});
		});

		describe('deleteTeamGroup', () => {
			it('should delete team group by id', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(stateWithGroup, deleteTeamGroup('group-1'));

				expect(actual.groups).toHaveLength(0);
			});

			it('should delete correct group from multiple groups', () => {
				const stateWithGroups = {
					groups: [mockGroup, { ...mockGroup, id: 'group-2' }],
				};
				const actual = teamReducer(stateWithGroups, deleteTeamGroup('group-1'));

				expect(actual.groups).toHaveLength(1);
				expect(actual.groups[0].id).toBe('group-2');
			});

			it('should not affect state if group not found', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(
					stateWithGroup,
					deleteTeamGroup('group-999'),
				);

				expect(actual.groups).toHaveLength(1);
			});
		});

		describe('addTeamMember', () => {
			it('should add member to existing group', () => {
				const stateWithGroup = { groups: [{ ...mockGroup, members: [] }] };
				const actual = teamReducer(
					stateWithGroup,
					addTeamMember({ groupId: 'group-1', member: mockMember }),
				);

				expect(actual.groups[0].members).toHaveLength(1);
				expect(actual.groups[0].members?.[0]).toEqual(mockMember);
			});

			it('should initialize members array if undefined', () => {
				const groupWithoutMembers = { ...mockGroup, members: undefined };
				const stateWithGroup = { groups: [groupWithoutMembers] };
				const actual = teamReducer(
					stateWithGroup,
					addTeamMember({ groupId: 'group-1', member: mockMember }),
				);

				expect(actual.groups[0].members).toBeDefined();
				expect(actual.groups[0].members).toHaveLength(1);
			});

			it('should not add member if group not found', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(
					stateWithGroup,
					addTeamMember({ groupId: 'group-999', member: mockMember }),
				);

				expect(actual.groups[0].members).toHaveLength(1);
			});
		});

		describe('updateTeamMember', () => {
			it('should update existing team member', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const updatedMember = { ...mockMember, name: 'Jane Doe' };
				const actual = teamReducer(
					stateWithGroup,
					updateTeamMember(updatedMember),
				);

				expect(actual.groups[0].members?.[0].name).toBe('Jane Doe');
			});

			it('should not update if member not found', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const nonExistentMember = { ...mockMember, id: 'member-999' };
				const actual = teamReducer(
					stateWithGroup,
					updateTeamMember(nonExistentMember),
				);

				expect(actual.groups[0].members?.[0].name).toBe('John Doe');
			});
		});

		describe('deleteTeamMember', () => {
			it('should delete team member from group', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(
					stateWithGroup,
					deleteTeamMember({ groupId: 'group-1', memberId: 'member-1' }),
				);

				expect(actual.groups[0].members).toHaveLength(0);
			});

			it('should delete correct member from multiple members', () => {
				const member2 = { ...mockMember, id: 'member-2', name: 'Jane Smith' };
				const groupWithMembers = {
					...mockGroup,
					members: [mockMember, member2],
				};
				const stateWithGroup = { groups: [groupWithMembers] };
				const actual = teamReducer(
					stateWithGroup,
					deleteTeamMember({ groupId: 'group-1', memberId: 'member-1' }),
				);

				expect(actual.groups[0].members).toHaveLength(1);
				expect(actual.groups[0].members?.[0].id).toBe('member-2');
			});

			it('should not affect state if member not found', () => {
				const stateWithGroup = { groups: [mockGroup] };
				const actual = teamReducer(
					stateWithGroup,
					deleteTeamMember({ groupId: 'group-1', memberId: 'member-999' }),
				);

				expect(actual.groups[0].members).toHaveLength(1);
			});
		});

		describe('complex scenarios', () => {
			it('should handle multiple operations in sequence', () => {
				let state = initialState;

				// Add first group
				state = teamReducer(state, addTeamGroup(mockGroup));
				expect(state.groups).toHaveLength(1);

				// Add second group
				const group2 = { ...mockGroup, id: 'group-2', name: 'Managers' };
				state = teamReducer(state, addTeamGroup(group2));
				expect(state.groups).toHaveLength(2);

				// Update first group name
				state = teamReducer(
					state,
					updateTeamGroupName({
						groupId: 'group-1',
						name: 'Senior Contractors',
					}),
				);
				expect(state.groups[0].name).toBe('Senior Contractors');

				// Add member to second group
				const newMember = { ...mockMember, id: 'member-2', groupId: 'group-2' };
				state = teamReducer(
					state,
					addTeamMember({ groupId: 'group-2', member: newMember }),
				);
				expect(state.groups[1].members).toHaveLength(2);

				// Delete first group
				state = teamReducer(state, deleteTeamGroup('group-1'));
				expect(state.groups).toHaveLength(1);
				expect(state.groups[0].id).toBe('group-2');
			});
		});
	});
});
