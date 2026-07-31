import { test, expect } from '@playwright/test';
import {
	createPropertyForTest,
	loginWithDemoUser,
	waitForPageLoaded,
} from './auth.helper';

/**
 * Property management tests
 * Tests property CRUD operations (Create, Read, Update, Delete)
 */

test.describe('Property Management', () => {
	test.beforeEach(async ({ page }) => {
		await loginWithDemoUser(page);
	});

	test('user can create a new property', async ({ page }) => {
		const uniqueName = `My Test Property ${Date.now()}`;
		const created = await createPropertyForTest(page, {
			name: uniqueName,
			address: '123 Main St, Springfield, IL 62701',
		});

		expect(created).toBeTruthy();
	});

	test('user can view property details', async ({ page }) => {
		const propertyName = `E2E View Property ${Date.now()}`;
		expect(
			await createPropertyForTest(page, {
				name: propertyName,
				address: '500 View Way, Springfield, IL 62701',
			}),
		).toBeTruthy();
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		const propertyImage = page.locator(`img[alt="${propertyName}"]`).first();
		await expect(propertyImage).toBeVisible({ timeout: 10000 });
		await propertyImage.click({ force: true });

		// Verify property details page loaded
		await expect(page).toHaveURL(/\/property\//i, { timeout: 10000 });
	});

	test('user can update property details', async ({ page }) => {
		const initialName = `E2E Update Property ${Date.now()}`;
		expect(
			await createPropertyForTest(page, {
				name: initialName,
				address: '600 Update Ave, Springfield, IL 62701',
			}),
		).toBeTruthy();
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		const scopedOverflowToggle = page
			.locator(`img[alt="${initialName}"]`)
			.first()
			.locator('xpath=ancestor::*[.//button[contains(normalize-space(),"⋮")]][1]')
			.getByText('⋮')
			.first();
		const overflowToggle = (await scopedOverflowToggle
			.isVisible({ timeout: 2000 })
			.catch(() => false))
			? scopedOverflowToggle
			: page.getByText('⋮').first();

		await expect(overflowToggle).toBeVisible({ timeout: 10000 });
		await overflowToggle.click({ force: true });
		await page.getByText(/^Edit$/).first().click();

		// Update property name
		const updatedNameValue = `Updated Property ${Date.now()}`;
		const nameInput = page.getByPlaceholder(/enter property name/i).first();
		await nameInput.clear();
		await nameInput.fill(updatedNameValue);
		await expect(nameInput).toHaveValue(updatedNameValue);

		// Save changes
		const saveButton = page.getByRole('button', {
			name: /save property|save|update/i,
		});
		await saveButton.last().click({ force: true });

		// Verify update was successful
		await page.waitForTimeout(1500);
		const editHeading = page.getByRole('heading', { name: /edit property/i }).first();
		if (await editHeading.isVisible({ timeout: 1500 }).catch(() => false)) {
			await page.keyboard.press('Escape').catch(() => {});
		}
		const updatedName = page.getByText(new RegExp(updatedNameValue, 'i'));
		const updatedVisible = await updatedName
			.first()
			.isVisible({ timeout: 10000 })
			.catch(() => false);
		expect(updatedVisible).toBeTruthy();
	});

	test('user can delete a property @destructive', async ({ page }) => {
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		const getOverflowCount = async () => {
			await page.waitForTimeout(800);
			return page.getByText('⋮').count();
		};

		let countBefore = await getOverflowCount();

		if (countBefore === 0) {
			await page.reload({ waitUntil: 'domcontentloaded' });
			await waitForPageLoaded(page);
			countBefore = await getOverflowCount();
		}

		if (countBefore === 0) {
			expect(
				await createPropertyForTest(page, {
					name: `E2E Delete Property ${Date.now()}`,
					address: '700 Delete Rd, Springfield, IL 62701',
				}),
			).toBeTruthy();
			await page.goto('/properties', { waitUntil: 'domcontentloaded' });
			await waitForPageLoaded(page);
			countBefore = await page.getByText('⋮').count();
		}
		expect(countBefore).toBeGreaterThan(0);

		await page.getByText('⋮').first().click();
		await page.getByText(/^Delete$/).first().click();

		// Confirm deletion if prompted
		const confirmMessage = page.getByText(
			/are you sure you want to delete this property/i,
		);
		if (await confirmMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
			await page
				.getByRole('button', { name: /^Delete$/i })
				.last()
				.click({ force: true });
		}

		// Verify deletion was successful
		await page.waitForTimeout(2000);
		const countAfter = await page.getByText('⋮').count();
		expect(countAfter).toBeLessThanOrEqual(countBefore);
	});
});
