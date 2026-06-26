// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

if (typeof global.setImmediate === 'undefined') {
	global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
}

if (typeof global.clearImmediate === 'undefined') {
	global.clearImmediate = (id) => clearTimeout(id);
}

// jsdom does not implement scrollTo on DOM elements. Stub it out so components
// that call ref.current?.scrollTo() in a useEffect do not throw in tests.
if (typeof window !== 'undefined') {
	Element.prototype.scrollTo = Element.prototype.scrollTo || function () {};
	window.scrollTo = window.scrollTo || function () {};
}

// jsdom does not provide IntersectionObserver. Components use it only to
// respond to browser visibility changes, so a no-op implementation is enough
// for deterministic component tests.
if (typeof global.IntersectionObserver === 'undefined') {
	global.IntersectionObserver = class IntersectionObserver {
		constructor() {}
		observe() {}
		unobserve() {}
		disconnect() {}
	};
}
