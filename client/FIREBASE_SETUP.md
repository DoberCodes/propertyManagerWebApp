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

````
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
│   │   ├── groupId (string) [REQUIRED]
│   │   ├── title (string) [REQUIRED]
│   │   ├── slug (string) [REQUIRED]
│   │   ├── image (string - optional)
│   │   ├── owner (string - optional)
│   │   ├── address (string - optional)
│   │   ├── propertyType (string: 'Single Family'|'Multi-Family'|'Commercial' - optional)
│   │   ├── bedrooms (number - optional)
│   │   ├── bathrooms (number - optional)
│   │   ├── units (array - optional, for Multi-Family properties) [NOT YET IN FIREBASE]
│   │   │   ├── name (string)
│   │   │   ├── occupants (array)
│   │   │   └── deviceIds (array of device IDs)
│   │   ├── hasSuites (boolean - optional, for Commercial properties) [NOT YET IN FIREBASE]
│   │   ├── suites (array - optional, for Commercial properties with suites) [NOT YET IN FIREBASE]
│   │   │   ├── name (string)
│   │   │   ├── occupants (array)
│   │   │   └── deviceIds (array of device IDs)
│   │   ├── deviceIds (array of strings - optional, property-level device IDs)
│   │   ├── administrators (array of strings - optional, user IDs)
│   │   ├── viewers (array of strings - optional, user IDs)
│   │   ├── taskHistory (array - optional) [NOT YET IN FIREBASE]
│   │   │   ├── date (string)
│   │   │   └── description (string)
│   │   ├── maintenanceHistory (array - optional, alias for taskHistory) [NOT YET IN FIREBASE]
│   │   ├── notes (string - optional)
│   │   ├── isFavorite (boolean - optional)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
│
├── tasks/
│   ├── {taskId}
│   │   ├── propertyId (string)
│   │   ├── suiteId (string - optional, for suite-specific tasks)
│   │   ├── unitId (string - optional, for unit-specific tasks)
│   │   ├── devices (array of strings - optional, device IDs related to task)
│   │   ├── title (string)
│   │   ├── dueDate (string)
│   │   ├── status (string: 'Pending'|'In Progress'|'Awaiting Approval'|'Completed'|'Rejected')
│   │   ├── property (string - property title)
│   │   ├── notes (string)
│   │   ├── completionDate (string - optional)
│   │   ├── completedBy (string - user ID, optional)
│   │   ├── approvedBy (string - user ID, optional)
│   │   ├── approvedAt (string - optional)
│   │   ├── rejectionReason (string - optional)
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
├── suites/
│   ├── {suiteId}
│   │   ├── propertyId (string)
│   │   ├── name (string)
│   │   ├── floor (number)
│   │   ├── area (number)
│   │   ├── isOccupied (boolean)
│   │   ├── deviceIds (array of strings - device IDs for devices in this suite)
│   │   ├── occupants (array of objects)
│   │   │   ├── firstName (string)
│   │   │   ├── lastName (string)
│   │   │   ├── email (string)
│   │   │   └── phone (string)
│   │   ├── taskHistory (array - references to tasks completed in this suite)
│   │   │   ├── taskId (string)
│   │   │   ├── date (string)
│   │   │   ├── title (string)
│   │   │   └── status (string)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
├── units/
│   ├── {unitId}
│   │   ├── propertyId (string - links to multifamily property)
│   │   ├── name (string)
│   │   ├── floor (number)
│   │   ├── bedrooms (number)
│   │   ├── bathrooms (number)
│   │   ├── area (number)
│   │   ├── isOccupied (boolean)
│   │   ├── deviceIds (array of strings - device IDs for devices in this unit)
│   │   ├── occupants (array of objects)
│   │   │   ├── firstName (string)
│   │   │   ├── lastName (string)
│   │   │   ├── email (string)
│   │   │   └── phone (string)
│   │   ├── taskHistory (array - references to tasks completed in this unit)
│   │   │   ├── taskId (string)
│   │   │   ├── date (string)
│   │   │   ├── title (string)
│   │   │   └── status (string)
│   │   ├── createdAt (timestamp)
│   │   └── updatedAt (timestamp)
│
└── devices/
    ├── {deviceId}
    │   ├── type (string: 'HVAC'|'Plumbing'|'Electrical'|'Appliance'|'Security'|'Other')
    │   ├── brand (string - optional)
    │   ├── model (string - optional)
    │   ├── serialNumber (string - optional)
    │   ├── installationDate (string - optional)
    │   ├── location (object - where device is located)
    │   │   ├── propertyId (string) [REQUIRED]
    │   │   ├── unitId (string - optional, for device in a unit)
    │   │   └── suiteId (string - optional, for device in a suite)
    │   ├── status (string: 'Active'|'Maintenance'|'Broken'|'Decommissioned' - optional)
    │   ├── maintenanceHistory (array - optional)
    │   │   ├── date (string)
    │   │   ├── description (string)
    │   │   └── taskId (string - optional, reference to maintenance task)
    │   ├── notes (string - optional)
    │   ├── createdAt (timestamp)
    │   └── updatedAt (timestamp)

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
````

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

### Suites

- `useGetSuitesQuery(propertyId)` - Get all suites in a property
- `useGetSuiteQuery(suiteId)` - Get single suite
- `useCreateSuiteMutation()` - Create suite
- `useUpdateSuiteMutation()` - Update suite
- `useDeleteSuiteMutation()` - Delete suite

### Units

- `useGetUnitsQuery(propertyId)` - Get all units in a multifamily property
- `useGetUnitQuery(unitId)` - Get single unit
- `useCreateUnitMutation()` - Create unit
- `useUpdateUnitMutation()` - Update unit
- `useDeleteUnitMutation()` - Delete unit

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

## Fields NOT YET In Firebase (Stored in Redux or App State)

The following fields are used in the app but haven't been migrated to Firestore yet. They're marked with `[NOT YET IN FIREBASE]` in the collection structures above:

### Property Fields:

- `propertyType` - Type of property (Single Family, Multi-Family, Commercial)
- `units` - Array of unit objects for multi-family properties (name, occupants, deviceIds)
- `hasSuites` - Boolean flag for commercial properties with multiple suites
- `suites` - Array of suite objects for commercial properties (name, occupants, deviceIds)
- `taskHistory` / `maintenanceHistory` - Maintenance and task history for properties
- `administrators` - Array of user IDs with admin access
- `viewers` - Array of user IDs with viewer access

### Already in Firebase:

- ✅ **Devices** - Separate `devices` collection with full CRUD endpoints
- ✅ **Device references** - Units/Suites/Properties store `deviceIds` instead of full objects

### Why Remaining Fields Aren't In Firebase Yet:

1. **Units/Suites/PropertyType** - These are part of a comprehensive property structure redesign. They should be stored as Firebase collections or nested documents, not flat arrays.
2. **taskHistory/maintenanceHistory** - Currently stored as inline arrays, but should reference the `tasks` collection instead.
3. **Access Control Fields** - These should be managed through Firebase Security Rules rather than denormalized data.

### Action Items:

- [ ] Migrate `units` to separate `propertyUnits` collection with propertyId reference
- [ ] Migrate `suites` to separate `propertySuites` collection with propertyId reference
- [ ] Use `propertyType` to determine unit/suite relationships (keep in Property doc, but validate at write time)
- [ ] Replace `taskHistory` with Firestore queries filtering the `tasks` collection
- [ ] Implement Firebase Security Rules for role-based access instead of storing admin/viewer arrays

## Current Setup Status

- ✅ Firebase SDK installed
- ✅ Firebase config created (add your credentials)
- ✅ Redux Toolkit Query API slice set up
- ✅ Store integrated with API middleware
- ✅ All endpoints ready for Firestore
- ✅ Type safety for all operations
- ✅ Devices collection implemented with full CRUD
- ⚠️ Some fields still need Firebase migration (see above)

## Next Steps

1. **Add Firebase credentials** to `.env.local`
2. **Set up Firestore security rules** in Firebase Console
3. **Optional**: Add Firebase Authentication for user management
4. **Start using API hooks** in your components alongside Redux
5. **Test Firebase connection** once credentials are in place
6. **Migrate remaining fields** listed above to Firebase as needed

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
