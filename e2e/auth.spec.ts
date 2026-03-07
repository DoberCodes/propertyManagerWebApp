import { test, expect } from '@playwright/test';
import {
	registerNewAccount,
	generateTestEmail,
	loginWithDemoUser,
	logout,
} from './auth.helper';

/**
 * Authentication and registration tests
 * Tests login, registration, and logout flows
 */

test.describe('Authentication', () => {
	test('user can register a new account', async ({ page }) => {
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		await registerNewAccount(page, testEmail, testPassword, {
			submitFinalStep: false,
		});

		await page.waitForTimeout(1000);

		await expect(
			page
				.getByRole('button', {
					name: /create account|sign up|register|submit|complete|finish|done/i,
				})
				.last(),
		).toBeVisible();
		console.log('✓ Reached final registration step without creating account');
	});

	test('demo user can login and redirect to dashboard', async ({ page }) => {
		await loginWithDemoUser(page);
		await page.waitForTimeout(1500);
		expect(page.url()).toMatch(/dashboard/i);
		console.log('✓ Demo user login redirect verified');
	});

	test('user can logout', async ({ page }) => {
		// Login with demo user from env and verify redirect to dashboard
		await loginWithDemoUser(page);
		await page.waitForTimeout(1500);
		expect(page.url()).toMatch(/dashboard/i);

		// Logout and verify redirect away from dashboard
		await logout(page);
		await page.waitForTimeout(1500);
		const finalUrl = page.url();
		expect(finalUrl).not.toMatch(/dashboard/i);
		expect(finalUrl).toMatch(/login|signin|localhost:3000\/?(#\/)?$/i);
		console.log('✓ Demo user login redirect and logout redirect verified');
	});
});
