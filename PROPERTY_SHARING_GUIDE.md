# Property Sharing Feature

## Overview

The property sharing feature allows property owners to invite other users to view or manage their properties with different permission levels.

## Features

### 1. **Share Permissions**

- **Admin**: Can view and edit property details, create/manage tasks, and invite other users
- **Viewer**: Can only view property details, tasks, and information (read-only access)

### 2. **Property Invitations**

- Property owners can invite users via email
- Invitations expire after 7 days
- Recipients can accept or decline invitations
- Pending invitations appear on the Dashboard

### 3. **Share Management**

- Property owners can view all users with access to their properties
- Modify permission levels (upgrade/downgrade between admin and viewer)
- Revoke access at any time

## User Interface

### Dashboard

- **InvitationsPanel**: Displays pending property invitations
  - Shows property title, sender email, and permission level
  - Accept or decline buttons for each invitation
  - Auto-refreshes when invitations are processed

### Property Detail Page

- **Share Button** (👥 Share Property): Only visible to property owners
  - Opens SharePropertyModal for managing access

### SharePropertyModal

- **Invite Section**:
  - Email input field
  - Permission selector (Admin/Viewer)
  - Send invitation button
- **Current Shares Section**:
  - List of all users with access
  - Permission badges (Admin/Viewer)
  - Edit and delete buttons for each share

## API Endpoints

### Property Shares

- `getPropertyShares(propertyId)`: Get all shares for a property
- `getSharedPropertiesForUser(userId)`: Get all properties shared with a user
- `createPropertyShare(data)`: Create a new property share
- `updatePropertyShare(id, permission)`: Update share permission
- `deletePropertyShare(id)`: Revoke property access

### User Invitations

- `getUserInvitations(userEmail)`: Get pending invitations for a user
- `sendInvitation(data)`: Send a property invitation
- `acceptInvitation(invitationId, userId)`: Accept an invitation
- `rejectInvitation(invitationId)`: Decline an invitation

## Data Models

### PropertyShare

```typescript
{
	id: string;
	propertyId: string;
	ownerId: string;
	sharedWithUserId: string;
	sharedWithEmail: string;
	permission: 'admin' | 'viewer';
	createdAt: string;
	updatedAt: string;
}
```

### UserInvitation

```typescript
{
	id: string;
	propertyId: string;
	propertyTitle: string;
	fromUserId: string;
	fromUserEmail: string;
	toEmail: string;
	permission: 'admin' | 'viewer';
	status: 'pending' | 'accepted' | 'rejected';
	createdAt: string;
	expiresAt: string;
}
```

## Permission Checks

### Helper Functions (utils/permissions.ts)

- `canShareProperty(userId, property)`: Check if user can share a property (owner only)
- `hasAdminShareAccess(permission)`: Check if user has admin share access
- `hasViewerShareAccess(permission)`: Check if user has viewer share access
- `canEditProperty(userId, property, sharePermission)`: Check if user can edit property
- `canDeleteProperty(userId, property)`: Check if user can delete property (owner only)
- `getSharePermissionLabel(permission)`: Get display name for permission level

## How It Works

### Sharing a Property

1. Property owner clicks "👥 Share Property" button
2. SharePropertyModal opens
3. Owner enters recipient's email and selects permission level
4. System sends invitation to recipient
5. Invitation appears in recipient's Dashboard InvitationsPanel

### Accepting an Invitation

1. User sees invitation in Dashboard
2. User clicks "Accept" button
3. System creates PropertyShare record
4. User immediately gains access to the property
5. Property appears in user's Properties list

### Managing Access

1. Property owner opens SharePropertyModal
2. Current shares list shows all users with access
3. Owner can:
   - Click edit icon to change permission level
   - Click delete icon to revoke access
   - Add new users via invitation

### Viewing Shared Properties

- Shared properties automatically appear in the Properties list
- Properties query (`getProperties`) combines:
  - Properties owned by the user (via propertyGroups)
  - Properties shared with the user (via propertyShares)
- Duplicate properties are filtered out

## Security Considerations

1. **Owner-Only Actions**:
   - Only property owners can share properties
   - Only property owners can delete properties
   - Only property owners can change share permissions

2. **Permission-Based Access**:
   - Viewers cannot edit property details
   - Viewers cannot delete properties
   - Admins can edit but not delete or share

3. **Email-Based Invitations**:
   - Invitations sent to email addresses
   - Recipients must have accounts with matching emails
   - Expired invitations cannot be accepted

4. **Data Isolation**:
   - Users only see properties they own or have been shared with
   - Share data includes both userId and email for verification

## Testing Data

The seed script includes sample data:

- 2 PropertyShares (one admin, one viewer)
- 2 UserInvitations (pending invitations)

To test:

1. Run `npm run seed:firebase` to populate sample data
2. Log in as different users to see different perspectives
3. Use test emails: manager@example.com, assistant@example.com, newuser@example.com

## Future Enhancements

- Email notifications when invitations are sent
- Bulk invite functionality
- Share expiration dates
- Activity logs for share changes
- Team-based sharing (share with entire teams)
- Property templates with default share settings
