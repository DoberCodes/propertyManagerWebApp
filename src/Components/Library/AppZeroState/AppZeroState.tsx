import React from 'react';
import {
	AppZeroStateActions,
	AppZeroStateBadge,
	AppZeroStateButton,
	AppZeroStateCard,
	AppZeroStateDescription,
	AppZeroStateIcon,
	AppZeroStateShell,
	AppZeroStateTitle,
} from './AppZeroState.styles';

export type AppZeroStateKind =
	| 'noProperties'
	| 'noAssignedProperties'
	| 'noPropertyMatches'
	| 'noTasks'
	| 'noActiveTasks'
	| 'noTaskMatches'
	| 'noAppliances'
	| 'noApplianceMatches';

export interface AppZeroStateAction {
	label: string;
	onClick: () => void;
	variant?: 'primary' | 'secondary';
	disabled?: boolean;
	hideOnCompact?: boolean;
}

interface AppZeroStateContent {
	title: string;
	description: string;
}

const APP_ZERO_STATE_COPY: Record<AppZeroStateKind, AppZeroStateContent> = {
	noProperties: {
		title: 'No properties yet',
		description:
			'Add your first property to start organizing tasks, equipment, maintenance history, and reminders.',
	},
	noAssignedProperties: {
		title: 'No assigned properties',
		description:
			'No property assignments were found for your account. Contact your account owner or manager.',
	},
	noPropertyMatches: {
		title: 'No properties match your filters',
		description: 'Clear your search or filters to see more properties.',
	},
	noTasks: {
		title: 'No tasks yet',
		description:
			'Create a maintenance task to track repairs, inspections, reminders, or recurring care.',
	},
	noActiveTasks: {
		title: 'No active tasks',
		description:
			'All your maintenance tasks are complete. Add another task when you are ready to plan what comes next.',
	},
	noTaskMatches: {
		title: 'No tasks match your filters',
		description: 'Clear your search or filters to see more tasks.',
	},
	noAppliances: {
		title: 'No equipment records yet',
		description:
			'Add HVAC, water heater, roof, appliances, or other equipment you want to track.',
	},
	noApplianceMatches: {
		title: 'No equipment matches your filters',
		description: 'Clear your search or filters to see more equipment.',
	},
};

interface AppZeroStateProps {
	kind: AppZeroStateKind;
	title?: string;
	description?: string;
	actions?: AppZeroStateAction[];
	fullPage?: boolean;
}

const getZeroStateBadge = (kind: AppZeroStateKind): string => {
	if (kind === 'noTasks' || kind === 'noActiveTasks' || kind === 'noTaskMatches') {
		return 'Task Center';
	}

	if (kind === 'noAppliances' || kind === 'noApplianceMatches') {
		return 'Equipment';
	}

	return 'Property Setup';
};

export const getAppZeroStateCopy = (
	kind: AppZeroStateKind,
): AppZeroStateContent => APP_ZERO_STATE_COPY[kind];

export const AppZeroState: React.FC<AppZeroStateProps> = ({
	kind,
	title,
	description,
	actions = [],
	fullPage = false,
}) => {
	const copy = getAppZeroStateCopy(kind);
	const badge = getZeroStateBadge(kind);

	return (
		<AppZeroStateShell $fullPage={fullPage}>
			<AppZeroStateCard>
				<AppZeroStateIcon aria-hidden='true'>M</AppZeroStateIcon>
				<AppZeroStateBadge>{badge}</AppZeroStateBadge>
				<AppZeroStateTitle>{title || copy.title}</AppZeroStateTitle>
				<AppZeroStateDescription>
					{description || copy.description}
				</AppZeroStateDescription>
				{actions.length > 0 && (
					<AppZeroStateActions>
						{actions.map((action) => (
							<AppZeroStateButton
								key={action.label}
								type='button'
								$variant={action.variant}
								$hideOnCompact={action.hideOnCompact}
								disabled={action.disabled}
								onClick={action.onClick}>
								{action.label}
							</AppZeroStateButton>
						))}
					</AppZeroStateActions>
				)}
			</AppZeroStateCard>
		</AppZeroStateShell>
	);
};
