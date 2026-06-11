import styled from 'styled-components';

export const Wrapper = styled.div`
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100vh;
	min-height: 100vh;
	overflow: hidden;
	padding-bottom: 0;
	background-color: #fafafa;

	@supports (height: 100dvh) {
		height: 100dvh;
		min-height: 100dvh;
	}

	@media (max-width: 1024px) {
		width: 100%;
	}
`;

export const Main = styled.div`
	display: flex;
	flex: 1;
	height: 100%; /* Use full height of Wrapper */
	min-height: 0;
	overflow: hidden;
	flex-direction: row;

	@media (max-width: 1024px) {
		flex-direction: column;
		height: 100%;
	}
`;

export const Sidebar = styled.div`
	width: 250px;
	min-width: 250px;
	height: 100%; /* Match height of Main */
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

	@media (max-width: 1024px) {
		display: none;
	}
`;

export const Content = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	height: 100%; /* Match height of Main */
	min-height: 0;
	overflow-y: auto;
	padding: 20px;
	background-color: #fafafa; /* match TeamPage off-white */

	padding-bottom: max(16px, calc(8px + env(safe-area-inset-bottom)));

	@media (max-width: 1024px) {
		padding: 15px;
		padding-bottom: max(18px, calc(12px + env(safe-area-inset-bottom)));
	}

	@media (max-width: 480px) {
		padding: 10px;
		padding-bottom: max(18px, calc(12px + env(safe-area-inset-bottom)));
	}
`;
