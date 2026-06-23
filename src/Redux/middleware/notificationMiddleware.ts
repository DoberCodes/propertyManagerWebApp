import { Middleware } from '@reduxjs/toolkit';
import { addDoc, collection } from '@firebase/firestore';
import { db } from '../../config/firebase';
import { Notification } from '../../types/Notification.types';
import { apiSlice } from '../API/apiSlice';

const notificationMiddleware: Middleware =
	(store) => (next) => async (action) => {
		// Pass the action to the next middleware/reducer
		const result = next(action);

		// Check if this is a fulfilled RTK Query mutation
		if (action.type?.endsWith('/fulfilled')) {
			const state = store.getState();
			const currentUser = state.user.currentUser;
			const isNotificationsEnabled =
				currentUser?.notificationPreferences?.enabled ?? true;
			const preferenceTypes = currentUser?.notificationPreferences?.types as
				| Record<string, boolean>
				| undefined;

			const isTypeEnabled = (type: string) =>
				isNotificationsEnabled && (preferenceTypes?.[type] ?? true);

			const createInAppNotification = async (
				notificationData: Omit<Notification, 'id'>,
			) => {
				await addDoc(collection(db, 'notifications'), notificationData);
				store.dispatch(apiSlice.util.invalidateTags(['Notifications']));
			};

			// Define which mutations should trigger notifications
			const notificationTriggers = {
				createTask: {
					type: 'task_created',
					title: 'Task Created',
					message: 'A new task has been created',
				},
				createProperty: {
					type: 'property_created',
					title: 'Property Added',
					message: 'A new property has been added',
				},
				updateProperty: {
					type: 'property_updated',
					title: 'Property Updated',
					message: 'A property has been updated',
				},
				deleteProperty: {
					type: 'property_deleted',
					title: 'Property Deleted',
					message: 'A property has been deleted',
				},
			};

			const endpointName = action.meta.arg.endpointName;
			const trigger = notificationTriggers[endpointName];
			if (trigger && currentUser) {
				// Check if notifications are enabled (default to true if not set)
				const notificationsEnabled = isNotificationsEnabled;
				const isNotificationEnabled = isTypeEnabled(trigger.type);

				if (notificationsEnabled && isNotificationEnabled) {
					// Create notification directly in Firestore
					try {
						const notificationData: Omit<Notification, 'id'> = {
							userId: currentUser.id,
							type: trigger.type,
							title: trigger.title,
							message: trigger.message,
							data: action.payload,
							status: 'unread',
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						};

						await createInAppNotification(notificationData);
					} catch (error) {
						console.error('Failed to create notification:', error);
					}
				}
			}

			if (currentUser && endpointName === 'createTask') {
				const task = action.payload as any;
				const priority = String(task?.priority || '').toLowerCase();
				const isCritical = priority === 'high' || priority === 'urgent';
				const hasAssignee = Boolean(task?.assignee);

				if (isCritical && !hasAssignee && isTypeEnabled('task_unassigned_critical')) {
					try {
						await createInAppNotification({
							userId: currentUser.id,
							type: 'task_unassigned_critical',
							title: 'Critical Task Needs Assignment',
							message: `"${task?.title || 'Task'}" is ${priority} priority and has no assignee.`,
							data: {
								taskId: task?.id,
								taskTitle: task?.title,
								priority: task?.priority,
								propertyId: task?.propertyId,
							},
							status: 'unread',
							actionUrl: task?.propertyId ? `/properties/${task.propertyId}` : undefined,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						});
					} catch (error) {
						console.error('Failed to create unassigned critical notification:', error);
					}
				}
			}

			if (currentUser && endpointName === 'updateTask') {
				const updates = action.meta?.arg?.originalArgs?.updates as any;
				const taskId = action.meta?.arg?.originalArgs?.id;
				const priority = String(updates?.priority || '').toLowerCase();
				const priorityUpdatedToCritical = priority === 'high' || priority === 'urgent';
				const explicitlyUnassigned =
					Object.prototype.hasOwnProperty.call(updates || {}, 'assignee') &&
					!updates?.assignee;

				if (
					priorityUpdatedToCritical &&
					explicitlyUnassigned &&
					isTypeEnabled('task_unassigned_critical')
				) {
					try {
						await createInAppNotification({
							userId: currentUser.id,
							type: 'task_unassigned_critical',
							title: 'Critical Task Needs Assignment',
							message: `Task ${taskId ? `#${taskId}` : ''} is now ${priority} priority and has no assignee.`,
							data: {
								taskId,
								priority: updates?.priority,
								propertyId: updates?.propertyId,
							},
							status: 'unread',
							actionUrl: updates?.propertyId
								? `/properties/${updates.propertyId}`
								: undefined,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						});
					} catch (error) {
						console.error('Failed to create unassigned critical notification:', error);
					}
				}
			}
		}

		return result;
	};

export default notificationMiddleware;
