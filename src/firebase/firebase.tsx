import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
	apiKey: 'AIzaSyA9GFGDdmPvRZYZI9GMlYLM7ZmRVYRu6ws',
	authDomain: 'adhomemaint.firebaseapp.com',
	projectId: 'adhomemaint',
	storageBucket: 'adhomemaint.appspot.com',
	messagingSenderId: '188924492418',
	appId: '1:188924492418:web:94f56e2d5963661642929b',
	measurementId: 'G-VYYFKM5R5M',
};

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
