import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
} from '@firebase/firestore';
import { CompletionFile, Task, TaskFinancials } from '../../types/Task.types';
import { apiSlice, docToData } from './apiSlice';
import { auth, db } from '../../config/firebase';
import { callFirebaseFunction } from '../../config/firebaseFunctions';
import {
	filterRecordsByAccessProperties,
	resolveAccountAccessContext,
	resolveTargetUserId,
} from './accountContext';
import { canUseRecurringTasks } from '../../utils/subscriptionUtils';
import {
	buildMaintenanceEventFromTask,
	removeRecurringFieldsForPlan,
	withDefaultTaskNotificationSchedule,
} from '../../tasks/taskLifecycle';
import {
	approveTaskWorkflow,
	createNextRecurringTaskForCompletion,
	submitTaskCompletionWorkflow,
	TaskLifecycleDependencies,
} from '../../tasks/taskLifecycleWorkflow';
import { trackAnalyticsEvent } from '../../analytics/analytics';

const getSharedPropertyIdsForUser = async (
	userId: string,
	profileEmail?: string,
	authEmail?: string | null,
): Promise<string[]> => {
	void userId;
	void profileEmail;
	void authEmail;
	// Shared properties feature retired.
	return [];

	/*
	const propertyIdSet = new Set<string>();

	const sharesByUserQuery = query(
		collection(db, 'propertyShares'),
		where('sharedWithUserId', '==', userId),
	);
	const sharesByUserSnapshot = await getDocs(sharesByUserQuery);
	sharesByUserSnapshot.docs.forEach((shareDoc) => {
		const share = shareDoc.data() as PropertyShare;
		if (share?.propertyId) {
			propertyIdSet.add(share.propertyId);
		}
	});

	for (const email of getShareRecipientEmailCandidates(profileEmail, authEmail)) {
		const sharesByEmailQuery = query(
			collection(db, 'propertyShares'),
			where('sharedWithEmail', '==', email),
		);
		const sharesByEmailSnapshot = await getDocs(sharesByEmailQuery);
		sharesByEmailSnapshot.docs.forEach((shareDoc) => {
			const share = shareDoc.data() as PropertyShare;
			if (share?.propertyId) {
				propertyIdSet.add(share.propertyId);
			}
		});
	}

	return Array.from(propertyIdSet);
	*/
};

const writeMaintenanceEvent = async (
	event: Record<string, unknown>,
): Promise<void> => {
	await callFirebaseFunction<
		{ event: Record<string, unknown> },
		{ success: boolean; id: string }
	>('createMaintenanceEvent', { event });
};

const canAccountUseRecurringTasks = async (accountId: string): Promise<boolean> => {
	const accountUserSnapshot = await getDoc(doc(db, 'users', accountId));
	const accountUserData = accountUserSnapshot.data() || {};
	return Boolean(
		accountUserData.subscription &&
			canUseRecurringTasks(accountUserData.subscription as any),
	);
};


const notifyRecurringTaskGenerationFailure = async ({
	userId,
	task,
	taskId,
	error,
}: {
	userId: string;
	task: Task;
	taskId: string;
	error: unknown;
}): Promise<void> => {
	console.warn('Failed to create next recurring task:', error);
	try {
		const now = new Date().toISOString();
		await addDoc(collection(db, 'notifications'), {
			userId,
			type: 'task_recurring_generation_failed',
			title: 'Recurring Task Generation Failed',
			message: `Automatic recurring task creation failed for "${task.title}". Please review and create the next task manually.`,
			data: {
				taskId,
				taskTitle: task.title,
				propertyId: task.propertyId,
				recurrenceFrequency: task.recurrenceFrequency,
				recurrenceInterval: task.recurrenceInterval,
			},
			status: 'unread',
			actionUrl: task.propertyId ? `/properties/${task.propertyId}` : undefined,
			createdAt: now,
			updatedAt: now,
		});
	} catch (notificationError) {
		console.warn(
			'Failed to create recurring generation failure notification:',
			notificationError,
		);
	}
};

const createTaskLifecycleDependencies = (): TaskLifecycleDependencies => {
	return {
		getTask: async (taskId: string) => {
			const taskSnapshot = await getDoc(doc(db, 'tasks', taskId));
			return taskSnapshot.exists() ? (taskSnapshot.data() as Task) : null;
		},
		writeMaintenanceEvent,
		createTask: async (task) => {
			await addDoc(collection(db, 'tasks'), task);
		},
		deleteTask: async (taskId) => {
			await deleteDoc(doc(db, 'tasks', taskId));
		},
		notifyRecurringTaskGenerationFailure,
		warn: console.warn,
	};
};

export const taskSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Task endpoints
		getTasks: builder.query<Task[], void>({
			async queryFn() {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;
					const accessContext = await resolveAccountAccessContext();
					const accessibleAccountIds = accessContext.accountIds;
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data() || {};

					const ownedPropertyIds: string[] = [];
					for (const accountId of accessibleAccountIds) {
						try {
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('accountId', '==', accountId),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							ownedPropertyIds.push(
								...propertiesSnapshot.docs.map((propertyDoc) => propertyDoc.id),
							);
						} catch (ownedPropertiesError) {
							console.warn(
								'Could not fetch account-linked properties for tasks:',
								ownedPropertiesError,
							);
						}
					}

					// Also get shared properties for this user
					let sharedPropertyIds: string[] = [];
					try {
						// Get user's email first
						const userEmail = userData?.email;
						sharedPropertyIds = await getSharedPropertyIdsForUser(
							userId,
							userEmail,
							currentUser.email,
						);
					} catch (shareError) {
						// If getting shared properties fails, continue with owned properties only
						console.warn('Could not fetch shared properties:', shareError);
					}

					// Combine and deduplicate property IDs
					const allPropertyIds = [
						...new Set([...ownedPropertyIds, ...sharedPropertyIds]),
					].filter((propertyId) =>
						accessContext.isScopedTeamMember
							? accessContext.allowedPropertyIds.includes(String(propertyId))
							: true,
					);

					const accountTasks: Task[] = [];
					for (const accountId of accessibleAccountIds) {
						const accountTasksQuery = query(
							collection(db, 'tasks'),
							where('accountId', '==', accountId),
						);
						const accountTasksSnapshot = await getDocs(accountTasksQuery);
						const accountTasksBatch = accountTasksSnapshot.docs
							.map((doc) => docToData(doc) as Task)
							.filter(Boolean) as Task[];
						accountTasks.push(...accountTasksBatch);
					}

					// Fetch all tasks for these properties
					const allTasks: Task[] = [];
					if (allPropertyIds.length > 0) {
						for (const accountId of accessibleAccountIds) {
							for (let i = 0; i < allPropertyIds.length; i += 10) {
								const batch = allPropertyIds.slice(i, i + 10);
								try {
									const tasksQuery = query(
										collection(db, 'tasks'),
										where('accountId', '==', accountId),
										where('propertyId', 'in', batch),
									);
									const tasksSnapshot = await getDocs(tasksQuery);
									const tasks = tasksSnapshot.docs
										.map((doc) => docToData(doc) as Task)
										.filter(Boolean) as Task[];
									allTasks.push(...tasks);
								} catch (propertyTaskError) {
									console.warn(
										'Could not fetch property-linked tasks batch:',
										propertyTaskError,
									);
								}
							}
						}
					}

					const uniqueTasks = Array.from(
						new Map(
							[...accountTasks, ...allTasks].map((task) => [task.id, task]),
						).values(),
					) as Task[];

					return {
						data: filterRecordsByAccessProperties(
							uniqueTasks,
							accessContext,
							(task) => String(task.propertyId || ''),
						),
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Tasks'],
		}),

		createTask: builder.mutation<Task, Omit<Task, 'id'>>({
			async queryFn(newTask) {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const targetUserId = await resolveTargetUserId();
					const canUseRecurringTaskFeature =
						await canAccountUseRecurringTasks(targetUserId);
					const preparedTask = withDefaultTaskNotificationSchedule(
						removeRecurringFieldsForPlan(
							newTask as Record<string, any>,
							canUseRecurringTaskFeature,
						) as Omit<Task, 'id'>,
					);
					const docRef = await addDoc(collection(db, 'tasks'), {
						...preparedTask,
						userId: preparedTask.userId || targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					void trackAnalyticsEvent('task_created', {
						task_priority: String(preparedTask.priority || 'unspecified'),
						task_status: String(preparedTask.status || 'unspecified'),
						has_due_date: Boolean(preparedTask.dueDate),
						has_equipment: Boolean(
							(preparedTask as any).deviceId ||
								(preparedTask as any).applianceId ||
								((preparedTask as any).deviceIds || []).length,
						),
						is_recurring: Boolean((preparedTask as any).recurrence?.enabled),
						has_notifications: Boolean(
							Array.isArray((preparedTask as any).notifications) &&
								(preparedTask as any).notifications.length > 0,
						),
					});
					return {
						data: {
							id: docRef.id,
							...preparedTask,
							userId: preparedTask.userId || targetUserId,
							accountId: targetUserId,
						} as Task,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
		}),

		updateTask: builder.mutation<Task, { id: string; updates: Partial<Task> }>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'tasks', id);
					const snapshot = await getDoc(docRef);
					const existingTask = snapshot.exists()
						? (snapshot.data() as Task)
						: null;

					const targetUserId = await resolveTargetUserId();
					const canUseRecurringTaskFeature =
						await canAccountUseRecurringTasks(targetUserId);
					const preparedUpdates = removeRecurringFieldsForPlan(
						updates as Record<string, any>,
						canUseRecurringTaskFeature,
					) as Partial<Task>;
					const existingAccountId = String(
						(existingTask as any)?.accountId ||
							(existingTask as any)?.userId ||
							targetUserId,
					).trim();

					await updateDoc(docRef, {
						...(existingAccountId ? { accountId: existingAccountId } : {}),
						...preparedUpdates,
						updatedAt: new Date().toISOString(),
					});

					const transitioningToCompleted =
						preparedUpdates.status === 'Completed' &&
						existingTask &&
						existingTask.status !== 'Completed';

					if (transitioningToCompleted && existingTask) {
						const completionDate =
							(preparedUpdates as any).completionDate || new Date().toISOString();
						const completionNotes =
							(preparedUpdates as any).completionNotes ||
							existingTask.completionNotes ||
							'Completed from task';

						const eventPayload = buildMaintenanceEventFromTask({
							task: { ...existingTask, ...preparedUpdates, status: 'Completed' },
							taskId: id,
							accountId: (existingTask as any).accountId || targetUserId,
							eventType: 'task_completed',
							eventSource: 'task_completion',
							completionDate,
							completionNotes,
							completedBy: (preparedUpdates as any).completedBy || existingTask.completedBy,
							completedByName: (preparedUpdates as any).completedByName,
							completionFile: (preparedUpdates as any).completionFile,
							financials: (preparedUpdates as any).financials,
						});

						await writeMaintenanceEvent(eventPayload as Record<string, unknown>);
						await createNextRecurringTaskForCompletion({
							task: { ...existingTask, ...preparedUpdates, status: 'Completed' },
							taskId: id,
							accountId: (existingTask as any).accountId || targetUserId,
							completionDate,
							notifyUserId: auth.currentUser?.uid || targetUserId,
							deps: createTaskLifecycleDependencies(),
						});
						void trackAnalyticsEvent('task_completed', {
							completion_path: 'task_update',
							task_priority: String(existingTask.priority || 'unspecified'),
							has_completion_file: Boolean((preparedUpdates as any).completionFile),
							has_financials: Boolean((preparedUpdates as any).financials),
							is_recurring: Boolean((existingTask as any).recurrence?.enabled),
							approval_required: false,
						});
					}

					return { data: { id, ...preparedUpdates } as Task };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks', 'MaintenanceHistory', 'MaintenanceEvents'],
		}),

		deleteTask: builder.mutation<void, string>({
			async queryFn(taskId: string) {
				try {
					await deleteDoc(doc(db, 'tasks', taskId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
		}),

		// Task completion endpoints
		// Note: File upload now uses base64 encoding on the client side
		// See TaskCompletionModal.tsx for implementation

		submitTaskCompletion: builder.mutation<
			Partial<Task>,
			{
				taskId: string;
				completionDate: string;
				completionNotes?: string;
				completionFile?: CompletionFile;
				financials?: TaskFinancials;
				completedBy: string;
				canSelfComplete?: boolean;
				completedByPlan?: string;
			}
		>({
			async queryFn({
				taskId,
				completionDate,
				completionNotes,
				completionFile,
				financials,
				completedBy,
				completedByPlan,
			}) {
				try {
					const targetUserId = await resolveTargetUserId();
					const result = await submitTaskCompletionWorkflow(
						{
							taskId,
							accountId: targetUserId,
							notifyUserId: auth.currentUser?.uid || targetUserId,
							completionDate,
							completionNotes,
							completionFile,
							financials,
							completedBy,
							completedByPlan,
						},
						createTaskLifecycleDependencies(),
					);
					void trackAnalyticsEvent('task_completed', {
						completion_path: 'completion_workflow',
						has_completion_file: Boolean(completionFile),
						has_financials: Boolean(financials),
						approval_required: true,
						has_completion_notes: Boolean(String(completionNotes || '').trim()),
					});

					return { data: result };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks', 'MaintenanceHistory', 'MaintenanceEvents'],
		}),

		approveTask: builder.mutation<
			Partial<Task>,
			{ taskId: string; approvedBy: string }
		>({
			async queryFn({ taskId, approvedBy }) {
				try {
					const targetUserId = await resolveTargetUserId();
					const result = await approveTaskWorkflow(
						{
							taskId,
							accountId: targetUserId,
							approvedBy,
						},
						createTaskLifecycleDependencies(),
					);

					// TODO: Send notification to the user who completed the task

					return { data: result };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks', 'MaintenanceHistory', 'MaintenanceEvents'],
		}),

		rejectTask: builder.mutation<
			Partial<Task>,
			{ taskId: string; rejectionReason: string }
		>({
			async queryFn({ taskId, rejectionReason }) {
				try {
					const docRef = doc(db, 'tasks', taskId);
					const updates = {
						status: 'Rejected' as const,
						rejectionReason,
						updatedAt: new Date().toISOString(),
					};

					await updateDoc(docRef, updates);

					// TODO: Send notification to the user with rejection reason

					return { data: { id: taskId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
		}),
	}),
});

export const {
	useGetTasksQuery,
	useCreateTaskMutation,
	useUpdateTaskMutation,
	useDeleteTaskMutation,
	useSubmitTaskCompletionMutation,
	useApproveTaskMutation,
	useRejectTaskMutation,
} = taskSlice;
