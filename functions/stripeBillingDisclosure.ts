import Stripe from 'stripe';

export interface StripeBillingDisclosure {
	source: 'stripe';
	status: string;
	priceId: string | null;
	productId: string | null;
	currency: string;
	interval: 'day' | 'week' | 'month' | 'year' | null;
	intervalCount: number | null;
	quantity: number;
	listAmountMinor: number | null;
	currentPeriodEnd: number | null;
	cancelAtPeriodEnd: boolean;
	discount: {
		couponId: string;
		name: string | null;
		percentOff: number | null;
		amountOffMinor: number | null;
		currency: string | null;
		duration: 'forever' | 'once' | 'repeating';
		durationInMonths: number | null;
		startsAt: number;
		endsAt: number | null;
	} | null;
	nextInvoice: {
		amountDueMinor: number;
		currency: string;
		dueAt: number | null;
	} | null;
	syncedAt: string;
}

const expandedDiscount = (
	subscription: Stripe.Subscription,
): Stripe.Discount | null => {
	const discountFromList = subscription.discounts?.find(
		(discount): discount is Stripe.Discount =>
			typeof discount === 'object' && discount !== null,
	);
	return discountFromList || subscription.discount || null;
};

const productIdFromPrice = (price: Stripe.Price | null): string | null => {
	if (!price?.product) return null;
	return typeof price.product === 'string'
		? price.product
		: price.product.id;
};

export const buildStripeBillingDisclosure = async (
	stripe: Stripe,
	subscription: Stripe.Subscription,
): Promise<StripeBillingDisclosure> => {
	const item = subscription.items.data[0] || null;
	const price = item?.price || null;
	const discount = expandedDiscount(subscription);
	const coupon = discount?.coupon || null;
	const customerId =
		typeof subscription.customer === 'string'
			? subscription.customer
			: subscription.customer?.id || '';
	let upcomingInvoice: Stripe.UpcomingInvoice | null = null;

	if (
		customerId &&
		['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)
	) {
		try {
			upcomingInvoice = await stripe.invoices.retrieveUpcoming({
				customer: customerId,
				subscription: subscription.id,
			});
		} catch (error) {
			// Stripe has no upcoming invoice for some cancelled, paused, or fully
			// discounted configurations. The remaining subscription facts are still
			// safe and useful to persist.
			upcomingInvoice = null;
		}
	}

	const quantity = Math.max(1, Number(item?.quantity || 1));
	const unitAmount = Number.isFinite(Number(price?.unit_amount))
		? Number(price?.unit_amount)
		: null;
	const dueAt = upcomingInvoice
		? upcomingInvoice.next_payment_attempt || upcomingInvoice.period_end || null
		: null;

	return {
		source: 'stripe',
		status: subscription.status,
		priceId: price?.id || null,
		productId: productIdFromPrice(price),
		currency: String(price?.currency || upcomingInvoice?.currency || 'usd').toLowerCase(),
		interval: price?.recurring?.interval || null,
		intervalCount: price?.recurring?.interval_count || null,
		quantity,
		listAmountMinor: unitAmount === null ? null : unitAmount * quantity,
		currentPeriodEnd: subscription.current_period_end || null,
		cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
		discount:
			discount && coupon
				? {
						couponId: coupon.id,
						name: coupon.name || null,
						percentOff: coupon.percent_off ?? null,
						amountOffMinor: coupon.amount_off ?? null,
						currency: coupon.currency || null,
						duration: coupon.duration,
						durationInMonths: coupon.duration_in_months ?? null,
						startsAt: discount.start,
						endsAt: discount.end || null,
					}
				: null,
		nextInvoice: upcomingInvoice
			? {
					amountDueMinor: upcomingInvoice.amount_due,
					currency: String(upcomingInvoice.currency || price?.currency || 'usd').toLowerCase(),
					dueAt,
				}
			: null,
		syncedAt: new Date().toISOString(),
	};
};
