# Firestore Scripts

This directory contains scripts for managing your Firestore database.

## Available Scripts

### 1. Seed Mock Data

Populate Firestore with mock data for development/testing.

```bash
npm run seed:firebase
```

### 2. Initialize App Version (New!)

Create the initial app version document in Firestore for the update notification system.

```bash
node scripts/initAppVersion.cjs
```

This creates an `appConfig/version` document with:

- version: "1.0.0"
- releaseDate: current timestamp
- releaseNotes: description of the release

**Run this once before building your first APK with the update system.**

### 3. Update App Version (New!)

Update the app version in Firestore when releasing a new APK.

```bash
node scripts/updateAppVersion.cjs <version> [release notes]
```

Examples:

```bash
node scripts/updateAppVersion.cjs 1.0.1 "Bug fixes and performance improvements"
node scripts/updateAppVersion.cjs 1.1.0 "New features: Task assignment and property groups"
```

When you update the version in Firestore, users on older versions will automatically see the update notification banner prompting them to download the new APK.

---

## Data Source

**The script imports mock data from `src/data/mockData.ts`** - a shared file used by both Redux slices and the seeding script. This ensures a single source of truth:

- **Redux slices** (`propertyDataSlice.tsx`, `teamSlice.tsx`) import from `mockData.ts`
- **Seed script** (`scripts/seedFirestore.js`) imports from `mockData.ts`
- **To update mock data**: Edit `src/data/mockData.ts` and changes will automatically apply to both Redux and Firebase seeding

## Prerequisites

1. **Firebase project set up** in the Firebase Console
2. **Environment variables configured** in `.env.local` at the client root:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```
3. **Firestore security rules** configured to allow writes (see below)

## Usage

### Run the seeding script:

```bash
npm run seed:firebase
```

Or directly:

```bash
node scripts/seedFirestore.js
```

## What Gets Created

The script creates the following Firestore collections with sample data:

- **propertyGroups** (2 groups)
- **properties** (4 properties)
- **units** (7 units for multi-family properties)
- **suites** (3 suites for commercial property)
- **tasks** (4 tasks)
- **teamGroups** (1 team group)
- **teamMembers** (2 members)
- **devices** (3 devices)

All data is structured according to the Firebase schema defined in `FIREBASE_SETUP.md`.

## Firestore Security Rules

**Important:** Before running the seed script, temporarily allow writes to your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // TEMPORARY - for seeding only!
    }
  }
}
```

**⚠️ After seeding, replace with proper security rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /propertyGroups/{groupId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    match /properties/{propertyId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid in resource.data.administrators;
    }
    match /units/{unitId} {
      allow read, write: if request.auth != null;
    }
    match /suites/{suiteId} {
      allow read, write: if request.auth != null;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
    match /teamGroups/{groupId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
    match /teamMembers/{memberId} {
      allow read, write: if request.auth != null;
    }
    match /devices/{deviceId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Reusability

This script can be run multiple times. Each run will:

- **Overwrite** existing documents with the same IDs
- Be idempotent (safe to run repeatedly)
- Use data from `src/data/mockData.ts` for consistency

## Customization

To modify the seeded data:

1. **Edit `src/data/mockData.ts`** - the single source of truth
2. Update the exported arrays (`mockPropertyGroups`, `mockTasks`, `mockTeamGroups`)
3. Re-run `npm run seed:firebase` to update Firestore
4. Changes will also reflect in Redux initial state automatically

### Reverting to Standalone Data

If needed, the original hardcoded data is preserved as commented code in `seedFirestore.js`. To revert:

1. Open `scripts/seedFirestore.js`
2. Uncomment the "LEGACY HARDCODED DATA" section
3. Remove or comment out the import and transform functions at the top
4. Update the `seedFirestore()` function to use the hardcoded arrays

## Troubleshooting

### Error: "Missing Firebase configuration"

- Verify `.env.local` exists with all required variables
- Check that variable names start with `REACT_APP_`

### Error: "Missing or insufficient permissions"

- Update Firestore security rules to allow writes (see above)
- Ensure you're using the correct Firebase project

### Error: "Cannot find module '../src/data/mockData.ts'"

- Ensure `src/data/mockData.ts` exists
- The script uses require() for TypeScript files - Node.js may need ts-node installed if issues persist
- Alternative: Revert to the commented hardcoded data (see "Reverting to Standalone Data" above)

### Error: "Firebase app already initialized"

- Only run the script once per session
- Restart if you need to run again

## Production Notes

**Never run this script in production!** It's meant for:

- Initial development setup
- Testing environments
- Demo/staging environments

For production:

1. Use Firebase Admin SDK with service account credentials
2. Implement proper authentication
3. Add data validation and sanitization
4. Use transactions for data integrity
