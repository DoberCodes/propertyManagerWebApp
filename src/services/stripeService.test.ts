import {
	createCheckoutSession,
	handleCheckoutSuccess,
} from './stripeService';
import { httpsCallable } from 'firebase/functions';

jest.mock('firebase/functions', () => ({
	httpsCallable: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
	functions: { app: 'test-functions-app' },
}));

describe('stripeService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('creates checkout session with expected payload and returns URL', async () => {
		const callableMock = jest.fn().mockResolvedValue({
			data: {
				sessionId: 'cs_test_123',
				url: 'https://checkout.stripe.com/c/pay/cs_test_123',
			},
		});

		(httpsCallable as jest.Mock).mockReturnValue(callableMock);

		const result = await createCheckoutSession(
			'price_test_123',
			'user_123',
			'user@example.com',
		);

		expect(httpsCallable).toHaveBeenCalledWith(
			expect.anything(),
			'createCheckoutSession',
		);
		expect(callableMock).toHaveBeenCalledWith(
			expect.objectContaining({
				priceId: 'price_test_123',
				userId: 'user_123',
				email: 'user@example.com',
			}),
		);
		expect(result).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
	});

	it('includes trialEnd when provided', async () => {
		const callableMock = jest.fn().mockResolvedValue({
			data: {
				sessionId: 'cs_test_456',
				url: 'https://checkout.stripe.com/c/pay/cs_test_456',
			},
		});

		(httpsCallable as jest.Mock).mockReturnValue(callableMock);

		await createCheckoutSession(
			'price_test_456',
			'user_456',
			'user2@example.com',
			1730000000,
		);

		expect(callableMock).toHaveBeenCalledWith(
			expect.objectContaining({
				trialEnd: 1730000000,
			}),
		);
	});

	it('verifies checkout success via verifyCheckoutSession callable', async () => {
		const verifyResult = {
			success: true,
			subscriptionStatus: 'active',
		};
		const callableMock = jest.fn().mockResolvedValue({ data: verifyResult });

		(httpsCallable as jest.Mock).mockReturnValue(callableMock);

		const result = await handleCheckoutSuccess('cs_test_success_123');

		expect(httpsCallable).toHaveBeenCalledWith(
			expect.anything(),
			'verifyCheckoutSession',
		);
		expect(callableMock).toHaveBeenCalledWith({
			sessionId: 'cs_test_success_123',
		});
		expect(result).toEqual(verifyResult);
	});
});
