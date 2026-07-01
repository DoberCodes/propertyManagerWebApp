import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import {
	getAuth,
	setPersistence,
	browserLocalPersistence,
	indexedDBLocalPersistence,
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

// Firebase configuration
// Replace these with your actual Firebase project credentials
const readEnv = (name: string, fallback: string) =>
	process.env[name]?.trim() || fallback;

const firebaseConfig = {
	apiKey: readEnv('REACT_APP_FIREBASE_API_KEY', 'YOUR_API_KEY'),
	authDomain: readEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', 'YOUR_AUTH_DOMAIN'),
	projectId: readEnv('REACT_APP_FIREBASE_PROJECT_ID', 'YOUR_PROJECT_ID'),
	storageBucket:
		readEnv('REACT_APP_FIREBASE_STORAGE_BUCKET', 'YOUR_STORAGE_BUCKET'),
	messagingSenderId:
		readEnv(
			'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
			'YOUR_MESSAGING_SENDER_ID',
		),
	appId: readEnv('REACT_APP_FIREBASE_APP_ID', 'YOUR_APP_ID'),
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
