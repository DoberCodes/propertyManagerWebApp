import { test as setup } from '@playwright/test';
import { mkdirSync } from 'fs';
import path from 'path';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { getDemoCredentials, loginWithDemoUser } from './auth.helper';

const authFile = path.join('.auth', 'demo-user.json');

const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const hasFirebaseConfig = () =>
	Boolean(
		firebaseConfig.apiKey &&
			firebaseConfig.authDomain &&
			firebaseConfig.projectId &&
			firebaseConfig.appId,
	);

const runDemoPermissionPreflight = async () => {
	if (!hasFirebaseConfig()) {
		console.warn('[e2e preflight] Skipping RBAC preflight: missing Firebase config env vars.');
		return;
	}

	const app = getApps()[0] || initializeApp(firebaseConfig);
	const auth = getAuth(app);
	const db = getFirestore(app);

	const { email, password } = getDemoCredentials();
	const credential = await signInWithEmailAndPassword(auth, email, password);
	const uid = credential.user.uid;

	const userDocRef = doc(db, 'users', uid);
	const userDocSnapshot = await getDoc(userDocRef);
	const userData = userDocSnapshot.data() || {};
	const accountId = String(userData.accountId || '').trim();
	const userRole = String(userData.role || '').trim() || '(none)';

	let membershipDocFound = false;
	let membershipStatus = '(missing)';
	let membershipRoles = '(missing)';

	if (accountId) {
		const membershipId = `${accountId}_${uid}`;
		const membershipDocRef = doc(db, 'accountMemberships', membershipId);
		const membershipSnapshot = await getDoc(membershipDocRef);
		membershipDocFound = membershipSnapshot.exists();
		if (membershipDocFound) {
			const membershipData = membershipSnapshot.data() || {};
			membershipStatus = String(membershipData.status || 'active');
			membershipRoles = Array.isArray(membershipData.roles)
				? membershipData.roles.join(', ')
				: '(none)';
		}
	}

	console.log('[e2e preflight] Demo auth context:');
	console.log(`  uid=${uid}`);
	console.log(`  user.email=${email}`);
	console.log(`  user.accountId=${accountId || '(missing)'}`);
	console.log(`  user.role=${userRole}`);
	console.log(`  membership.exists=${membershipDocFound}`);
	console.log(`  membership.status=${membershipStatus}`);
	console.log(`  membership.roles=${membershipRoles}`);
};

setup('persist demo login state', async ({ page }) => {
	mkdirSync(path.dirname(authFile), { recursive: true });
	await runDemoPermissionPreflight();
	await loginWithDemoUser(page);
	await page.context().storageState({ path: authFile });
});
