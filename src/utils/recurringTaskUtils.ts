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
	interval: number | string,
	customUnit?: RecurrenceCustomUnit,
): string => {
	// Ensure interval is a number
	const numericInterval =
		typeof interval === 'string' ? parseInt(interval, 10) : interval;

	// Handle date parsing to avoid timezone issues
	let date: Date;
	if (typeof completionDate === 'string') {
		// Parse date string as local date to avoid timezone conversion issues
		// Split YYYY-MM-DD and create date at local noon to avoid DST issues
		const [year, month, day] = completionDate.split('-').map(Number);
		date = new Date(year, month - 1, day, 12, 0, 0); // month is 0-indexed, noon time
	} else {
		date = completionDate;
	}

	const nextDate = new Date(date);

	switch (frequency) {
		case 'daily':
			nextDate.setDate(nextDate.getDate() + numericInterval);
			break;
		case 'weekly':
			nextDate.setDate(nextDate.getDate() + numericInterval * 7);
			break;
		case 'biweekly':
			nextDate.setDate(nextDate.getDate() + numericInterval * 14);
			break;
		case 'monthly':
			nextDate.setMonth(nextDate.getMonth() + numericInterval);
			break;
		case 'quarterly':
			nextDate.setMonth(nextDate.getMonth() + numericInterval * 3);
			break;
		case 'yearly':
			nextDate.setFullYear(nextDate.getFullYear() + numericInterval);
			break;
		case 'custom':
			if (!customUnit) {
				throw new Error('Custom unit is required for custom frequency');
			}
			switch (customUnit) {
				case 'days':
					nextDate.setDate(nextDate.getDate() + numericInterval);
					break;
				case 'weeks':
					nextDate.setDate(nextDate.getDate() + numericInterval * 7);
					break;
				case 'months':
					nextDate.setMonth(nextDate.getMonth() + numericInterval);
					break;
				case 'years':
					nextDate.setFullYear(nextDate.getFullYear() + numericInterval);
					break;
				default:
					throw new Error(`Unknown custom unit: ${customUnit}`);
			}
			break;
		default:
			throw new Error(`Unknown recurrence frequency: ${frequency}`);
	}

	console.log('Final next date:', nextDate);

	// Return as YYYY-MM-DD format, ensuring we get the correct date regardless of timezone
	const year = nextDate.getFullYear();
	const month = String(nextDate.getMonth() + 1).padStart(2, '0');
	const day = String(nextDate.getDate()).padStart(2, '0');
	const result = `${year}-${month}-${day}`;

	return result;
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
	interval: number | string,
	customUnit?: RecurrenceCustomUnit,
): string => {
	const numericInterval =
		typeof interval === 'string' ? parseInt(interval, 10) : interval;

	if (frequency === 'custom' && customUnit) {
		const plural = numericInterval === 1 ? customUnit.slice(0, -1) : customUnit;
		return `Every ${numericInterval} ${plural}`;
	}

	const intervalText = numericInterval === 1 ? '' : `${numericInterval} `;

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
	const plural = numericInterval === 1 ? freq : `${freq}s`;

	return `Every ${intervalText}${plural}`;
};
