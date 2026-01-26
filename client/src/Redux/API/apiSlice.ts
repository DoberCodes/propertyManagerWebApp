import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	getDoc,
	updateDoc,
	deleteDoc,
	addDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';

// Types
export interface Property {
	id: string;
	groupId: string;
	title: string;
	slug: string;
	image?: string;
	owner?: string;
	administrators?: string[];
	viewers?: string[];
	address?: string;
	bedrooms?: number;
	bathrooms?: number;
	devices?: any[];
	notes?: string;
	maintenanceHistory?: Array<{ date: string; description: string }>;
	isFavorite?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export interface PropertyGroup {
	id: string;
	userId: string;
	name: string;
	isEditingName?: boolean;
	properties?: Property[];
	createdAt?: string;
	updatedAt?: string;
}

export interface CompletionFile {
	name: string;
	url: string;
	size: number;
	type: string;
	uploadedAt: string;
}

export interface Task {
	id: string;
	propertyId: string;
	title: string;
	dueDate: string;
	status:
		| 'Pending'
		| 'In Progress'
		| 'Awaiting Approval'
		| 'Completed'
		| 'Rejected';
	property: string;
	notes?: string;
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string; // User ID who completed the task
	approvedBy?: string; // Admin/Lead ID who approved
	approvedAt?: string;
	rejectionReason?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface TeamMember {
	id: string;
	groupId: string;
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: string[];
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
	createdAt?: string;
	updatedAt?: string;
}

export interface TeamGroup {
	id: string;
	userId: string;
	name: string;
	isEditingName?: boolean;
	linkedProperties: string[];
	members?: TeamMember[];
	createdAt?: string;
	updatedAt?: string;
}

// Helper function to convert Firestore docs to data with IDs
const docToData = (docSnapshot: any) => {
	if (!docSnapshot.exists()) return null;
	return { id: docSnapshot.id, ...docSnapshot.data() };
};

export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fakeBaseQuery(),
	endpoints: (builder) => ({
		// Property Group endpoints
		getPropertyGroups: builder.query<PropertyGroup[], string>({
			async queryFn(userId: string) {
				try {
					const q = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', userId),
					);
					const querySnapshot = await getDocs(q);
					const groups = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as PropertyGroup[];
					return { data: groups };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		getPropertyGroup: builder.query<PropertyGroup, string>({
			async queryFn(groupId: string) {
				try {
					const docRef = doc(db, 'propertyGroups', groupId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot);
					return { data: data as PropertyGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		createPropertyGroup: builder.mutation<
			PropertyGroup,
			Omit<PropertyGroup, 'id'>
		>({
			async queryFn(newGroup) {
				try {
					const docRef = await addDoc(collection(db, 'propertyGroups'), {
						...newGroup,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newGroup } as PropertyGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		updatePropertyGroup: builder.mutation<
			PropertyGroup,
			{ id: string; updates: Partial<PropertyGroup> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'propertyGroups', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as PropertyGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		deletePropertyGroup: builder.mutation<void, string>({
			async queryFn(groupId: string) {
				try {
					await deleteDoc(doc(db, 'propertyGroups', groupId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		// Property endpoints
		getProperties: builder.query<Property[], string>({
			async queryFn(groupId: string) {
				try {
					const q = query(
						collection(db, 'properties'),
						where('groupId', '==', groupId),
					);
					const querySnapshot = await getDocs(q);
					const properties = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as Property[];
					return { data: properties };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		getProperty: builder.query<Property, string>({
			async queryFn(propertyId: string) {
				try {
					const docRef = doc(db, 'properties', propertyId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot);
					return { data: data as Property };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		createProperty: builder.mutation<Property, Omit<Property, 'id'>>({
			async queryFn(newProperty) {
				try {
					const docRef = await addDoc(collection(db, 'properties'), {
						...newProperty,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newProperty } as Property };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		updateProperty: builder.mutation<
			Property,
			{ id: string; updates: Partial<Property> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'properties', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Property };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		deleteProperty: builder.mutation<void, string>({
			async queryFn(propertyId: string) {
				try {
					await deleteDoc(doc(db, 'properties', propertyId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		// Task endpoints
		getTasks: builder.query<Task[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'tasks'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const tasks = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as Task[];
					return { data: tasks };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		createTask: builder.mutation<Task, Omit<Task, 'id'>>({
			async queryFn(newTask) {
				try {
					const docRef = await addDoc(collection(db, 'tasks'), {
						...newTask,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newTask } as Task };
				} catch (error: any) {
					return { error: error.message };
				}
			},
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
		}),

		// Task completion workflow endpoints
		uploadTaskCompletionFile: builder.mutation<
			CompletionFile,
			{ taskId: string; file: File }
		>({
			async queryFn({ taskId, file }) {
				try {
					// Create a unique filename
					const timestamp = Date.now();
					const fileName = `${timestamp}_${file.name}`;
					const filePath = `task-completions/${taskId}/${fileName}`;

					// Upload file to Firebase Storage
					const storageRef = ref(storage, filePath);
					const snapshot = await uploadBytes(storageRef, file);

					// Get download URL
					const downloadURL = await getDownloadURL(snapshot.ref);

					const completionFile: CompletionFile = {
						name: file.name,
						url: downloadURL,
						size: file.size,
						type: file.type,
						uploadedAt: new Date().toISOString(),
					};

					return { data: completionFile };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		submitTaskCompletion: builder.mutation<
			Partial<Task>,
			{
				taskId: string;
				completionDate: string;
				completionFile: CompletionFile;
				completedBy: string;
			}
		>({
			async queryFn({ taskId, completionDate, completionFile, completedBy }) {
				try {
					const docRef = doc(db, 'tasks', taskId);
					const updates = {
						status: 'Awaiting Approval' as const,
						completionDate,
						completionFile,
						completedBy,
						rejectionReason: undefined, // Clear any previous rejection
						updatedAt: new Date().toISOString(),
					};

					await updateDoc(docRef, updates);

					// TODO: Send notification to admin/maintenance lead
					// This would typically trigger a cloud function or send an email

					return { data: { id: taskId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		approveTask: builder.mutation<
			Partial<Task>,
			{ taskId: string; approvedBy: string }
		>({
			async queryFn({ taskId, approvedBy }) {
				try {
					const docRef = doc(db, 'tasks', taskId);
					const approvedAt = new Date().toISOString();
					const updates = {
						status: 'Completed' as const,
						approvedBy,
						approvedAt,
						updatedAt: approvedAt,
					};

					await updateDoc(docRef, updates);

					// TODO: Send notification to the user who completed the task

					return { data: { id: taskId, ...updates } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
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
		}),

		// Team Group endpoints
		getTeamGroups: builder.query<TeamGroup[], string>({
			async queryFn(userId: string) {
				try {
					const q = query(
						collection(db, 'teamGroups'),
						where('userId', '==', userId),
					);
					const querySnapshot = await getDocs(q);
					const groups = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as TeamGroup[];
					return { data: groups };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		createTeamGroup: builder.mutation<TeamGroup, Omit<TeamGroup, 'id'>>({
			async queryFn(newGroup) {
				try {
					const docRef = await addDoc(collection(db, 'teamGroups'), {
						...newGroup,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newGroup } as TeamGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		updateTeamGroup: builder.mutation<
			TeamGroup,
			{ id: string; updates: Partial<TeamGroup> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'teamGroups', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as TeamGroup };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		deleteTeamGroup: builder.mutation<void, string>({
			async queryFn(groupId: string) {
				try {
					await deleteDoc(doc(db, 'teamGroups', groupId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		// Team Member endpoints
		getTeamMembers: builder.query<TeamMember[], string>({
			async queryFn(groupId: string) {
				try {
					const q = query(
						collection(db, 'teamMembers'),
						where('groupId', '==', groupId),
					);
					const querySnapshot = await getDocs(q);
					const members = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as TeamMember[];
					return { data: members };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		createTeamMember: builder.mutation<TeamMember, Omit<TeamMember, 'id'>>({
			async queryFn(newMember) {
				try {
					const docRef = await addDoc(collection(db, 'teamMembers'), {
						...newMember,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newMember } as TeamMember };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		updateTeamMember: builder.mutation<
			TeamMember,
			{ id: string; updates: Partial<TeamMember> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'teamMembers', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as TeamMember };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),

		deleteTeamMember: builder.mutation<void, string>({
			async queryFn(memberId: string) {
				try {
					await deleteDoc(doc(db, 'teamMembers', memberId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
		}),
	}),
});

export const {
	// Property Groups
	useGetPropertyGroupsQuery,
	useGetPropertyGroupQuery,
	useCreatePropertyGroupMutation,
	useUpdatePropertyGroupMutation,
	useDeletePropertyGroupMutation,
	// Properties
	useGetPropertiesQuery,
	useGetPropertyQuery,
	useCreatePropertyMutation,
	useUpdatePropertyMutation,
	useDeletePropertyMutation,
	// Tasks
	useGetTasksQuery,
	useCreateTaskMutation,
	useUpdateTaskMutation,
	useDeleteTaskMutation,
	useUploadTaskCompletionFileMutation,
	useSubmitTaskCompletionMutation,
	useApproveTaskMutation,
	useRejectTaskMutation,
	// Team Groups
	useGetTeamGroupsQuery,
	useCreateTeamGroupMutation,
	useUpdateTeamGroupMutation,
	useDeleteTeamGroupMutation,
	// Team Members
	useGetTeamMembersQuery,
	useCreateTeamMemberMutation,
	useUpdateTeamMemberMutation,
	useDeleteTeamMemberMutation,
} = apiSlice;
