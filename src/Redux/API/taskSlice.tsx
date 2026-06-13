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
import { httpsCallable } from 'firebase/functions';
import { CompletionFile, Task, TaskFinancials } from '../../types/Task.types';
import { MaintenanceEvent } from '../../types/MaintenanceEvent.types';
import { apiSlice, docToData } from './apiSlice';
import { auth, db, functions as cloudFunctions } from '../../config/firebase';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';
import { getDefaultTaskNotifications } from '../../utils/taskNotificationUtils';
import { canUseRecurringTasks } from '../../utils/subscriptionUtils';

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

type TeamMemberAccess = {
	id?: string;
	accountId?: string;
	email?: string;
	userAccountId?: string;
	linkedProperties?: string[];
};

const getTeamMemberAccessForCurrentUser = async (
	accountIds: string[],
	userData: any,
	userId: string,
	authEmail?: string | null,
): Promise<{ isScoped: boolean; linkedPropertyIds: Set<string> }> => {
	const isTeamMemberProfile =
		userData?.isTeamMemberAccount === true ||
		String(userData?.subscription?.promoCode || '')
			.trim()
			.toUpperCase()
			.startsWith('TEAM-');

	if (!isTeamMemberProfile || userData?.isAccountOwner === true) {
		return { isScoped: false, linkedPropertyIds: new Set() };
	}

	const normalizedEmail = String(userData?.email || authEmail || '')
		.trim()
		.toLowerCase();
	const teamMemberId = String(userData?.teamMemberId || '').trim();

	for (const accountId of accountIds) {
		if (teamMemberId) {
			const memberDoc = await getDoc(doc(db, 'teamMembers', teamMemberId));
			if (memberDoc.exists()) {
				const member = docToData(memberDoc) as TeamMemberAccess;
				if (!member.accountId || member.accountId === accountId) {
					return {
						isScoped: true,
						linkedPropertyIds: new Set(member.linkedProperties || []),
					};
				}
			}
		}

		const byUserQuery = query(
			collection(db, 'teamMembers'),
			where('accountId', '==', accountId),
			where('userAccountId', '==', userId),
		);
		const byUserSnapshot = await getDocs(byUserQuery);
		if (!byUserSnapshot.empty) {
			const member = docToData(byUserSnapshot.docs[0]) as TeamMemberAccess;
			return {
				isScoped: true,
				linkedPropertyIds: new Set(member.linkedProperties || []),
			};
		}

		if (normalizedEmail) {
			const membersQuery = query(
				collection(db, 'teamMembers'),
				where('accountId', '==', accountId),
			);
			const membersSnapshot = await getDocs(membersQuery);
			const emailMatch = membersSnapshot.docs
				.map((memberDoc) => docToData(memberDoc) as TeamMemberAccess)
				.find(
					(member) =>
						String(member?.email || '').trim().toLowerCase() ===
						normalizedEmail,
				);

			if (emailMatch) {
				return {
					isScoped: true,
					linkedPropertyIds: new Set(emailMatch.linkedProperties || []),
				};
			}
		}
	}

	return { isScoped: true, linkedPropertyIds: new Set() };
};

const filterTasksByAllowedProperties = (
	tasks: Task[],
	isScoped: boolean,
	linkedPropertyIds: Set<string>,
): Task[] => {
	if (!isScoped) {
		return tasks;
	}

	if (linkedPropertyIds.size === 0) {
		return [];
	}

	return tasks.filter((task) => linkedPropertyIds.has(String(task.propertyId || '')));
};

const sanitizeMaintenanceEvent = (event: Partial<MaintenanceEvent>) => {
	const sanitized: Record<string, unknown> = {};
	Object.entries(event).forEach(([key, value]) => {
		if (value !== undefined) {
			sanitized[key] = value;
		}
	});
	return sanitized;
};

const buildMaintenanceEventFromTask = ({
	task,
	taskId,
	accountId,
	eventType,
	eventSource,
	completionDate,
	completionNotes,
	completionFile,
	completedBy,
	completedByName,
	financials,
}: {
	task: Task;
	taskId: string;
	accountId: string;
	eventType: MaintenanceEvent['eventType'];
	eventSource: MaintenanceEvent['eventSource'];
	completionDate: string;
	completionNotes?: string;
	completionFile?: CompletionFile;
	completedBy?: string;
	completedByName?: string;
	financials?: TaskFinancials;
}) => {
	const now = new Date().toISOString();
	return sanitizeMaintenanceEvent({
		accountId,
		propertyId: task.propertyId,
		propertyTitle: task.propertyTitle || task.property,
		unitId: task.unitId,
		deviceIds: Array.isArray(task.devices) && task.devices.length > 0 ? task.devices : undefined,
		title: task.title || 'Maintenance event',
		completionDate,
		completionNotes: completionNotes || task.completionNotes,
		completedBy,
		completedByName,
		completionFile,
		financials: financials || task.financials,
		linkedTaskIds: [taskId],
		originalTaskId: taskId,
		recurringTaskId: task.isRecurring ? task.parentTaskId || taskId : undefined,
		maintenanceCycleId: task.isRecurring ? task.parentTaskId || taskId : undefined,
		eventType,
		eventSource,
		createdAt: now,
		updatedAt: now,
	});
};

const writeMaintenanceEvent = async (
	event: Record<string, unknown>,
): Promise<void> => {
	const createMaintenanceEvent = httpsCallable<
		{ event: Record<string, unknown> },
		{ success: boolean; id: string }
	>(cloudFunctions, 'createMaintenanceEvent');

	await createMaintenanceEvent({ event });
};

const withDefaultTaskNotificationSchedule = (
	task: Omit<Task, 'id'>,
): Omit<Task, 'id'> => {
	if (task.enableNotifications === false) {
		return task;
	}

	if (Array.isArray(task.notifications) && task.notifications.length > 0) {
		return {
			...task,
			enableNotifications:
				typeof task.enableNotifications === 'boolean'
					? task.enableNotifications
					: true,
		};
	}

	return {
		...task,
		enableNotifications: true,
		notifications: getDefaultTaskNotifications(),
	};
};

const canAccountUseRecurringTasks = async (accountId: string): Promise<boolean> => {
	const accountUserSnapshot = await getDoc(doc(db, 'users', accountId));
	const accountUserData = accountUserSnapshot.data() || {};
	return Boolean(
		accountUserData.subscription &&
			canUseRecurringTasks(accountUserData.subscription as any),
	);
};

const removeRecurringFieldsForPlan = <T extends Record<string, any>>(
	taskData: T,
	canUseRecurringTaskFeature: boolean,
): T => {
	if (canUseRecurringTaskFeature) {
		return taskData;
	}

	const nextTaskData: Record<string, any> = { ...taskData };
	nextTaskData.isRecurring = false;
	delete nextTaskData.recurrenceFrequency;
	delete nextTaskData.recurrenceInterval;
	delete nextTaskData.recurrenceCustomUnit;
	delete nextTaskData.parentTaskId;
	delete nextTaskData.lastRecurrenceDate;
	return nextTaskData as T;
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
					const accessibleAccountIds = await resolveAccessibleAccountIds();
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data() || {};
					const { isScoped, linkedPropertyIds } =
						await getTeamMemberAccessForCurrentUser(
							accessibleAccountIds,
							userData,
							userId,
							currentUser.email,
						);

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
						isScoped ? linkedPropertyIds.has(String(propertyId)) : true,
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
						data: filterTasksByAllowedProperties(
							uniqueTasks,
							isScoped,
							linkedPropertyIds,
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

					await updateDoc(docRef, {
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
					const docRef = doc(db, 'tasks', taskId);
					const taskSnapshot = await getDoc(docRef);
					if (!taskSnapshot.exists()) {
						return { error: 'Task not found' };
					}
					const taskData = taskSnapshot.data() as Task;
					const targetUserId = await resolveTargetUserId();
					const mergedFinancials = financials
						? {
								currency:
									financials.currency || taskData.financials?.currency || 'USD',
								estimate:
									financials.estimate || taskData.financials?.estimate,
								actual: financials.actual || taskData.financials?.actual,
								notes:
									financials.notes !== undefined
										? financials.notes
										: taskData.financials?.notes,
						  }
						: taskData.financials;
					const eventPayload = buildMaintenanceEventFromTask({
						task: { ...taskData, status: 'Completed' },
						taskId,
						accountId: (taskData as any).accountId || targetUserId,
						eventType: 'task_completed',
						eventSource: 'task_completion',
						completionDate,
						completionNotes: completionNotes || taskData.completionNotes || '',
						completionFile,
						completedBy,
						completedByName: undefined,
						financials: mergedFinancials,
					});

					await writeMaintenanceEvent({
						...eventPayload,
						data: {
							completedByPlan,
						},
					});

					try {
						await deleteDoc(docRef);
					} catch (cleanupError) {
						console.warn('Task completion history was written, but task cleanup failed:', cleanupError);
					}

					return {
						data: {
							id: taskId,
							status: 'Completed',
							completionDate,
							completionFile,
							completedBy,
							completionNotes,
							financials: mergedFinancials,
						},
					};
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
					const docRef = doc(db, 'tasks', taskId);
					const taskSnapshot = await getDoc(docRef);
					if (!taskSnapshot.exists()) {
						return { error: 'Task not found' };
					}
					const taskData = taskSnapshot.data() as Task;
					const targetUserId = await resolveTargetUserId();
					const approvedAt = new Date().toISOString();
					const updates = {
						status: 'Completed' as const,
						approvedBy,
						updatedAt: approvedAt,
					};

					const eventPayload = buildMaintenanceEventFromTask({
						task: { ...taskData, ...updates },
						taskId,
						accountId: (taskData as any).accountId || targetUserId,
						eventType: 'task_approved',
						eventSource: 'task_approval',
						completionDate: taskData.completionDate || approvedAt,
						completionNotes: taskData.completionNotes,
						completionFile: taskData.completionFile,
						completedBy: taskData.completedBy,
						completedByName: undefined,
						financials: taskData.financials,
					});

					await writeMaintenanceEvent({
						...eventPayload,
						data: {
							approvedBy,
							approvedAt,
						},
					});
					await deleteDoc(docRef);

					// TODO: Send notification to the user who completed the task

					return { data: { id: taskId, ...updates } };
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
