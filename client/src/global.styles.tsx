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

	body {
		background: ${({ theme }) => theme.bg2};
		color: ${({ theme }) => theme.text};
		/* fontfamily:  */
		letter-spacing: .6px;
	}

`;

export const nav_height = '100px';
export const footer_height = '300px';

export const blue = '#4169E1';

export const font_title = '28px';
export const font_main = '18px';

export const Flexbox = styled.div<{ span?: any }>`
	@media only screen and (min-width: 768px) {
		width: ${(props) => (props.span ? (props.span / 12) * 100 : '25%')};
	}
`;

export default GlobalStyles;
