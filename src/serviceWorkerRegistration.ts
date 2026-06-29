const isLocalhost = Boolean(
	window.location.hostname === 'localhost' ||
		window.location.hostname === '[::1]' ||
		window.location.hostname.match(
			/^127(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/,
		),
);

export const registerMaintleyServiceWorker = () => {
	if (process.env.NODE_ENV !== 'production') {
		return;
	}

	if (!('serviceWorker' in navigator)) {
		return;
	}

	window.addEventListener('load', () => {
		const serviceWorkerUrl = '/service-worker.js';

		if (isLocalhost) {
			navigator.serviceWorker
				.register(serviceWorkerUrl)
				.then((registration) => {
					registration.update();
				})
				.catch((error) => {
					console.warn('Maintley service worker registration failed.', error);
				});
			return;
		}

		navigator.serviceWorker.register(serviceWorkerUrl).catch((error) => {
			console.warn('Maintley service worker registration failed.', error);
		});
	});
};
