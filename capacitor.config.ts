import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.maintleyapp',
	appName: 'Maintley',
	webDir: 'build',
	server: {
		cleartext: true,
	},
};

export default config;
