import React from 'react';
import { CardBody, CardTitle, Wrapper } from './Card.styles';

export interface CardProps {
	title: string;
	children: any;
}

export const Card = (props: CardProps) => {
	return (
		<Wrapper>
			<CardTitle>{props.title}</CardTitle>
			<CardBody>{props.children}</CardBody>
		</Wrapper>
	);
};
