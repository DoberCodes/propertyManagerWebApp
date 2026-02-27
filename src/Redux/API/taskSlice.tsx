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
import { CompletionFile, Task } from '../../types/Task.types';
import { apiSlice, docToData } from './apiSlice';
import { auth, db } from '../../config/firebase';
import { PropertyShare } from '../../types/Property.types';
import {
	resolveAccessibleAccountIds,
	resolveTargetUserId,
} from './accountContext';

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

						if (userEmail) {
							// Find all shares where this user has access
							const sharesQuery = query(
								collection(db, 'propertyShares'),
								where('sharedWithEmail', '==', userEmail),
							);
							const sharesSnapshot = await getDocs(sharesQuery);
							sharedPropertyIds = sharesSnapshot.docs
								.map((doc) => doc.data() as PropertyShare)
								.filter(Boolean)
								.map((share) => share.propertyId);
						}
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
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Task };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks'],
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
				completionFile: CompletionFile;
				completedBy: string;
				userType?: string;
			}
		>({
			async queryFn({
				taskId,
				completionDate,
				completionNotes,
				completionFile,
				completedBy,
				userType,
			}) {
				try {
					const docRef = doc(db, 'tasks', taskId);
					const taskSnapshot = await getDoc(docRef);
					if (!taskSnapshot.exists()) {
						return { error: 'Task not found' };
					}
					const taskData = taskSnapshot.data() as Task;
					const targetUserId = await resolveTargetUserId();
					const historyData = {
						...taskData,
						status: 'Completed',
						completionDate,
						completionFile,
						completedBy,
						completionNotes: completionNotes || taskData.completionNotes || '',
						originalTaskId: taskId,
						completedByUserType: userType,
						userId: taskData.userId,
						ownerId: taskData.userId,
						propertyId: taskData.propertyId,
						accountId: (taskData as any).accountId || targetUserId,
						propertyTitle: taskData.propertyTitle || taskData.property,
						// Link recurring tasks together
						recurringTaskId: taskData.isRecurring
							? taskData.parentTaskId || taskId
							: undefined,
						updatedAt: new Date().toISOString(),
					};

					// Remove any undefined fields (Firebase doesn't allow them)
					Object.keys(historyData).forEach((key) => {
						if (historyData[key] === undefined) {
							delete historyData[key];
						}
					});

					await addDoc(collection(db, 'maintenanceHistory'), historyData);
					await deleteDoc(docRef);

					return {
						data: {
							id: taskId,
							status: 'Completed',
							completionDate,
							completionFile,
							completedBy,
							completionNotes,
						},
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks', 'MaintenanceHistory'],
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
						approvedAt,
						updatedAt: approvedAt,
					};

					const historyData = {
						...taskData,
						...updates,
						accountId: (taskData as any).accountId || targetUserId,
						originalTaskId: taskId,
						// Link recurring tasks together
						recurringTaskId: taskData.isRecurring
							? taskData.parentTaskId || taskId
							: undefined,
					};

					// Remove any undefined fields (Firebase doesn't allow them)
					Object.keys(historyData).forEach((key) => {
						if (historyData[key] === undefined) {
							delete historyData[key];
						}
					});

					await addDoc(collection(db, 'maintenanceHistory'), historyData);
					await deleteDoc(docRef);

					// TODO: Send notification to the user who completed the task

					return { data: { id: taskId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Tasks', 'MaintenanceHistory'],
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
