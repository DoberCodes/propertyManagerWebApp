const CACHE_VERSION = 'maintley-pwa-v1';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const APP_SHELL_URLS = [
	'/',
	'/index.html',
	'/offline.html',
	'/manifest.json',
	'/favicon.ico',
	'/favicon.svg',
	'/favicon-16x16.png',
	'/favicon-32x32.png',
	'/apple-touch-icon.png',
	'/mstile-150x150.png',
	'/icons/icon-48.png',
	'/icons/icon-72.png',
	'/icons/icon-96.png',
	'/icons/icon-128.png',
	'/icons/icon-192.png',
	'/icons/icon-256.png',
	'/icons/icon-512.png',
	'/icons/maskable-icon-192.png',
	'/icons/maskable-icon-512.png',
];

const isSameOrigin = (url) => url.origin === self.location.origin;

const isStaticAsset = (url) =>
	isSameOrigin(url) &&
	(url.pathname.startsWith('/static/') ||
		url.pathname.startsWith('/icons/') ||
		url.pathname === '/manifest.json' ||
		url.pathname === '/favicon.ico' ||
		url.pathname === '/favicon.svg' ||
		url.pathname === '/favicon-16x16.png' ||
		url.pathname === '/favicon-32x32.png' ||
		url.pathname === '/apple-touch-icon.png' ||
		url.pathname === '/mstile-150x150.png');

const isCacheableResponse = (response) =>
	response && response.ok && response.type === 'basic';

const resolveNotificationTargetUrl = (data = {}) => {
	const rawUrl = data.actionUrl || data.url || data.click_action || '/';
	try {
		return new URL(rawUrl, self.location.origin).href;
	} catch (error) {
		return self.location.origin;
	}
};

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(APP_SHELL_CACHE)
			.then((cache) => cache.addAll(APP_SHELL_URLS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) =>
				Promise.all(
					cacheNames
						.filter((cacheName) => !cacheName.startsWith(CACHE_VERSION))
						.map((cacheName) => caches.delete(cacheName)),
				),
			)
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;

	if (request.method !== 'GET') {
		return;
	}

	const url = new URL(request.url);

	if (!isSameOrigin(url)) {
		return;
	}

	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request).catch(() => caches.match('/offline.html')),
		);
		return;
	}

	if (!isStaticAsset(url)) {
		return;
	}

	event.respondWith(
		caches.match(request).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(request).then((networkResponse) => {
				if (isCacheableResponse(networkResponse)) {
					const responseClone = networkResponse.clone();
					caches.open(STATIC_CACHE).then((cache) => {
						cache.put(request, responseClone);
					});
				}
				return networkResponse;
			});
		}),
	);
});

self.addEventListener('push', (event) => {
	if (!event.data) {
		return;
	}

	let payload = {};
	try {
		payload = event.data.json();
	} catch (error) {
		payload = {
			notification: {
				title: 'Maintley',
				body: event.data.text(),
			},
		};
	}

	const notification = payload.notification || {};
	const data = payload.data || {};
	const title = notification.title || data.title || 'Maintley';
	const options = {
		body: notification.body || data.message || '',
		icon: notification.icon || '/icons/icon-192.png',
		badge: notification.badge || '/icons/icon-192.png',
		data,
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const targetUrl = resolveNotificationTargetUrl(event.notification.data);

	event.waitUntil(
		self.clients
			.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				for (const client of clientList) {
					if ('focus' in client && client.url === targetUrl) {
						return client.focus();
					}
				}

				if (self.clients.openWindow) {
					return self.clients.openWindow(targetUrl);
				}
				return undefined;
			}),
	);
});
