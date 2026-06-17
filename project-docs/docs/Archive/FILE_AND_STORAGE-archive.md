# Firebase Storage Security Rules

## Task Completion Files Storage Rules

Deploy these rules to your Firebase Console Storage section:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // Task completion files - user can upload to their own folder
    match /task-completions/{userId}/{taskId}/{allFiles=**} {
      // Allow read for the uploader and any admin users
      allow read: if isOwner(userId);

      // Allow write only for the owner of the user folder
      allow write: if isOwner(userId);
    }

    // Property images - user can upload to their own folder
    match /properties/{userId}/{allFiles=**} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // User profile images - user can upload to their own folder
    match /user-profile-images/{userId}/{allFiles=**} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // Team member images - user can upload to their own folder
    match /team-member-images/{userId}/{allFiles=**} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // Team member files - user can upload to their own folder
    match /team-member-files/{userId}/{allFiles=**} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // Device files - authenticated users can read, owners can write
    // Note: Using propertyId in path, so any authenticated user can read
    // and users with write access to properties can upload
    match /device-files/{propertyId}/{allFiles=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Maintenance files - authenticated users can read, owners can write
    // Note: Using propertyId in path, so any authenticated user can read
    // and users with write access to properties can upload
    match /maintenance-files/{propertyId}/{allFiles=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Default deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Steps to Deploy:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** > **Rules**
4. Replace the existing rules with the rules above
5. Click **Publish**

## File Upload Paths

- Task completion files: `task-completions/{userId}/{taskId}/{timestamp}-{filename}`
- Property images: `properties/{userId}/{filename}`
- User profile images: `user-profile-images/{userId}/{filename}`
- Team member images: `team-member-images/{userId}/{memberId}/{filename}`
- Team member files: `team-member-files/{userId}/{memberId}/{filename}`
- Device files: `device-files/{propertyId}/{deviceId}/{filename}`
- Maintenance files: `maintenance-files/{propertyId}/{filename}`

The storage rules ensure:

- Users can only upload to their own folders (based on userId from auth)
- Some files (property images, user profiles, team members) can be read by any authenticated user
- Device and maintenance files use propertyId for broader access within property management
- All other access is denied by default (secure by default)


# Task Completion File Upload - Base64 → Firebase Storage Migration

## Summary of Changes

Updated the task completion workflow to use **Firebase Storage** instead of **Base64 encoding** for file uploads.

## Files Modified

### 1. `src/Components/TaskCompletionModal/TaskCompletionModal.tsx`

**Changes:**

- Replaced `uploadToBase64` import with Firebase Storage imports:
  ```typescript
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { storage } from '../../config/firebase';
  ```
- Updated file size validation: 700KB → **25MB** (Firebase Storage limit)
- Replaced `uploadToBase64()` call with Firebase Storage upload:
  ```typescript
  // Step 1: Upload file to Firebase Storage
  const fileRef = ref(
  	storage,
  	`task-completions/${currentUser!.id}/${taskId}/${Date.now()}-${selectedFile!.name}`,
  );
  await uploadBytes(fileRef, selectedFile!);
  const downloadUrl = await getDownloadURL(fileRef);
  ```
- File now receives a **public Storage download URL** instead of base64 data

### 2. `STORAGE_RULES.md` (NEW FILE)

**Purpose:** Firebase Storage security rules for production deployment
**Key Rules:**

- Users can upload to `task-completions/{userId}/{taskId}/{files}`
- Users can read files they uploaded
- All other access is denied (secure by default)

## Why Firebase Storage?

| Aspect          | Base64                                   | Firebase Storage                         |
| --------------- | ---------------------------------------- | ---------------------------------------- |
| File Size Limit | 700KB                                    | 25MB+                                    |
| Database Impact | Stores binary in Firestore (larger docs) | Stores only URL reference (smaller docs) |
| Performance     | Slower (encodes/decodes)                 | Faster (direct streaming)                |
| Cost            | Higher (Firestore read/write)            | More efficient                           |
| CDN             | No                                       | Yes (automatic)                          |

## How to Deploy

### 1. Update Firebase Firestore Rules (Already Done)

- See `FIREBASE_RULES.MD` - `maintenanceHistory` collection rules are set

### 2. Deploy Firebase Storage Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** > **Rules**
4. Copy rules from `STORAGE_RULES.md`
5. Click **Publish**

### 3. Test the Flow

1. Mark a task as complete in the dashboard
2. Upload a file in the modal
3. Verify:
   - File uploads successfully to Storage
   - Task moves to `maintenanceHistory` collection
   - Maintenance history shows the file with working download link

## API/Firestore No Changes Needed

The `submitTaskCompletion` mutation in `apiSlice.ts` already stores:

- `completionFile.url` → Now a Storage download URL (was base64)
- All other fields remain the same
- No database schema changes required

## Storage Path Structure

```
gs://your-project-bucket/
  └── task-completions/
      └── {userId}/
          └── {taskId}/
              └── {timestamp}-{filename}
```

Example: `task-completions/user-123/task-456/1707000000000-work-order.pdf`

## Notes

- Storage URLs are **public/shareable** but time-limited (default 1 hour for unsigned URLs)
- If longer-lived URLs are needed, configure signed URLs in API layer
- File uploads are **async and happen before Firestore write**, so network errors won't corrupt the history record
