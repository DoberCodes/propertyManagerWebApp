import {
	HeroImageSubtitle,
	HeroImageTitle,
	HeroImageWrapper,
} from './HeroImage.styles';

export interface HeroImageProps {
	children?: any;
}

export const HeroImage = (props: HeroImageProps) => {
	return (
		<HeroImageWrapper>
			<HeroImageTitle>Welcome to Property Manager</HeroImageTitle>
			<HeroImageSubtitle>
				We are here to help manage your property tasks
			</HeroImageSubtitle>
			<div>{props.children}</div>
		</HeroImageWrapper>
	);
};
