import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from 'firebase/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const createAccount = async (
	username: string,
	password: string,
	firstName: string,
	lastName: string,
	householdName: string
) => {
	await createUserWithEmailAndPassword(auth, username, password)
		.then(async (userCred) => {
			const user = userCred.user;
			await setDoc(doc(db, 'users', user.uid), {
				uid: user.uid,
				householdName: householdName,
				firstName: firstName,
				lastName: lastName,
				authProvider: 'local',
				email: username,
			});
			console.log(user);
			return user;
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode, errorMessage);
		});
};

export const signIn = (email: string, password: string) => {
	console.log('triggered');
	signInWithEmailAndPassword(auth, email, password)
		.then((userCredential) => {
			// Signed in
			const user = userCredential.user;
			console.log(user);
			return user;
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode + errorMessage);
		});
};
