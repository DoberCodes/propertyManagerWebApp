import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './Redux/store';
import App from './App';

test('renders app', () => {
	render(
		<Provider store={store}>
			<App />
		</Provider>,
	);
	// Basic test that app renders without crashing
	expect(document.body).toBeInTheDocument();
});
