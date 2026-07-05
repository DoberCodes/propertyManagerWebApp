import {
	buildTaskAssignmentFields,
	buildTaskAssigneeOptions,
	getStoredTaskAssigneeOption,
} from './taskAssignment';

describe('taskAssignment', () => {
	it('builds one eligible list from current user, team, family, and company-only contractors', () => {
		const options = buildTaskAssigneeOptions({
			propertyId: 'property-1',
			currentUser: {
				id: 'owner-1',
				firstName: 'Avery',
				lastName: 'Owner',
				email: 'avery@example.com',
			},
			teamMembers: [
				{
					id: 'team-1',
					firstName: 'Morgan',
					lastName: 'Lead',
					title: 'Maintenance Lead',
					email: 'morgan@example.com',
					linkedProperties: ['property-1'],
				},
			],
			familyMembers: [
				{
					id: 'family-1',
					firstName: 'Jamie',
					lastName: 'Family',
					email: 'jamie@example.com',
				},
			],
			contractors: [
				{
					id: 'contractor-1',
					company: 'Pinecrest Roofing',
					category: 'Roofer',
					propertyId: 'property-1',
				},
			],
		});

		expect(options).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					value: 'owner-1',
					label: 'Avery Owner',
					type: 'user',
				}),
				expect.objectContaining({
					value: 'team-1',
					label: 'Morgan Lead (Maintenance Lead)',
					type: 'team_member',
				}),
				expect.objectContaining({
					value: 'family-1',
					label: 'Jamie Family',
					type: 'family_member',
				}),
				expect.objectContaining({
					value: 'contractor-1',
					label: 'Pinecrest Roofing (Roofer)',
					type: 'contractor',
				}),
			]),
		);
	});

	it('filters property-scoped team members and contractors by property', () => {
		const options = buildTaskAssigneeOptions({
			propertyId: 'property-1',
			currentUser: null,
			teamMembers: [
				{
					id: 'team-visible',
					firstName: 'Visible',
					lastName: 'Tech',
					linkedProperties: ['property-1'],
				},
				{
					id: 'team-hidden',
					firstName: 'Hidden',
					lastName: 'Tech',
					linkedProperties: ['property-2'],
				},
			],
			contractors: [
				{
					id: 'contractor-visible',
					company: 'Visible HVAC',
					propertyId: 'property-1',
				},
				{
					id: 'contractor-hidden',
					company: 'Hidden HVAC',
					propertyId: 'property-2',
				},
			],
		});

		expect(options.map((option) => option.value)).toEqual([
			'team-visible',
			'contractor-visible',
		]);
	});

	it('preserves stored assignee snapshots for former assignees', () => {
		expect(
			getStoredTaskAssigneeOption({
				assignee: 'former-1',
				assignedTo: {
					id: 'former-1',
					name: 'Former Vendor',
					email: 'former@example.com',
					type: 'contractor',
				},
			}),
		).toEqual({
			value: 'former-1',
			label: 'Former Vendor',
			email: 'former@example.com',
			type: 'contractor',
		});
	});

	it('creates the persisted assignment fields from the selected option', () => {
		const fields = buildTaskAssignmentFields('contractor-1', [
			{
				value: 'contractor-1',
				label: 'Pinecrest Roofing (Roofer)',
				type: 'contractor',
			},
		]);

		expect(fields).toEqual({
			assignee: 'contractor-1',
			assignedTo: {
				id: 'contractor-1',
				name: 'Pinecrest Roofing (Roofer)',
				type: 'contractor',
			},
		});
	});

	it('deduplicates assignees by record id', () => {
		const options = buildTaskAssigneeOptions({
			currentUser: { id: 'same-id', firstName: 'Current', lastName: 'User' },
			additionalOptions: [
				{ value: 'same-id', label: 'Duplicate User', type: 'user' },
			],
		});

		expect(options).toHaveLength(1);
		expect(options[0].label).toBe('Current User');
	});
});
