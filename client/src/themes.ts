import { DefaultTheme } from 'styled-components';

declare module 'styled-components' {
	export interface DefaultTheme {
		bg2: string;
		text: string;
	}
}

export const lightTheme: DefaultTheme = {
	bg2: '#ffffff',
	text: '#000000',
};

export const darkTheme: DefaultTheme = {
	bg2: '#1a1a1a',
	text: '#ffffff',
};
