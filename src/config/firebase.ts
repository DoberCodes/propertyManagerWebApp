import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
	getAuth,
	setPersistence,
	browserLocalPersistence,
	indexedDBLocalPersistence,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';

// Firebase configuration
// Replace these with your actual Firebase project credentials
const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'YOUR_API_KEY',
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'YOUR_AUTH_DOMAIN',
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
	storageBucket:
		process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'YOUR_STORAGE_BUCKET',
	messagingSenderId:
		process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
		'YOUR_MESSAGING_SENDER_ID',
	appId: process.env.REACT_APP_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Set auth persistence based on platform
// Prefer IndexedDB on native, but fall back to localStorage if unavailable
const setAuthPersistence = async () => {
	try {
		if (Capacitor.isNativePlatform()) {
			await setPersistence(auth, indexedDBLocalPersistence);
			console.log(
				'Auth persistence set to IndexedDB for',
				Capacitor.getPlatform(),
			);
			return;
		}

		await setPersistence(auth, browserLocalPersistence);
		console.log('Auth persistence set to localStorage for web');
	} catch (error) {
		console.warn(
			'IndexedDB persistence failed, falling back to localStorage:',
			error,
		);
		try {
			await setPersistence(auth, browserLocalPersistence);
			console.log('Auth persistence fallback set to localStorage');
		} catch (fallbackError) {
			console.error('Error setting fallback auth persistence:', fallbackError);
		}
	}
};

void setAuthPersistence();

export default app;
