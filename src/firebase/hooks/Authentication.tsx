import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from 'firebase/auth';
import { redirect } from 'react-router-dom';
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
			const payload = {
				uid: user.uid,
				householdName: householdName,
				firstName: firstName,
				lastName: lastName,
				authProvider: 'local',
				email: username,
			};
			await setDoc(doc(db, 'users', user.uid), payload);
			redirect('/Home');
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode, errorMessage);
		});
};

export const signIn = (email: string, password: string) => {
	signInWithEmailAndPassword(auth, email, password)
		.then(() => {
			redirect('/Home');
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode + errorMessage);
		});
};
