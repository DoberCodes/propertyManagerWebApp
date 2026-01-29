import styled from 'styled-components';

export const Wrapper = styled.ul`
	width: 90%;
	padding: 0;
	margin: 0;

	@media (max-width: 768px) {
		width: 95%;
	}

	@media (max-width: 480px) {
		width: 100%;
		padding: 0 10px;
	}
`;

export const ListItem = styled.li`
	list-style: none;
	text-align: center;
	font-size: 16px;
	margin-top: 10px;

	@media (max-width: 768px) {
		font-size: 14px;
		margin-top: 8px;
	}

	@media (max-width: 480px) {
		font-size: 12px;
		margin-top: 6px;
	}
`;
