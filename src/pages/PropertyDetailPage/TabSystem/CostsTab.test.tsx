import { render, screen } from '@testing-library/react';
import { CostsTab } from './CostsTab';
import type { Task } from '../../../types/Task.types';

const buildTask = (overrides: Partial<Task>): Task =>
	({
		id: 'task-1',
		userId: 'user-1',
		propertyId: 'property-1',
		title: 'Task',
		dueDate: '2025-07-01',
		status: 'Initiated',
		property: 'property-1',
		notes: '',
		...overrides,
	}) as Task;

describe('CostsTab', () => {
	test('shows costs from maintenance events and task estimates in one view', () => {
		render(
			<CostsTab
				maintenanceHistoryRecords={[
					{
						id: 'event-1',
						title: 'HVAC installation',
						completionDate: '2025-06-14',
						financials: {
							currency: 'USD',
							actual: {
								contractorCost: 7325.18,
							},
						},
					},
				]}
				tasks={[
					buildTask({
						id: 'task-2',
						title: 'Replace HVAC filter',
						financials: {
							currency: 'USD',
							estimate: {
								materialsCost: 30,
							},
						},
					}),
				]}
			/>,
		);

		expect(screen.getByText('HVAC installation')).toBeInTheDocument();
		expect(screen.getByText('Replace HVAC filter')).toBeInTheDocument();
		expect(screen.getByText('$7,355.18 recorded')).toBeInTheDocument();
		expect(screen.getByText('1 maintenance record')).toBeInTheDocument();
		expect(screen.getByText('1 task cost')).toBeInTheDocument();
	});

	test('does not duplicate completed task costs when a linked maintenance event owns the cost', () => {
		render(
			<CostsTab
				maintenanceHistoryRecords={[
					{
						id: 'event-1',
						title: 'HVAC installation',
						completionDate: '2025-06-14',
						originalTaskId: 'task-1',
						financials: {
							currency: 'USD',
							actual: {
								contractorCost: 7325.18,
							},
						},
					},
				]}
				tasks={[
					buildTask({
						id: 'task-1',
						title: 'HVAC installation task',
						status: 'Completed',
						completionDate: '2025-06-14',
						financials: {
							currency: 'USD',
							actual: {
								contractorCost: 7325.18,
							},
						},
					}),
				]}
			/>,
		);

		expect(screen.getByText('HVAC installation')).toBeInTheDocument();
		expect(screen.queryByText('HVAC installation task')).not.toBeInTheDocument();
		expect(screen.getByText('$7,325.18 recorded')).toBeInTheDocument();
		expect(screen.getByText('1 maintenance record')).toBeInTheDocument();
		expect(screen.getByText('0 task costs')).toBeInTheDocument();
	});

	test('keeps active task estimates visible until completed work is recorded', () => {
		render(
			<CostsTab
				maintenanceHistoryRecords={[
					{
						id: 'event-1',
						title: 'HVAC installation',
						completionDate: '2025-06-14',
						linkedTaskIds: ['task-1'],
						financials: {
							currency: 'USD',
							actual: {
								contractorCost: 7325.18,
							},
						},
					},
				]}
				tasks={[
					buildTask({
						id: 'task-1',
						title: 'Future HVAC follow-up',
						status: 'Initiated',
						financials: {
							currency: 'USD',
							estimate: {
								laborCost: 100,
							},
						},
					}),
				]}
			/>,
		);

		expect(screen.getByText('HVAC installation')).toBeInTheDocument();
		expect(screen.getByText('Future HVAC follow-up')).toBeInTheDocument();
		expect(screen.getByText('$7,425.18 recorded')).toBeInTheDocument();
	});
});
