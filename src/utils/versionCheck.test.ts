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

import {
	getAPKDownloadURL,
	getAPKReleaseAssetName,
	getVersionedAPKDownloadURL,
	setAvailableVersion,
} from './versionCheck';

describe('versionCheck APK release URLs', () => {
	beforeEach(() => {
		localStorage.clear();
		delete process.env.REACT_APP_APK_URL;
	});

	it('builds Maintley versioned APK asset names', () => {
		expect(getAPKReleaseAssetName('2.8.0')).toBe('maintley-2.8.0-release.apk');
	});

	it('builds a versioned GitHub release APK URL by default', () => {
		expect(getVersionedAPKDownloadURL('2.8.0')).toBe(
			'https://github.com/DoberFamilyVentures/propertyManagerWebApp/releases/download/v2.8.0/maintley-2.8.0-release.apk',
		);
	});

	it('uses the available update version for APK downloads', () => {
		setAvailableVersion('2.8.0');

		expect(getAPKDownloadURL()).toBe(
			'https://github.com/DoberFamilyVentures/propertyManagerWebApp/releases/download/v2.8.0/maintley-2.8.0-release.apk',
		);
	});
});
