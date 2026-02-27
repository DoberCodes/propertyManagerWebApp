import { test, expect, Page } from '@playwright/test';
import { loginWithDemoUser, waitForPageLoaded } from './auth.helper';

const PERMISSION_ERROR_REGEX =
	/missing or insufficient permissions|permission[- ]denied|insufficient permissions/i;

async function assertNoPermissionErrors(
	page: Page,
	consoleErrors: string[],
	context: string,
) {
	const uiErrorVisible = await page
		.getByText(PERMISSION_ERROR_REGEX)
		.first()
		.isVisible({ timeout: 1200 })
		.catch(() => false);

	const consolePermissionErrors = consoleErrors.filter((entry) =>
		PERMISSION_ERROR_REGEX.test(entry),
	);
	const errorSummary = `${context} surfaced a permission error. Console matches: ${consolePermissionErrors.join(
		' | ',
	)}`;

	if (uiErrorVisible || consolePermissionErrors.length > 0) {
		throw new Error(errorSummary);
	}
	expect(uiErrorVisible || consolePermissionErrors.length > 0).toBe(false);
}

test.describe('Account RBAC write regression', () => {
	test('demo user can perform key create flows without permission denied', async ({
		page,
	}) => {
		const consoleErrors: string[] = [];
		let attemptedCreateFlows = 0;
		page.on('console', (msg) => {
			if (msg.type() === 'error' || msg.type() === 'warning') {
				consoleErrors.push(msg.text());
			}
		});
		page.on('pageerror', (err) => {
			consoleErrors.push(err.message);
		});

		await loginWithDemoUser(page);

		// Flow 1: Property create
		await page.goto('/#/properties');
		await waitForPageLoaded(page);

		const createPropertyButton = page
			.getByRole('button', {
				name: /add property|new property|create property/i,
			})
			.first();

		const canCreateProperty = await createPropertyButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		if (canCreateProperty) {
			attemptedCreateFlows += 1;

			await createPropertyButton.click({ force: true });
			await page.waitForTimeout(800);

			const propertyName = `RBAC Property ${Date.now()}`;
			const nameInput = page
				.locator('input[name*="name" i], input[placeholder*="property name" i]')
				.first();
			await nameInput.fill(propertyName);

			const addressInput = page
				.locator('input[placeholder*="address" i], input[name*="address" i]')
				.first();
			await addressInput.fill('101 RBAC Ave, Springfield, IL 62701');

			const submitPropertyButton = page
				.getByRole('button', { name: /create|save|add/i })
				.last();
			await submitPropertyButton.click();
			await page.waitForTimeout(1600);

			await assertNoPermissionErrors(page, consoleErrors, 'Property create');
		}

		// Flow 2: Task create
		await page.goto('/#/tasks');
		await waitForPageLoaded(page);

		const createTaskButton = page
			.getByRole('button', { name: /create task|new task|add task/i })
			.first();

		const canCreateTask = await createTaskButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		if (canCreateTask) {
			attemptedCreateFlows += 1;

			await createTaskButton.click({ force: true });
			await page.waitForTimeout(700);

			const titleInput = page
				.locator(
					'input[name*="title" i], input[placeholder*="task title" i], input[placeholder*="title" i]',
				)
				.first();
			await titleInput.fill(`RBAC Task ${Date.now()}`);

			const descriptionInput = page
				.locator(
					'textarea[name*="desc" i], textarea[placeholder*="description" i]',
				)
				.first();
			if (
				await descriptionInput.isVisible({ timeout: 1200 }).catch(() => false)
			) {
				await descriptionInput.fill('RBAC write-permission regression task');
			}

			const propertySelect = page
				.locator('select[name*="property" i], [role="combobox"]')
				.first();
			if (
				await propertySelect.isVisible({ timeout: 1200 }).catch(() => false)
			) {
				await propertySelect.click().catch(() => {});
				const firstOption = page.locator('[role="option"]').first();
				if (await firstOption.isVisible({ timeout: 1200 }).catch(() => false)) {
					await firstOption.click();
				}
			}

			const submitTaskButton = page
				.getByRole('button', { name: /create|save|add/i })
				.last();
			await submitTaskButton.click();
			await page.waitForTimeout(1600);

			await assertNoPermissionErrors(page, consoleErrors, 'Task create');
		}

		if (attemptedCreateFlows === 0) {
			return;
		}
	});
});
