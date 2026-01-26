# Role-Based Permissions System

## Overview

A complete role-based permissions system has been added to manage user access across the application. This includes role constants, permission checking utilities, mock users for testing, and role-based UI components.

## Files Created/Modified

### New Files

1. **`client/src/constants/roles.ts`** - Role constants and hierarchies
2. **`client/src/utils/permissions.ts`** - Permission checking utility functions
3. **`client/src/Components/Library/UserSwitcher/`** - User switcher component for testing

### Modified Files

1. **`client/src/Redux/Slices/userSlice.tsx`** - Updated with role-based user system
2. **`client/src/Components/Library/TaskCompletionModal/TaskCompletionModal.tsx`** - Uses currentUser from Redux
3. **`client/src/Components/Library/TaskApprovalModal/TaskApprovalModal.tsx`** - Adds permission checks

## User Roles

```typescript
export const USER_ROLES = {
	ADMIN: 'admin', // Highest permissions
	PROPERTY_MANAGER: 'property_manager', // Can manage properties & approve tasks
	ASSISTANT_MANAGER: 'assistant_manager', // Can manage properties
	MAINTENANCE_LEAD: 'maintenance_lead', // Can approve tasks
	MAINTENANCE: 'maintenance', // Can perform tasks
	CONTRACTOR: 'contractor', // Limited access
	TENANT: 'tenant', // Minimal access
};
```

## Mock Users for Testing

Seven mock users are available, one for each role:

| Name           | Email                     | Role                   | Can Approve Tasks? |
| -------------- | ------------------------- | ---------------------- | ------------------ |
| Admin User     | admin@propertymanager.com | Admin                  | ✅ Yes             |
| John Smith     | john@propertymanager.com  | Property Manager       | ✅ Yes             |
| Sarah Johnson  | sarah@propertymanager.com | Assistant Manager      | ❌ No              |
| Mike Rodriguez | mike@propertymanager.com  | Maintenance Lead       | ✅ Yes             |
| Chris Thompson | chris@propertymanager.com | Maintenance Technician | ❌ No              |
| David Lee      | david@contractor.com      | Contractor             | ❌ No              |
| Emily Brown    | emily@tenant.com          | Tenant                 | ❌ No              |

Default user on app startup: **Admin User**

## Permission Functions

### canApproveTaskCompletions(role)

Check if a role can approve task completions.

```typescript
import { canApproveTaskCompletions } from '../utils/permissions';

if (canApproveTaskCompletions(currentUser.role)) {
	// Show approval button
}
```

**Roles with permission**: Admin, Property Manager, Maintenance Lead

### canManageProperties(role)

Check if a role can manage properties.

```typescript
import { canManageProperties } from '../utils/permissions';

if (canManageProperties(currentUser.role)) {
	// Show property management features
}
```

**Roles with permission**: Admin, Property Manager, Assistant Manager

### canManageTeamMembers(role)

Check if a role can manage team members.

```typescript
import { canManageTeamMembers } from '../utils/permissions';

if (canManageTeamMembers(currentUser.role)) {
	// Show team management features
}
```

**Roles with permission**: Admin, Property Manager

### isAdmin(role)

Check if user is an admin.

```typescript
import { isAdmin } from '../utils/permissions';

if (isAdmin(currentUser.role)) {
	// Show admin-only features
}
```

### hasHigherRoleThan(userRole, compareRole)

Compare role hierarchy levels.

```typescript
import { hasHigherRoleThan } from '../utils/permissions';

if (hasHigherRoleThan(currentUser.role, teamMember.role)) {
	// Can manage this team member
}
```

### getRoleDisplayName(role)

Get user-friendly role name for display.

```typescript
import { getRoleDisplayName } from '../utils/permissions';

console.log(getRoleDisplayName('property_manager')); // "Property Manager"
```

### getRoleColor(role)

Get color for role badges.

```typescript
import { getRoleColor } from '../utils/permissions';

const badgeColor = getRoleColor(currentUser.role);
```

## Redux Integration

### Accessing Current User

```typescript
import { useSelector } from 'react-redux';
import { RootState } from '../Redux/Store/store';

function MyComponent() {
  const currentUser = useSelector((state: RootState) => state.user.currentUser);

  if (!currentUser) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      Welcome, {currentUser.firstName} {currentUser.lastName}!
      Role: {currentUser.role}
    </div>
  );
}
```

### Switching Users (Testing Only)

```typescript
import { useDispatch } from 'react-redux';
import { switchMockUser } from '../Redux/Slices/userSlice';

function TestComponent() {
  const dispatch = useDispatch();

  const switchToAdmin = () => {
    dispatch(switchMockUser('user-admin-1'));
  };

  const switchToTenant = () => {
    dispatch(switchMockUser('user-tenant-1'));
  };

  return (
    <div>
      <button onClick={switchToAdmin}>Switch to Admin</button>
      <button onClick={switchToTenant}>Switch to Tenant</button>
    </div>
  );
}
```

## UserSwitcher Component

### Usage

Add the UserSwitcher component to any page for easy role testing:

```typescript
import { UserSwitcher } from '../Components/Library/UserSwitcher';

function DevelopmentPage() {
  return (
    <div>
      <h1>Development Tools</h1>
      <UserSwitcher />
    </div>
  );
}
```

The UserSwitcher component provides:

- Current user display with avatar and role badge
- List of all mock users
- One-click switching between users
- Visual indication of active user
- Role-based color coding

### Example: Add to HomePage

```typescript
// In HomePage.tsx
import { UserSwitcher } from '../../Components/Library/UserSwitcher';

// Add somewhere in your component
{process.env.NODE_ENV === 'development' && <UserSwitcher />}
```

## Task Completion with Roles

### User Submitting Completion

Any authenticated user can submit a task completion:

```typescript
import { TaskCompletionModal } from '../Components/Library/TaskCompletionModal';

<TaskCompletionModal
  taskId={task.id}
  taskTitle={task.title}
  onClose={handleClose}
  onSuccess={handleSuccess}
/>
```

The modal automatically:

- Gets current user from Redux (`state.user.currentUser`)
- Uses `currentUser.id` for `completedBy` field
- Shows error if not logged in

### Admin Reviewing Completion

Only users with approval permissions can review:

```typescript
import { TaskApprovalModal } from '../Components/Library/TaskApprovalModal';
import { useSelector } from 'react-redux';
import { canApproveTaskCompletions } from '../utils/permissions';

function AdminTaskList() {
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const canApprove = currentUser && canApproveTaskCompletions(currentUser.role);

  const awaitingApproval = tasks.filter(t => t.status === 'Awaiting Approval');

  if (!canApprove) {
    return <div>You don't have permission to approve tasks.</div>;
  }

  return (
    <div>
      {awaitingApproval.map(task => (
        <TaskApprovalModal
          taskId={task.id}
          taskTitle={task.title}
          taskProperty={task.property}
          completionDate={task.completionDate!}
          completionFile={task.completionFile!}
          completedBy={task.completedBy!}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      ))}
    </div>
  );
}
```

The modal automatically:

- Checks if user has approval permissions
- Shows "Access Denied" if user can't approve
- Shows "Authentication Required" if not logged in
- Uses `currentUser.id` for `approvedBy` field

## Filtering Tasks by Role

Show different tasks based on user role:

```typescript
import { useSelector } from 'react-redux';
import { canApproveTaskCompletions } from '../utils/permissions';

function TaskDashboard() {
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  const tasks = useSelector((state: RootState) => state.propertyData.tasks);

  if (!currentUser) return null;

  const canApprove = canApproveTaskCompletions(currentUser.role);

  // Admins/Managers see tasks awaiting approval
  const tasksToReview = canApprove
    ? tasks.filter(t => t.status === 'Awaiting Approval')
    : [];

  // Regular users see their own tasks
  const myTasks = tasks.filter(t => t.completedBy === currentUser.id);

  return (
    <div>
      {canApprove && (
        <section>
          <h2>Tasks Awaiting Approval ({tasksToReview.length})</h2>
          {/* Render approval list */}
        </section>
      )}

      <section>
        <h2>My Tasks ({myTasks.length})</h2>
        {/* Render user's tasks */}
      </section>
    </div>
  );
}
```

## Testing Workflow

1. **Start as Admin** (default user)
   - Can approve all tasks
   - Can manage properties and teams

2. **Switch to Maintenance Lead**
   - Can approve tasks
   - Cannot manage properties

3. **Switch to Maintenance Technician**
   - Can submit task completions
   - Cannot approve tasks
   - Will see "Access Denied" in TaskApprovalModal

4. **Switch to Tenant**
   - Very limited access
   - Cannot approve tasks
   - Cannot manage anything

## Production Considerations

### Remove Mock User System

Before deploying to production:

1. Remove UserSwitcher component from all pages
2. Replace mock users with actual authentication
3. Update userSlice to integrate with your auth provider (Firebase Auth, Auth0, etc.)

### Keep These Files

These can remain in production:

- `constants/roles.ts`
- `utils/permissions.ts`
- Permission checks in components

### Replace Mock Logic

```typescript
// Current (Development)
const currentUser = useSelector((state: RootState) => state.user.currentUser);

// Production (with Firebase Auth)
import { useAuth } from '../hooks/useAuth';
const { user, loading } = useAuth();

if (loading) return <Loading />;
if (!user) return <Login />;

// Map Firebase user to your User type
const currentUser: User = {
  id: user.uid,
  firstName: user.displayName?.split(' ')[0] || '',
  lastName: user.displayName?.split(' ')[1] || '',
  email: user.email || '',
  role: user.customClaims?.role || USER_ROLES.TENANT,
  title: user.customClaims?.title || '',
  image: user.photoURL || undefined,
};
```

## Backward Compatibility

The userSlice maintains backward compatibility with existing code:

```typescript
// Legacy fields still work
state.user.cred.UserId;
state.user.cred.UserName;
state.user.Profile.email;
state.user.Profile.HouseHoldName;

// New fields
state.user.currentUser;
state.user.isAuthenticated;
```

All legacy actions (`setUserCred`) still work and automatically update the new fields.
