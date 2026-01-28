import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TeamMember {
	id: string; // Changed to string (Firebase)
	groupId: string; // Added (Firebase)
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: string[]; // Changed to string (Firebase)
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
	createdAt?: string; // Added (Firebase)
	updatedAt?: string; // Added (Firebase)
}

export interface TeamGroup {
	id: string; // Changed to string (Firebase)
	userId: string; // Added (Firebase)
	name: string;
	isEditingName?: boolean;
	linkedProperties: string[]; // Changed to string (Firebase)
	members: TeamMember[];
	createdAt?: string; // Added (Firebase)
	updatedAt?: string; // Added (Firebase)
}

export interface TeamState {
	groups: TeamGroup[];
}

const initialState: TeamState = {
	groups: [],
};

export const teamSlice = createSlice({
	name: 'team',
	initialState,
	reducers: {
		// Group actions
		addTeamGroup: (state, action: PayloadAction<TeamGroup>) => {
			state.groups.push(action.payload);
		},
		deleteTeamGroup: (state, action: PayloadAction<string>) => {
			state.groups = state.groups.filter((g) => g.id !== action.payload);
		},
		updateTeamGroupName: (
			state,
			action: PayloadAction<{ groupId: string; name: string }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.name = action.payload.name;
				group.isEditingName = false;
			}
		},
		toggleTeamGroupEditName: (state, action: PayloadAction<string>) => {
			const group = state.groups.find((g) => g.id === action.payload);
			if (group) {
				group.isEditingName = !group.isEditingName;
			}
		},

		// Member actions
		addTeamMember: (
			state,
			action: PayloadAction<{ groupId: string; member: TeamMember }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.members.push(action.payload.member);
			}
		},
		updateTeamMember: (
			state,
			action: PayloadAction<{ groupId: string; member: TeamMember }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				const memberIndex = group.members.findIndex(
					(m) => m.id === action.payload.member.id,
				);
				if (memberIndex >= 0) {
					group.members[memberIndex] = action.payload.member;
				}
			}
		},
		deleteTeamMember: (
			state,
			action: PayloadAction<{ groupId: string; memberId: string }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.members = group.members.filter(
					(m) => m.id !== action.payload.memberId,
				);
			}
		},
	},
});

export const {
	addTeamGroup,
	deleteTeamGroup,
	updateTeamGroupName,
	toggleTeamGroupEditName,
	addTeamMember,
	updateTeamMember,
	deleteTeamMember,
} = teamSlice.actions;

export default teamSlice.reducer;
