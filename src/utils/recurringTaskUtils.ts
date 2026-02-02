/**
 * Utility functions for handling recurring tasks
 */

import { RecurrenceFrequency, RecurrenceCustomUnit } from '../types/Task.types';

/**
 * Calculates the next due date for a recurring task
 * @param completionDate The date the task was completed
 * @param frequency The recurrence frequency (daily, weekly, etc.)
 * @param interval The number of periods to add (e.g., 2 for every 2 weeks)
 * @param customUnit The custom time unit (only used when frequency is 'custom')
 * @returns The next due date as an ISO string (YYYY-MM-DD)
 */
export const calculateNextDueDate = (
	completionDate: Date | string,
	frequency: RecurrenceFrequency,
	interval: number,
	customUnit?: RecurrenceCustomUnit,
): string => {
	const date =
		typeof completionDate === 'string'
			? new Date(completionDate)
			: completionDate;

	const nextDate = new Date(date);

	switch (frequency) {
		case 'daily':
			nextDate.setDate(nextDate.getDate() + interval);
			break;
		case 'weekly':
			nextDate.setDate(nextDate.getDate() + interval * 7);
			break;
		case 'biweekly':
			nextDate.setDate(nextDate.getDate() + interval * 14);
			break;
		case 'monthly':
			nextDate.setMonth(nextDate.getMonth() + interval);
			break;
		case 'quarterly':
			nextDate.setMonth(nextDate.getMonth() + interval * 3);
			break;
		case 'yearly':
			nextDate.setFullYear(nextDate.getFullYear() + interval);
			break;
		case 'custom':
			if (!customUnit) {
				throw new Error('Custom unit is required for custom frequency');
			}
			switch (customUnit) {
				case 'days':
					nextDate.setDate(nextDate.getDate() + interval);
					break;
				case 'weeks':
					nextDate.setDate(nextDate.getDate() + interval * 7);
					break;
				case 'months':
					nextDate.setMonth(nextDate.getMonth() + interval);
					break;
				case 'years':
					nextDate.setFullYear(nextDate.getFullYear() + interval);
					break;
				default:
					throw new Error(`Unknown custom unit: ${customUnit}`);
			}
			break;
		default:
			throw new Error(`Unknown recurrence frequency: ${frequency}`);
	}

	// Return as ISO string in format YYYY-MM-DD
	return nextDate.toISOString().split('T')[0];
};

/**
 * Formats frequency for display
 * @param frequency The recurrence frequency
 * @param interval The interval number
 * @param customUnit The custom time unit (only used when frequency is 'custom')
 * @returns Human-readable frequency string
 */
export const formatRecurrenceDisplay = (
	frequency: RecurrenceFrequency,
	interval: number,
	customUnit?: RecurrenceCustomUnit,
): string => {
	if (frequency === 'custom' && customUnit) {
		const plural = interval === 1 ? customUnit.slice(0, -1) : customUnit;
		return `Every ${interval} ${plural}`;
	}

	const intervalText = interval === 1 ? '' : `${interval} `;

	const frequencyMap: Record<Exclude<RecurrenceFrequency, 'custom'>, string> = {
		daily: 'day',
		weekly: 'week',
		biweekly: '2 weeks',
		monthly: 'month',
		quarterly: '3 months',
		yearly: 'year',
	};

	const freq =
		frequencyMap[frequency as Exclude<RecurrenceFrequency, 'custom'>];
	const plural = interval === 1 ? freq : `${freq}s`;

	return `Every ${intervalText}${plural}`;
};
