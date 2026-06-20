import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export const Wrapper = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 100dvh;
	width: 100%;
	padding: max(24px, env(safe-area-inset-top))
		max(24px, env(safe-area-inset-right))
		max(24px, env(safe-area-inset-bottom))
		max(24px, env(safe-area-inset-left));
	background:
		radial-gradient(circle at 12% 18%, rgba(16, 185, 129, 0.18), transparent 30%),
		radial-gradient(circle at 88% 85%, rgba(59, 130, 246, 0.12), transparent 28%),
		linear-gradient(145deg, #f0fdf4 0%, ${COLORS.bgLight} 48%, #eff6ff 100%);
	position: relative;
	overflow-x: hidden;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(15, 118, 110, 0.035) 1px, transparent 1px),
			linear-gradient(90deg, rgba(15, 118, 110, 0.035) 1px, transparent 1px);
		background-size: 42px 42px;
		pointer-events: none;
	}

	@media (max-width: 640px) {
		align-items: center;
		padding: max(14px, env(safe-area-inset-top))
			max(14px, env(safe-area-inset-right))
			max(18px, env(safe-area-inset-bottom))
			max(14px, env(safe-area-inset-left));
	}

	@media (max-width: 640px) and (max-height: 720px) {
		align-items: flex-start;
	}
`;

export const LoginShell = styled.main`
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-columns: minmax(320px, 0.92fr) minmax(390px, 1.08fr);
	width: min(100%, 1040px);
	min-height: 640px;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.94);
	border: 1px solid rgba(209, 250, 229, 0.9);
	border-radius: 24px;
	box-shadow: 0 28px 70px rgba(15, 23, 42, 0.16);
	backdrop-filter: blur(16px);

	@media (max-width: 820px) {
		grid-template-columns: 1fr;
		width: min(100%, 540px);
		min-height: 0;
	}

	@media (max-width: 640px) {
		border-radius: 18px;
	}

	@media (max-width: 640px) and (max-height: 720px) {
		margin: auto 0;
	}
`;

export const BrandPanel = styled.section`
	position: relative;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 36px;
	padding: 48px;
	overflow: hidden;
	color: white;
	background:
		linear-gradient(155deg, rgba(6, 95, 70, 0.96), rgba(4, 120, 87, 0.93)),
		url('/house.jpg') center / cover;

	&::after {
		content: '';
		position: absolute;
		right: -90px;
		bottom: -120px;
		width: 300px;
		height: 300px;
		border: 44px solid rgba(255, 255, 255, 0.07);
		border-radius: 50%;
	}

	@media (max-width: 820px) {
		gap: 18px;
		padding: 28px 32px;
	}

	@media (max-width: 480px) {
		padding: 24px 22px;
	}

	@media (max-width: 640px) and (max-height: 720px) {
		gap: 8px;
		padding: 16px 20px;
	}
`;

export const BrandLogo = styled.img`
	position: relative;
	z-index: 1;
	width: 210px;
	height: auto;
	object-fit: contain;
	object-position: left center;

	@media (max-width: 820px) {
		width: 170px;
	}

	@media (max-width: 640px) and (max-height: 720px) {
		width: 138px;
	}
`;

export const BrandCopy = styled.div`
	position: relative;
	z-index: 1;

	h1 {
		max-width: 430px;
		margin: 0 0 18px;
		font-size: clamp(2rem, 4vw, 3.2rem);
		font-weight: 800;
		line-height: 1.08;
		letter-spacing: -0.04em;
	}

	p {
		max-width: 420px;
		margin: 0;
		color: rgba(255, 255, 255, 0.82);
		font-size: 1rem;
		line-height: 1.65;
	}

	@media (max-width: 820px) {
		h1 {
			margin-bottom: 8px;
			font-size: 1.6rem;
		}

		p {
			font-size: 0.9rem;
			line-height: 1.5;
		}
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1.4rem;
		}

		p {
			display: none;
		}
	}

	@media (max-width: 640px) and (max-height: 720px) {
		h1 {
			margin: 0;
			font-size: 1.2rem;
			line-height: 1.2;
		}

		p {
			display: none;
		}
	}
`;

export const BrandSteps = styled.div`
	position: relative;
	z-index: 1;
	display: grid;
	gap: 12px;

	@media (max-width: 820px) {
		display: none;
	}
`;

export const BrandStep = styled.div`
	display: grid;
	grid-template-columns: 34px minmax(0, 1fr);
	align-items: center;
	gap: 12px;
	color: rgba(255, 255, 255, 0.9);
	font-size: 0.9rem;
	font-weight: 650;

	span {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border: 1px solid rgba(255, 255, 255, 0.22);
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.1);
	}
`;

export const FormPanel = styled.section`
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 42px;
	background: rgba(255, 255, 255, 0.9);

	@media (max-width: 820px) {
		padding: 30px;
	}

	@media (max-width: 480px) {
		padding: 22px 16px;
	}

	@media (max-width: 640px) and (max-height: 720px) {
		align-items: flex-start;
		padding: 16px;
	}
`;
