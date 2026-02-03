import styled from 'styled-components';

export const AnimatedTip = styled.p`
	font-size: 1.1rem;
	color: #333;
	font-weight: bold;
	text-align: center;
	margin: 15px 0;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const Container = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16px 20px;
	width: 100%;
	height: 100%;
	margin: 0 auto;
	overflow: hidden;
	gap: 12px;

	@media (max-width: 768px) {
		padding: 12px 16px;
	}

	@media (max-width: 480px) {
		padding: 10px 12px;
	}
`;

export const WeatherInfoWrapper = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	width: 100%;

	img {
		width: 60px;
		height: 60px;
	}
`;

export const Header = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin-bottom: 15px;

	form {
		display: flex;
		flex-direction: column;
		align-items: center;

		label {
			font-size: 1rem;
			color: #555;
			margin-bottom: 8px;
		}

		input {
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 6px;
			margin-bottom: 10px;
			width: 100%;
			max-width: 320px;
		}

		button {
			padding: 10px 20px;
			background-color: #007bff;
			color: #fff;
			border: none;
			border-radius: 6px;
			cursor: pointer;
			transition: background-color 0.3s;

			&:hover {
				background-color: #0056b3;
			}
		}
	}
`;

export const WeatherInfo = styled.div`
	text-align: center;
	margin-bottom: 10px;
	flex-grow: 1;

	h3 {
		margin: 0;
		font-size: 1.2rem;
		color: #333;
	}

	p {
		margin: 5px 0;
		font-size: 0.9rem;
		color: #555;
	}

	img {
		margin-top: 5px;
		max-height: 50px;
	}
`;

export const Recommendation = styled.p`
	font-size: 13px;
	color: #10b981;
	font-weight: 600;
	margin: 0;
`;

export const TipText = styled.p`
	font-size: 13px;
	color: #1f2937;
	font-weight: 500;
	margin: 0;
	text-align: center;
	line-height: 1.5;
	animation: fadeIn 0.5s ease-in-out;

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
`;

export const ZeroStateContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	text-align: center;

	icon {
		font-size: 48px;
		opacity: 0.3;
	}

	p {
		margin: 0;
		font-size: 14px;
		color: #999999;
	}
`;
