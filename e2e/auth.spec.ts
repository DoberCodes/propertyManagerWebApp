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

			await expect(page).not.toHaveURL(/dashboard/i);
			console.log('Verified registration flow without creating account');
		});
	});

	test.describe('Demo Auth Flow', () => {
		test('demo user can login and redirect to dashboard', async ({ page }) => {
			await loginWithDemoUser(page);
			await expect(page).toHaveURL(/dashboard/i);
			console.log('Demo user login redirect verified');
		});

		test('user can logout', async ({ page }) => {
			await loginWithDemoUser(page);
			await expect(page).toHaveURL(/dashboard/i);

			await logout(page);
			await expect(page).not.toHaveURL(/dashboard/i);
			await expect(page).toHaveURL(/login|signin|localhost:3000\/?$/i);
			console.log('Demo user login redirect and logout redirect verified');
		});
	});
});
