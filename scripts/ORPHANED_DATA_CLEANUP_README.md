# Orphaned Data Cleanup Migration

This script (`scripts/migrateRemoveOrphanedData.cjs`) is designed to clean up orphaned data in Firestore that is no longer connected to active user accounts. It's safe to run repeatedly and is built to scale with your application.

## Purpose

When users delete their accounts or are removed from Firebase Auth, their associated data in Firestore becomes "orphaned" - it still exists but references user IDs that no longer exist. This script identifies and removes such data while preserving relationships for active users.

## How It Works

The script performs three phases of cleanup:

### Phase 1: User-Owned Collections

Removes documents that have a `userId` field pointing to a deleted user.

### Phase 2: Property-Related Collections

Removes documents that reference properties owned by deleted users.

### Phase 3: Shared User References

Removes deleted user IDs from arrays in shared documents (like co-owners, administrators, viewers).

## Current Collections Cleaned

### User-Owned Collections (Direct userId references)

- `propertyGroups` - User's property groupings
- `teamGroups` - User's team organizations
- `teamMembers` - User's team member records
- `favorites` - User's property favorites
- `tasks` - User's created tasks
- `users` - **User profile data (CRITICAL - was missing before!)**
- `notifications` - User's notification history
- `contractors` - User's contractor relationships

### Property-Related Collections (Reference propertyId)

- `tasks` - Tasks associated with properties
- `suites` - Property suites/units
- `units` - Property units
- `devices` - Devices installed on properties
- `propertyShares` - Property sharing relationships
- `userInvitations` - Property invitation records
- `maintenanceHistory` - Property maintenance records

### Shared User Arrays

- `properties` - coOwners, administrators, viewers arrays

## Maintenance as App Expands

### Adding New Collections

Edit the `COLLECTION_CONFIG` object at the top of `migrateRemoveOrphanedData.cjs`:

#### For User-Owned Collections:

```javascript
userOwned: [
    'propertyGroups',
    'teamGroups',
    'teamMembers',
    'favorites',
    'tasks',
    'userProfiles',        // NEW: Add here
    'userSettings',        // NEW: Add here
],
```

#### For Property-Related Collections:

```javascript
propertyRelated: [
    { name: 'tasks', field: 'propertyId' },
    { name: 'suites', field: 'propertyId' },
    { name: 'maintenanceHistory', field: 'propertyId' },  // NEW: Add here
    { name: 'propertyDocuments', field: 'propertyId' },   // NEW: Add here
],
```

#### For Shared User Arrays:

```javascript
sharedUserArrays: [
    { collection: 'properties', fields: ['coOwners', 'administrators', 'viewers'] },
    { collection: 'teamGroups', fields: ['memberIds', 'managerIds'] },  // NEW: Add here
],
```

### Running the Migration

```bash
# From the project root
node scripts/migrateRemoveOrphanedData.cjs
```

## Safety Features

- **Idempotent**: Safe to run multiple times
- **Batch Operations**: Handles Firestore limits (500 operations per batch)
- **Error Handling**: Continues processing even if individual operations fail
- **Logging**: Detailed output shows exactly what was cleaned
- **Preservation**: Only removes data truly disconnected from active users

## When to Run

- After implementing account deletion features
- Periodically for database maintenance (monthly/quarterly)
- Before major deployments
- When adding new collections that reference users

## Output Example

```
🚀 Starting orphaned data cleanup migration...

📋 Configuration loaded for collections:
   • User-owned: propertyGroups, teamGroups, teamMembers, favorites, tasks
   • Property-related: tasks, suites, units, devices, propertyShares, userInvitations
   • Shared user arrays: properties(coOwners,administrators,viewers)

Fetching all current Firebase Auth users...
Found 8 current users in Firebase Auth

🧹 Phase 1: Cleaning user-owned collections...
🔍 Checking collection: propertyGroups
   ✅ Removed 0 orphaned documents from propertyGroups

🎉 Migration completed successfully!
📊 Summary:
   • Total orphaned documents removed: 0
   • Properties with cleaned shared references: 0
   • Active users preserved: 8
```

## Future-Proofing

The script includes commented placeholders for common future collections:

- `userProfiles`, `userSettings` (user-owned)
- `maintenanceHistory`, `propertyDocuments` (property-related)
- `memberIds`, `managerIds` (shared user arrays)

Simply uncomment and modify as needed when implementing these features.
