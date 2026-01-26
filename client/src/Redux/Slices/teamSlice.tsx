import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TeamMember {
	id: number;
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: number[];
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
}

export interface TeamGroup {
	id: number;
	name: string;
	isEditingName?: boolean;
	linkedProperties: number[];
	members: TeamMember[];
}

export interface TeamState {
	groups: TeamGroup[];
}

const initialState: TeamState = {
	groups: [
		{
			id: 1,
			name: 'Leadership',
			linkedProperties: [1, 2, 3, 4],
			members: [
				{
					id: 1,
					firstName: 'Admin',
					lastName: 'User',
					title: 'System Administrator',
					email: 'admin@test.com',
					phone: '(555) 000-0001',
					role: 'admin',
					address: '100 Admin Plaza, Admin City, State',
					image: 'https://via.placeholder.com/120?text=AU',
					notes: 'System administrator with full access',
					linkedProperties: [1, 2, 3, 4],
					taskHistory: [
						{ date: '2026-01-25', task: 'System maintenance' },
						{ date: '2026-01-20', task: 'User management' },
					],
					files: [],
				},
				{
					id: 2,
					firstName: 'John',
					lastName: 'Smith',
					title: 'Senior Property Manager',
					email: 'john@test.com',
					phone: '(555) 123-4567',
					role: 'property_manager',
					address: '123 Main St, City, State',
					image: 'https://via.placeholder.com/120?text=JS',
					notes: 'Senior property manager',
					linkedProperties: [1, 2],
					taskHistory: [
						{ date: '2026-01-25', task: 'Property inspection' },
						{ date: '2026-01-20', task: 'Tenant meeting' },
					],
					files: [],
				},
				{
					id: 3,
					firstName: 'Sarah',
					lastName: 'Johnson',
					title: 'Assistant Manager',
					email: 'sarah@test.com',
					phone: '(555) 234-5678',
					role: 'assistant_manager',
					address: '456 Oak Ave, City, State',
					image: 'https://via.placeholder.com/120?text=SJ',
					notes: 'Assistant manager',
					linkedProperties: [3, 4],
					taskHistory: [
						{ date: '2026-01-22', task: 'Lease review' },
						{ date: '2026-01-18', task: 'Tenant screening' },
					],
					files: [],
				},
			],
		},
		{
			id: 2,
			name: 'Maintenance Team',
			linkedProperties: [1, 2, 3, 4],
			members: [
				{
					id: 4,
					firstName: 'Mike',
					lastName: 'Rodriguez',
					title: 'Maintenance Lead',
					email: 'mike@test.com',
					phone: '(555) 345-6789',
					role: 'maintenance_lead',
					address: '789 Pine St, City, State',
					image: 'https://via.placeholder.com/120?text=MR',
					notes: 'Lead maintenance technician',
					linkedProperties: [1, 2, 3, 4],
					taskHistory: [
						{ date: '2026-01-24', task: 'HVAC repair' },
						{ date: '2026-01-19', task: 'Plumbing fix' },
					],
					files: [],
				},
				{
					id: 5,
					firstName: 'Chris',
					lastName: 'Thompson',
					title: 'Maintenance Technician',
					email: 'chris@test.com',
					phone: '(555) 456-7890',
					role: 'maintenance',
					address: '321 Elm St, City, State',
					image: 'https://via.placeholder.com/120?text=CT',
					notes: 'Maintenance technician',
					linkedProperties: [1, 2, 3, 4],
					taskHistory: [
						{ date: '2026-01-23', task: 'Electrical work' },
						{ date: '2026-01-17', task: 'Door repair' },
					],
					files: [],
				},
			],
		},
		{
			id: 3,
			name: 'External Partners',
			linkedProperties: [1, 2, 3, 4],
			members: [
				{
					id: 6,
					firstName: 'David',
					lastName: 'Lee',
					title: 'Independent Contractor',
					email: 'david@test.com',
					phone: '(555) 567-8901',
					role: 'contractor',
					address: '555 Contractor Ave, City, State',
					image: 'https://via.placeholder.com/120?text=DL',
					notes: 'Independent contractor',
					linkedProperties: [2, 4],
					taskHistory: [{ date: '2026-01-21', task: 'Exterior painting' }],
					files: [],
				},
			],
		},
		{
			id: 4,
			name: 'Tenants',
			linkedProperties: [1, 2, 3, 4],
			members: [
				{
					id: 7,
					firstName: 'Emily',
					lastName: 'Brown',
					title: 'Tenant',
					email: 'emily@test.com',
					phone: '(555) 678-9012',
					role: 'tenant',
					address: '101 Tenant St, Apt 5B, City, State',
					image: 'https://via.placeholder.com/120?text=EB',
					notes: 'Tenant',
					linkedProperties: [1],
					taskHistory: [],
					files: [],
				},
			],
		},
	],
};

export const teamSlice = createSlice({
	name: 'team',
	initialState,
	reducers: {
		// Group actions
		addTeamGroup: (state, action: PayloadAction<TeamGroup>) => {
			state.groups.push(action.payload);
		},
		deleteTeamGroup: (state, action: PayloadAction<number>) => {
			state.groups = state.groups.filter((g) => g.id !== action.payload);
		},
		updateTeamGroupName: (
			state,
			action: PayloadAction<{ groupId: number; name: string }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.name = action.payload.name;
				group.isEditingName = false;
			}
		},
		toggleTeamGroupEditName: (state, action: PayloadAction<number>) => {
			const group = state.groups.find((g) => g.id === action.payload);
			if (group) {
				group.isEditingName = !group.isEditingName;
			}
		},

		// Member actions
		addTeamMember: (
			state,
			action: PayloadAction<{ groupId: number; member: TeamMember }>,
		) => {
			const group = state.groups.find((g) => g.id === action.payload.groupId);
			if (group) {
				group.members.push(action.payload.member);
			}
		},
		updateTeamMember: (
			state,
			action: PayloadAction<{ groupId: number; member: TeamMember }>,
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
			action: PayloadAction<{ groupId: number; memberId: number }>,
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
