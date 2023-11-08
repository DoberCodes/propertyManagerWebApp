import styled from 'styled-components';

export const Wrapper = styled.div<{ background?: string }>`
	height: 100%;
	width: 100%;
	max-width: 1440px;
	margin: 0 auto;
	min-height: 500px;
	scroll-margin-top: 100px;
	background-color: ${(props) => props.background};
`;
