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
		// Homeowner accounts with one property intentionally skip the collection
		// view and open that property's record directly. Wait for either stable
		// outcome instead of racing the redirect.
		const propertyImage = page.locator(`img[alt="${homeName}"]`).first();
		const propertyHeading = page.getByRole('heading', {
			name: homeName,
			exact: true,
		});
		await expect(propertyHeading.or(propertyImage)).toBeVisible({ timeout: 30000 });
		if (await propertyImage.isVisible()) {
			await propertyImage.click({ force: true });
		}
		await expect(propertyHeading).toBeVisible({ timeout: 30000 });
		await expect(page).toHaveURL(/\/property\//i);

		const spacesRegion = page.getByRole('region', { name: /^Spaces$/i });
		if (!(await spacesRegion.isVisible({ timeout: 3000 }).catch(() => false))) {
			await page.getByRole('button', { name: /^Details$/i }).first().click();
		}
		await expect(spacesRegion).toBeVisible({ timeout: 30000 });

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

		await page.getByRole('button', { name: /open profile menu/i }).click();
		await page.getByRole('link', { name: /view profile/i }).click();
		await expect(page).toHaveURL(/\/profile$/i);
		const trialEnabled =
			process.env.REACT_APP_ENABLE_HOMEOWNER_PLUS_PRODUCT_TRIAL === 'true' &&
			process.env.REACT_APP_ENABLE_INTERNAL_ENTITLEMENT_GRANT_ISSUANCE === 'true';
		const expectedAccessLabel = trialEnabled
			? /^effective access:\s*homeowner\+$/i
			: /^plan:\s*free$/i;
		const expectedCapacityLabel = trialEnabled
			? /4 property slots available/i
			: /0 home slots available/i;
		await expect(page.getByText(expectedAccessLabel)).toBeVisible({
			timeout: trialEnabled ? 60000 : 30000,
		});
		await expect(
			page.getByText(expectedCapacityLabel).filter({ visible: true }),
		).toBeVisible();
	});
});
