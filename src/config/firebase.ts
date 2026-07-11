import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import {
	getAuth,
	setPersistence,
	browserLocalPersistence,
	indexedDBLocalPersistence,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

const placeholderPatterns = [/^YOUR_/i, /^REPLACE_/i, /^TODO$/i, /^changeme$/i];

const testFirebaseConfig: Record<string, string> = {
	REACT_APP_FIREBASE_API_KEY: 'test-api-key',
	REACT_APP_FIREBASE_AUTH_DOMAIN: 'localhost',
	REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
	REACT_APP_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
	REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
	REACT_APP_FIREBASE_APP_ID: 'test-app-id',
};

const isPlaceholderValue = (value: string) =>
	placeholderPatterns.some((pattern) => pattern.test(value.trim()));

const readRequiredEnv = (name: string) => {
	const value = process.env[name]?.trim();

	if (value && !isPlaceholderValue(value)) {
		return value;
	}

	if (process.env.NODE_ENV === 'test') {
		return testFirebaseConfig[name];
	}

	throw new Error(
		`Missing required Firebase configuration value: ${name}. Set this environment variable before building Maintley.`,
	);
};

const firebaseMeasurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID?.trim();

const firebaseConfig = {
	apiKey: readRequiredEnv('REACT_APP_FIREBASE_API_KEY'),
	authDomain: readRequiredEnv('REACT_APP_FIREBASE_AUTH_DOMAIN'),
	projectId: readRequiredEnv('REACT_APP_FIREBASE_PROJECT_ID'),
	storageBucket: readRequiredEnv('REACT_APP_FIREBASE_STORAGE_BUCKET'),
	messagingSenderId:
		readRequiredEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
	appId: readRequiredEnv('REACT_APP_FIREBASE_APP_ID'),
	...(firebaseMeasurementId && !isPlaceholderValue(firebaseMeasurementId)
		? {
				measurementId: firebaseMeasurementId,
		  }
		: {}),
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const isNativePlatform = Capacitor.isNativePlatform();
const shouldForceLongPolling =
	process.env.REACT_APP_FIRESTORE_FORCE_LONG_POLLING === 'true' ||
	isNativePlatform;

// Initialize Firebase services
export const db = initializeFirestore(app, {
	experimentalAutoDetectLongPolling: !shouldForceLongPolling,
	experimentalForceLongPolling: shouldForceLongPolling,
});
export const auth = getAuth(app);

// Set auth persistence based on platform
// Prefer IndexedDB on native, but fall back to localStorage if unavailable
const setAuthPersistence = async () => {
	try {
		if (isNativePlatform) {
			await setPersistence(auth, indexedDBLocalPersistence);
			return;
		}

		await setPersistence(auth, browserLocalPersistence);
	} catch (error) {
		console.warn(
			'IndexedDB persistence failed, falling back to localStorage:',
			error,
		);
		try {
			await setPersistence(auth, browserLocalPersistence);
		} catch (fallbackError) {
			console.error('Error setting fallback auth persistence:', fallbackError);
		}
	}
};

void setAuthPersistence();

export default app;
