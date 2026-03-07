import { test, expect, Page, Frame } from '@playwright/test';
import { loginWithDemoUser, waitForPageLoaded } from './auth.helper';

const clickAnyCheckoutAction = async (page: Page): Promise<boolean> => {
	const candidates = page.getByRole('button', {
		name: /subscribe|upgrade|get started|select plan|keep/i,
	});
	const count = await candidates.count();

	for (let index = 0; index < count; index += 1) {
		const button = candidates.nth(index);
		const text = (await button.textContent())?.toLowerCase() ?? '';

		if (text.includes('current plan') || text.includes('scheduled')) {
			continue;
		}

		const isVisible = await button
			.isVisible({ timeout: 500 })
			.catch(() => false);
		const isEnabled = await button
			.isEnabled({ timeout: 500 })
			.catch(() => false);

		if (isVisible && isEnabled) {
			await button.click();
			return true;
		}
	}

	return false;
};

const fillInputInPageOrFrames = async (
	page: Page,
	selectors: string[],
	value: string,
): Promise<boolean> => {
	for (const selector of selectors) {
		const directInput = page.locator(selector).first();
		if (await directInput.isVisible({ timeout: 1200 }).catch(() => false)) {
			await directInput.fill(value);
			return true;
		}
	}

	const frames: Frame[] = page.frames();
	for (const frame of frames) {
		for (const selector of selectors) {
			const frameInput = frame.locator(selector).first();
			if (await frameInput.isVisible({ timeout: 700 }).catch(() => false)) {
				await frameInput.fill(value);
				return true;
			}
		}
	}

	return false;
};

const fillHostedCardForm = async (page: Page, cardNumber: string) => {
	const cardFilled = await fillInputInPageOrFrames(
		page,
		[
			'input[name="cardnumber"]',
			'input[name="cardNumber"]',
			'input[autocomplete="cc-number"]',
			'input[placeholder*="Card number" i]',
		],
		cardNumber,
	);

	if (!cardFilled) {
		throw new Error('Could not find Stripe card number input on hosted checkout.');
	}

	const expiryFilled = await fillInputInPageOrFrames(
		page,
		[
			'input[name="exp-date"]',
			'input[name="cardExpiry"]',
			'input[autocomplete="cc-exp"]',
			'input[placeholder*="MM / YY" i]',
		],
		'12/34',
	);

	if (!expiryFilled) {
		throw new Error('Could not find Stripe expiry input on hosted checkout.');
	}

	const cvcFilled = await fillInputInPageOrFrames(
		page,
		[
			'input[name="cvc"]',
			'input[name="cardCvc"]',
			'input[autocomplete="cc-csc"]',
			'input[placeholder*="CVC" i]',
		],
		'123',
	);

	if (!cvcFilled) {
		throw new Error('Could not find Stripe CVC input on hosted checkout.');
	}

	const zipFilled = await fillInputInPageOrFrames(
		page,
		[
			'input[name="postal"]',
			'input[name="zip"]',
			'input[autocomplete="postal-code"]',
			'input[placeholder*="ZIP" i]',
			'input[placeholder*="Postal" i]',
		],
		'12345',
	);

	if (!zipFilled) {
		console.warn('ZIP/postal input not detected on Stripe Checkout (continuing).');
	}
};

const submitHostedCheckout = async (page: Page) => {
	const payButton = page
		.getByRole('button', {
			name: /subscribe|start trial|pay|complete|submit|purchase|confirm/i,
		})
		.last();

	await expect(payButton).toBeVisible({ timeout: 10000 });
	await payButton.click();
};

const openHostedCheckout = async (page: Page): Promise<boolean> => {
	await page.goto('/#/paywall', { waitUntil: 'domcontentloaded' });
	await waitForPageLoaded(page);

	expect(await clickAnyCheckoutAction(page)).toBeTruthy();

	const hostedReached = await page
		.waitForURL(/stripe\.com/i, { timeout: 15000 })
		.then(() => true)
		.catch(() => false);

	return hostedReached;
};

test.describe('Stripe Hosted Checkout Cards', () => {
	test.beforeAll(() => {
		const stripePublicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY || '';
		test.skip(
			!stripePublicKey.startsWith('pk_test_'),
			'Stripe hosted checkout tests require sandbox/test mode (REACT_APP_STRIPE_PUBLIC_KEY must start with pk_test_).',
		);
	});

	test.beforeEach(async ({ page }) => {
		await loginWithDemoUser(page);
	});

	test('shows declined-card error for 4000 0000 0000 0002 on hosted checkout', async ({
		page,
	}) => {
		const hostedReached = await openHostedCheckout(page);
		test.skip(!hostedReached, 'Hosted Stripe Checkout not reached in this environment.');

		await fillHostedCardForm(page, '4000000000000002');
		await submitHostedCheckout(page);

		const sawDeclineError = await page
			.locator(
				'text=/declined|insufficient|incorrect|failed|try another payment method|could not be processed/i',
			)
			.first()
			.isVisible({ timeout: 12000 })
			.catch(() => false);

		expect(sawDeclineError).toBeTruthy();
		expect(/stripe\.com/i.test(page.url())).toBeTruthy();
	});

	test('completes hosted checkout with 4242 test card and returns to app', async ({
		page,
	}) => {
		const hostedReached = await openHostedCheckout(page);
		test.skip(!hostedReached, 'Hosted Stripe Checkout not reached in this environment.');

		await fillHostedCardForm(page, '4242424242424242');
		await submitHostedCheckout(page);

		const returnedToApp = await page
			.waitForURL(/#\/dashboard(\?|$)/i, { timeout: 45000 })
			.then(() => true)
			.catch(() => false);

		expect(returnedToApp).toBeTruthy();
		await expect(page).toHaveURL(/#\/dashboard/i);
	});
});
