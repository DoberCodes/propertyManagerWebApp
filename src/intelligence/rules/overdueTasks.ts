import { MaintleyIntelligenceRule } from '../types';
import { getTaskDate, isTaskOpen, makeFinding } from './helpers';

export const overdueTasksRule: MaintleyIntelligenceRule = {
	id: 'overdue-tasks-exist',
	evaluate: (context) => {
		const startOfToday = new Date(context.currentDate);
		startOfToday.setHours(0, 0, 0, 0);

		return context.tasks.flatMap((task) => {
			const dueDate = getTaskDate(task);
			if (!dueDate || !isTaskOpen(task) || dueDate >= startOfToday) {
				return [];
			}

			return [
				makeFinding(context, {
					id: `maintley-intelligence:${context.property.id}:overdue-task:${task.id}`,
					ruleId: 'overdue-tasks-exist',
					category: 'Overdue Work',
					severity: 'high',
					priority: 'high',
					title: `Review overdue task: ${task.title}`,
					description: `${task.title} was due on ${dueDate.toLocaleDateString()}.`,
					whyItMatters:
						'Overdue work directly affects maintenance execution and should be reviewed first.',
					suggestedActionLabel: 'Open Tasks',
					suggestedActionType: 'open_tasks',
					metadata: {
						taskId: task.id,
						taskTitle: task.title,
						dueDate: task.dueDate,
					},
				}),
			];
		});
	},
};
