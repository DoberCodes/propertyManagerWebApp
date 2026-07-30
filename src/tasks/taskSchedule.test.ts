import {
	getTaskScheduleMode,
	getTaskTimingLabel,
	normalizeTaskSchedule,
} from './taskSchedule';

describe('task scheduling', () => {
	it('keeps legacy tasks without a due date as ASAP', () => {
		expect(getTaskScheduleMode({ dueDate: '' })).toBe('asap');
		expect(getTaskTimingLabel({ dueDate: '' })).toBe('ASAP');
	});

	it('distinguishes explicitly unscheduled tasks', () => {
		expect(getTaskScheduleMode({ dueDate: '', scheduleMode: 'unscheduled' })).toBe('unscheduled');
		expect(getTaskTimingLabel({ dueDate: '', scheduleMode: 'unscheduled' })).toBe('Not scheduled');
	});

	it('removes dates from ASAP and unscheduled task payloads', () => {
		expect(normalizeTaskSchedule({ dueDate: '2030-01-01', scheduleMode: 'asap' })).toEqual({
			dueDate: '',
			scheduleMode: 'asap',
		});
		expect(normalizeTaskSchedule({ dueDate: '2030-01-01', scheduleMode: 'unscheduled' })).toEqual({
			dueDate: '',
			scheduleMode: 'unscheduled',
		});
	});
});
