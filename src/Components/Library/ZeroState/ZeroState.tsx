import React from 'react';
import {
	ZeroStateContainer,
	ZeroStateIcon,
	ZeroStateTitle,
	ZeroStateDescription,
	ZeroStateActions,
	ZeroStatePrimaryButton,
	ZeroStateSecondaryButton,
} from './ZeroState.styles';

interface ZeroStateAction {
	label: string;
	onClick: () => void;
	variant?: 'primary' | 'secondary';
}

interface ZeroStateProps {
	icon?: string;
	title: string;
	description: string;
	actions?: ZeroStateAction[];
}

export const ZeroState: React.FC<ZeroStateProps> = ({
	icon = '📭',
	title,
	description,
	actions = [],
}) => {
	return (
		<ZeroStateContainer>
			<ZeroStateIcon>{icon}</ZeroStateIcon>
			<ZeroStateTitle>{title}</ZeroStateTitle>
			<ZeroStateDescription>{description}</ZeroStateDescription>
			{actions.length > 0 && (
				<ZeroStateActions>
					{actions.map((action, index) => {
						const ButtonComponent =
							action.variant === 'secondary'
								? ZeroStateSecondaryButton
								: ZeroStatePrimaryButton;
						return (
							<ButtonComponent
								key={index}
								type='button'
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									action.onClick();
								}}>
								{action.label}
							</ButtonComponent>
						);
					})}
				</ZeroStateActions>
			)}
		</ZeroStateContainer>
	);
};
