# Firebase Security Rules Testing Guide

This guide helps you test your Firebase security rules to ensure proper access control.

## Quick Start

Run all tests (Firestore + Storage):

```bash
npm run test:rules:all
```

Or test individually:

```bash
# Test Firestore rules
npm run test:rules

# Test Storage rules
npm run test:storage
```

## What Gets Tested

The test script validates:

### 1. **Collection Structure**

- ✅ All 20+ collections are accessible
- ✅ Collections contain data
- ⚠️ Warns if collections are empty

### 2. **User-Based Access Control**

Tests collections that use `userId` for access control:

- `propertyGroups`
- `tasks`
- `teamGroups`
- `devices`
- `suites`
- `units`
- `favorites`
- `contractors`

### 3. **Special Collections**

- **familyAccounts**: Verifies owner/member structure
- **appConfig**: Confirms read-only access
- **notifications**: Validates backend-only creation

### 4. **Invitation Systems**

Tests email-based invitation security:

- `tenantInvitationCodes`
- `teamMemberInvitationCodes`
- `userInvitations`

## Manual Testing in Your App

### Test 1: Basic Authentication

1. **Before Login** - Try to access any page

   - ❌ Should redirect to login
   - ❌ No data should be visible

2. **After Login** - Access dashboard
   - ✅ Should see your own properties
   - ✅ Should see your own tasks
   - ❌ Should NOT see other users' data

### Test 2: Property Access

1. **Your Properties**

   ```
   - ✅ Can view all your properties
   - ✅ Can create new properties
   - ✅ Can edit your properties
   - ✅ Can delete your properties
   ```

2. **Shared Properties**

   ```
   - ✅ Can view properties shared with you
   - ✅ Can see property details
   - Permission depends on share level (admin/viewer)
   ```

3. **Other Users' Properties**
   ```
   - ❌ Cannot view in list
   - ❌ Cannot access directly by URL
   - ❌ Should get permission denied
   ```

### Test 3: Task Management

1. **Your Tasks**

   - ✅ Can create tasks for your properties
   - ✅ Can view and edit your tasks
   - ✅ Can mark tasks as complete

2. **Other Users' Tasks**
   - ❌ Should not appear in your task list
   - ❌ Cannot access task details

### Test 4: Team Features

1. **Team Members**

   - ✅ Can add members to your team
   - ✅ Can view your team members
   - ✅ Can edit member details
   - ❌ Cannot see other users' teams

2. **Team Invitations**
   - ✅ Can create invitation codes
   - ✅ Can send invitations
   - ✅ Recipients can see their invitations
   - ❌ Cannot see invitations sent by others

### Test 5: Family Accounts

1. **Account Owner**

   - ✅ Can view family account
   - ✅ Can add family members (up to limit)
   - ✅ Can remove family members
   - ✅ Can view all members

2. **Family Member**

   - ✅ Can view family account
   - ✅ Can see other family members
   - ❌ Cannot modify family account
   - ❌ Cannot remove other members

3. **Non-Members**
   - ❌ Cannot access the family account
   - ❌ Cannot see member list

### Test 6: Notifications

1. **Your Notifications**

   - ✅ Can read your notifications
   - ✅ Can mark as read
   - ✅ Can dismiss/delete notifications
   - ❌ Cannot create notifications manually

2. **Other Users' Notifications**
   - ❌ Cannot see others' notifications
   - ❌ Cannot access by URL manipulation

### Test 7: Tenant Features

1. **Landlord**

   - ✅ Can create tenant invitation codes
   - ✅ Can view tenant profiles for their units
   - ✅ Can manage tenant information

2. **Tenant**
   - ✅ Can view their own profile
   - ✅ Can update their own information
   - ❌ Cannot see other tenants

### Test 8: Storage (Files)

1. **Your Files**

   - ✅ Can upload to your folders
   - ✅ Can view your uploaded files
   - ✅ Can delete your files

2. **Other Users' Files**
   - ❌ Cannot access others' private folders
   - ✅ Can view public files (property images)

## Test Commands

Run all tests (Firestore + Storage):

```bash
npm run test:rules:all
```

Run individually:

```bash
# Test Firestore database rules
npm run test:rules

# Test Storage file rules
npm run test:storage
```

The automated tests will check:

- ✅ All collections are accessible (Firestore)
- ✅ User isolation is working (Firestore)
- ✅ Storage paths are configured (Storage)
- ✅ File upload permissions (Storage)
- ⚠️ Warns about empty collections/paths

## Browser Console Testing

Open your browser's Developer Tools (F12) and run these tests in the Console:

### Test Read Access

```javascript
// This should work (your own data)
firebase
	.firestore()
	.collection('propertyGroups')
	.where('userId', '==', firebase.auth().currentUser.uid)
	.get()
	.then((snap) => console.log('✅ Can read own data:', snap.size, 'docs'))
	.catch((err) => console.error('❌ Error:', err.message));

// This should fail (missing auth)
firebase
	.auth()
	.signOut()
	.then(() => {
		firebase
			.firestore()
			.collection('propertyGroups')
			.get()
			.then((snap) =>
				console.warn('⚠️ Unexpected: Read without auth succeeded'),
			)
			.catch((err) => console.log('✅ Correctly blocked:', err.message));
	});
```

### Test Write Access

```javascript
// This should work (your own document)
firebase
	.firestore()
	.collection('propertyGroups')
	.add({
		userId: firebase.auth().currentUser.uid,
		name: 'Test Group',
		createdAt: new Date().toISOString(),
	})
	.then((doc) => {
		console.log('✅ Can create own data');
		// Clean up
		return doc.delete();
	})
	.catch((err) => console.error('❌ Error:', err.message));

// This should fail (trying to create for another user)
firebase
	.firestore()
	.collection('propertyGroups')
	.add({
		userId: 'some-other-user-id',
		name: 'Hacker Group',
	})
	.then((doc) =>
		console.warn('⚠️ Security issue: Created doc for another user!'),
	)
	.catch((err) => console.log('✅ Correctly blocked:', err.message));
```

## Common Issues & Solutions

### Issue: "Missing or insufficient permissions"

**Solution:**

- Verify you're logged in
- Check that documents have the correct `userId` field
- Ensure rules are deployed to Firebase Console

### Issue: "Cannot read documents"

**Solution:**

- Check Firebase Console → Firestore → Rules
- Verify rules match the [FIREBASE_RULES.MD](FIREBASE_RULES.MD) file
- Ensure indexes are created for complex queries

### Issue: "Can see other users' data"

**Solution:**

- **URGENT**: This is a security issue
- Check if rules are properly filtering by `userId`
- Verify the document structure includes `userId`

### Issue: Collections are empty

**Solution:**

```bash
# Seed your database with test data
npm run seed:firebase

# Or initialize empty collections
npm run init:firestore
```

## Firebase Console Verification

1. **Go to Firebase Console → Firestore → Rules**
2. **Verify these key lines exist:**

   ```
   function isAuthenticated() {
     return request.auth != null;
   }

   function isOwner(userId) {
     return isAuthenticated() && request.auth.uid == userId;
   }
   ```

3. **Check the catch-all at the bottom:**

   ```
   match /{document=**} {
     allow read, write: if false;  // Should deny all by default
   }
   ```

4. **Test in Rules Playground:**
   - Click "Rules Playground" in Firebase Console
   - Select a collection (e.g., `propertyGroups`)
   - Choose operation type (read/write)
   - Set authentication provider
   - Test different scenarios

## Security Best Practices ✅

Your rules should follow these principles:

- ✅ **Authentication Required**: No unauthenticated access
- ✅ **User Isolation**: Users can only access their own data
- ✅ **Email-Based Sharing**: Invitations work via email matching
- ✅ **Backend-Only Creation**: Sensitive collections (notifications) only created by Cloud Functions
- ✅ **Read-Only Config**: App configuration is read-only for users
- ✅ **Default Deny**: All unlisted paths are denied

## Automated Testing (Advanced)

For CI/CD pipelines, you can use Firebase Emulators:

```bash
# Install Firebase tools (if not already installed)
npm install -g firebase-tools

# Start emulators (Firestore and Storage)
firebase emulators:start --only firestore,storage

# Run tests against emulator (in another terminal)
npm run test:rules:all
```

Note: The test scripts use Firebase Admin SDK, which bypasses security rules by default. For true rule testing with emulators, you'd need to use the Firebase client SDK with emulator connection.

## Need Help?

If tests fail or you're seeing unexpected behavior:

1. Check the [FIREBASE_RULES.MD](FIREBASE_RULES.MD) for the latest Firestore rules
2. Check the [STORAGE_RULES.md](STORAGE_RULES.md) for the latest Storage rules
3. Verify rules are deployed in Firebase Console (both Firestore and Storage)
4. Clear cache and refresh your browser
5. Check browser console for detailed error messages
6. Review this testing guide for manual test scenarios

---

**Last Updated:** After adding 5 new Firestore collections and 5 new Storage paths (February 2026)
