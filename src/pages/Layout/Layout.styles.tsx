import styled from 'styled-components';
import { nav_height } from '../../global.styles';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	min-height: 100vh; /* Ensure at least full viewport height */
	padding-top: env(safe-area-inset-top);
	padding-bottom: env(safe-area-inset-bottom);

	@media (max-width: 1024px) {
		width: 100%;
	}
`;

export const Main = styled.div`
	display: flex;
	flex: 1;
	height: calc(
		100vh - ${nav_height}
	); /* Use fixed height to ensure full viewport usage */
	overflow: hidden;
	flex-direction: row;
	min-height: 0; /* Allow flex items to shrink below their minimum content size */

	@media (max-width: 768px) {
		flex-direction: column;
		height: calc(100vh - ${nav_height} - 70px);
	}
`;

export const Sidebar = styled.div`
	width: 250px;
	min-width: 250px;
	height: 100vh; /* Ensure sidebar spans full height */
	flex-shrink: 0; /* Prevent sidebar from shrinking */
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
		display: none;
	}
`;

export const Content = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	padding: 20px;
	background-color: #ffffff;
	padding-bottom: 70px;

	@media (max-width: 768px) {
		padding: 15px;
		padding-bottom: 85px;
	}

	@media (max-width: 480px) {
		padding: 10px;
		padding-bottom: 85px;
	}
`;
