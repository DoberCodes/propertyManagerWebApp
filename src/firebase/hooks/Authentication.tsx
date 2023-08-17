import { createUserWithEmailAndPassword } from 'firebase/auth';
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
	console.log({
		username,
		password,
		firstName,
		lastName,
		householdName,
	});
	// await createUserWithEmailAndPassword(auth, username, password)
	// 	.then((userCred) => {
	// 		const user = userCred.user;
	// 		console.log(user);
	// 	})
	// 	.catch((error) => {
	// 		const errorCode = error.code;
	// 		const errorMessage = error.message;
	// 		console.log(errorCode, errorMessage);
	// 	});
	await createUserWithEmailAndPassword(auth, username, password)
		.then(async (userCred) => {
			const user = userCred.user;
			const docRef = await setDoc(doc(db, 'users', user.uid), {
				uid: user.uid,
				// familyName: familyName,
				firstName: firstName,
				lastName: lastName,
				authProvider: 'local',
				email: username,
			});
			console.log(docRef);
			console.log(user);
		})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode, errorMessage);
		});
};
