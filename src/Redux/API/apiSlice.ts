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
import { User } from '../Slices/userSlice';

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
	propertyType?: 'Single Family' | 'Multi-Family' | 'Commercial';
	bedrooms?: number;
	bathrooms?: number;
	units?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>; // For multi-family properties
	hasSuites?: boolean; // For commercial properties
	suites?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>; // For commercial properties
	deviceIds?: string[]; // Device IDs for property-level devices
	notes?: string;
	taskHistory?: Array<{ date: string; description: string }>;
	maintenanceHistory?: Array<{ date: string; description: string }>; // Alias for taskHistory
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

export interface Device {
	id: string;
	type: string; // 'HVAC', 'Plumbing', 'Electrical', 'Appliance', 'Security', 'Other'
	brand?: string;
	model?: string;
	serialNumber?: string;
	installationDate?: string;
	location: {
		propertyId: string;
		unitId?: string; // Optional: for device in a specific unit
		suiteId?: string; // Optional: for device in a specific suite
	};
	status?: 'Active' | 'Maintenance' | 'Broken' | 'Decommissioned'; // Device status
	maintenanceHistory?: Array<{
		date: string;
		description: string;
		taskId?: string;
	}>;
	notes?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface Task {
	id: string;
	propertyId: string;
	suiteId?: string; // Optional: for tasks specific to a suite
	unitId?: string; // Optional: for tasks specific to a unit
	devices?: string[]; // Optional: device IDs related to this task
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
	assignedTo?: string; // Team member ID this task is assigned to
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

export interface Suite {
	id: string;
	propertyId: string;
	name: string;
	floor: number;
	bedrooms: number;
	bathrooms: number;
	area: number;
	isOccupied: boolean;
	deviceIds?: string[]; // Device IDs for devices in this suite
	occupants?: Array<{
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
	}>; // Renamed from occupantName to occupants
	taskHistory?: Array<{
		taskId: string;
		date: string;
		title: string;
		status: string;
	}>; // Maintenance/task history for this suite
	createdAt?: string;
	updatedAt?: string;
}

export interface Unit {
	id: string;
	propertyId: string; // Changed from suiteId - units belong to properties (multifamily homes)
	name: string;
	floor: number;
	area: number;
	isOccupied: boolean;
	deviceIds?: string[]; // Device IDs for devices in this unit
	occupants?: Array<{
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
	}>; // Renamed from occupantName to occupants
	taskHistory?: Array<{
		taskId: string;
		date: string;
		title: string;
		status: string;
	}>; // Maintenance/task history for this unit
	createdAt?: string;
	updatedAt?: string;
}

export interface Favorite {
	id: string;
	userId: string;
	propertyId: string;
	title: string;
	slug: string;
	timestamp: number;
	createdAt?: string;
}

// Helper function to convert Firestore docs to data with IDs
const docToData = (docSnapshot: any) => {
	if (!docSnapshot.exists()) return null;
	return { id: docSnapshot.id, ...docSnapshot.data() };
};

export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fakeBaseQuery(),
	tagTypes: [
		'PropertyGroups',
		'Properties',
		'TeamGroups',
		'TeamMembers',
		'Tasks',
		'Devices',
		'Suites',
		'Units',
		'Favorites',
	],
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
			providesTags: ['PropertyGroups'],
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
			providesTags: ['PropertyGroups'],
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
			invalidatesTags: ['PropertyGroups'],
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
			invalidatesTags: ['PropertyGroups'],
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
			invalidatesTags: ['PropertyGroups'],
		}),

		// Property endpoints
		getProperties: builder.query<Property[], string>({
			async queryFn(userId: string) {
				try {
					// First, get all property groups for this user
					const groupsQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', userId),
					);
					const groupsSnapshot = await getDocs(groupsQuery);
					const groupIds = groupsSnapshot.docs.map((doc) => doc.id);

					// If no groups, return empty array
					if (groupIds.length === 0) {
						return { data: [] };
					}

					// Fetch all properties for these groups
					// Note: Firestore 'in' query supports up to 10 values
					// For more than 10 groups, we'd need to batch the queries
					const allProperties: Property[] = [];

					// Process in batches of 10 (Firestore limitation)
					for (let i = 0; i < groupIds.length; i += 10) {
						const batch = groupIds.slice(i, i + 10);
						const propertiesQuery = query(
							collection(db, 'properties'),
							where('groupId', 'in', batch),
						);
						const propertiesSnapshot = await getDocs(propertiesQuery);
						const properties = propertiesSnapshot.docs.map((doc) => ({
							id: doc.id,
							...doc.data(),
						})) as Property[];
						allProperties.push(...properties);
					}

					return { data: allProperties };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Properties'],
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
			providesTags: ['Properties'],
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
			invalidatesTags: ['Properties', 'PropertyGroups'],
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
			invalidatesTags: ['Properties', 'PropertyGroups'],
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
			invalidatesTags: ['Properties', 'PropertyGroups'],
		}),

		// Task endpoints
		getTasks: builder.query<Task[], string>({
			async queryFn(userId: string) {
				try {
					// First, get all properties for this user's groups
					const groupsQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', userId),
					);
					const groupsSnapshot = await getDocs(groupsQuery);
					const groupIds = groupsSnapshot.docs.map((doc) => doc.id);

					if (groupIds.length === 0) {
						return { data: [] };
					}

					// Get all property IDs for these groups
					const allPropertyIds: string[] = [];
					for (let i = 0; i < groupIds.length; i += 10) {
						const batch = groupIds.slice(i, i + 10);
						const propertiesQuery = query(
							collection(db, 'properties'),
							where('groupId', 'in', batch),
						);
						const propertiesSnapshot = await getDocs(propertiesQuery);
						propertiesSnapshot.docs.forEach((doc) => {
							allPropertyIds.push(doc.id);
						});
					}

					if (allPropertyIds.length === 0) {
						return { data: [] };
					}

					// Fetch all tasks for these properties
					const allTasks: Task[] = [];
					for (let i = 0; i < allPropertyIds.length; i += 10) {
						const batch = allPropertyIds.slice(i, i + 10);
						const tasksQuery = query(
							collection(db, 'tasks'),
							where('propertyId', 'in', batch),
						);
						const tasksSnapshot = await getDocs(tasksQuery);
						const tasks = tasksSnapshot.docs.map((doc) => ({
							id: doc.id,
							...doc.data(),
						})) as Task[];
						allTasks.push(...tasks);
					}

					return { data: allTasks };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Tasks'],
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
			invalidatesTags: ['Tasks'],
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
			invalidatesTags: ['Tasks'],
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

		// User endpoints
		updateUser: builder.mutation<
			User,
			{ id: string; updates: Partial<Omit<User, 'id' | 'role'>> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'users', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as User };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: [],
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
			providesTags: ['TeamGroups'],
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
			invalidatesTags: ['TeamGroups'],
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
			invalidatesTags: ['TeamGroups'],
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
			invalidatesTags: ['TeamGroups'],
		}),

		// Team Member endpoints
		getTeamMembers: builder.query<TeamMember[], string>({
			async queryFn(userId: string) {
				try {
					// First, get all team groups for this user
					const groupsQuery = query(
						collection(db, 'teamGroups'),
						where('userId', '==', userId),
					);
					const groupsSnapshot = await getDocs(groupsQuery);
					const groupIds = groupsSnapshot.docs.map((doc) => doc.id);

					// If no groups, return empty array
					if (groupIds.length === 0) {
						return { data: [] };
					}

					// Fetch all team members for these groups
					const allMembers: TeamMember[] = [];

					// Process in batches of 10 (Firestore limitation)
					for (let i = 0; i < groupIds.length; i += 10) {
						const batch = groupIds.slice(i, i + 10);
						const membersQuery = query(
							collection(db, 'teamMembers'),
							where('groupId', 'in', batch),
						);
						const membersSnapshot = await getDocs(membersQuery);
						const members = membersSnapshot.docs.map((doc) => ({
							id: doc.id,
							...doc.data(),
						})) as TeamMember[];
						allMembers.push(...members);
					}

					return { data: allMembers };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['TeamMembers'],
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
			invalidatesTags: ['TeamMembers'],
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
			invalidatesTags: ['TeamMembers'],
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
			invalidatesTags: ['TeamMembers'],
		}),
		// Suites endpoints
		getSuites: builder.query<Suite[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'suites'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const suites = querySnapshot.docs.map(docToData);
					return { data: suites };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Suites'],
		}),

		getSuite: builder.query<Suite, string>({
			async queryFn(suiteId: string) {
				try {
					const docRef = doc(db, 'suites', suiteId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot);
					return { data: data as Suite };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Suites'],
		}),

		createSuite: builder.mutation<Suite, Omit<Suite, 'id'>>({
			async queryFn(newSuite) {
				try {
					const docRef = await addDoc(collection(db, 'suites'), {
						...newSuite,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newSuite } as Suite };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		updateSuite: builder.mutation<
			Suite,
			{ id: string; updates: Partial<Suite> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'suites', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Suite };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		deleteSuite: builder.mutation<void, string>({
			async queryFn(suiteId: string) {
				try {
					await deleteDoc(doc(db, 'suites', suiteId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Suites'],
		}),

		// Units endpoints
		getUnits: builder.query<Unit[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'units'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const units = querySnapshot.docs.map(docToData);
					return { data: units };
				} catch (error) {
					return { error: (error as Error).message };
				}
			},
			providesTags: ['Units'],
		}),

		getUnit: builder.query<Unit, string>({
			async queryFn(unitId: string) {
				try {
					const docRef = doc(db, 'units', unitId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot);
					return { data: data as Unit };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Units'],
		}),

		createUnit: builder.mutation<Unit, Omit<Unit, 'id'>>({
			async queryFn(newUnit) {
				try {
					const docRef = await addDoc(collection(db, 'units'), {
						...newUnit,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newUnit } as Unit };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		updateUnit: builder.mutation<Unit, { id: string; updates: Partial<Unit> }>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'units', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Unit };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		deleteUnit: builder.mutation<void, string>({
			async queryFn(unitId: string) {
				try {
					await deleteDoc(doc(db, 'units', unitId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Units'],
		}),

		// Device endpoints
		getDevices: builder.query<Device[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'devices'),
						where('location.propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const devices = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as Device[];
					return { data: devices };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		getDevice: builder.query<Device, string>({
			async queryFn(deviceId: string) {
				try {
					const docRef = doc(db, 'devices', deviceId);
					const docSnapshot = await getDoc(docRef);
					const data = docToData(docSnapshot);
					return { data: data as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Devices'],
		}),

		createDevice: builder.mutation<Device, Omit<Device, 'id'>>({
			async queryFn(newDevice) {
				try {
					const docRef = await addDoc(collection(db, 'devices'), {
						...newDevice,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});
					return { data: { id: docRef.id, ...newDevice } as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		updateDevice: builder.mutation<
			Device,
			{ id: string; updates: Partial<Device> }
		>({
			async queryFn({ id, updates }) {
				try {
					const docRef = doc(db, 'devices', id);
					await updateDoc(docRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});
					return { data: { id, ...updates } as Device };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		deleteDevice: builder.mutation<void, string>({
			async queryFn(deviceId: string) {
				try {
					await deleteDoc(doc(db, 'devices', deviceId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Devices'],
		}),

		// Favorites endpoints
		getFavorites: builder.query<Favorite[], string>({
			async queryFn(userId: string) {
				try {
					const q = query(
						collection(db, 'favorites'),
						where('userId', '==', userId),
					);
					const querySnapshot = await getDocs(q);
					const favorites = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as Favorite[];
					// Sort by timestamp descending (most recent first)
					favorites.sort((a, b) => b.timestamp - a.timestamp);
					return { data: favorites };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Favorites'],
		}),

		addFavorite: builder.mutation<
			Favorite,
			{ userId: string; propertyId: string; title: string; slug: string }
		>({
			async queryFn({ userId, propertyId, title, slug }) {
				try {
					// Check if already exists
					const q = query(
						collection(db, 'favorites'),
						where('userId', '==', userId),
						where('propertyId', '==', propertyId),
					);
					const existingSnapshot = await getDocs(q);

					if (!existingSnapshot.empty) {
						// Already favorited, return existing
						const existing = existingSnapshot.docs[0];
						return {
							data: {
								id: existing.id,
								...existing.data(),
							} as Favorite,
						};
					}

					// Create new favorite
					const favoriteData = {
						userId,
						propertyId,
						title,
						slug,
						timestamp: Date.now(),
						createdAt: new Date().toISOString(),
					};
					const docRef = await addDoc(
						collection(db, 'favorites'),
						favoriteData,
					);
					return { data: { id: docRef.id, ...favoriteData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Favorites'],
		}),

		removeFavorite: builder.mutation<
			void,
			{ userId: string; propertyId: string }
		>({
			async queryFn({ userId, propertyId }) {
				try {
					const q = query(
						collection(db, 'favorites'),
						where('userId', '==', userId),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);

					// Delete all matching favorites (should only be one)
					const deletePromises = querySnapshot.docs.map((docSnapshot) =>
						deleteDoc(doc(db, 'favorites', docSnapshot.id)),
					);
					await Promise.all(deletePromises);

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Favorites'],
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
	// User
	useUpdateUserMutation,
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
	// Suites
	useGetSuitesQuery,
	useGetSuiteQuery,
	useCreateSuiteMutation,
	useUpdateSuiteMutation,
	useDeleteSuiteMutation,
	// Units
	useGetUnitsQuery,
	useGetUnitQuery,
	useCreateUnitMutation,
	useUpdateUnitMutation,
	useDeleteUnitMutation,
	// Devices
	useGetDevicesQuery,
	useGetDeviceQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useDeleteDeviceMutation,
	// Favorites
	useGetFavoritesQuery,
	useAddFavoriteMutation,
	useRemoveFavoriteMutation,
} = apiSlice;
