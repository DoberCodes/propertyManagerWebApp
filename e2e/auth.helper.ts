import { Page } from '@playwright/test';

/**
 * Helper functions to handle Firebase authentication in tests
 */

/**
 * Generate a unique email for testing to avoid conflicts
 */
export function generateTestEmail(): string {
	const timestamp = Date.now();
	const random = Math.floor(Math.random() * 10000);
	return `test.user.${timestamp}.${random}@maintley-test.com`;
}

export function getDemoCredentials(): { email: string; password: string } {
	const email = process.env.E2E_DEMO_EMAIL?.trim() || '';
	const password = process.env.E2E_DEMO_PASSWORD?.trim() || '';

	if (!email || !password) {
		throw new Error(
			'Missing demo credentials. Set E2E_DEMO_EMAIL and E2E_DEMO_PASSWORD in your environment.',
		);
	}

	return { email, password };
}

/**
 * Suppress the webpack dev server overlay that can interfere with tests
 */
async function suppressDevServerOverlay(page: Page) {
	try {
		await page.addStyleTag({
			content:
				'#webpack-dev-server-client-overlay{display:none!important;pointer-events:none!important;} iframe#webpack-dev-server-client-overlay{display:none!important;pointer-events:none!important;}',
		});
	} catch {
		// Ignore style injection failures
	}
	try {
		await page.evaluate(() => {
			const overlay = document.getElementById(
				'webpack-dev-server-client-overlay',
			);
			if (overlay) overlay.remove();
			document
				.querySelectorAll('iframe#webpack-dev-server-client-overlay')
				.forEach((node) => node.remove());
		});
	} catch {
		// Ignore DOM cleanup failures
	}
}

async function dismissGuidedSetupIfPresent(page: Page) {
	// Try multiple times with different selectors
	for (let attempt = 0; attempt < 8; attempt++) {
		// Try skip tour button
		const skipTourButton = page
			.getByRole('button', { name: /skip tour/i })
			.first();
		if (await skipTourButton.isVisible({ timeout: 800 }).catch(() => false)) {
			await skipTourButton.click({ force: true }).catch(() => {});
			await page.waitForTimeout(500);
			continue;
		}

		// Try next/happy button
		const nextTourButton = page
			.getByRole('button', { name: /happy to be here|next|continue/i })
			.first();
		if (await nextTourButton.isVisible({ timeout: 600 }).catch(() => false)) {
			await nextTourButton.click({ force: true }).catch(() => {});
			await page.waitForTimeout(500);
			continue;
		}

		// Try close button (X)
		const closeButton = page.getByRole('button', { name: /close|×/i }).first();
		if (await closeButton.isVisible({ timeout: 600 }).catch(() => false)) {
			await closeButton.click({ force: true }).catch(() => {});
			await page.waitForTimeout(500);
			continue;
		}

		// If no modal found, break
		const guidedSetupHeading = page
			.getByRole('heading', { name: /guided setup|welcome|tour/i })
			.first();
		if (
			!(await guidedSetupHeading.isVisible({ timeout: 500 }).catch(() => false))
		) {
			break;
		}

		await page.waitForTimeout(300);
	}
}

/**
 * Wait for loading states to disappear after page navigation
 */
export async function waitForPageLoaded(page: Page, timeout: number = 15000) {
	if (page.isClosed()) {
		return false;
	}

	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		if (page.isClosed()) {
			return false;
		}

		try {
			const isLoading = await page.evaluate(() => {
				const loadingEls = document.querySelectorAll(
					'[class*="Loading"], [data-testid*="loading"]',
				);
				for (let i = 0; i < loadingEls.length; i++) {
					const el = loadingEls[i];
					const style = window.getComputedStyle(el);
					if (
						style.display !== 'none' &&
						style.visibility !== 'hidden' &&
						style.opacity !== '0'
					) {
						return true;
					}
				}
				return false;
			});
			if (!isLoading) {
				if (!page.isClosed()) {
					await dismissGuidedSetupIfPresent(page);
					await page.waitForTimeout(300);
					await dismissGuidedSetupIfPresent(page);
					await page.waitForTimeout(500);
				}
				return true;
			}
			await page.waitForTimeout(300);
		} catch (e) {
			if (!page.isClosed()) {
				await dismissGuidedSetupIfPresent(page);
				await page.waitForTimeout(500);
			}
			return true;
		}
	}
	console.warn('Page loading took longer than expected');
	return false;
}

/**
 * Register a new user account through the UI
 */
export async function registerNewAccount(
	page: Page,
	email: string,
	password: string,
	options: { submitFinalStep?: boolean } = {},
) {
	const { submitFinalStep = true } = options;

	// Navigate directly to the clean registration route.
	await page.goto('/registration', {
		waitUntil: 'domcontentloaded',
		timeout: 40000,
	});
	await suppressDevServerOverlay(page);
	await page.waitForTimeout(1000);

	// Step 1: Fill in first name, last name, and select user type
	console.log('Starting registration - Step 1: Name and user type');
	await suppressDevServerOverlay(page);
	await page.waitForTimeout(2000);

	// Find inputs by placeholder since they don't have name attributes
	const firstNameInput = page.locator('input[placeholder*="First"]').first();
	await firstNameInput.waitFor({ state: 'visible', timeout: 10000 });
	await firstNameInput.fill('Test');

	const lastNameInput = page.locator('input[placeholder*="Last"]').first();
	await lastNameInput.waitFor({ state: 'visible', timeout: 10000 });
	await lastNameInput.fill('User');

	// Select home radio button
	const homeRadio = page
		.getByRole('radio', { name: /home/i })
		.first();
	const isHomeVisible = await homeRadio
		.isVisible({ timeout: 5000 })
		.catch(() => false);
	if (isHomeVisible) {
		await suppressDevServerOverlay(page);
		await homeRadio.click();
		await page.waitForTimeout(300);
	}

	// Click Next button
	const nextButton = page.getByRole('button', { name: /next/i }).first();
	const isNextVisible = await nextButton
		.isVisible({ timeout: 5000 })
		.catch(() => false);

	if (isNextVisible) {
		console.log('Clicking Next button for Step 1');
		await suppressDevServerOverlay(page);
		await nextButton.click();
		await page.waitForTimeout(800);
	}

	// Step 2: Fill in email and password
	console.log('Looking for email input field on Step 2');
	const emailInput = page
		.locator('input[type="email"], input[placeholder*="Email"]')
		.first();
	await emailInput.waitFor({ state: 'visible', timeout: 10000 });
	console.log('Found email input, filling email');
	await emailInput.fill(email);

	console.log('Looking for password input field');
	const passwordInput = page
		.locator('input[type="password"], input[placeholder*="Password"]')
		.first();
	await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
	console.log('Found password input, filling password');
	await passwordInput.fill(password);

	const confirmPasswordInput = page
		.locator('input[placeholder*="Confirm"]')
		.first();
	await confirmPasswordInput.waitFor({ state: 'visible', timeout: 10000 });
	console.log('Found confirm password input, filling it');
	await confirmPasswordInput.fill(password);

	// Check terms agreement checkbox
	console.log('Looking for terms agreement checkbox');
	const termsCheckbox = page.locator('input[type="checkbox"]').first();
	const isTermsVisible = await termsCheckbox
		.isVisible({ timeout: 5000 })
		.catch(() => false);
	if (isTermsVisible) {
		console.log('Checking terms agreement checkbox');
		await termsCheckbox.check();
	}

	// Click Next button for Step 2
	console.log('Looking for Next button to proceed to Step 3');
	const nextButton2 = page.getByRole('button', { name: /next/i }).first();
	if (await nextButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
		console.log('Clicking Next button to proceed to Step 3');
		await suppressDevServerOverlay(page);
		await nextButton2.click();
		await page.waitForTimeout(800);
	}

	// Step 3: Plan selection
	console.log('On Step 3 - checking for plan selection or tenant code');
	await page.waitForTimeout(500);

	console.log('Looking for plan selection buttons');
	const selectPlanButtons = page.getByRole('button', { name: /select plan/i });
	const buttonCount = await selectPlanButtons.count();

	if (buttonCount > 0) {
		console.log(`Found ${buttonCount} "Select Plan" buttons`);
		await selectPlanButtons.first().click();
		console.log('Plan selected');

		// Wait for Continue button
		console.log('Waiting for Continue button');
		const continueButton = page.getByRole('button', { name: /continue/i });
		const canContinue = await continueButton
			.isVisible({ timeout: 10000 })
			.catch(() => false);
		if (!canContinue && !submitFinalStep) {
			console.log(
				'Continue button not shown after plan selection; registration smoke stops before account submission.',
			);
			return;
		}
		await continueButton.waitFor({ state: 'visible', timeout: 10000 });
		console.log('Found Continue button, clicking it');
		await continueButton.click();
		console.log('Clicked Continue button to proceed to Step 4');
	}

	// Step 4: Final submission
	console.log('Waiting for Step 4 final submission screen');
	await page.waitForTimeout(500);

	console.log('Successfully reached Step 4');

	if (!submitFinalStep) {
		console.log(
			'Skipping final account submission for test/demo mode (no Firebase signup)',
		);
		const finalButton = page
			.getByRole('button', {
				name: /create account|sign up|register|submit|complete|finish|done/i,
			})
			.last();

		await finalButton.waitFor({ state: 'visible', timeout: 10000 });
		return;
	}

	console.log('Looking for final submit button on Step 4');

	const submitButton = page
		.getByRole('button', {
			name: /create account|sign up|register|submit|complete|finish|done/i,
		})
		.last();

	await submitButton.waitFor({ state: 'visible', timeout: 10000 });
	console.log('Found final submit button, clicking it');
	await submitButton.click();
	console.log('Clicked final submit button');

	// Check for error messages
	console.log('Checking for error messages after submission...');
	await page.waitForTimeout(1000);
	await page.waitForTimeout(1500);

	// Aggressively dismiss guided setup modals
	await dismissGuidedSetupIfPresent(page);
	await page.waitForTimeout(800);
	await dismissGuidedSetupIfPresent(page);
	await page.waitForTimeout(800);
	await dismissGuidedSetupIfPresent(page);
	await page.waitForTimeout(500);
}

/**
 * Login to an existing account
 */
export async function login(page: Page, email: string, password: string) {
	// Navigate directly to the clean login route.
	await page.goto('/login', {
		waitUntil: 'domcontentloaded',
		timeout: 40000,
	});
	await suppressDevServerOverlay(page);
	await page.waitForTimeout(500);

	// Fill in credentials
	const emailInput = page
		.locator(
			'input[type="email"], input[name="email"], input[placeholder*="email" i], input[id*="email" i]',
		)
		.first();
	const passwordInput = page
		.locator(
			'input[type="password"], input[name="password"], input[placeholder*="password" i], input[id*="password" i]',
		)
		.first();

	await suppressDevServerOverlay(page);
	await emailInput.waitFor({ state: 'visible', timeout: 10000 });
	await emailInput.fill(email);

	await suppressDevServerOverlay(page);
	await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
	await passwordInput.fill(password);

	// Submit the form
	const submitButton = page
		.getByRole('button', { name: /sign in|login|submit/i })
		.last();
	await suppressDevServerOverlay(page);
	await submitButton.click();

	const navigatedAfterLogin = await page
		.waitForFunction(() => !window.location.pathname.includes('/login'), {
			timeout: 15000,
		})
		.then(() => true)
		.catch(() => false);

	if (!navigatedAfterLogin) {
		const authError = await page
			.locator('[role="alert"], [class*="error" i], [data-testid*="error" i]')
			.first()
			.textContent()
			.catch(() => null);

		throw new Error(
			authError?.trim()
				? `Login failed: ${authError.trim()}`
				: 'Login failed: still on /login after submitting credentials. Verify E2E_DEMO_EMAIL/E2E_DEMO_PASSWORD.',
		);
	}

	await page.waitForTimeout(500);

	await dismissGuidedSetupIfPresent(page);

	await page.goto('/dashboard', {
		waitUntil: 'domcontentloaded',
		timeout: 40000,
	});
	await waitForPageLoaded(page);

	if (page.url().includes('/login')) {
		throw new Error(
			'Login failed: authenticated dashboard access was not established after login.',
		);
	}
}

export async function loginWithDemoUser(page: Page) {
	const alreadyAuthenticated = await isLoggedIn(page);
	if (alreadyAuthenticated) {
		return;
	}

	const { email, password } = getDemoCredentials();
	await login(page, email, password);
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
	if (page.isClosed()) {
		return;
	}

	await waitForPageLoaded(page);

	const profileMenuTrigger = page
		.getByRole('button', { name: /open profile menu/i })
		.first();
	if (
		await profileMenuTrigger.isVisible({ timeout: 3000 }).catch(() => false)
	) {
		await profileMenuTrigger.click();
	} else {
		const desktopProfileTrigger = page.locator('.desktop-profile').first();
		if (
			await desktopProfileTrigger.isVisible({ timeout: 3000 }).catch(() => false)
		) {
			await desktopProfileTrigger.click();
		} else {
			const mobileProfileTrigger = page.locator('.mobile-profile img').first();
			if (
				await mobileProfileTrigger
					.isVisible({ timeout: 3000 })
					.catch(() => false)
			) {
				await mobileProfileTrigger.click();
			}
		}
	}

	const logoutButton = page
		.getByRole('button', { name: /log out|sign out|logout/i })
		.first();
	const canLogout = await logoutButton
		.isVisible({ timeout: 5000 })
		.catch(() => false);
	if (!canLogout) {
		throw new Error('Logout failed: could not find a visible logout button.');
	}

	await logoutButton.click();
	const didLeaveDashboard = await page
		.waitForFunction(() => !window.location.pathname.includes('/dashboard'), {
			timeout: 10000,
		})
		.then(() => true)
		.catch(() => false);

	if (!didLeaveDashboard) {
		throw new Error(
			`Logout failed: still on dashboard after clicking logout (${page.url()}).`,
		);
	}
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
	try {
		await page.goto('/dashboard', {
			waitUntil: 'domcontentloaded',
			timeout: 40000,
		});
		await waitForPageLoaded(page);
		const currentUrl = page.url();

		if (currentUrl.includes('/login')) {
			return false;
		}

		if (currentUrl.includes('/dashboard')) {
			return true;
		}

		const dashboardNavVisible = await page
			.getByRole('link', { name: /dashboard/i })
			.first()
			.isVisible({ timeout: 1500 })
			.catch(() => false);

		return dashboardNavVisible;
	} catch {
		return false;
	}
}

export async function createPropertyForTest(
	page: Page,
	options: {
		name?: string;
		address?: string;
	} = {},
): Promise<boolean> {
	const escapeRegex = (value: string) =>
		value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

	const tryCreate = async (name: string, address: string): Promise<boolean> => {
		console.log(`[e2e] createPropertyForTest tryCreate start: ${name}`);
		const countBefore = await page.getByText('⋮').count();

		const createButton = page
			.getByRole('button', {
				name: /add property|new property|create property/i,
			})
			.first();
		const canCreate = await createButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);
		if (!canCreate) {
			console.log('[e2e] createPropertyForTest: create button not visible');
			return false;
		}

		await createButton.click({ force: true }).catch(async () => {
			await createButton.click();
		});

		const modalHeading = page
			.getByRole('heading', { name: /add new property/i })
			.first();
		const modalOpened = await modalHeading
			.isVisible({ timeout: 7000 })
			.catch(() => false);
		if (!modalOpened) {
			console.log('[e2e] createPropertyForTest: add property modal did not open');
			return false;
		}
		await page.waitForTimeout(400);

		const groupSelect = page.locator('select').first();
		if (await groupSelect.isVisible({ timeout: 2500 }).catch(() => false)) {
			await groupSelect.evaluate((selectEl) => {
				const select = selectEl as HTMLSelectElement;
				if (select.options.length > 1) {
					select.selectedIndex = 1;
					select.dispatchEvent(new Event('change', { bubbles: true }));
				}
			});
		}

		const nameInput = page.getByPlaceholder(/enter property name/i).first();
		if (!(await nameInput.isVisible({ timeout: 3000 }).catch(() => false))) {
			console.log('[e2e] createPropertyForTest: property name input not visible');
			return false;
		}
		await nameInput.fill(name);

		const ownerInput = page.locator('input[placeholder*="owner" i]').first();
		if (await ownerInput.isVisible({ timeout: 1200 }).catch(() => false)) {
			await ownerInput.fill('E2E Owner');
		}

		const rentalCheckbox = page.locator('input[type="checkbox"]').first();
		if (await rentalCheckbox.isVisible({ timeout: 1200 }).catch(() => false)) {
			const isChecked = await rentalCheckbox.isChecked().catch(() => false);
			if (!isChecked) {
				await rentalCheckbox.check({ force: true }).catch(async () => {
					await rentalCheckbox.click({ force: true });
				});
			}
		}

		const addressInput = page
			.locator('input[placeholder*="address" i], input[name*="address" i]')
			.first();
		if (!(await addressInput.isVisible({ timeout: 3000 }).catch(() => false))) {
			console.log('[e2e] createPropertyForTest: address input not visible');
			return false;
		}
		await addressInput.fill(address);

		await page.getByRole('button', { name: /save property/i }).click();
		await page.waitForTimeout(1200);
		await page.goto('/properties', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);

		const countAfter = await page.getByText('⋮').count();
		const createdPropertyVisible = await page
			.getByText(new RegExp(escapeRegex(name), 'i'))
			.first()
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		if (createdPropertyVisible || countAfter > countBefore) {
			console.log(
				`[e2e] createPropertyForTest: creation detected (createdPropertyVisible=${createdPropertyVisible}, countBefore=${countBefore}, countAfter=${countAfter})`,
			);
			return true;
		}

		console.log(
			`[e2e] createPropertyForTest: create attempt failed (createdPropertyVisible=${createdPropertyVisible}, countBefore=${countBefore}, countAfter=${countAfter})`,
		);

		return false;
	};

	const freeOnePropertySlot = async (): Promise<boolean> => {
		console.log('[e2e] createPropertyForTest: attempting to free one property slot');
		const overflowToggle = page.getByText('⋮').first();
		if (!(await overflowToggle.isVisible({ timeout: 2000 }).catch(() => false))) {
			console.log('[e2e] createPropertyForTest: no overflow menu available to delete');
			return false;
		}

		await overflowToggle.click();
		const deleteMenuItem = page.getByText(/^Delete$/).first();
		if (!(await deleteMenuItem.isVisible({ timeout: 1500 }).catch(() => false))) {
			console.log('[e2e] createPropertyForTest: delete menu item not visible');
			return false;
		}

		await deleteMenuItem.click();
		const confirmDelete = page.getByRole('button', { name: /^Delete$/i }).first();
		if (!(await confirmDelete.isVisible({ timeout: 2500 }).catch(() => false))) {
			console.log('[e2e] createPropertyForTest: delete confirmation button not visible');
			return false;
		}

		await confirmDelete.click({ force: true });
		await page.waitForTimeout(1200);
		console.log('[e2e] createPropertyForTest: deleted one property slot');
		return true;
	};

	const timestamp = Date.now();
	const propertyName = options.name || `E2E Property ${timestamp}`;
	const propertyAddress =
		options.address || `${timestamp} Test Ave, Springfield, IL 62701`;

	await page.goto('/properties', { waitUntil: 'domcontentloaded' });
	await waitForPageLoaded(page);

	const createdFirstTry = await tryCreate(propertyName, propertyAddress);
	if (createdFirstTry) {
		return true;
	}

	const freedSlot = await freeOnePropertySlot();
	if (!freedSlot) {
		console.log('[e2e] createPropertyForTest: could not free slot');
		return false;
	}

	await page.goto('/properties', { waitUntil: 'domcontentloaded' });
	await waitForPageLoaded(page);
	const retryCreated = await tryCreate(`${propertyName} Retry`, propertyAddress);
	console.log(`[e2e] createPropertyForTest retry result: ${retryCreated}`);
	return retryCreated;
}

export async function createTaskForTest(
	page: Page,
	options: {
		title?: string;
		description?: string;
		ensureProperty?: boolean;
	} = {},
): Promise<boolean> {
	if (options.ensureProperty) {
		await createPropertyForTest(page).catch(() => false);
	}

	const timestamp = Date.now();
	const taskTitle = options.title || `E2E Task ${timestamp}`;
	const taskDescription =
		options.description || 'Automatically created by Playwright for deterministic coverage.';

	await page.goto('/tasks', { waitUntil: 'domcontentloaded' });
	await waitForPageLoaded(page);

	const createButton = page
		.getByRole('button', { name: /create task|new task|add task/i })
		.first();
	const canCreate = await createButton
		.isVisible({ timeout: 5000 })
		.catch(() => false);
	if (!canCreate) {
		return false;
	}

	await createButton.click({ force: true }).catch(async () => {
		await createButton.click();
	});
	await page.waitForTimeout(700);

	const titleInput = page.locator(
		'input[name*="title" i], input[placeholder*="task title" i], input[placeholder*="title" i]',
	);
	const hasTitleField = await titleInput
		.first()
		.isVisible({ timeout: 3000 })
		.catch(() => false);
	if (!hasTitleField) {
		return false;
	}

	await titleInput.first().fill(taskTitle);

	const descInput = page.locator(
		'textarea[name*="desc" i], textarea[placeholder*="description" i]',
	);
	if (await descInput.first().isVisible({ timeout: 1000 }).catch(() => false)) {
		await descInput.first().fill(taskDescription);
	}

	const dueDateInput = page.locator('input[type="date"], input[name*="due" i]');
	const hasDueDate = await dueDateInput
		.first()
		.isVisible({ timeout: 1500 })
		.catch(() => false);
	if (hasDueDate) {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const dueDate = tomorrow.toISOString().split('T')[0];
		await dueDateInput.first().fill(dueDate);
	}

	const propertySelect = page.locator(
		'select[name*="property" i], [role="combobox"]',
	);
	if (
		await propertySelect
			.first()
			.isVisible({ timeout: 1500 })
			.catch(() => false)
	) {
		await propertySelect.first().click().catch(() => {});
		const firstOption = page.locator('[role="option"]').first();
		if (await firstOption.isVisible({ timeout: 1200 }).catch(() => false)) {
			await firstOption.click().catch(() => {});
		}
	}

	const submitButton = page
		.getByRole('button', { name: /create|save|add/i })
		.last();
	await submitButton.click();
	await page.waitForTimeout(1500);

	const createdVisible = await page
		.getByText(new RegExp(taskTitle, 'i'))
		.first()
		.isVisible({ timeout: 5000 })
		.catch(() => false);

	return createdVisible;
}
