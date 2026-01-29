import styled, { createGlobalStyle } from 'styled-components';
import { COLORS } from './constants/colors';

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
        background-color: ${COLORS.bgLight};
        color: ${COLORS.textPrimary};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }

    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }

    ::-webkit-scrollbar-track {
        background: ${COLORS.gray100};
    }

    ::-webkit-scrollbar-thumb {
        background: ${COLORS.gray300};
        border-radius: 4px;

        &:hover {
            background: ${COLORS.gray400};
        }
    }

    /* Selection styling */
    ::selection {
        background-color: ${COLORS.primaryLight};
        color: ${COLORS.textPrimary};
    }

`;

export const nav_height = '70px';
export const footer_height = '300px';

export const blue = '${COLORS.primary}';

export const font_title = '28px';
export const font_main = '18px';

export const Flexbox = styled.div<{ span?: any }>`
	@media only screen and (min-width: 768px) {
		width: ${(props) => (props.span ? (props.span / 12) * 100 : '25%')};
	}
`;

export default GlobalStyles;
