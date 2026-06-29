export type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PromptListener = (event: BeforeInstallPromptEvent | null) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let initialized = false;
const listeners = new Set<PromptListener>();

const notifyListeners = () => {
	listeners.forEach((listener) => listener(deferredPrompt));
};

export const initializePwaInstallPromptCapture = () => {
	if (initialized || typeof window === 'undefined') {
		return;
	}

	initialized = true;

	window.addEventListener('beforeinstallprompt', (event: Event) => {
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
		notifyListeners();
	});

	window.addEventListener('appinstalled', () => {
		deferredPrompt = null;
		notifyListeners();
	});
};

export const getDeferredPwaInstallPrompt = () => deferredPrompt;

export const clearDeferredPwaInstallPrompt = () => {
	deferredPrompt = null;
	notifyListeners();
};

export const subscribeToPwaInstallPrompt = (listener: PromptListener) => {
	listeners.add(listener);
	listener(deferredPrompt);

	return () => {
		listeners.delete(listener);
	};
};
