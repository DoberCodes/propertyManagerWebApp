import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
	getAuth,
	setPersistence,
	browserLocalPersistence,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

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

// Set auth persistence to LOCAL (persists across browser sessions)
setPersistence(auth, browserLocalPersistence).catch((error) => {
	console.error('Error setting auth persistence:', error);
});

export default app;
