import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
    *, *::before, *::after {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 100%;
	font: inherit;
	vertical-align: baseline;
	box-sizing: border-box;
	}

    html {
        scroll-behavior: smooth;
    }

`;

export const nav_height = '70px';
export const footer_height = '300px';

export const blue = '#10b981';

export const font_title = '28px';
export const font_main = '18px';

export const Flexbox = styled.div<{ span?: any }>`
	@media only screen and (min-width: 768px) {
		width: ${(props) => (props.span ? (props.span / 12) * 100 : '25%')};
	}
`;

export default GlobalStyles;
