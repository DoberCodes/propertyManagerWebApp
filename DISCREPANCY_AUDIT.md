# Firebase vs App Discrepancy Audit

## Critical Issues Found

### 1. **Task Interface Mismatch** ⚠️ CRITICAL

**Firebase (apiSlice.ts):**

```typescript
export interface Task {
	id: string;
	propertyId: string;
	suiteId?: string;
	unitId?: string;
	devices?: string[]; // Array of device IDs
	title: string;
	dueDate: string;
	status:
		| 'Pending'
		| 'In Progress'
		| 'Awaiting Approval'
		| 'Completed'
		| 'Rejected';
	property: string;
	notes?: string;
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectionReason?: string;
	createdAt?: string;
	updatedAt?: string;
}
```

**Redux Slice (propertyDataSlice.tsx):**

```typescript
export interface Task {
	id: number; // ❌ Number vs String
	title: string;
	dueDate: string;
	status:
		| 'Pending'
		| 'In Progress'
		| 'Awaiting Approval'
		| 'Completed'
		| 'Rejected';
	property: string;
	unit?: string; // ❌ Not in Firebase
	suite?: string; // ❌ Not in Firebase
	notes?: string;
	assignee?: string; // ❌ Not in Firebase
	completionDate?: string;
	completionFile?: CompletionFile;
	completedBy?: string;
	approvedBy?: string;
	approvedAt?: string;
	rejectionReason?: string;
	// ❌ Missing: propertyId, suiteId, unitId, devices
}
```

**Discrepancies:**

- ID: `number` (Redux) vs `string` (Firebase)
- Missing propertyId field in Redux version
- `unit` and `suite` as strings instead of using `unitId`/`suiteId`
- `assignee` field in Redux not in Firebase
- `devices` field structure different

---

### 2. **Property/Unit/Suite - Devices Handling** ⚠️ CRITICAL

**Firebase (apiSlice.ts):**

```typescript
units?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>
suites?: Array<{ name: string; occupants?: any[]; deviceIds?: string[] }>
deviceIds?: string[]  // Property-level device IDs
```

**Redux Slice (propertyDataSlice.tsx):**

```typescript
export interface Unit {
	name: string;
	tenants?: Tenant[]; // ❌ Not occupants
	devices?: any[]; // ❌ Full objects, not IDs
	notes?: string;
}

export interface Suite {
	name: string;
	tenants?: Tenant[]; // ❌ Not occupants
	devices?: any[]; // ❌ Full objects, not IDs
	notes?: string;
}
```

**Components (PropertyDialog.tsx):**

```typescript
interface Device {
	id: number; // ❌ Number vs String
	type: string;
	brand: string;
	model: string;
	installationDate: string;
	warrantyFile?: string;
	unit?: string;
}
```

**Discrepancies:**

- Redux stores full device objects, Firebase should store only IDs
- Device IDs: `number` (components) vs `string` (Firebase)
- Field names: `tenants` (Redux) vs `occupants` (Firebase)

---

### 3. **TeamMember - Multiple Issues** ⚠️ MEDIUM

**Firebase (apiSlice.ts):**

```typescript
export interface TeamMember {
	id: string;
	groupId: string;
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: string[];
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
	createdAt?: string;
	updatedAt?: string;
}
```

**Redux Slice (teamSlice.tsx):**

```typescript
export interface TeamMember {
	id: number; // ❌ Number vs String
	firstName: string;
	lastName: string;
	title: string;
	email: string;
	phone: string;
	role: string;
	address: string;
	image?: string;
	notes: string;
	linkedProperties: number[]; // ❌ Number vs String
	taskHistory: Array<{ date: string; task: string }>;
	files: Array<{ name: string; id: string }>;
	// ❌ Missing: groupId, createdAt, updatedAt
}
```

**Discrepancies:**

- ID: `number` (Redux) vs `string` (Firebase)
- `linkedProperties`: `number[]` (Redux) vs `string[]` (Firebase)
- Missing `groupId`, `createdAt`, `updatedAt` in Redux

---

### 4. **TeamGroup - ID Type Mismatch** ⚠️ MEDIUM

**Firebase (apiSlice.ts):**

```typescript
export interface TeamGroup {
	id: string;
	userId: string;
	name: string;
	linkedProperties: string[];
	members?: TeamMember[];
	createdAt?: string;
	updatedAt?: string;
}
```

**Redux Slice (teamSlice.tsx):**

```typescript
export interface TeamGroup {
	id: number; // ❌ Number vs String
	name: string;
	linkedProperties: number[]; // ❌ Number vs String
	members: TeamMember[];
	// ❌ Missing: userId, createdAt, updatedAt
}
```

**Discrepancies:**

- ID: `number` (Redux) vs `string` (Firebase)
- `linkedProperties`: `number[]` (Redux) vs `string[]` (Firebase)
- Missing `userId`, `createdAt`, `updatedAt` fields

---

### 5. **PropertyGroup - ID Type & Structure Mismatch** ⚠️ MEDIUM

**Firebase (apiSlice.ts):**

```typescript
export interface PropertyGroup {
	id: string;
	userId: string;
	name: string;
	properties?: Property[];
	createdAt?: string;
	updatedAt?: string;
}
```

**Redux Slice (propertyDataSlice.tsx):**

```typescript
export interface PropertyGroup {
	id: number; // ❌ Number vs String
	name: string;
	properties: Property[];
	// ❌ Missing: userId, createdAt, updatedAt
}
```

**Discrepancies:**

- ID: `number` (Redux) vs `string` (Firebase)
- Missing `userId`, `createdAt`, `updatedAt` in Redux

---

### 6. **Property - Missing Fields in Redux** ⚠️ MEDIUM

**Firebase (apiSlice.ts):**

```typescript
deviceIds?: string[]  // Device IDs for property-level devices
```

**Redux Slice (propertyDataSlice.tsx):**

```typescript
devices?: any[]  // Full device objects
```

**Additional Redux field not in Firebase:**

```typescript
tenants?: Tenant[]  // ❌ Not in Firebase
```

---

### 7. **Tenant Interface - Not in Firebase** ⚠️ LOW

**Only in Redux (propertyDataSlice.tsx):**

```typescript
export interface Tenant {
	id: number;
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	unit?: string;
	leaseStart?: string;
	leaseEnd?: string;
}
```

**Status:** Not documented in Firebase structure. Unclear if this should be:

- A separate collection
- Part of occupants array in units/suites
- Removed entirely

---

## Summary Table

| Interface     | Location               | Issue                                      | Severity |
| ------------- | ---------------------- | ------------------------------------------ | -------- |
| Task          | Redux vs Firebase      | ID type, field mismatch                    | CRITICAL |
| Device        | Components vs Firebase | ID type, structure                         | CRITICAL |
| Unit/Suite    | Redux vs Firebase      | devices vs deviceIds, tenants vs occupants | CRITICAL |
| TeamMember    | Redux vs Firebase      | ID types, missing fields                   | MEDIUM   |
| TeamGroup     | Redux vs Firebase      | ID types, missing fields                   | MEDIUM   |
| PropertyGroup | Redux vs Firebase      | ID types, missing fields                   | MEDIUM   |
| Property      | Redux vs Firebase      | devices vs deviceIds, extra tenants field  | MEDIUM   |
| Tenant        | Redux only             | Not in Firebase                            | LOW      |

---

## Action Items (Recommended Order)

### CRITICAL - Must Fix

1. [ ] **Unify ID Types**: All IDs should be `string` (Firebase) throughout app
   - Convert Redux slices to use string IDs
   - Update all components using numeric IDs

2. [ ] **Fix Task Interface**:
   - Update Redux Task to match Firebase structure
   - Add `propertyId` field
   - Use `unitId`/`suiteId` instead of `unit`/`suite` string fields
   - Remove `assignee` or document it

3. [ ] **Fix Device References**:
   - Update Property/Unit/Suite to store `deviceIds` only
   - Fetch full Device objects when needed
   - Update PropertyDialog to use Firebase device structure

### MEDIUM - Should Fix

4. [ ] **Add Missing Timestamps**: Add `createdAt` and `updatedAt` to Redux slices

5. [ ] **Add Missing IDs**: Add `groupId` and `userId` to Redux TeamMember/TeamGroup

6. [ ] **Standardize Field Names**: Use `occupants` instead of `tenants` in Property interface

### LOW - Can Address Later

7. [ ] **Clarify Tenant Model**: Decide if Tenant should be a separate collection or removed

---

## Notes

- Mock authentication will remain unchanged
- Redux mock data will be cleaned up as Firebase migration progresses
- Components are still reading from Redux, not Firebase (future migration phase)
