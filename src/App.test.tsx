// mock axios early to prevent Jest trying to parse the ESM axios package
import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './Redux/store/store';
import App from 'App';

jest.mock('axios', () => ({
	get: jest.fn(),
	post: jest.fn(),
	create: jest.fn(() => ({ get: jest.fn(), post: jest.fn() })),
}));

jest.mock('./router', () => ({
	RouterComponent: () => <div>Router ready</div>,
}));

jest.mock('./Hooks/DataFetchContext', () => ({
	DataFetchProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

jest.mock('./Components/Library/UpdateNotification/UpdateNotification', () => ({
	__esModule: true,
	default: () => null,
	UpdateNotification: () => null,
}));

jest.mock('./services/authSession', () => ({
	onAuthStateChange: () => () => {},
}));

jest.mock('@capacitor/core', () => ({
	Capacitor: {
		isNativePlatform: () => false,
		Plugins: {},
	},
	registerPlugin: jest.fn(),
}));

test('renders app', () => {
	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);

	expect(document.body).toBeInTheDocument();
});
