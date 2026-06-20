import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faChevronRight,
	faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import {
	ActiveFilterBadge,
	ApplyFilterButton,
	ClearDraftButton,
	CollapseButton,
	FilterBackdrop,
	FilterPanel,
	FilterPanelActions,
	FilterPanelBody,
	FilterPanelHeader,
	FilterPanelTitleBlock,
	FilterTrigger,
} from './FloatingFilterPanel.styles';

interface FloatingFilterPanelProps {
	isOpen: boolean;
	onOpen: () => void;
	onDismiss: () => void;
	onApply: () => void;
	onClearDraft: () => void;
	activeFilterCount?: number;
	title: string;
	description?: string;
	children: React.ReactNode;
}

export const FloatingFilterPanel: React.FC<FloatingFilterPanelProps> = ({
	isOpen,
	onOpen,
	onDismiss,
	onApply,
	onClearDraft,
	activeFilterCount = 0,
	title,
	description,
	children,
}) => {
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onDismiss();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isOpen, onDismiss]);

	return (
		<>
			<FilterTrigger
				type='button'
				$open={isOpen}
				onClick={onOpen}
				aria-label='Open search and filters'
				aria-expanded={isOpen}>
				<FontAwesomeIcon icon={faMagnifyingGlass} />
				{activeFilterCount > 0 && (
					<ActiveFilterBadge>{activeFilterCount}</ActiveFilterBadge>
				)}
			</FilterTrigger>

			<FilterBackdrop
				type='button'
				$open={isOpen}
				onClick={onDismiss}
				aria-label='Close filters without applying'
			/>

			<FilterPanel
				$open={isOpen}
				aria-hidden={!isOpen}
				aria-label={title}>
				<FilterPanelHeader>
					<CollapseButton
						type='button'
						onClick={onDismiss}
						aria-label='Collapse without applying filters'>
						<FontAwesomeIcon icon={faChevronRight} />
					</CollapseButton>
					<FilterPanelTitleBlock>
						<h2>{title}</h2>
						{description && <p>{description}</p>}
					</FilterPanelTitleBlock>
				</FilterPanelHeader>

				<FilterPanelBody>{children}</FilterPanelBody>

				<FilterPanelActions>
					<ClearDraftButton type='button' onClick={onClearDraft}>
						Clear
					</ClearDraftButton>
					<ApplyFilterButton type='button' onClick={onApply}>
						Apply filters
					</ApplyFilterButton>
				</FilterPanelActions>
			</FilterPanel>
		</>
	);
};
