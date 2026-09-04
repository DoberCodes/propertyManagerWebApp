import styled, { createGlobalStyle } from 'styled-components';
import { COLORS } from './constants/colors';
import { TYPOGRAPHY } from './constants/typography';

const GlobalStyles = createGlobalStyle`
    html {
        scroll-behavior: smooth;
        height: 100%;
    }

    body {
        margin: 0;
        padding: 0;
        background-color: ${COLORS.bgLight};
        color: ${COLORS.textPrimary};
        font-family: ${TYPOGRAPHY.fontFamily};
        font-size: ${TYPOGRAPHY.body.fontSize};
        font-weight: ${TYPOGRAPHY.body.fontWeight};
        line-height: ${TYPOGRAPHY.body.lineHeight};
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        display: flex;
        flex-direction: column;
        min-height: 100%;
    }

    #root {
        width: 100%;
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    *, *::before, *::after {
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 100%;
	font: inherit;
	vertical-align: baseline;
	box-sizing: border-box;
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

    @media (max-width: 768px), (pointer: coarse) {
        button:not([data-inline-action='true']),
        [role='button'],
        input:not([type='checkbox']):not([type='radio']),
        select {
            min-height: 44px;
        }

        input[type='checkbox'],
        input[type='radio'] {
            min-width: 24px;
            min-height: 24px;
        }
    }

`;

export const nav_height = '90px';
export const footer_height = '300px';

export const font_title = '28px';
export const font_main = TYPOGRAPHY.body.fontSize;

export const Flexbox = styled.div<{ span?: any }>`
	@media only screen and (min-width: 768px) {
		width: ${(props) => (props.span ? (props.span / 12) * 100 : '25%')};
	}
`;

export const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: ${COLORS.textPrimary};

    &:hover {
        color: ${COLORS.primary};
        cursor: pointer;
    }
`;

export const Toolbar = styled.div`
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
`;

export const ToolbarItem = styled(IconWrapper)`
    height: 32px;
    width: 32px;
    background-color: ${COLORS.bgLight};
    border: 1px solid ${COLORS.gray300};

    &:hover {
        background-color: ${COLORS.primaryLight};
        border-color: ${COLORS.primary};
    }

    @media (max-width: 640px) {
        margin: 10px
    }
`;

export default GlobalStyles;
