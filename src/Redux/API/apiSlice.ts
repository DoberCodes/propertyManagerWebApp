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
import { db, storage, auth } from '../../config/firebase';
import { User } from '../Slices/userSlice';

// Types
export type SharePermission = 'admin' | 'viewer';

export interface PropertyShare {
	id: string;
	propertyId: string;
	ownerId: string; // User who owns the property
	sharedWithUserId: string; // User who has access
	sharedWithEmail: string; // Email of user who has access
	permission: SharePermission; // 'admin' or 'viewer'
	createdAt: string;
	updatedAt: string;
}

export interface UserInvitation {
	id: string;
	propertyId: string;
	propertyTitle: string;
	fromUserId: string;
	fromUserEmail: string;
	toEmail: string;
	permission: SharePermission;
	status: 'pending' | 'accepted' | 'rejected';
	createdAt: string;
	expiresAt: string;
}

export interface Notification {
	id: string;
	userId: string; // Recipient of the notification
	type:
		| 'share_invitation'
		| 'share_invitation_accepted'
		| 'property_added'
		| 'property_updated'
		| 'property_deleted'
		| 'property_group_created'
		| 'property_group_updated'
		| 'property_group_deleted'
		| 'task_created'
		| 'task_assigned'
		| 'task_updated'
		| 'task_deleted'
		| 'team_member_added'
		| 'team_member_updated'
		| 'team_member_removed'
		| 'team_group_created'
		| 'team_group_updated'
		| 'team_group_deleted'
		| 'maintenance_request'
		| 'maintenance_request_created'
		| 'other';
	title: string;
	message: string;
	data?: {
		propertyId?: string;
		propertyTitle?: string;
		fromUserId?: string;
		fromUserEmail?: string;
		permission?: SharePermission;
		taskId?: string;
		maintenanceRequestId?: string;
		[key: string]: any;
	};
	status: 'unread' | 'read' | 'accepted' | 'rejected';
	actionUrl?: string;
	createdAt: string;
	updatedAt: string;
}

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
	userId: string; // Owner of the device
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
	userId: string; // Owner of the task
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
	assignedTo?: {
		id: string;
		name: string;
		email?: string;
	}; // Assignee object
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
	userId: string; // Owner of the suite
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
	userId: string; // Owner of the unit
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
		'PropertyShares',
		'UserInvitations',
		'Notifications',
	],
	endpoints: (builder) => ({
		// Property Group endpoints
		getPropertyGroups: builder.query<PropertyGroup[], void>({
			async queryFn() {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;
					// Get user's email for shared properties lookup
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userData = userDoc.data();
					const userEmail = userData?.email;

					// Get property groups
					const q = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', userId),
					);
					const querySnapshot = await getDocs(q);
					const groups = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as PropertyGroup[];

					// Fetch properties for each group
					const groupsWithProperties = await Promise.all(
						groups.map(async (group) => {
							const isSharedGroup =
								group.name?.toLowerCase() === 'shared properties';
							// Get properties owned by user in this group
							const propertiesQuery = query(
								collection(db, 'properties'),
								where('groupId', '==', group.id),
							);
							const propertiesSnapshot = await getDocs(propertiesQuery);
							const ownedProperties = propertiesSnapshot.docs.map((doc) => ({
								id: doc.id,
								...doc.data(),
							})) as Property[];

							// Get shared properties that should appear in this group
							let sharedProperties: Property[] = [];
							if (userEmail) {
								const sharesQuery = query(
									collection(db, 'propertyShares'),
									where('sharedWithEmail', '==', userEmail),
								);
								const sharesSnapshot = await getDocs(sharesQuery);
								const shares = sharesSnapshot.docs.map((doc) => ({
									id: doc.id,
									...doc.data(),
								})) as PropertyShare[];

								// Fetch shared property documents
								const propertyIds = shares.map((share) => share.propertyId);
								if (propertyIds.length > 0) {
									// Process in batches of 10
									for (let i = 0; i < propertyIds.length; i += 10) {
										const batch = propertyIds.slice(i, i + 10);
										const sharedPropertiesQuery = query(
											collection(db, 'properties'),
											where('__name__', 'in', batch),
										);
										const sharedPropertiesSnapshot = await getDocs(
											sharedPropertiesQuery,
										);
										const properties = sharedPropertiesSnapshot.docs.map(
											(doc) => ({
												id: doc.id,
												...doc.data(),
											}),
										) as Property[];
										// Include all shared properties in the Shared Properties group
										const groupSharedProperties = isSharedGroup
											? properties
											: properties.filter((p) => p.groupId === group.id);
										sharedProperties.push(...groupSharedProperties);
									}
								}
							}

							// Combine owned and shared properties, deduplicate
							const allProperties = [...ownedProperties, ...sharedProperties];
							const uniqueProperties = Array.from(
								new Map(allProperties.map((p) => [p.id, p])).values(),
							);

							return {
								...group,
								properties: uniqueProperties,
							};
						}),
					);

					return { data: groupsWithProperties };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyGroups', 'Properties', 'PropertyShares'],
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
		getProperties: builder.query<Property[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get user's email for shared properties lookup
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userEmail = userDoc.data()?.email;

					// Get all property groups owned by this user
					const groupsQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', userId),
					);
					const groupsSnapshot = await getDocs(groupsQuery);
					const groupIds = groupsSnapshot.docs.map((doc) => doc.id);

					// Fetch all properties owned by this user
					const ownedProperties: Property[] = [];
					if (groupIds.length > 0) {
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
							ownedProperties.push(...properties);
						}
					}

					// Get shared properties
					const sharedProperties: Property[] = [];
					if (userEmail) {
						const sharesQuery = query(
							collection(db, 'propertyShares'),
							where('sharedWithEmail', '==', userEmail),
						);
						const sharesSnapshot = await getDocs(sharesQuery);
						const shares = sharesSnapshot.docs.map((doc) => ({
							id: doc.id,
							...doc.data(),
						})) as PropertyShare[];

						const propertyIds = shares.map((share) => share.propertyId);
						if (propertyIds.length > 0) {
							// Process in batches of 10
							for (let i = 0; i < propertyIds.length; i += 10) {
								const batch = propertyIds.slice(i, i + 10);
								const propertiesQuery = query(
									collection(db, 'properties'),
									where('__name__', 'in', batch),
								);
								const propertiesSnapshot = await getDocs(propertiesQuery);
								const properties = propertiesSnapshot.docs.map((doc) => ({
									id: doc.id,
									...doc.data(),
								})) as Property[];
								sharedProperties.push(...properties);
							}
						}
					}

					// Combine and deduplicate
					const allProperties = [...ownedProperties, ...sharedProperties];
					const uniqueProperties = Array.from(
						new Map(allProperties.map((p) => [p.id, p])).values(),
					);

					return { data: uniqueProperties };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Properties', 'PropertyShares'],
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
					// Delete the property
					await deleteDoc(doc(db, 'properties', propertyId));

					// Delete all favorites for this property
					const favoritesQuery = query(
						collection(db, 'favorites'),
						where('propertyId', '==', propertyId),
					);
					const favoritesSnapshot = await getDocs(favoritesQuery);
					for (const favDoc of favoritesSnapshot.docs) {
						await deleteDoc(favDoc.ref);
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties', 'PropertyGroups', 'Favorites'],
		}),

		// Task endpoints
		getTasks: builder.query<Task[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;

					// Get all properties for this user's groups
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
		getTeamGroups: builder.query<TeamGroup[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;
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
		getTeamMembers: builder.query<TeamMember[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { error: 'User not authenticated' };
					}
					const userId = currentUser.uid;
					// Fetch all team members where userId matches current user
					const membersQuery = query(
						collection(db, 'teamMembers'),
						where('userId', '==', userId),
					);
					const membersSnapshot = await getDocs(membersQuery);
					const members = membersSnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as TeamMember[];
					return { data: members };
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
					// Get the team member's email
					const memberDoc = await getDoc(doc(db, 'teamMembers', memberId));
					if (!memberDoc.exists()) {
						return { error: 'Team member not found' };
					}
					const memberData = memberDoc.data();
					const memberEmail = memberData.email;

					// Check for shared properties with this email
					const sharesQuery = query(
						collection(db, 'propertyShares'),
						where('sharedWithEmail', '==', memberEmail),
					);
					const sharesSnapshot = await getDocs(sharesQuery);
					if (!sharesSnapshot.empty) {
						return {
							error: 'Cannot remove team member: they have shared properties.',
						};
					}

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

		// Property Sharing endpoints
		getPropertyShares: builder.query<PropertyShare[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'propertyShares'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const shares = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as PropertyShare[];
					return { data: shares };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['PropertyShares'],
		}),

		getSharedPropertiesForUser: builder.query<Property[], string>({
			async queryFn(userId: string) {
				try {
					// Get user's email first
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userEmail = userDoc.data()?.email;

					if (!userEmail) {
						return { data: [] };
					}

					// Find all shares where this user has access
					const sharesQuery = query(
						collection(db, 'propertyShares'),
						where('sharedWithEmail', '==', userEmail),
					);
					const sharesSnapshot = await getDocs(sharesQuery);
					const shares = sharesSnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as PropertyShare[];

					// Get all shared properties
					const propertyIds = shares.map((share) => share.propertyId);
					if (propertyIds.length === 0) {
						return { data: [] };
					}

					const allProperties: Property[] = [];
					// Process in batches of 10 (Firestore limitation)
					for (let i = 0; i < propertyIds.length; i += 10) {
						const batch = propertyIds.slice(i, i + 10);
						const propertiesQuery = query(
							collection(db, 'properties'),
							where('__name__', 'in', batch),
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
			providesTags: ['PropertyShares', 'Properties'],
		}),

		createPropertyShare: builder.mutation<
			PropertyShare,
			Omit<PropertyShare, 'id' | 'createdAt' | 'updatedAt'>
		>({
			async queryFn(newShare) {
				try {
					const now = new Date().toISOString();
					const shareData = {
						...newShare,
						createdAt: now,
						updatedAt: now,
					};
					const docRef = await addDoc(
						collection(db, 'propertyShares'),
						shareData,
					);
					return { data: { id: docRef.id, ...shareData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyShares', 'Properties'],
		}),

		updatePropertyShare: builder.mutation<
			PropertyShare,
			{ id: string; permission: SharePermission }
		>({
			async queryFn({ id, permission }) {
				try {
					const docRef = doc(db, 'propertyShares', id);
					await updateDoc(docRef, {
						permission,
						updatedAt: new Date().toISOString(),
					});
					const updatedDoc = await getDoc(docRef);
					return { data: { id, ...updatedDoc.data() } as PropertyShare };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyShares'],
		}),

		deletePropertyShare: builder.mutation<void, string>({
			async queryFn(shareId: string) {
				try {
					// Get the share document to find the associated invitation
					const shareDoc = await getDoc(doc(db, 'propertyShares', shareId));
					if (!shareDoc.exists()) {
						return { error: 'Property share not found' };
					}

					const shareData = shareDoc.data();
					const propertyId = shareData.propertyId;
					const sharedWithEmail = shareData.sharedWithEmail;

					// Delete the property share
					await deleteDoc(doc(db, 'propertyShares', shareId));

					// Find and delete the associated accepted invitation
					const invitationQuery = query(
						collection(db, 'userInvitations'),
						where('propertyId', '==', propertyId),
						where('toEmail', '==', sharedWithEmail),
						where('status', '==', 'accepted'),
					);
					const invitationSnapshot = await getDocs(invitationQuery);
					if (!invitationSnapshot.empty) {
						for (const invDoc of invitationSnapshot.docs) {
							await deleteDoc(invDoc.ref);
						}
					}

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['PropertyShares', 'Properties', 'UserInvitations'],
		}),

		// User Invitations endpoints
		getUserInvitations: builder.query<UserInvitation[], void>({
			async queryFn() {
				try {
					// Get authenticated user from Firebase Auth
					const currentUser = auth.currentUser;
					if (!currentUser || !currentUser.email) {
						return { error: 'User not authenticated or email not available' };
					}
					const userEmail = currentUser.email;

					const q = query(
						collection(db, 'userInvitations'),
						where('toEmail', '==', userEmail),
						where('status', '==', 'pending'),
					);
					const querySnapshot = await getDocs(q);
					const invitations = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as UserInvitation[];
					return { data: invitations };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['UserInvitations'],
		}),

		sendInvitation: builder.mutation<
			UserInvitation,
			Omit<UserInvitation, 'id' | 'createdAt' | 'expiresAt' | 'status'>
		>({
			async queryFn(invitation) {
				try {
					const now = new Date();
					const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
					const invitationData = {
						...invitation,
						status: 'pending' as const,
						createdAt: now.toISOString(),
						expiresAt: expiresAt.toISOString(),
					};
					const docRef = await addDoc(
						collection(db, 'userInvitations'),
						invitationData,
					);

					// Create notification for recipient if user exists
					const normalizedEmail = invitation.toEmail.toLowerCase();
					const userQuery = query(
						collection(db, 'users'),
						where('email', '==', normalizedEmail),
					);
					const userSnapshot = await getDocs(userQuery);
					const recipientDoc = userSnapshot.docs[0];

					if (recipientDoc) {
						const notificationData = {
							userId: recipientDoc.id,
							type: 'share_invitation',
							title: 'Property Invitation',
							message: `${invitation.fromUserEmail} invited you to access "${invitation.propertyTitle}"`,
							data: {
								invitationId: docRef.id,
								propertyId: invitation.propertyId,
								propertyTitle: invitation.propertyTitle,
								fromUserId: invitation.fromUserId,
								fromUserEmail: invitation.fromUserEmail,
								permission: invitation.permission,
							},
							status: 'unread' as const,
							createdAt: now.toISOString(),
							updatedAt: now.toISOString(),
						};

						try {
							await addDoc(collection(db, 'notifications'), notificationData);
						} catch (notifError) {
							console.error(
								'Failed to create invitation notification:',
								notifError,
							);
						}
					}

					return { data: { id: docRef.id, ...invitationData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['UserInvitations'],
		}),

		acceptInvitation: builder.mutation<
			PropertyShare,
			{ invitationId: string; userId: string }
		>({
			async queryFn({ invitationId, userId }) {
				try {
					// Get the invitation
					const invitationRef = doc(db, 'userInvitations', invitationId);
					const invitationDoc = await getDoc(invitationRef);
					const invitation = {
						id: invitationDoc.id,
						...invitationDoc.data(),
					} as UserInvitation;

					// Get user's email
					const userDocRef = doc(db, 'users', userId);
					const userDoc = await getDoc(userDocRef);
					const userEmail = userDoc.data()?.email;

					if (!userEmail) {
						return { error: 'User email not found' };
					}

					// Create property share
					const now = new Date().toISOString();
					const shareData = {
						propertyId: invitation.propertyId,
						ownerId: invitation.fromUserId,
						sharedWithUserId: userId,
						sharedWithEmail: userEmail,
						permission: invitation.permission,
						createdAt: now,
						updatedAt: now,
					};
					const shareRef = await addDoc(
						collection(db, 'propertyShares'),
						shareData,
					);

					// Update invitation status
					await updateDoc(invitationRef, { status: 'accepted' });

					// Ensure the recipient has a Shared Properties group
					const sharedGroupName = 'Shared Properties';
					const sharedGroupQuery = query(
						collection(db, 'propertyGroups'),
						where('userId', '==', userId),
						where('name', '==', sharedGroupName),
					);
					const sharedGroupSnapshot = await getDocs(sharedGroupQuery);
					if (sharedGroupSnapshot.empty) {
						const nowIso = new Date().toISOString();
						await addDoc(collection(db, 'propertyGroups'), {
							userId,
							name: sharedGroupName,
							createdAt: nowIso,
							updatedAt: nowIso,
						});
					}

					// Create a notification for the recipient
					const recipientNotificationData = {
						userId,
						type: 'share_invitation',
						title: 'Property Shared',
						message: `${invitation.fromUserEmail} shared "${invitation.propertyTitle}" with you`,
						data: {
							propertyId: invitation.propertyId,
							propertyTitle: invitation.propertyTitle,
							fromUserId: invitation.fromUserId,
							fromUserEmail: invitation.fromUserEmail,
							permission: invitation.permission,
						},
						status: 'accepted',
						createdAt: now,
						updatedAt: now,
					};

					try {
						await addDoc(
							collection(db, 'notifications'),
							recipientNotificationData,
						);
					} catch (notifError) {
						console.error(
							'Failed to create recipient notification:',
							notifError,
						);
					}

					// Create a notification for the sender
					const senderNotificationData = {
						userId: invitation.fromUserId,
						type: 'share_invitation_accepted',
						title: 'Invitation Accepted',
						message: `${userEmail} accepted your invitation to share "${invitation.propertyTitle}"`,
						data: {
							propertyId: invitation.propertyId,
							propertyTitle: invitation.propertyTitle,
							userId: userId,
							userEmail: userEmail,
							permission: invitation.permission,
						},
						status: 'unread',
						createdAt: now,
						updatedAt: now,
					};

					try {
						await addDoc(
							collection(db, 'notifications'),
							senderNotificationData,
						);
					} catch (notifError) {
						console.error('Failed to create sender notification:', notifError);
					}

					return { data: { id: shareRef.id, ...shareData } };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: [
				'UserInvitations',
				'PropertyShares',
				'Properties',
				'TeamMembers',
				'TeamGroups',
			],
		}),

		rejectInvitation: builder.mutation<void, string>({
			async queryFn(invitationId: string) {
				try {
					const invitationRef = doc(db, 'userInvitations', invitationId);
					await updateDoc(invitationRef, { status: 'rejected' });
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['UserInvitations'],
		}),

		cancelInvitation: builder.mutation<void, string>({
			async queryFn(invitationId: string) {
				try {
					const invitationRef = doc(db, 'userInvitations', invitationId);
					await deleteDoc(invitationRef);
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['UserInvitations'],
		}),

		getPropertyInvitations: builder.query<UserInvitation[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'userInvitations'),
						where('propertyId', '==', propertyId),
						where('status', '==', 'pending'),
					);
					const querySnapshot = await getDocs(q);
					const invitations = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
					})) as UserInvitation[];
					return { data: invitations };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['UserInvitations'],
		}),

		// Get all invitations for a property (pending and accepted) for the owner
		getAllPropertyInvitations: builder.query<UserInvitation[], string>({
			async queryFn(propertyId: string) {
				try {
					const q = query(
						collection(db, 'userInvitations'),
						where('propertyId', '==', propertyId),
					);
					const querySnapshot = await getDocs(q);
					const invitations = querySnapshot.docs
						.map((doc) => ({
							id: doc.id,
							...doc.data(),
						}))
						.sort(
							(a: any, b: any) =>
								new Date(b.createdAt).getTime() -
								new Date(a.createdAt).getTime(),
						) as UserInvitation[];
					return { data: invitations };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['UserInvitations'],
		}),

		// Notifications
		getUserNotifications: builder.query<Notification[], void>({
			async queryFn() {
				try {
					const currentUser = auth.currentUser;
					if (!currentUser) {
						return { data: [] };
					}

					const q = query(
						collection(db, 'notifications'),
						where('userId', '==', currentUser.uid),
					);
					const querySnapshot = await getDocs(q);
					const notifications = querySnapshot.docs
						.map((doc) => ({
							id: doc.id,
							...doc.data(),
						}))
						.sort(
							(a: any, b: any) =>
								new Date(b.createdAt).getTime() -
								new Date(a.createdAt).getTime(),
						) as Notification[];
					return { data: notifications };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Notifications'],
		}),

		createNotification: builder.mutation<
			Notification,
			Omit<Notification, 'id'>
		>({
			async queryFn(notificationData) {
				try {
					const notificationRef = collection(db, 'notifications');
					const docRef = await addDoc(notificationRef, {
						...notificationData,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});

					return {
						data: {
							id: docRef.id,
							...notificationData,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						} as Notification,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Notifications'],
		}),

		updateNotification: builder.mutation<
			Notification,
			{ id: string; updates: Partial<Notification> }
		>({
			async queryFn({ id, updates }) {
				try {
					const notificationRef = doc(db, 'notifications', id);
					await updateDoc(notificationRef, {
						...updates,
						updatedAt: new Date().toISOString(),
					});

					const updatedDoc = await getDoc(notificationRef);
					return {
						data: {
							id: updatedDoc.id,
							...updatedDoc.data(),
						} as Notification,
					};
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Notifications'],
		}),

		deleteNotification: builder.mutation<void, string>({
			async queryFn(notificationId) {
				try {
					await deleteDoc(doc(db, 'notifications', notificationId));
					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Notifications'],
		}),

		getUserByEmail: builder.query<{ id: string; email: string } | null, string>(
			{
				async queryFn(email: string) {
					try {
						const q = query(
							collection(db, 'users'),
							where('email', '==', email.toLowerCase()),
						);
						const querySnapshot = await getDocs(q);

						if (querySnapshot.empty) {
							return { data: null };
						}

						const userDoc = querySnapshot.docs[0];
						return {
							data: {
								id: userDoc.id,
								email: userDoc.data().email,
							},
						};
					} catch (error: any) {
						return { error: error.message };
					}
				},
			},
		),

		addTenant: builder.mutation<
			void,
			{
				propertyId: string;
				firstName: string;
				lastName: string;
				email: string;
				phone?: string;
				unit?: string;
				leaseStart?: string;
				leaseEnd?: string;
			}
		>({
			async queryFn(tenantData) {
				try {
					const propertyRef = doc(db, 'properties', tenantData.propertyId);
					const propertySnap = await getDoc(propertyRef);

					if (!propertySnap.exists()) {
						return { error: 'Property not found' };
					}

					const property = propertySnap.data();
					const tenants = property.tenants || [];

					const newTenant = {
						id: `tenant_${Date.now()}`,
						firstName: tenantData.firstName,
						lastName: tenantData.lastName,
						email: tenantData.email,
						phone: tenantData.phone || '',
						unit: tenantData.unit || '',
						leaseStart: tenantData.leaseStart || '',
						leaseEnd: tenantData.leaseEnd || '',
						createdAt: new Date().toISOString(),
					};

					tenants.push(newTenant);
					await updateDoc(propertyRef, { tenants });

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties'],
		}),

		removeTenant: builder.mutation<
			void,
			{ propertyId: string; tenantId: string }
		>({
			async queryFn({ propertyId, tenantId }) {
				try {
					const propertyRef = doc(db, 'properties', propertyId);
					const propertySnap = await getDoc(propertyRef);

					if (!propertySnap.exists()) {
						return { error: 'Property not found' };
					}

					const property = propertySnap.data();
					const tenants = (property.tenants || []).filter(
						(t: any) => t.id !== tenantId,
					);

					await updateDoc(propertyRef, { tenants });

					return { data: undefined };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Properties'],
		}),

		// App Version
		getAppVersion: builder.query<
			{ version: string; releaseDate?: string; releaseNotes?: string },
			void
		>({
			async queryFn() {
				try {
					const versionDoc = await getDoc(doc(db, 'appConfig', 'version'));

					if (!versionDoc.exists()) {
						// Return default version if not configured yet
						return {
							data: {
								version: '1.0.0',
								releaseDate: new Date().toISOString(),
								releaseNotes: 'Initial release',
							},
						};
					}

					const data = versionDoc.data();
					return {
						data: {
							version: data.version || '1.0.0',
							releaseDate: data.releaseDate,
							releaseNotes: data.releaseNotes,
						},
					};
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
	// Property Shares
	useGetPropertySharesQuery,
	useGetSharedPropertiesForUserQuery,
	useCreatePropertyShareMutation,
	useUpdatePropertyShareMutation,
	useDeletePropertyShareMutation,
	// User Invitations
	useGetUserInvitationsQuery,
	useSendInvitationMutation,
	useAcceptInvitationMutation,
	useRejectInvitationMutation,
	useCancelInvitationMutation,
	useGetPropertyInvitationsQuery,
	useGetAllPropertyInvitationsQuery,
	// Tenants
	useAddTenantMutation,
	useRemoveTenantMutation,
	// Notifications
	useGetUserNotificationsQuery,
	useCreateNotificationMutation,
	useUpdateNotificationMutation,
	useDeleteNotificationMutation,
	// Users
	useGetUserByEmailQuery,
	// App Version
	useGetAppVersionQuery,
} = apiSlice;
