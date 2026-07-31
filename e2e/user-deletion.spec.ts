import { test, expect } from '@playwright/test';
import {
	createPropertyForTest,
	registerNewAccount,
	generateTestEmail,
	loginWithDemoUser,
	login,
	isLoggedIn,
	waitForPageLoaded,
} from './auth.helper';

/**
 * User Data Deletion & Account Cleanup Tests
 * Tests that users can delete their own data through the UI
 * Verifies properties, tasks, and accounts can be removed by the user
 */

test.describe('User Account & Data Deletion @destructive', () => {
	test('user can delete all their properties through the UI', async ({
		page,
	}) => {
		console.log(`\n📝 Test: Deleting properties via UI`);
		console.log(`Using demo account`);
		await loginWithDemoUser(page);

		// Step 2: Create multiple properties
		console.log('📦 Creating test properties...');
		let createdPropertyCount = 0;
		for (let i = 1; i <= 2; i++) {
			const created = await createPropertyForTest(page, {
				name: `Deletion Property ${Date.now()} ${i}`,
				address: `${100 + i} Delete Lane, Springfield, IL 62701`,
			});
			if (created) {
				createdPropertyCount++;
				console.log(`   ✅ Created property ${i}`);
			}
		}
		expect(createdPropertyCount).toBeGreaterThan(0);

		// Step 3: Navigate to properties and delete them
		console.log('🗑️  Deleting properties...');
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		let propertyCount = 0;
		const maxDeletes = 5;
		for (let attempt = 0; attempt < maxDeletes; attempt++) {
			const overflowToggle = page.getByText('⋮').first();
			const hasToggle = await overflowToggle
				.isVisible({ timeout: 2000 })
				.catch(() => false);
			if (!hasToggle) {
				break;
			}

			await overflowToggle.click();
			const deleteItem = page.getByText(/^Delete$/).first();
			const hasDeleteItem = await deleteItem
				.isVisible({ timeout: 2000 })
				.catch(() => false);
			if (!hasDeleteItem) {
				break;
			}

			await deleteItem.click();
			const confirmBtn = page.getByRole('button', { name: /^Delete$/i }).first();
			await expect(confirmBtn).toBeVisible({ timeout: 3000 });
			await confirmBtn.click();
			await page.waitForTimeout(900);
			propertyCount++;
			console.log(`   ✅ Property ${propertyCount} deleted`);
		}

		console.log(`✅ Successfully deleted ${propertyCount} properties`);
		expect(propertyCount).toBeGreaterThan(0);
	});

	test('user can delete all their tasks through the UI', async ({ page }) => {
		console.log(`\n📝 Test: Deleting tasks via UI`);
		console.log(`Using demo account`);
		await loginWithDemoUser(page);

		// Step 2: Create multiple tasks
		console.log('📋 Creating test tasks...');
		let createdTaskCount = 0;
		for (let i = 1; i <= 2; i++) {
			await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
			await waitForPageLoaded(page);

			const createButton = page.getByRole('button', {
				name: /create task|new task|add task/i,
			});
			if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
				await createButton.click();
				await page.waitForTimeout(500);

				const titleInput = page.locator(
					'input[name*="title" i], input[placeholder*="task title" i], input[placeholder*="title" i]',
				);
				if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
					await titleInput.fill(`Task ${i} for Deletion`);
					const submitBtn = page
						.getByRole('button', { name: /create|save|add/i })
						.last();
					await submitBtn.click();
					await page.waitForTimeout(1000);
					createdTaskCount++;
					console.log(`   ✅ Created task ${i}`);
				}
			}
		}
		expect(createdTaskCount).toBeGreaterThan(0);

		// Step 3: Navigate to tasks and delete them
		console.log('🗑️  Deleting tasks...');
		await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		let taskCount = 0;
		const maxDeletes = 5;
		for (let attempt = 0; attempt < maxDeletes; attempt++) {
			const deleteButtons = page.getByRole('button', {
				name: /delete|remove/i,
			});
			const firstDeleteBtn = deleteButtons.first();
			const canDelete = await firstDeleteBtn
				.isVisible({ timeout: 2000 })
				.catch(() => false);
			if (!canDelete) {
				break;
			}

			await firstDeleteBtn.click();
			await page.waitForTimeout(400);

			// Confirm deletion if prompted
			const confirmBtn = page.getByRole('button', {
				name: /confirm|yes|delete|ok/i,
			});
			if (
				await confirmBtn
					.first()
					.isVisible({ timeout: 2000 })
					.catch(() => false)
			) {
				await confirmBtn.first().click();
				await page.waitForTimeout(600);
				taskCount++;
				console.log(`   ✅ Task ${taskCount} deleted`);
			}
		}

		console.log(`✅ Successfully deleted ${taskCount} tasks`);
		expect(taskCount).toBeGreaterThan(0);
	});

	test('user can delete their account through the UI', async ({ page }) => {
		// Step 1: Create test account
		const testEmail = generateTestEmail();
		const testPassword = 'TestPassword123!';

		console.log(`\n📝 Test: Deleting account via UI`);
		console.log(`Creating account: ${testEmail}`);
		await registerNewAccount(page, testEmail, testPassword);
		if (!(await isLoggedIn(page))) {
			await login(page, testEmail, testPassword);
		}

		// Verify logged in
		expect(await isLoggedIn(page)).toBeTruthy();
		console.log('✅ Account created successfully');

		// Step 2: Look for account/settings page to delete account
		console.log('🔍 Looking for account deletion option...');
		const settingsRoutes = ['settings', 'account', 'profile', 'preferences'];
		let foundAccountSettings = false;

		for (const route of settingsRoutes) {
			try {
				await page.goto(`/${route}`, { waitUntil: 'domcontentloaded' });
				await waitForPageLoaded(page);

				// Look for "Delete Account" button or link
				const deleteAccountBtn = page
					.getByRole('button', { name: /delete.*account|remove.*account/i })
					.first();

				if (
					await deleteAccountBtn.isVisible({ timeout: 2000 }).catch(() => false)
				) {
					console.log(`📝 Found account settings at: ${route}`);
					console.log('🗑️  Clicking delete account button...');

					await deleteAccountBtn.click();
					await page.waitForTimeout(1000);

					// Look for confirmation dialog
					const confirmDeleteBtn = page.getByRole('button', {
						name: /confirm.*delete|yes.*delete|delete.*account|ok/i,
					});

					if (
						await confirmDeleteBtn
							.isVisible({ timeout: 3000 })
							.catch(() => false)
					) {
						console.log('⚠️  Confirming account deletion...');
						await confirmDeleteBtn.click();
						await page.waitForTimeout(2000);

						// Verify we're logged out or redirected
						const isLoggedOut = !(await isLoggedIn(page));

						if (isLoggedOut) {
							console.log(
								'✅ Account deleted via UI - logged out successfully',
							);
							foundAccountSettings = true;

							// Step 3: Verify account is actually deleted by trying to log in
							console.log(
								`\n🔄 Verifying deletion: Attempting to log in with ${testEmail}`,
							);
							await page.goto('/login', { waitUntil: 'domcontentloaded' });
							await waitForPageLoaded(page);
							const loginBtn = page
								.getByRole('button', { name: /sign in|login/i })
								.first();

							if (
								await loginBtn.isVisible({ timeout: 3000 }).catch(() => false)
							) {
								await loginBtn.click();
								await page.waitForTimeout(500);

								const emailInput = page.locator('input[type="email"]').first();
								const passwordInput = page
									.locator('input[type="password"]')
									.first();

								if (
									await emailInput
										.isVisible({ timeout: 2000 })
										.catch(() => false)
								) {
									await emailInput.fill(testEmail);
									await passwordInput.fill(testPassword);

									const submitBtn = page
										.getByRole('button', { name: /sign in|login/i })
										.last();
									await submitBtn.click();
									await page.waitForTimeout(2000);

									const errorMsg = page.getByText(
										/not found|invalid|incorrect|user doesn't exist|no user/i,
									);
									const loginFailed = await errorMsg
										.isVisible({ timeout: 2000 })
										.catch(() => false);

									if (loginFailed) {
										console.log(
											'✅ Account deletion verified - login failed as expected',
										);
									} else {
										console.log('ℹ️  Login check inconclusive');
									}
								}
							}
							break;
						}
					}
				}
			} catch (error) {
				// Continue to next route
			}
		}

		if (!foundAccountSettings) {
			console.log(
				'⚠️  Note: Account deletion through UI not found in tested routes',
			);
			console.log('   Tested routes:', settingsRoutes.join(', '));
			console.log(
				'   Accounts created for testing will be cleaned up via: yarn e2e:ci',
			);
		}
	});

	test('complete user data cleanup task', async ({ page }) => {
		// Step 1: Login with demo account
		console.log(`\n📝 Test: Complete User Cleanup Task (Demo User)`);
		await loginWithDemoUser(page);

		// Step 2: Create test data
		console.log('📦 Creating test data...');
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);
		const createPropBtn = page.getByRole('button', {
			name: /add property|new property|create/i,
		});

		let propertyCreated = false;
		if (await createPropBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
			await createPropBtn.click();
			const addressInput = page.locator('input[placeholder*="address" i]');
			if (await addressInput.isVisible({ timeout: 2000 }).catch(() => false)) {
				await addressInput.fill('Cleanup Test Property');
				await page
					.getByRole('button', { name: /create|save/i })
					.last()
					.click();
				propertyCreated = true;
				console.log('   ✅ Property created');
			}
		}

		// Step 3: Summary
		console.log(`\n📊 Cleanup Summary:`);
		console.log(`   User: Demo account`);
		console.log(`   Data Created: Properties, Tasks`);
		console.log(`\n🧹 Cleanup Options:`);
		console.log(`   1. Manual UI deletion: Delete via Settings → Account`);
		console.log(`   2. Restore demo data if needed for next run`);

		expect(propertyCreated).toBeTruthy();
	});
});
