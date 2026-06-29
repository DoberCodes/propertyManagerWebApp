import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import { store } from './Redux/store';
import App from './App';
import GlobalStyles from './global.styles';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { registerMaintleyServiceWorker } from './serviceWorkerRegistration';
if (process.env.NODE_ENV === 'development') {
	import('./utils/testFirebase');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
	throw new Error('Failed to find the root element');
}
const root = ReactDOM.createRoot(rootElement);
root.render(
	<React.StrictMode>
		<Provider store={store}>
			<StyleSheetManager
				shouldForwardProp={(prop: string) =>
					isPropValid(prop) && prop !== 'variant'
				}>
				<GlobalStyles />
				<App />
			</StyleSheetManager>
		</Provider>
	</React.StrictMode>,
);

// If needed later, web vitals can be sent to an analytics endpoint.
reportWebVitals();
registerMaintleyServiceWorker();
