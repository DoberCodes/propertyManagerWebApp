import styled from 'styled-components';

export const Wrapper = styled.div<{ background?: string }>`
	height: 100%;
	width: 100%;
	max-width: 1440px;
	margin: 0 auto;
	padding: 100px 0 100px 0;
	min-height: 500px;
	background-color: ${(props) => props.background};
`;
