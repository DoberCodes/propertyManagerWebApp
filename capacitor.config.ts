import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.doberfamily.propertymanager',
	appName: 'Property Manager',
	webDir: 'build',
	server: {
		cleartext: true,
	},
};

export default config;
