import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TeamMember {
	id: string;
	groupId: string;
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: string[];
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
	createdAt?: string;
	updatedAt?: string;
}

export interface TeamGroup {
	id: string;
	userId: string;
	name: string;
	isEditingName?: boolean;
	linkedProperties: string[];
	members?: TeamMember[];
	createdAt?: string;
	updatedAt?: string;
}

interface TeamState {
	groups: TeamGroup[];
}

const initialState: TeamState = {
	groups: [],
};

const teamSlice = createSlice({
	name: 'team',
	initialState,
	reducers: {
		setTeamGroups: (state, action: PayloadAction<TeamGroup[]>) => {
			state.groups = action.payload;
		},
		addTeamGroup: (state, action: PayloadAction<TeamGroup>) => {
			state.groups.push(action.payload);
		},
		updateTeamGroup: (state, action: PayloadAction<TeamGroup>) => {
			const index = state.groups.findIndex((g) => g.id === action.payload.id);
			if (index !== -1) {
				state.groups[index] = action.payload;
			}
		},
		updateTeamGroupName: (
			state,
			action: PayloadAction<{ groupId: string; name: string }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.name = action.payload.name;
			}
		},
		toggleTeamGroupEditName: (state, action: PayloadAction<string>) => {
			const group = state.groups.find((g) => g.id === action.payload);
			if (group) {
				group.isEditingName = !group.isEditingName;
			}
		},
		deleteTeamGroup: (state, action: PayloadAction<string>) => {
			state.groups = state.groups.filter((g) => g.id !== action.payload);
		},
		addTeamMember: (
			state,
			action: PayloadAction<{ groupId: string; member: TeamMember }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				if (!group.members) {
					group.members = [];
				}
				group.members.push(action.payload.member);
			}
		},
		updateTeamMember: (state, action: PayloadAction<TeamMember>) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group && group.members) {
				const index = group.members.findIndex(
					(m) => m.id === action.payload.id,
				);
				if (index !== -1) {
					group.members[index] = action.payload;
				}
			}
		},
		deleteTeamMember: (
			state,
			action: PayloadAction<{ groupId: string; memberId: string }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group && group.members) {
				group.members = group.members.filter(
					(m) => m.id !== action.payload.memberId,
				);
			}
		},
	},
});

export const {
	setTeamGroups,
	addTeamGroup,
	updateTeamGroup,
	updateTeamGroupName,
	toggleTeamGroupEditName,
	deleteTeamGroup,
	addTeamMember,
	updateTeamMember,
	deleteTeamMember,
} = teamSlice.actions;

export default teamSlice.reducer;
