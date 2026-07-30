import type { BillingDisclosure } from '../Redux/Slices/userSlice';

export const formatBillingAmount = (
	amountMinor: number | null | undefined,
	currency = 'usd',
): string | null => {
	if (!Number.isFinite(Number(amountMinor))) return null;
	return new Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: String(currency || 'usd').toUpperCase(),
	}).format(Number(amountMinor) / 100);
};

export const formatBillingDate = (
	timestampSeconds: number | null | undefined,
): string | null => {
	if (!Number.isFinite(Number(timestampSeconds)) || Number(timestampSeconds) <= 0) {
		return null;
	}
	return new Date(Number(timestampSeconds) * 1000).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
};

export const describeStripeDiscount = (
	discount: BillingDisclosure['discount'],
	currency = 'usd',
): string | null => {
	if (!discount) return null;
	const amount =
		discount.percentOff !== null
			? `${discount.percentOff}% off`
			: discount.amountOffMinor !== null
				? `${formatBillingAmount(
						discount.amountOffMinor,
						discount.currency || currency,
					) || 'Discount'} off`
				: 'Discount applied';

	if (discount.duration === 'forever') return `${amount} for the life of this subscription`;
	if (discount.duration === 'once') return `${amount} on the first invoice`;
	if (discount.endsAt) {
		return `${amount} through ${formatBillingDate(discount.endsAt)}`;
	}
	if (discount.durationInMonths) {
		return `${amount} for ${discount.durationInMonths} month${discount.durationInMonths === 1 ? '' : 's'}`;
	}
	return amount;
};

export const getStripeBillingPresentation = (
	disclosure: BillingDisclosure | undefined,
) => {
	if (!disclosure) {
		return {
			listPriceLabel: null,
			discountLabel: null,
			renewalLabel: null,
			nextInvoiceLabel: null,
		};
	}

	const listAmount = formatBillingAmount(
		disclosure.listAmountMinor,
		disclosure.currency,
	);
	const interval = disclosure.interval
		? `${disclosure.intervalCount && disclosure.intervalCount > 1 ? `${disclosure.intervalCount} ` : ''}${disclosure.interval}${disclosure.intervalCount && disclosure.intervalCount > 1 ? 's' : ''}`
		: null;
	const periodEnd = formatBillingDate(disclosure.currentPeriodEnd);
	const nextInvoiceAmount = formatBillingAmount(
		disclosure.nextInvoice?.amountDueMinor,
		disclosure.nextInvoice?.currency || disclosure.currency,
	);
	const nextInvoiceDate = formatBillingDate(
		disclosure.nextInvoice?.dueAt || disclosure.currentPeriodEnd,
	);

	return {
		listPriceLabel: listAmount
			? `${listAmount}${interval ? ` per ${interval}` : ''}`
			: null,
		discountLabel: describeStripeDiscount(disclosure.discount, disclosure.currency),
		renewalLabel: disclosure.cancelAtPeriodEnd
			? `Scheduled to end${periodEnd ? ` on ${periodEnd}` : ''}`
			: periodEnd
				? `Renews on ${periodEnd}`
				: null,
		nextInvoiceLabel:
			nextInvoiceAmount && nextInvoiceDate
				? `${nextInvoiceAmount} on ${nextInvoiceDate}`
				: nextInvoiceAmount,
	};
};
