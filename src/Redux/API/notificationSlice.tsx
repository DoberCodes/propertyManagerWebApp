import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	updateDoc,
	where,
} from '@firebase/firestore';
import { Notification } from '../../types/Notification.types';
import { apiSlice, docToData } from './apiSlice';
import { auth, db } from '../../config/firebase';
import { doc as firestoreDoc } from 'firebase/firestore';
import { shouldCreateNotification } from '../../utils/notificationPreferences';

const NotificationSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		// Notifications
		getUserNotifications: builder.query<Notification[], string | undefined>({
			async queryFn(userId) {
				try {
					if (!userId) {
						return { data: [] };
					}

					const q = query(
						collection(db, 'notifications'),
						where('userId', '==', userId),
						orderBy('createdAt', 'desc'),
					);
					const querySnapshot = await getDocs(q);
					const notifications = querySnapshot.docs
						.map((doc) => docToData(doc))
						.filter(Boolean) as Notification[];
					return { data: notifications };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			providesTags: ['Notifications'],
			// Force refetch when component mounts to avoid stale data
			keepUnusedDataFor: 0,
		}),

		createNotification: builder.mutation<
			Notification,
			Omit<Notification, 'id'>
		>({
			async queryFn(notificationData) {
				try {
					const resolvedUserId =
						notificationData.userId || auth.currentUser?.uid;
					if (!resolvedUserId) {
						return { error: 'Notification userId is missing' };
					}

					const userDoc = await getDoc(firestoreDoc(db, 'users', resolvedUserId));
					if (
						userDoc.exists() &&
						!shouldCreateNotification(
							userDoc.data()?.notificationPreferences,
							notificationData.type,
						)
					) {
						return {
							data: {
								id: 'skipped-by-preferences',
								...notificationData,
								userId: resolvedUserId,
							} as Notification,
						};
					}
					const notificationRef = collection(db, 'notifications');
					const docRef = await addDoc(notificationRef, {
						...notificationData,
						userId: resolvedUserId,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					});

					return {
						data: {
							id: docRef.id,
							...notificationData,
							userId: resolvedUserId,
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
					const data = updatedDoc.data() as Notification;
					return { data };
				} catch (error: any) {
					return { error: error.message };
				}
			},
			invalidatesTags: ['Notifications'],
		}),

		deleteNotification: builder.mutation<void, string>({
			async queryFn(notification) {
				if (!notification) {
					console.error('Invalid notificationId:', notification);
					return { error: 'Invalid notification ID provided' };
				}

				try {
					await deleteDoc(doc(db, 'notifications', notification));
					return { data: undefined };
				} catch (error: any) {
					console.error('Failed to delete notification:', error); // Log full error
					return { error: error.message || 'Unknown error occurred' };
				}
			},
			invalidatesTags: ['Notifications'],
		}),
	}),
});

export { NotificationSlice };

export const {
	useGetUserNotificationsQuery,
	useCreateNotificationMutation,
	useUpdateNotificationMutation,
	useDeleteNotificationMutation,
} = NotificationSlice;
