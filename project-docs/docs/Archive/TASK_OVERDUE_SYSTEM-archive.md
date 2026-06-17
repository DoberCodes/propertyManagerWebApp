# Task Display Status System

# Archived

Task overdue behavior has been consolidated into:

DATA_MODEL.md

See:

Task Model
→ Task Status Model
→ Overdue Handling

Last reviewed: 2026-06-12

Maintley keeps task workflow state simple and derives homeowner-facing timing labels from the task due date.

## Stored Status

Task records may still contain legacy statuses for backward compatibility, but new task flows should primarily use:

- `Initiated`
- `Completed`

Existing legacy values may still appear in older records:

- `Pending`
- `In Progress`
- `Awaiting Approval`
- `Rejected`
- `Overdue`
- `Hold`

Do not rely on `status: Overdue` as the source of truth. Overdue is derived from `dueDate` for display, sorting, notification wording, and email grouping.

## Derived Display Status

Frontend helper:

- `src/utils/taskDisplayStatus.ts`

Functions helper:

- `functions/taskDisplayStatus.ts`

Derived labels:

- `Initiated`: no usable due date and not completed.
- `Upcoming`: due date is more than 14 days away.
- `Due Soon`: due date is today through 14 days away.
- `Overdue`: due date is before today, or a legacy task is already stored as `Overdue`.
- `Completed`: stored status is `Completed`.

## Backend Function

Function:

- `functions/markTasksAsOverdue.ts`

Export:

- `markTasksAsOverdue`

Current purpose:

- Runs as a compatibility/observability check.
- Logs how many active tasks currently display as overdue.
- Does not update task documents.

## Notifications And Emails

Task-specific notification schedules still drive reminder delivery.

Reminder emails and in-app notification wording should use homeowner-facing language:

- `Upcoming Maintenance`
- `Due Soon`
- `Maintenance Due Today`
- `Overdue Maintenance`

Monthly Property Summary groups upcoming and overdue tasks by derived due-date state, not by requiring a stored `Overdue` status.

