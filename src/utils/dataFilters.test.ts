import { filterTasksByRole } from './dataFilters';
import { USER_ROLES } from '../constants/roles';

describe('dataFilters utility functions', () => {
	describe('filterTasksByRole', () => {
		const mockTasks = [
			{
				id: '1',
				title: 'Task 1',
				property: 'Main Street Property',
			},
			{
				id: '2',
				title: 'Task 2',
				property: 'Main Street Property',
			},
			{
				id: '3',
				title: 'Task 3',
				property: 'Oak Street Property',
			},
		];

		const mockProperties = [
			{ id: 'prop1', title: 'Main Street Property' },
			{ id: 'prop2', title: 'Oak Street Property' },
		];

		const mockTeamMembers = [
			{
				id: 'member1',
				email: 'contractor@example.com',
				linkedProperties: ['prop1'],
			},
			{
				id: 'member2',
				email: 'tenant@example.com',
				linkedProperties: ['prop1'],
			},
		];

		const mockUser = {
			id: 'user1',
			email: 'contractor@example.com',
			role: USER_ROLES.CONTRACTOR,
		};

		it('should return all tasks for admin role', () => {
			const adminUser = { ...mockUser, role: USER_ROLES.ADMIN };
			const result = filterTasksByRole(mockTasks as any, adminUser as any);
			expect(result).toHaveLength(3);
			expect(result).toEqual(mockTasks);
		});

		it('should return all tasks for property manager role', () => {
			const managerUser = { ...mockUser, role: USER_ROLES.PROPERTY_MANAGER };
			const result = filterTasksByRole(mockTasks as any, managerUser as any);
			expect(result).toHaveLength(3);
			expect(result).toEqual(mockTasks);
		});

		it('should filter tasks by linkedProperties for contractor role', () => {
			const contractorUser = { ...mockUser, role: USER_ROLES.CONTRACTOR };
			const result = filterTasksByRole(
				mockTasks as any,
				contractorUser as any,
				mockTeamMembers as any,
				mockProperties as any,
			);
			expect(result).toHaveLength(2);
			expect(
				result.every((task) => task.property === 'Main Street Property'),
			).toBe(true);
		});

		it('should filter tasks by linkedProperties for tenant role', () => {
			const tenantUser = {
				...mockUser,
				role: USER_ROLES.TENANT,
				email: 'tenant@example.com',
			};
			const result = filterTasksByRole(
				mockTasks as any,
				tenantUser as any,
				mockTeamMembers as any,
				mockProperties as any,
			);
			expect(result).toHaveLength(2);
			expect(
				result.every((task) => task.property === 'Main Street Property'),
			).toBe(true);
		});

		it('should return empty array if tasks is undefined', () => {
			const result = filterTasksByRole(undefined as any, mockUser as any);
			expect(result).toEqual([]);
		});

		it('should return empty array if tasks is null', () => {
			const result = filterTasksByRole(null as any, mockUser as any);
			expect(result).toEqual([]);
		});

		it('should return empty array if user is undefined', () => {
			const result = filterTasksByRole(mockTasks as any, undefined as any);
			expect(result).toEqual([]);
		});

		it('should handle empty tasks array', () => {
			const result = filterTasksByRole([], mockUser as any);
			expect(result).toEqual([]);
		});
	});
});
