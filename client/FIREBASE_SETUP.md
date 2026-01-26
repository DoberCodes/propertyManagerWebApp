# Redux Toolkit + Firebase Integration Guide

## Setup Complete ✅

Your application now has Redux Toolkit Query (createApi) integrated with Firebase Firestore. Here's how to use it.

## Environment Variables

Create a `.env.local` file in the `client` directory (copy from `.env.example`):

```bash
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

Get these values from your Firebase Console → Project Settings → General tab.

## Firebase Firestore Collections

The API slice is configured to work with the following collections:

### Collections Structure:

```
Firestore Database
├── propertyGroups/
│   ├── {groupId}
│   │   ├── userId (string)
│   │   ├── name (string)
│   │   ├── linkedProperties (array)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
│
├── properties/
│   ├── {propertyId}
│   │   ├── groupId (string)
│   │   ├── title (string)
│   │   ├── slug (string)
│   │   ├── image (string)
│   │   ├── owner (string)
│   │   ├── address (string)
│   │   ├── bedrooms (number)
│   │   ├── bathrooms (number)
│   │   ├── notes (string)
│   │   ├── isFavorite (boolean)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
│
├── tasks/
│   ├── {taskId}
│   │   ├── propertyId (string)
│   │   ├── title (string)
│   │   ├── dueDate (string)
│   │   ├── status (string: 'Pending'|'In Progress'|'Completed')
│   │   ├── property (string - property title)
│   │   ├── notes (string)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
│
├── teamGroups/
│   ├── {groupId}
│   │   ├── userId (string)
│   │   ├── name (string)
│   │   ├── linkedProperties (array)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
│
└── teamMembers/
    └── {memberId}
        ├── groupId (string)
        ├── firstName (string)
        ├── lastName (string)
        ├── title (string)
        ├── email (string)
        ├── phone (string)
        ├── role (string)
        ├── address (string)
        ├── image (string)
        ├── notes (string)
        ├── linkedProperties (array)
        ├── taskHistory (array of objects)
        ├── files (array of objects)
        ├── createdAt (timestamp)
        └── updatedAt (timestamp)
```

## Using the API in Components

### 1. Query Data (Read)

```tsx
import { useGetPropertyGroupsQuery } from '../../Redux/API/apiSlice';

function MyComponent() {
	const userId = 'current-user-id'; // Get from auth
	const { data: groups, isLoading, error } = useGetPropertyGroupsQuery(userId);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error}</div>;

	return (
		<ul>
			{groups?.map((group) => (
				<li key={group.id}>{group.name}</li>
			))}
		</ul>
	);
}
```

### 2. Mutate Data (Create, Update, Delete)

```tsx
import {
	useCreatePropertyGroupMutation,
	useUpdatePropertyGroupMutation,
	useDeletePropertyGroupMutation,
} from '../../Redux/API/apiSlice';

function MyComponent() {
	const [createGroup, { isLoading: isCreating }] =
		useCreatePropertyGroupMutation();
	const [updateGroup] = useUpdatePropertyGroupMutation();
	const [deleteGroup] = useDeletePropertyGroupMutation();

	const handleCreate = async () => {
		try {
			const result = await createGroup({
				userId: 'user-id',
				name: 'New Group',
				linkedProperties: [],
			}).unwrap();
			console.log('Created:', result);
		} catch (error) {
			console.error('Error:', error);
		}
	};

	const handleUpdate = async (groupId: string) => {
		try {
			const result = await updateGroup({
				id: groupId,
				updates: { name: 'Updated Name' },
			}).unwrap();
			console.log('Updated:', result);
		} catch (error) {
			console.error('Error:', error);
		}
	};

	const handleDelete = async (groupId: string) => {
		try {
			await deleteGroup(groupId).unwrap();
			console.log('Deleted');
		} catch (error) {
			console.error('Error:', error);
		}
	};

	return (
		<>
			<button onClick={handleCreate} disabled={isCreating}>
				Create Group
			</button>
		</>
	);
}
```

## All Available API Hooks

### Property Groups

- `useGetPropertyGroupsQuery(userId)` - Get all groups for user
- `useGetPropertyGroupQuery(groupId)` - Get single group
- `useCreatePropertyGroupMutation()` - Create group
- `useUpdatePropertyGroupMutation()` - Update group
- `useDeletePropertyGroupMutation()` - Delete group

### Properties

- `useGetPropertiesQuery(groupId)` - Get properties in group
- `useGetPropertyQuery(propertyId)` - Get single property
- `useCreatePropertyMutation()` - Create property
- `useUpdatePropertyMutation()` - Update property
- `useDeletePropertyMutation()` - Delete property

### Tasks

- `useGetTasksQuery(propertyId)` - Get tasks for property
- `useCreateTaskMutation()` - Create task
- `useUpdateTaskMutation()` - Update task
- `useDeleteTaskMutation()` - Delete task

### Team Groups

- `useGetTeamGroupsQuery(userId)` - Get all team groups
- `useCreateTeamGroupMutation()` - Create team group
- `useUpdateTeamGroupMutation()` - Update team group
- `useDeleteTeamGroupMutation()` - Delete team group

### Team Members

- `useGetTeamMembersQuery(groupId)` - Get members in group
- `useCreateTeamMemberMutation()` - Create member
- `useUpdateTeamMemberMutation()` - Update member
- `useDeleteTeamMemberMutation()` - Delete member

## Firebase Security Rules

Add these security rules to your Firestore to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /propertyGroups/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId
    }
    match /properties/{document=**} {
      allow read, write: if request.auth != null
    }
    match /tasks/{document=**} {
      allow read, write: if request.auth != null
    }
    match /teamGroups/{document=**} {
      allow read, write: if request.auth.uid == resource.data.userId
    }
    match /teamMembers/{document=**} {
      allow read, write: if request.auth != null
    }
  }
}
```

## Transitioning from Redux State to Firebase

Currently, your app uses Redux slices with mock data. To transition to Firebase:

1. **Keep Redux slices** for optimistic updates and caching
2. **Use API hooks** to sync with Firebase
3. **Combine both**: Read from API, write to Redux on success

Example pattern:

```tsx
function MyComponent() {
	const dispatch = useDispatch();
	const [createGroup] = useCreatePropertyGroupMutation();

	const handleCreate = async (name: string) => {
		// Create in Firebase
		const result = await createGroup({
			userId: 'user-id',
			name,
			linkedProperties: [],
		}).unwrap();

		// Sync to Redux for offline-first experience
		dispatch(addGroup(result));
	};

	return <button onClick={() => handleCreate('New')}>Create</button>;
}
```

## Current Setup Status

- ✅ Firebase SDK installed
- ✅ Firebase config created (add your credentials)
- ✅ Redux Toolkit Query API slice set up
- ✅ Store integrated with API middleware
- ✅ All endpoints ready for Firestore
- ✅ Type safety for all operations

## Next Steps

1. **Add Firebase credentials** to `.env.local`
2. **Set up Firestore security rules** in Firebase Console
3. **Optional**: Add Firebase Authentication for user management
4. **Start using API hooks** in your components alongside Redux
5. **Test Firebase connection** once credentials are in place

## Troubleshooting

**Error: "FirebaseError: Missing or insufficient permissions"**

- Check your Firestore security rules
- Ensure user is authenticated
- Verify collection structure matches

**Error: "Cannot find module 'firebase'"**

- Run `npm install firebase` in the client directory
- Restart your dev server

**API calls returning undefined**

- Make sure `.env.local` has correct Firebase credentials
- Check browser console for Firebase initialization errors
- Verify `db` export is being used from `config/firebase.ts`
