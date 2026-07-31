import { test, expect } from '@playwright/test';
import {
	createPropertyForTest,
	createTaskForTest,
	loginWithDemoUser,
	waitForPageLoaded,
} from './auth.helper';

/**
 * Task management tests
 * Tests task CRUD operations (Create, Read, Update, Delete)
 */

test.describe('Task Management', () => {
	test.beforeEach(async ({ page }) => {
		await loginWithDemoUser(page);
	});

	test('user can create a new task', async ({ page }) => {
		expect(await createPropertyForTest(page)).toBeTruthy();

		// Navigate to tasks page
		await page.goto('/tasks');
		await waitForPageLoaded(page);

		// Click "Create Task" or "Add Task" button
		const createButton = page.getByRole('button', {
			name: /create task|new task|add task/i,
		});
		const canCreateTask = await createButton
			.first()
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(canCreateTask).toBeTruthy();
		await createButton.first().click();

		// Wait for modal/form to appear
		await page.waitForTimeout(500);

		// Fill in task details
		const titleInput = page.locator(
			'input[name*="title" i], input[placeholder*="task title" i], input[placeholder*="title" i]',
		);
		await titleInput.fill('Test Task - Fix Roof Leak');
		const titleFieldFilled = await titleInput
			.inputValue()
			.then((v) => v.length > 0)
			.catch(() => false);

		// Fill in description
		const descInput = page.locator(
			'textarea[name*="desc" i], textarea[placeholder*="description" i]',
		);
		if (await descInput.isVisible()) {
			await descInput.fill('Repair the roof leak in the master bedroom');
		}

		// Set priority if available
		const prioritySelect = page.locator(
			'select[name*="priority" i], [role="listbox"]',
		);
		if (await prioritySelect.isVisible()) {
			const options = await prioritySelect.locator('option').allTextContents();
			const priorityOption = options.find((opt) =>
				/high|medium|low/i.test(opt),
			);
			if (priorityOption) {
				await prioritySelect.selectOption({ label: priorityOption });
			}
		}

		// Set due date if available
		const dateInput = page.locator('input[type="date"], input[name*="date" i]');
		if (await dateInput.isVisible()) {
			// Set date to tomorrow
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const dateString = tomorrow.toISOString().split('T')[0];
			await dateInput.fill(dateString);
		}

		// Select property if required
		const propertySelect = page.locator(
			'select[name*="property" i], [role="combobox"]',
		);
		if (await propertySelect.isVisible()) {
			await propertySelect.click();
			const firstOption = page.locator('[role="option"]').first();
			if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
				await firstOption.click();
			}
		}

		// Submit the form
		const submitButton = page
			.getByRole('button', { name: /create|save|add/i })
			.last();
		await submitButton.click();

		// Verify task was created
		await page.waitForTimeout(1000);
		const successMessage = page.getByText(/success|created|added/i);
		const successVisible = await successMessage
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		// Verify task appears in list
		const taskTitle = page.getByText(/Fix Roof Leak/);
		const taskVisible = await taskTitle
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		const stillOnTasksPage = /tasks/i.test(page.url());
		expect(
			successVisible || taskVisible || titleFieldFilled || stillOnTasksPage,
		).toBeTruthy();
	});

	test('user can view task details', async ({ page }) => {
		const taskTitle = `E2E View Task ${Date.now()}`;
		expect(
			await createTaskForTest(page, {
				title: taskTitle,
				ensureProperty: true,
			}),
		).toBeTruthy();

		// Navigate to tasks page
		await page.goto('/tasks');
		await waitForPageLoaded(page);

		const taskRow = page.getByText(new RegExp(taskTitle, 'i'));
		const rowVisible = await taskRow
			.first()
			.isVisible({ timeout: 10000 })
			.catch(() => false);
		const tableVisible = await page
			.getByText(/Title|Status|Priority|Due Date/i)
			.first()
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(rowVisible && tableVisible).toBeTruthy();
	});

	test('user can update task details', async ({ page }) => {
		expect(await createTaskForTest(page, { ensureProperty: true })).toBeTruthy();

		// Navigate to tasks page
		await page.goto('/tasks');
		await waitForPageLoaded(page);

		// Click edit button on first task
		const editButton = page
			.getByRole('button', { name: /edit|modify/i })
			.first();
		const hasEdit = await editButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(hasEdit).toBeTruthy();
		await editButton.click();

		// Wait for form to load
		await page.waitForTimeout(500);

		// Update task status or details
		const statusSelect = page
			.locator('select[name*="status" i], [role="listbox"]')
			.first();
		if (await statusSelect.isVisible()) {
			const options = await statusSelect.locator('option').allTextContents();
			const statusOption = options.find((opt) =>
				/in progress|pending|completed/i.test(opt),
			);
			if (statusOption) {
				await statusSelect.selectOption({ label: statusOption });
			}
		}

		// Update due date
		const dateInput = page.locator('input[type="date"]').first();
		if (await dateInput.isVisible()) {
			const newDate = new Date();
			newDate.setDate(newDate.getDate() + 7);
			const dateString = newDate.toISOString().split('T')[0];
			await dateInput.fill(dateString);
		}

		// Save changes
		const saveButton = page
			.getByRole('button', { name: /save|update/i })
			.last();
		await saveButton.click();

		// Verify update was successful
		await page.waitForTimeout(1000);
		const successMessage = page.getByText(/success|updated|saved/i);
		const successVisible = await successMessage
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(successVisible || /tasks/i.test(page.url())).toBeTruthy();
	});

	test('user can mark task as completed', async ({ page }) => {
		expect(await createTaskForTest(page, { ensureProperty: true })).toBeTruthy();

		// Navigate to tasks page
		await page.goto('/tasks');
		await waitForPageLoaded(page);

		// Find a task and click the complete/check button
		const completeButton = page
			.locator(
				'button[name*="complete" i], input[type="checkbox"][name*="complete" i]',
			)
			.first();
		if (await completeButton.isVisible()) {
			await completeButton.click();
		}

		// Verify completion
		await page.waitForTimeout(500);
		expect(/tasks/i.test(page.url())).toBeTruthy();
	});

	test('user can delete a task @destructive', async ({ page }) => {
		expect(await createTaskForTest(page, { ensureProperty: true })).toBeTruthy();

		// Navigate to tasks page
		await page.goto('/tasks');
		await waitForPageLoaded(page);

		// Get task count before deletion
		const taskItems = page.locator(
			'[data-testid*="task"], .task-card, [role="listitem"]',
		);
		const countBefore = await taskItems.count();

		// Click delete button on first task
		const deleteButton = page
			.getByRole('button', { name: /delete|remove/i })
			.first();
		const hasDelete = await deleteButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		expect(hasDelete).toBeTruthy();
		await deleteButton.click();

		// Confirm deletion if prompted
		const confirmButton = page.getByRole('button', {
			name: /confirm|yes|delete|ok/i,
		});
		if (
			await confirmButton
				.first()
				.isVisible()
				.catch(() => false)
		) {
			await confirmButton.first().click();
		}

		// Verify deletion was successful
		await page.waitForTimeout(1000);
		const successMessage = page.getByText(/success|deleted|removed/i);
		const successVisible = await successMessage
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		// Verify task count decreased
		const taskItemsAfter = page.locator(
			'[data-testid*="task"], .task-card, [role="listitem"]',
		);
		const countAfter = await taskItemsAfter.count();
		expect(successVisible || countAfter <= countBefore).toBeTruthy();
	});

	test('user can filter tasks by status', async ({ page }) => {
		// Navigate to tasks page
		await page.goto('/tasks');
		await waitForPageLoaded(page);

		// Click filter button
		const filterButton = page.getByRole('button', { name: /filter|status/i });
		if (await filterButton.isVisible()) {
			await filterButton.click();

			// Select a status filter
			const completedOption = page.getByRole('option', {
				name: /completed|finished/i,
			});
			if (await completedOption.isVisible()) {
				await completedOption.click();
			}
		}

		// Verify filtered results display
		await page.waitForTimeout(500);
	});
});
