"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTaskDisplayStatus = void 0;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 14;
const parseDateOnly = (value) => {
    if (!value)
        return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime()))
        return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};
const getToday = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};
const getTaskDisplayStatus = (task) => {
    const storedStatus = String(task.status || '').trim();
    if (storedStatus === 'Completed') {
        return {
            label: 'Completed',
            isCompleted: true,
            isOverdue: false,
            isDueSoon: false,
        };
    }
    const dueDate = parseDateOnly(task.dueDate);
    if (!dueDate) {
        return {
            label: 'Initiated',
            isCompleted: false,
            isOverdue: false,
            isDueSoon: false,
        };
    }
    const today = getToday();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY);
    const isOverdue = storedStatus === 'Overdue' || daysUntilDue < 0;
    if (isOverdue) {
        return {
            label: 'Overdue',
            isCompleted: false,
            isOverdue: true,
            isDueSoon: false,
        };
    }
    if (daysUntilDue <= DUE_SOON_DAYS) {
        return {
            label: 'Due Soon',
            isCompleted: false,
            isOverdue: false,
            isDueSoon: true,
        };
    }
    return {
        label: 'Upcoming',
        isCompleted: false,
        isOverdue: false,
        isDueSoon: false,
    };
};
exports.getTaskDisplayStatus = getTaskDisplayStatus;
