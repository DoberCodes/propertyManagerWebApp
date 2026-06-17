# Playwright End-to-End Testing Guide

This document explains how to set up, configure, and run Playwright end-to-end (E2E) tests for the Maintley property manager application.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Project Structure](#project-structure)
4. [Test Files](#test-files)
5. [Running Tests](#running-tests)
6. [Test Credentials](#test-credentials)
7. [Environment Variables](#environment-variables)
8. [Writing New Tests](#writing-new-tests)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Installation

Playwright has already been installed as a dev dependency. To verify installation:

```bash
yarn list @playwright/test
```

If you need to reinstall or update:

```bash
yarn add -D @playwright/test
```

## Configuration

The Playwright configuration is defined in `playwright.config.ts` at the root of the project.

### Key Configuration Details

- **Base URL**: `http://localhost:3000` (Your local React dev server)
- **Test Directory**: `./e2e` (Where all E2E test files are located)
- **Timeout**: 30 seconds per test action
- **Retry**: 0 retries locally, 2 retries on CI
- **Parallel Execution**: Tests run in parallel by default
- **Output Folder**: `./test-results` (Test reports and artifacts)
- **Report**: HTML report generated after test runs

### Configured Browsers

The tests run on multiple browser types:

- **Chromium** (Desktop)
- **Firefox** (Desktop)
- **WebKit** (Safari-like)
- **Mobile Chrome** (Pixel 5 viewport)
- **Mobile Safari** (iPhone 12 viewport)

### Web Server

Playwright automatically starts your React dev server before running tests:

```typescript
webServer: {
  command: 'yarn start',
  url: 'http://localhost:3000',
  reuseExistingServer: !process.env.CI,
}
```

**Note**: If your dev server is already running, Playwright will reuse it (local development). In CI, it spins up a fresh server.

## Project Structure

```
e2e/
├── auth.helper.ts           # Authentication utility functions
├── auth.spec.ts             # Login, registration, logout tests
├── property.spec.ts         # Property CRUD tests
├── task.spec.ts             # Task CRUD tests
├── payment.spec.ts          # Payment and subscription tests
└── journey.spec.ts          # Full user journey tests
```

## Test Files

### auth.spec.ts

Tests authentication flows:

- User login with valid credentials
- Error handling for invalid credentials
- User logout
- Protection of authenticated routes

### property.spec.ts

Tests property management:

- Create a new property
- View property details
- Update property information
- Delete a property

### task.spec.ts

Tests task management:

- Create a new task
- View task details
- Update task status and details
- Mark task as completed
- Delete a task
- Filter tasks by status

### payment.spec.ts

Tests payment and subscription flows:

- View subscription/billing page
- Initiate subscription with valid Stripe test card
- Error handling with invalid cards
- View subscription status
- Update payment methods

**⚠️ Important**: Payment tests use Stripe test cards. These tests should only run against a test/development environment with test Stripe keys.

### journey.spec.ts

Complete user journey test:

- Login
- Create a property
- Create a task linked to the property
- Mark task as complete

This test validates the full workflow end-to-end.

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
yarn e2e

# Run tests in UI mode (interactive dashboard)
yarn e2e:ui

# Run tests in debug mode (step through with debugger)
yarn e2e:debug

# Run tests in specific browser
yarn e2e:chrome
yarn e2e:firefox
yarn e2e:webkit

# View test report after run
yarn e2e:report
```

### Running Specific Tests

```bash
# Run tests in a specific file
yarn e2e e2e/auth.spec.ts

# Run tests matching a pattern
yarn e2e --grep "user can login"

# Run a single test
yarn e2e --grep "user can create a new property"
```

### CI/Pipeline Execution

In your CI pipeline, run:

```bash
yarn e2e
```

For headless CI environments:

```bash
CI=true yarn e2e
```

## Test Credentials

Tests need valid user credentials to authenticate. By default, the tests look for credentials via environment variables (see [Environment Variables](#environment-variables)).

### Setting Up Test Accounts

1. Create a test user account in your Firebase project
2. Store credentials securely (see environment variables section)
3. Use the same account across all test runs (persists test data)

### Stripe Test Cards

For payment tests, use Stripe's test card numbers:

- **Valid card**: `4242 4242 4242 4242`
- **Card declined**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`

Any future expiration date and any 3-digit CVC can be used.

## Environment Variables

### Setting Up Environment Variables

Create a `.env.local` file in the project root (this file is gitignored):

```env
TEST_USER_EMAIL=test@maintley.com
TEST_USER_PASSWORD=TestPassword123!
STRIPE_TEST_KEY=pk_test_your_key_here
```

### GitHub Actions

Add secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Create new repository secrets:
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`

Then reference in your workflow:

```yaml
- name: Run E2E Tests
  run: yarn e2e
  env:
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
```

## Writing New Tests

### Test File Template

```typescript
import { test, expect } from '@playwright/test';
import { login } from './auth.helper';

test.describe('Feature Name', () => {
	test.beforeEach(async ({ page }) => {
		// Login before each test
		const testEmail = process.env.TEST_USER_EMAIL || 'test@maintley.com';
		const testPassword = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
		await login(page, testEmail, testPassword);
	});

	test('user can do something', async ({ page }) => {
		// Navigate
		await page.goto('/some-page');
		await page.waitForLoadState('networkidle');

		// Interact
		const button = page.getByRole('button', { name: /action/i });
		await button.click();

		// Assert
		const result = page.getByText(/success/i);
		await expect(result).toBeVisible();
	});
});
```

### Common Selectors

Use these Playwright locator strategies (in order of preference):

```typescript
// By accessible role (most reliable)
page.getByRole('button', { name: /Submit/i });
page.getByRole('heading', { name: /Dashboard/i });

// By label text
page.getByLabel('Email');

// By placeholder
page.getByPlaceholder('Enter email');

// By alt text (for images)
page.getByAltText('Logo');

// By text content
page.getByText(/Welcome/);

// By test ID (data-testid attributes)
page.getByTestId('submit-button');

// CSS selectors (least preferred)
page.locator('input[name="email"]');
```

### Waiting Strategies

```typescript
// Wait for page load
await page.waitForLoadState('networkidle');

// Wait for specific selector
await page.waitForSelector('button[type="submit"]');

// Wait for URL change
await page.waitForURL('/dashboard');

// Wait for visibility
await expect(element).toBeVisible();

// Custom wait
await page.waitForTimeout(2000);
```

### Handling Different States

```typescript
// Check visibility before action
if (await element.isVisible()) {
	await element.click();
}

// Wait with timeout
await element.isVisible({ timeout: 5000 });

// Handle optional elements
const optionalElement = page.locator('selector');
if (await optionalElement.isVisible().catch(() => false)) {
	await optionalElement.click();
}
```

## Best Practices

### 1. Use Authentication Helper

Always use the `login()` helper for authenticated tests:

```typescript
import { login } from './auth.helper';

test('logged in test', async ({ page }) => {
	await login(page, email, password);
	// Your test here
});
```

### 2. Wait for Page Load

Always wait for page load before interacting:

```typescript
await page.goto('/properties');
await page.waitForLoadState('networkidle');
```

### 3. Prefer User-Centric Selectors

❌ Avoid:

```typescript
page.locator('.button-class-123');
page.locator('#id-generated-by-build');
```

✅ Prefer:

```typescript
page.getByRole('button', { name: /Create/i });
page.getByLabel('Email Address');
page.getByPlaceholder('Enter your name');
```

### 4. Use Descriptive Test Names

❌ Bad:

```typescript
test('test 1', async ({ page }) => { ... })
```

✅ Good:

```typescript
test('user can create a new property with valid address', async ({ page }) => { ... })
```

### 5. One Action Per Test (Mostly)

Each test should focus on one specific behavior:

```typescript
test('user can create a property', async ({ page }) => {
	// Single action: create property
});

test('user can update a property', async ({ page }) => {
	// Single action: update property
});
```

### 6. Clean Up After Tests

Delete test data or use isolated test accounts:

```typescript
test.afterEach(async ({ page }) => {
	// Clean up test data
	await deleteTestProperty();
});
```

### 7. Make Tests Independent

Tests should not depend on execution order. Don't rely on previous test data.

## Troubleshooting

### Test Fails: "Timeout waiting for selector"

**Cause**: Element takes too long to appear or doesn't exist.

**Solution**:

```typescript
// Increase timeout
await page.waitForSelector('button', { timeout: 10000 });

// Check if element exists
const element = page.locator('button');
if (await element.isVisible().catch(() => false)) {
	// Element exists
}
```

### Test Fails: "Navigation timeout"

**Cause**: Page takes too long to load.

**Solution**:

```typescript
// Increase navigation timeout
await page.goto('/page', {
	waitUntil: 'domcontentloaded',
	timeout: 30000,
});

// Use different wait strategy
await page.waitForLoadState('domcontentloaded');
```

### Tests Fail on CI but Pass Locally

**Cause**: CI environment differences (slower, different dependencies).

**Solution**:

```typescript
// Increase waits for CI
const isCI = process.env.CI === 'true';
const timeout = isCI ? 10000 : 5000;
await page.waitForSelector('button', { timeout });
```

### Payment Tests Not Working

**Cause**:

- Using live Stripe keys (need test keys)
- Test card declined in test mode

**Solution**:

1. Verify Stripe is in test mode
2. Use valid Stripe test card numbers
3. Check that test credentials work manually first

### "Chromium" Failed to Launch

**Cause**: Browser binaries not installed.

**Solution**:

```bash
yarn playwright install chromium
# Or install all browsers
yarn playwright install
```

### Port 3000 Already in Use

**Cause**: Dev server already running or port conflict.

**Solution**:

```bash
# Kill existing process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

## Debugging Tests

### UI Mode (Recommended)

```bash
yarn e2e:ui
```

Interactive dashboard where you can:

- Watch tests run step-by-step
- Click through to any point in execution
- Inspect DOM at any step
- See network activity

### Debug Mode

```bash
yarn e2e:debug
```

Launches Playwright Inspector where you can:

- Step through code
- Set breakpoints
- Evaluate expressions
- Inspect selectors

### Add a Debugger

```typescript
test('debug this test', async ({ page }) => {
	await page.goto('/');
	await page.pause(); // Execution pauses here
	// Use debugger in Inspector
});
```

### View HTML at Failure Point

```typescript
test('debugging HTML', async ({ page }) => {
	try {
		await page.click('button[not-found]');
	} catch (error) {
		console.log(await page.content()); // Print current HTML
		throw error;
	}
});
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Resources

- [Playwright Official Docs](https://playwright.dev)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Selectors Guide](https://playwright.dev/docs/locators)
- [Debugging Guide](https://playwright.dev/docs/debug)

## Questions or Issues?

If you encounter issues with tests:

1. Check this document's Troubleshooting section
2. Run tests in UI mode: `yarn e2e:ui`
3. Check test output for detailed error messages
4. Review Playwright documentation
5. Check if test credentials are valid
6. Ensure dev server is running and accessible
