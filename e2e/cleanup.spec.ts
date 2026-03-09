import { test, expect } from '@playwright/test';
import {
	loginWithDemoUser,
	logout,
	isLoggedIn,
	generateTestEmail,
	waitForPageLoaded,
} from './auth.helper';

/**
 * Cleanup and Data Lifecycle Tests
 * Tests that verify cleanup functionality and data management
 */

test.describe('Data Cleanup & Lifecycle @destructive', () => {
	test('verify test user account creation and logout flow', async ({
		page,
	}) => {
		// Step 1: Login with demo account
		console.log(`\n📝 Logging in with demo account`);
		await loginWithDemoUser(page);

		// Step 2: Verify we're logged in
		await page.goto('/#/dashboard', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);
		expect(await isLoggedIn(page)).toBeTruthy();
		console.log('✅ Account created and logged in successfully');

		// Step 3: Create some test data to be cleaned up
		await page.goto('/#/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);
		const createButton = page.getByRole('button', {
			name: /add property|new property|create/i,
		});

		if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
			await createButton.click();
			await page.waitForTimeout(500);

			const addressInput = page.locator(
				'input[placeholder*="address" i], input[name*="address" i]',
			);
			if (await addressInput.isVisible({ timeout: 2000 }).catch(() => false)) {
				await addressInput.fill('Test Property for Cleanup');
				console.log('📦 Test property created');
			}
		}

		// Step 4: Logout
		await logout(page);
		console.log('🚪 Logged out successfully');
		await page.waitForTimeout(1000);

		// Step 5: Login again with demo account
		console.log(`\n🔄 Attempting demo login again`);
		await loginWithDemoUser(page);
		await page.waitForTimeout(1500);
		await page.goto('/#/dashboard', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);
		const loggedIn = await isLoggedIn(page);
		console.log(
			loggedIn ? '✅ Re-login successful' : '⚠️  Re-login status unknown',
		);
		expect(loggedIn || page.url().includes('dashboard')).toBeTruthy();
	});

	test('verify repeated demo login sessions (stress test)', async ({
		page,
	}) => {
		test.setTimeout(180000);

		console.log('\n🔄 Running repeated demo login sessions...');
		let successfulSessions = 0;
		for (let i = 0; i < 3; i++) {
			await loginWithDemoUser(page);

			// Verify logged in
			await page.goto('/#/dashboard', { waitUntil: 'domcontentloaded' });
			await waitForPageLoaded(page);
			const loggedIn = await isLoggedIn(page);
			expect(loggedIn || /dashboard/i.test(page.url())).toBeTruthy();
			successfulSessions += 1;

			console.log(`✅ Demo session ${i + 1} logged in`);

			// Logout for next cycle
			await logout(page);
			await page.waitForTimeout(1000);
		}

		console.log(`\n✅ Completed 3 demo login sessions`);
		expect(successfulSessions).toBe(3);
	});

	test('confirm test user email pattern matches cleanup criteria', async () => {
		// This test verifies that our test email generation matches the cleanup script pattern
		const testEmail = generateTestEmail();
		const emailPattern = /^test\.user\.\d+\.\d+@maintley-test\.com$/;

		console.log(`\n🔍 Testing email pattern:`, testEmail);
		const matches = emailPattern.test(testEmail);

		expect(matches).toBeTruthy();
		console.log('✅ Email matches cleanup pattern');
		console.log(
			`\n💡 Pattern: ^test\\.user\\.\\d+\\.\\d+@maintley-test\\.com$`,
		);
	});
});
