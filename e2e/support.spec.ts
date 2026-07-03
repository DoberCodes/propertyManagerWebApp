import { test, expect } from '@playwright/test';
import { loginWithDemoUser, waitForPageLoaded } from './auth.helper';

test.describe('Support center smoke', () => {
	test.beforeEach(async ({ page }) => {
		await loginWithDemoUser(page);
	});

	test('user can view support requests and open a new request without submitting', async ({
		page,
	}) => {
		await page.goto('/#/support?view=requests', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		await expect(page.getByText('Maintley Support')).toBeVisible();
		await expect(page.getByRole('button', { name: /my requests/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /new request/i })).toBeVisible();
		await expect(page.getByText(/we could not load your requests/i)).not.toBeVisible();

		await page.getByRole('button', { name: /new request/i }).click();
		await expect(page.getByRole('heading', { name: /new support request/i })).toBeVisible();

		await page.getByTitle(/close modal/i).click();
		await expect(page.getByRole('heading', { name: /new support request/i })).not.toBeVisible();
	});
});
