import {
	describeStripeDiscount,
	getStripeBillingPresentation,
} from './billingDisclosure';
import type { BillingDisclosure } from '../Redux/Slices/userSlice';

const disclosure = (overrides: Partial<BillingDisclosure> = {}): BillingDisclosure => ({
	source: 'stripe',
	status: 'active',
	priceId: 'price_portfolio',
	productId: 'prod_portfolio',
	currency: 'usd',
	interval: 'month',
	intervalCount: 1,
	quantity: 1,
	listAmountMinor: 2399,
	currentPeriodEnd: 1784952000,
	cancelAtPeriodEnd: false,
	discount: null,
	nextInvoice: {
		amountDueMinor: 2399,
		currency: 'usd',
		dueAt: 1784952000,
	},
	syncedAt: '2026-07-25T00:00:00.000Z',
	...overrides,
});

test('describes a forever percentage discount without implying a future charge', () => {
	const foreverDiscount: BillingDisclosure['discount'] = {
		couponId: 'coupon_100',
		name: 'Founder access',
		percentOff: 100,
		amountOffMinor: null,
		currency: null,
		duration: 'forever',
		durationInMonths: null,
		startsAt: 1,
		endsAt: null,
	};

	expect(describeStripeDiscount(foreverDiscount)).toBe(
		'100% off for the life of this subscription',
	);
	const presentation = getStripeBillingPresentation(
		disclosure({
			discount: foreverDiscount,
			nextInvoice: { amountDueMinor: 0, currency: 'usd', dueAt: 1784952000 },
		}),
	);
	expect(presentation.listPriceLabel).toBe('$23.99 per month');
	expect(presentation.nextInvoiceLabel).toContain('$0.00');
});

test('describes a repeating discount and scheduled cancellation', () => {
	const presentation = getStripeBillingPresentation(
		disclosure({
			cancelAtPeriodEnd: true,
			discount: {
				couponId: 'coupon_repeat',
				name: null,
				percentOff: 50,
				amountOffMinor: null,
				currency: null,
				duration: 'repeating',
				durationInMonths: 3,
				startsAt: 1,
				endsAt: 1784952000,
			},
		}),
	);

	expect(presentation.discountLabel).toContain('50% off through');
	expect(presentation.renewalLabel).toContain('Scheduled to end');
});
