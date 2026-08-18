import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: '.env.local' });
dotenv.config();

const DEMO_AUTH_STATE_PATH = path.join('.auth', 'demo-user.json');
const DESTRUCTIVE_GREP = /@destructive/;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './e2e',
	/* Run tests in files in parallel, but limit workers */
	fullyParallel: true,
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Limit workers to prevent resource exhaustion */
	workers: process.env.CI ? 1 : 2,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Test timeout - increased for slower environments */
	timeout: 120000,
	/* Expect timeout */
	expect: { timeout: 15000 },
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: 'http://localhost:3000',
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
		/* Screenshot on failure */
		screenshot: 'only-on-failure',
		/* Navigation timeout */
		navigationTimeout: 30000,
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'activation',
			testMatch: /first-value\.spec\.ts/,
			use: {
				...devices['Desktop Chrome'],
				storageState: { cookies: [], origins: [] },
			},
		},
		{
			name: 'setup',
			testMatch: /auth\.setup\.ts/,
		},
		{
			name: 'chromium',
			testIgnore: /first-value\.spec\.ts/,
			use: {
				...devices['Desktop Chrome'],
				storageState: DEMO_AUTH_STATE_PATH,
			},
			grepInvert: DESTRUCTIVE_GREP,
			dependencies: ['setup'],
		},

		{
			name: 'firefox',
			testIgnore: /first-value\.spec\.ts/,
			use: {
				...devices['Desktop Firefox'],
				storageState: DEMO_AUTH_STATE_PATH,
			},
			grepInvert: DESTRUCTIVE_GREP,
			dependencies: ['setup'],
		},

		{
			name: 'webkit',
			testIgnore: /first-value\.spec\.ts/,
			use: {
				...devices['Desktop Safari'],
				storageState: DEMO_AUTH_STATE_PATH,
			},
			grepInvert: DESTRUCTIVE_GREP,
			dependencies: ['setup'],
		},

		/* Test against mobile viewports. */
		{
			name: 'Mobile Chrome',
			testIgnore: /first-value\.spec\.ts/,
			use: {
				...devices['Pixel 5'],
				storageState: DEMO_AUTH_STATE_PATH,
			},
			grepInvert: DESTRUCTIVE_GREP,
			dependencies: ['setup'],
		},
		{
			name: 'Mobile Safari',
			testIgnore: /first-value\.spec\.ts/,
			use: {
				...devices['iPhone 12'],
				storageState: DEMO_AUTH_STATE_PATH,
			},
			grepInvert: DESTRUCTIVE_GREP,
			dependencies: ['setup'],
		},
		{
			name: 'teardown',
			use: {
				...devices['Desktop Chrome'],
				storageState: DEMO_AUTH_STATE_PATH,
			},
			grep: DESTRUCTIVE_GREP,
			dependencies: [
				'chromium',
				'firefox',
				'webkit',
				'Mobile Chrome',
				'Mobile Safari',
			],
		},

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
		// },
	],

	/* Run your local dev server before starting the tests */
	webServer: {
		command: 'yarn start',
		url: 'http://localhost:3000',
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},
});
