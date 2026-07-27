import {
	getGooglePlayStoreURL,
	getUpdateDestinationURL,
	setAvailableVersion,
} from './versionCheck';

jest.mock('../Redux/API/apiSlice', () => ({
	apiSlice: {
		endpoints: {
			getAppVersion: {
				initiate: jest.fn(),
			},
		},
	},
}));

jest.mock('../Redux/store', () => ({
	store: {
		dispatch: jest.fn(),
	},
}));

jest.mock('@capacitor/core', () => ({
	Capacitor: {
		isNativePlatform: jest.fn(() => false),
	},
}));

jest.mock('@capacitor/browser', () => ({
	Browser: {
		open: jest.fn(),
	},
}));

jest.mock('../config/appVersion', () => ({
	CURRENT_APP_VERSION: '2.7.24',
}));

describe('versionCheck Android update destination', () => {
	beforeEach(() => {
		localStorage.clear();
		delete process.env.REACT_APP_PLAY_STORE_URL;
	});

	it('uses the Maintley Google Play listing by default', () => {
		expect(getGooglePlayStoreURL()).toBe(
			'https://play.google.com/store/apps/details?id=com.maintleyapp',
		);
		expect(getUpdateDestinationURL()).toBe(
			'https://play.google.com/store/apps/details?id=com.maintleyapp',
		);
	});

	it('uses a configured Play Store URL when provided', () => {
		process.env.REACT_APP_PLAY_STORE_URL =
			'https://play.google.com/store/apps/details?id=com.example';

		expect(getGooglePlayStoreURL()).toBe(
			'https://play.google.com/store/apps/details?id=com.example',
		);
	});

	it('prefers the published Play Store URL from version metadata', () => {
		process.env.REACT_APP_PLAY_STORE_URL =
			'https://play.google.com/store/apps/details?id=com.example';
		setAvailableVersion('2.8.0', {
			playStoreUrl:
				'https://play.google.com/store/apps/details?id=com.maintleyapp',
		});

		expect(getUpdateDestinationURL()).toBe(
			'https://play.google.com/store/apps/details?id=com.maintleyapp',
		);
	});
});
