import {
	isTaskOverdue,
	isTaskOverdueForDisplay,
	matchesDateRangeOrIsOverdue,
} from './taskUtils';

const makeTask = (overrides: Record<string, unknown> = {}) => ({
	id: 'task-1',
	title: 'Test Task',
	status: 'Pending',
	priority: 'Medium',
	propertyId: 'property-1',
	property: 'Test Property',
	dueDate: new Date().toISOString(),
	...overrides,
});

describe('taskUtils overdue helpers', () => {
	describe('isTaskOverdue', () => {
		it('returns true for past-due active task', () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const task = makeTask({
				dueDate: yesterday.toISOString(),
				status: 'Pending',
			});

			expect(isTaskOverdue(task as any)).toBe(true);
		});

		it('returns false for past-due completed task', () => {
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);

			const task = makeTask({
				dueDate: yesterday.toISOString(),
				status: 'Completed',
			});

			expect(isTaskOverdue(task as any)).toBe(false);
		});
	});

	describe('isTaskOverdueForDisplay', () => {
		it('returns true for status Overdue even if due date checks would skip it', () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const task = makeTask({
				dueDate: tomorrow.toISOString(),
				status: 'Overdue',
			});

			expect(isTaskOverdueForDisplay(task as any)).toBe(true);
		});
	});

	describe('matchesDateRangeOrIsOverdue', () => {
		it('includes overdue tasks even when outside date range', () => {
			const task = makeTask({
				dueDate: '2024-01-01T10:00:00.000Z',
				status: 'Overdue',
			});

			expect(
				matchesDateRangeOrIsOverdue(task as any, '2030-01-01', '2030-12-31'),
			).toBe(true);
		});

		it('excludes non-overdue tasks outside date range', () => {
			const task = makeTask({
				dueDate: '2028-01-01T10:00:00.000Z',
				status: 'Pending',
			});

			expect(
				matchesDateRangeOrIsOverdue(task as any, '2030-01-01', '2030-12-31'),
			).toBe(false);
		});

		it('includes non-overdue tasks inside date range', () => {
			const task = makeTask({
				dueDate: '2030-06-01T10:00:00.000Z',
				status: 'Pending',
			});

			expect(
				matchesDateRangeOrIsOverdue(task as any, '2030-01-01', '2030-12-31'),
			).toBe(true);
		});
	});
});
