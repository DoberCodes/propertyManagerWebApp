import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
    * {
        margin: 0;
        padding: 0;
    }

    html {
        scroll-behavior: smooth;
    }

`;

export const nav_height = '100px';
export const footer_height = '300px';

export const blue = '#4169E1';

export const font_title = '28px';
export const font_main = '18px';

export default GlobalStyles;
