import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100vw;
	height: 100vh;

	@media (max-width: 1024px) {
		width: 100%;
	}
`;

export const Main = styled.div`
	display: flex;
	flex: 1;
	overflow: hidden;
	flex-direction: row;

	@media (max-width: 768px) {
		flex-direction: column;
	}
`;

export const Sidebar = styled.div`
	width: 250px;
	min-width: 250px;
	height: 100%;
	overflow-y: auto;
	border-right: 1px solid #e5e7eb;
	background-color: #fefefe;
	display: flex;
	flex-direction: column;

	@media (max-width: 1024px) {
		width: 200px;
		min-width: 200px;
	}

	@media (max-width: 768px) {
		width: 100%;
		min-width: 100%;
		height: auto;
		max-height: 200px;
		border-right: none;
		border-bottom: 1px solid #e5e7eb;
		overflow-x: auto;
		flex-direction: row;
	}

	@media (max-width: 480px) {
		max-height: 150px;
	}
`;

export const Content = styled.div`
	flex: 1;
	height: 100%;
	overflow-y: auto;
	padding: 20px;
	background-color: #ffffff;

	@media (max-width: 768px) {
		padding: 15px;
	}

	@media (max-width: 480px) {
		padding: 10px;
	}
`;
