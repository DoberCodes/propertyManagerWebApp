import { isNativeApp, isWebPlatform, getPlatform } from './platform';
import { Capacitor } from '@capacitor/core';

jest.mock('@capacitor/core', () => ({
	Capacitor: {
		isNativePlatform: jest.fn(),
		getPlatform: jest.fn(),
	},
}));

describe('platform utility functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('isNativeApp', () => {
		it('should return true when running on native platform', () => {
			(Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
			expect(isNativeApp()).toBe(true);
		});

		it('should return false when not on native platform', () => {
			(Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
			expect(isNativeApp()).toBe(false);
		});
	});

	describe('isWebPlatform', () => {
		it('should return true when running on web platform', () => {
			(Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
			expect(isWebPlatform()).toBe(true);
		});

		it('should return false when running on native platform', () => {
			(Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
			expect(isWebPlatform()).toBe(false);
		});
	});

	describe('getPlatform', () => {
		it('should return platform from Capacitor', () => {
			(Capacitor.getPlatform as jest.Mock).mockReturnValue('web');
			expect(getPlatform()).toBe('web');
		});

		it('should return ios platform', () => {
			(Capacitor.getPlatform as jest.Mock).mockReturnValue('ios');
			expect(getPlatform()).toBe('ios');
		});

		it('should return android platform', () => {
			(Capacitor.getPlatform as jest.Mock).mockReturnValue('android');
			expect(getPlatform()).toBe('android');
		});
	});
});
