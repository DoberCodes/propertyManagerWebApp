# Firebase Migration Checklist

## Phase 1: Setup ✅ COMPLETE

- [x] Install Firebase SDK
- [x] Create Firebase config file
- [x] Create Redux Toolkit Query API slice
- [x] Set up environment variables template
- [x] Add API slice to Redux store
- [x] All types defined for Firestore collections
- [x] Integration guide created
- [x] Example patterns documented

## Phase 2: Firebase Credentials (YOU MUST DO THIS)

- [ ] Create Firebase project in Console
- [ ] Enable Firestore Database
- [ ] Copy project credentials
- [ ] Create `.env.local` file with credentials
- [ ] Test Firebase connection in browser console:
  ```javascript
  // In browser console after app loads:
  import { db } from './config/firebase';
  console.log(db); // Should show Firestore instance
  ```

## Phase 3: Firestore Setup

- [ ] Create security rules in Firebase Console
- [ ] Create Firestore collections:
  - [ ] propertyGroups
  - [ ] properties
  - [ ] tasks
  - [ ] teamGroups
  - [ ] teamMembers
- [ ] Enable Firebase Authentication (optional but recommended)
- [ ] Set up authentication rules

## Phase 4: Component Migration (One at a Time)

### PropertiesTab

- [ ] Import API hooks
- [ ] Add `useGetPropertyGroupsQuery(userId)`
- [ ] Sync Firebase data to Redux state
- [ ] Update `handleAddGroup` to call `createGroupApi`
- [ ] Update `handleDeleteGroup` to call `deleteGroupApi`
- [ ] Update `handleAddProperty` to call `createPropertyApi`
- [ ] Update `handleDeleteProperty` to call `deletePropertyApi`
- [ ] Test: Create, read, update, delete groups and properties

### TeamPage

- [ ] Import API hooks
- [ ] Add `useGetTeamGroupsQuery(userId)`
- [ ] Add `useGetTeamMembersQuery(groupId)`
- [ ] Update `handleSaveTeamMember` to call API mutation
- [ ] Update `handleDeleteTeamMember` to call API mutation
- [ ] Test: Create, read, update, delete team members

### PropertyDetailPage

- [ ] Import API hooks
- [ ] Add `useGetTasksQuery(propertyId)`
- [ ] Update `handleTaskFormSubmit` to call `createTaskApi` or `updateTaskApi`
- [ ] Update `handleDeleteTask` to call `deleteTaskApi`
- [ ] Test: Create, read, update, delete tasks

## Phase 5: Testing

- [ ] Test CREATE operations (does data appear in Firestore?)
- [ ] Test READ operations (does data load from Firestore?)
- [ ] Test UPDATE operations (do changes persist?)
- [ ] Test DELETE operations (is data removed?)
- [ ] Test offline behavior (does optimistic update work?)
- [ ] Test error handling (do errors display correctly?)
- [ ] Test with multiple browser windows (real-time sync?)

## Phase 6: Optimization

- [ ] Add real-time listeners (optional, for live updates)
- [ ] Set up pagination for large data sets (optional)
- [ ] Configure cache invalidation strategy
- [ ] Monitor Firestore usage in Console
- [ ] Optimize security rules for performance

## Code Examples for Each Phase

### Simple Example: Add Group

```tsx
// Before (Redux only):
const handleAddGroup = () => {
	dispatch(
		addGroup({
			id: Date.now(),
			name: 'New Group',
			properties: [],
		}),
	);
};

// After (With Firebase):
const [createGroupApi] = useCreatePropertyGroupMutation();

const handleAddGroup = async (groupName: string) => {
	try {
		// Optimistic update
		dispatch(
			addGroup({
				id: Date.now(),
				name: groupName,
				properties: [],
			}),
		);

		// Firebase persistence
		await createGroupApi({
			userId: 'current-user-id',
			name: groupName,
			linkedProperties: [],
		}).unwrap();
	} catch (error) {
		console.error('Failed to create group:', error);
	}
};
```

### Sync Firebase to Redux on Load

```tsx
const userId = 'current-user-id';
const { data: firebaseGroups } = useGetPropertyGroupsQuery(userId);

// Sync to Redux
useEffect(() => {
	if (firebaseGroups && firebaseGroups.length > 0) {
		// You could dispatch to sync, or just let components use the API hook directly
	}
}, [firebaseGroups, dispatch]);
```

## Troubleshooting During Migration

**Issue: "Cannot create property without groupId"**

- Solution: Make sure `groupId` is passed to `createPropertyApi`

**Issue: "Data not appearing in Firestore"**

- Solution: Check security rules - they might be blocking writes
- Solution: Check browser console for Firebase errors
- Solution: Verify `.env.local` has correct credentials

**Issue: "Real-time updates not working"**

- Solution: Real-time listeners require RTK Query plugins (more advanced)
- Workaround: Use `refetch()` to manually sync data

**Issue: "Type errors with API responses"**

- Solution: Check that returned objects match the interface definitions
- Solution: Import types from `apiSlice.ts` and use them

## Performance Tips

1. **Cache invalidation**: RTK Query caches by endpoint + argument

   ```tsx
   // This refetches after mutation:
   const [createGroup] = useCreatePropertyGroupMutation();
   // RTK Query automatically refetches getPropertyGroupsQuery after creation
   ```

2. **Selective fetching**: Only fetch what you need

   ```tsx
   // Good - fetch only user's groups:
   const { data: myGroups } = useGetPropertyGroupsQuery(userId);

   // Avoid - fetching everything:
   const { data: allGroups } = useGetAllGroupsQuery();
   ```

3. **Avoid N+1 queries**: Don't fetch groups, then fetch properties for each group

   ```tsx
   // Less efficient:
   groups.map((group) => <Component key={group.id} groupId={group.id} />);
   // In Component: useGetPropertiesQuery(groupId) - runs multiple queries

   // More efficient:
   // Fetch all in one place, pass down data
   ```

## When You Have a Backend Ready

1. Update the `apiSlice.ts` to use REST endpoints instead of Firebase
2. Change `baseQuery: fakeBaseQuery()` to `baseQuery: fetchBaseQuery({ baseUrl: 'your-api-url' })`
3. Replace Firebase queries with REST queries
4. Keep all the same type definitions and hooks

Example:

```tsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({
		baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
	}),
	endpoints: (builder) => ({
		getPropertyGroups: builder.query<PropertyGroup[], string>({
			query: (userId) => `/property-groups?userId=${userId}`,
		}),
		// ... rest of endpoints
	}),
});
```

## Current Files Created

- ✅ `src/config/firebase.ts` - Firebase initialization
- ✅ `src/Redux/API/apiSlice.ts` - All API endpoints
- ✅ `src/Redux/API/INTEGRATION_EXAMPLE.tsx` - Example patterns
- ✅ `FIREBASE_SETUP.md` - Detailed setup guide
- ✅ `.env.example` - Environment variables template

## Next Meeting Checklist

Before connecting backend API:

- [ ] Firebase credentials added to `.env.local`
- [ ] Firestore collections created
- [ ] At least one component migrated to use API hooks
- [ ] Data successfully persisting to Firestore
- [ ] Real-time updates verified (if needed)

Then we can:

- [ ] Switch to backend API
- [ ] Set up authentication
- [ ] Add more advanced features (pagination, filtering, etc.)
