import { expect, test } from '@playwright/test';
import {
	generateTestEmail,
	isLoggedIn,
	login,
	registerNewAccount,
	waitForPageLoaded,
} from './auth.helper';

test.describe('First owner value', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('a new owner creates a complete home profile with generated Spaces', async ({
		page,
	}) => {
		const email = generateTestEmail();
		const password = 'TestPassword123!';
		const homeName = `Activation Home ${Date.now()}`;

		await registerNewAccount(page, email, password);
		if (!(await isLoggedIn(page))) await login(page, email, password);
		expect(await isLoggedIn(page)).toBeTruthy();

		const onboardingStartButton = page.getByRole('button', {
			name: /^Add My Home$/i,
		});
		await expect(onboardingStartButton).toBeVisible({ timeout: 30000 });
		await onboardingStartButton.click();

		await expect(page.getByText('Home Basics', { exact: true })).toBeVisible();
		await page.getByPlaceholder(/enter home name/i).fill(homeName);
		await page.getByPlaceholder('Enter address').fill('101 Activation Way, Columbus, OH 43004');
		await page.getByRole('button', { name: /^Next$/ }).click();

		await expect(page.getByText('Home Details', { exact: true })).toBeVisible();
		await page.locator('#property-bedroom-count').fill('2');
		await page.locator('#property-bathroom-count').fill('1.5');
		await page.getByRole('button', { name: /^Save Home$/ }).click();

		await expect(
			page.getByRole('heading', { name: /your maintenance record is ready/i }),
		).toBeVisible({ timeout: 30000 });
		await page.getByRole('button', { name: /go to today/i }).click();

		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page, 30000);
		const propertyImage = page.locator(`img[alt="${homeName}"]`).first();
		await expect(propertyImage).toBeVisible({ timeout: 30000 });
		await propertyImage.click({ force: true });
		await expect(page).toHaveURL(/\/property\//i);

		const detailsTab = page.getByRole('button', { name: /^Details$/i }).first();
		if (await detailsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
			await detailsTab.click();
		}

		for (const spaceName of [
			'Bedroom 1',
			'Bedroom 2',
			'Bathroom 1',
			'Half Bathroom 1',
		]) {
			await expect(page.getByText(spaceName, { exact: true })).toHaveCount(1, {
				timeout: 30000,
			});
		}
		await expect(page.getByText('No active Spaces')).toHaveCount(0);

		await page.goto('/profile', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page, 30000);
		await expect(page.getByText(/effective access:\s*homeowner\+/i)).toBeVisible({
			timeout: 30000,
		});
	});
});
