import { auth } from '../config/firebase';

/**
 * Test Firebase connection and authentication
 * Run this in the browser console to verify Firebase is working
 */
export const testFirebaseConnection = () => {
	console.log('=== Firebase Connection Test ===');
	console.log('Auth instance:', auth);
	console.log('Auth currentUser:', auth.currentUser);
	console.log('Auth app name:', auth.app.name);
	console.log('Auth config:', {
		apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
		authDomain: auth.app.options.authDomain,
		projectId: auth.app.options.projectId,
	});

	if (!auth.app.options.apiKey || auth.app.options.apiKey === 'YOUR_API_KEY') {
		console.error('❌ Firebase not configured! Check your .env file');
		return false;
	}

	console.log('✅ Firebase is configured correctly');
	return true;
};

// Export for window access
if (typeof window !== 'undefined') {
	(window as any).testFirebase = testFirebaseConnection;
}
