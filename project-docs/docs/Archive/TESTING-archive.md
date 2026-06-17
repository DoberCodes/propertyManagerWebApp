# Unit Testing Documentation

## Test Coverage Goal: 70%

### ✨ Current Status

**Total:** 156 passing tests across 12 test suites  
**Framework:** Jest 27.x + React Testing Library 14.x

#### Coverage by Category

| Category         | Statements | Branches | Functions | Lines   | Tests      |
| ---------------- | ---------- | -------- | --------- | ------- | ---------- |
| **Redux Slices** | 65.48%     | 65.78%   | 64.70%    | 66.66%  | 67 ✅      |
| **Constants**    | 100%       | 100%     | 100%      | 100%    | Covered ✅ |
| **Utils**        | 29.57%     | 21.39%   | 31.31%    | 30.60%  | 71 ⚠️      |
| **Library**      | Partial    | Partial  | Partial   | Partial | 18 🚧      |
| **Overall**      | 5.35%      | 3.71%    | 6.38%     | 5.29%   | 156 🚧     |

### Current Test Suite

#### ✅ Redux State Management (67 tests)

- **userSlice.test.ts** (15 tests) - User authentication state
- **navigationSlice.test.ts** (13 tests) - Tab selection & sidebar
- **teamSlice.test.ts** (26 tests) - Team & member CRUD
- **maintenanceRequestsSlice.test.ts** (24 tests) - Request lifecycle

#### ✅ Utilities (71 tests - Improving Coverage)

- **permissions.test.ts** (21 tests) - Permission checking functions
- **platform.test.ts** (9 tests) - Platform detection utilities
- **base64Upload.test.ts** (12 tests) - File upload utilities
- **csvExport.test.ts** (11 tests) - CSV export functionality
- **dataFilters.test.ts** (8 tests) - Data filtering logic
- **detailPageUtils.test.ts** (18 tests) - Detail page utilities

#### ✅ Library Components (18 tests - Initial Coverage)

- **ButtonGroup.test.tsx** (9 tests) - Reusable button group component
- **ZeroState.test.tsx** (9 tests) - Empty state component

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests without watch mode
npm test -- --coverage --watchAll=false

# Run specific test file
npm test -- permissions.test.ts

# Run tests matching pattern
npm test -- --testPathPattern="utils"
```

### Test Structure

Each test file follows this structure:

```typescript
describe('Component/Module Name', () => {
	describe('Function/Feature Name', () => {
		it('should behave correctly in scenario', () => {
			// Arrange
			// Act
			// Assert
		});
	});
});
```

### Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Test edge cases and error handling**
6. **Aim for high coverage of critical paths**

### Coverage Goals by Category

- **Utils**: 80%+ (Pure functions, easy to test)
- **Components**: 70%+ (UI components)
- **Redux**: 80%+ (State management)
- **Hooks**: 60%+ (Custom hooks)
- **Pages**: 40%+ (Complex integration)

### Next Steps

To reach 70% coverage:

1. ✅ Utility functions (completed)
2. ✅ Redux slices (in progress)
3. ⏳ More library components
4. ⏳ Custom hooks
5. ⏳ Integration tests for critical flows
