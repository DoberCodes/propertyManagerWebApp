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
import { PropertyShare } from '../../types/Property.types';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';

const getShareRecipientEmailCandidates = (
	profileEmail?: string,
	authEmail?: string | null,
): string[] => {
	const candidates = [
		String(profileEmail || '').trim(),
		String(profileEmail || '').trim().toLowerCase(),
		String(authEmail || '').trim(),
		String(authEmail || '').trim().toLowerCase(),
	].filter(Boolean);

	return Array.from(new Set(candidates));
};

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
						const userDocRef = doc(db, 'users', userId);
						const userDoc = await getDoc(userDocRef);
						const userEmail = userDoc.data()?.email;
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
					];

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

					return { data: uniqueTasks };
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
					const docRef = await addDoc(collection(db, 'tasks'), {
						...newTask,
						userId: newTask.userId || targetUserId,
						accountId: targetUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return {
						data: {
							id: docRef.id,
							...newTask,
							userId: newTask.userId || targetUserId,
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

					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});

					const transitioningToCompleted =
						updates.status === 'Completed' &&
						existingTask &&
						existingTask.status !== 'Completed';

					if (transitioningToCompleted && existingTask) {
						const targetUserId = await resolveTargetUserId();
						const completionDate =
							(updates as any).completionDate || new Date().toISOString();
						const completionNotes =
							(updates as any).completionNotes ||
							existingTask.completionNotes ||
							'Completed from task workflow';

						const eventPayload = buildMaintenanceEventFromTask({
							task: { ...existingTask, ...updates, status: 'Completed' },
							taskId: id,
							accountId: (existingTask as any).accountId || targetUserId,
							eventType: 'task_completed',
							eventSource: 'task_completion',
							completionDate,
							completionNotes,
							completedBy: (updates as any).completedBy || existingTask.completedBy,
							completedByName: (updates as any).completedByName,
							completionFile: (updates as any).completionFile,
							financials: (updates as any).financials,
						});

						await writeMaintenanceEvent(eventPayload as Record<string, unknown>);
					}

					return { data: { id, ...updates } as Task };
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

		// Task completion workflow endpoints
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
					await deleteDoc(docRef);

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
