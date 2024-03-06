import React from 'react';
import { Wrapper } from './Section.styles';

export interface SectionProps {
	id?: string;
	style?: any;
	background?: string;
	children: any;
}
export const Section = (props: SectionProps) => {
	return (
		<Wrapper id={props.id} style={props.style} background={props.background}>
			{props.children}
		</Wrapper>
	);
};
