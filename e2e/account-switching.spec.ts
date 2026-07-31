import { test, expect, Page } from '@playwright/test';
import { login, loginWithDemoUser, logout, waitForPageLoaded } from './auth.helper';

const PERMISSION_ERROR_REGEX =
	/missing or insufficient permissions|permission[- ]denied|insufficient permissions/i;

const getSecondaryDemoCredentials = () => ({
	email: process.env.E2E_SECONDARY_DEMO_EMAIL?.trim() || '',
	password: process.env.E2E_SECONDARY_DEMO_PASSWORD?.trim() || '',
});

const collectPermissionErrors = (page: Page) => {
	const messages: string[] = [];
	page.on('console', (message) => {
		if (message.type() === 'error' || message.type() === 'warning') {
			messages.push(message.text());
		}
	});
	page.on('pageerror', (error) => {
		messages.push(error.message);
	});
	return messages;
};

test.describe('Account switching regression', () => {
	test('switching between demo accounts does not retain blocked account state', async ({
		page,
	}) => {
		const secondary = getSecondaryDemoCredentials();
		test.skip(
			!secondary.email || !secondary.password,
			'Set E2E_SECONDARY_DEMO_EMAIL and E2E_SECONDARY_DEMO_PASSWORD to run two-account switching coverage.',
		);

		const messages = collectPermissionErrors(page);

		await loginWithDemoUser(page);
		await expect(page).toHaveURL(/dashboard/i);

		await logout(page);
		const messagesBeforeAccountSwitch = messages.length;
		await login(page, secondary.email, secondary.password);
		await expect(page).toHaveURL(/dashboard/i);

		await page.goto('/support?view=requests', { waitUntil: 'domcontentloaded' });
		await waitForPageLoaded(page);
		await expect(page.getByText('Maintley Support')).toBeVisible();
		await expect(page.getByText(/we could not load your requests/i)).not.toBeVisible();

		expect(
			messages
				.slice(messagesBeforeAccountSwitch)
				.filter((message) => PERMISSION_ERROR_REGEX.test(message)),
		).toEqual([]);
	});
});
