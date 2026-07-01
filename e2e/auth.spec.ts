import { test, expect } from '@playwright/test';
import {
	registerNewAccount,
	generateTestEmail,
	loginWithDemoUser,
	logout,
} from './auth.helper';

test.describe('Authentication', () => {
	test.describe('Registration Flow', () => {
		test.use({ storageState: { cookies: [], origins: [] } });

		test('user can move through registration without creating an account', async ({
			page,
		}) => {
			const testEmail = generateTestEmail();
			const testPassword = 'TestPassword123!';

			await registerNewAccount(page, testEmail, testPassword, {
				submitFinalStep: false,
			});

			await page.waitForTimeout(1000);
			expect(page.url()).not.toMatch(/dashboard/i);
			console.log('Verified registration flow without creating account');
		});
	});

	test.describe('Demo Auth Flow', () => {
		test('demo user can login and redirect to dashboard', async ({ page }) => {
			await loginWithDemoUser(page);
			await page.waitForTimeout(1500);
			expect(page.url()).toMatch(/dashboard/i);
			console.log('Demo user login redirect verified');
		});

		test('user can logout', async ({ page }) => {
			await loginWithDemoUser(page);
			await page.waitForTimeout(1500);
			expect(page.url()).toMatch(/dashboard/i);

			await logout(page);
			const finalUrl = page.url();
			expect(finalUrl).not.toMatch(/dashboard/i);
			expect(finalUrl).toMatch(/login|signin|localhost:3000\/?(#\/)?$/i);
			console.log('Demo user login redirect and logout redirect verified');
		});
	});
});
