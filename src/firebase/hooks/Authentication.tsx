import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from 'firebase/auth';
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
	return await createUserWithEmailAndPassword(auth, username, password)
		.then(async (userCred) => {
			const user = userCred.user;
			const payload = {
				uid: user.uid,
				householdName: householdName,
				firstName: firstName,
				lastName: lastName,
				authProvider: 'local',
				email: username,
			};
			await setDoc(doc(db, 'users', user.uid), payload);
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode, errorMessage);
		});
};

export const signIn = (email: string, password: string) => {
	return signInWithEmailAndPassword(auth, email, password).catch((error) => {
		const errorCode = error.code;
		const errorMessage = error.message;
		console.log(errorCode + errorMessage);
	});
};
