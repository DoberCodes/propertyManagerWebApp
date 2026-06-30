import app from './firebase';
import type { Functions, HttpsCallableResult } from 'firebase/functions';

let cachedFunctions: Functions | null = null;
let emulatorConnected = false;

export const getFirebaseFunctions = async (): Promise<Functions> => {
	if (cachedFunctions) return cachedFunctions;

	const { connectFunctionsEmulator, getFunctions } = await import('firebase/functions');
	const functions = getFunctions(app, 'us-central1');
	const functionsEmulatorHost =
		process.env.REACT_APP_FIREBASE_FUNCTIONS_EMULATOR_HOST;

	if (
		!emulatorConnected &&
		process.env.NODE_ENV === 'development' &&
		functionsEmulatorHost
	) {
		const [host, port] = functionsEmulatorHost.split(':');
		const parsedPort = Number(port || 5001);
		if (host && Number.isFinite(parsedPort)) {
			connectFunctionsEmulator(functions, host, parsedPort);
			emulatorConnected = true;
		}
	}

	cachedFunctions = functions;
	return functions;
};

export const callFirebaseFunction = async <RequestData, ResponseData>(
	name: string,
	data: RequestData,
): Promise<HttpsCallableResult<ResponseData>> => {
	const { httpsCallable } = await import('firebase/functions');
	const functions = await getFirebaseFunctions();
	const callable = httpsCallable<RequestData, ResponseData>(functions, name);
	return callable(data);
};
