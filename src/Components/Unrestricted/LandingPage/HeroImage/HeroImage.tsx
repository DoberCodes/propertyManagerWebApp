import {
	HeroImageSubtitle,
	HeroImageTitle,
	HeroImageWrapper,
} from './HeroImage.styles';

export const HeroImage = () => {
	return (
		<HeroImageWrapper>
			<HeroImageTitle>Welcome to My Property Manager</HeroImageTitle>
			<HeroImageSubtitle>
				We are here to help manage your property tasks
			</HeroImageSubtitle>
		</HeroImageWrapper>
	);
};
