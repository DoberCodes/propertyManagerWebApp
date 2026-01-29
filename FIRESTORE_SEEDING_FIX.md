# Fixing Firestore Permission Denied Error

## Problem

When running `yarn seed:firebase`, you get:

```
❌ Error seeding Firestore: 7 PERMISSION_DENIED: Missing or insufficient permissions.
```

This happens because Firestore security rules prevent unauthenticated writes.

## Solutions

### Solution 1: Temporarily Open Firestore Rules (Fastest)

**⚠️ For Development Only - Do NOT use in production!**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace with these temporary rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

5. Click **Publish**
6. Run: `yarn seed:firebase`
7. **IMPORTANT:** After seeding, restore your production rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Property groups - user must own them
    match /propertyGroups/{groupId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    // Properties - user must own or have share access
    match /properties/{propertyId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Property shares
    match /propertyShares/{shareId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // User invitations
    match /userInvitations/{inviteId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // Tasks, devices, suites, units
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Solution 2: Add Test User to Firebase Auth (Recommended)

1. Go to **Firebase Console** → **Authentication** → **Users**
2. Click **Add user**
3. Create a test admin user:
   - Email: `admin@test.com`
   - Password: `TestPassword123!`
4. Copy the User UID
5. Update your `.env` file:

```env
# Add these lines
FIREBASE_ADMIN_EMAIL=admin@test.com
FIREBASE_ADMIN_PASSWORD=TestPassword123!
```

6. Then use **Solution 1** to temporarily open rules and seed

### Solution 3: Use Firebase Admin SDK (Most Secure)

This requires a service account key and is more complex but bypasses security rules entirely.

1. Go to **Firebase Console** → **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file as `serviceAccountKey.json` in your project root
4. **Add to `.gitignore`:**

```
serviceAccountKey.json
```

5. Install Firebase Admin SDK:

```bash
npm install firebase-admin
```

6. Create `scripts/seedFirestoreAdmin.cjs`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Your seeding code here using db...
```

7. Add to `package.json`:

```json
"scripts": {
  "seed:firebase:admin": "node scripts/seedFirestoreAdmin.cjs"
}
```

## Recommended Approach

For **development**:

1. Use **Solution 1** (temporarily open rules)
2. Seed your database
3. Restore production rules immediately

For **production**:

1. Use **Solution 3** (Firebase Admin SDK)
2. Never commit service account keys
3. Use environment variables for credentials

## Testing Your Rules

After restoring production rules, test that they work:

1. **Sign in to your app** with a real user
2. **Try to view properties** - should work
3. **Try to create a property** - should work
4. **Sign out and try again** - should fail

## Security Best Practices

✅ **DO:**

- Use authenticated requests
- Validate user ownership
- Check permissions before writes
- Use Admin SDK for server-side operations
- Keep service account keys secret

❌ **DON'T:**

- Leave `allow read, write: if true` in production
- Commit service account keys to git
- Share credentials in code
- Allow unauthenticated access in production

## Quick Reference

| Method     | Difficulty | Security  | Best For            |
| ---------- | ---------- | --------- | ------------------- |
| Open Rules | Easy       | ⚠️ Low    | Quick dev seeding   |
| Auth User  | Medium     | ✅ Good   | Regular development |
| Admin SDK  | Hard       | ✅✅ Best | Production/CI/CD    |
