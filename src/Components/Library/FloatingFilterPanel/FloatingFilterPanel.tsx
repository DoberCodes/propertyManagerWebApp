import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
	faXmark,
	faFolderOpen,
	faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../Redux/store/store';
import {
	ActiveFilterBadge,
	AdditionalSettingsMenu,
	AdditionalSettingsMenuItem,
	AdditionalSettingsMenuWrap,
	AdditionalSettingsTrigger,
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
	additionalSettingsActions?: Array<{
		label: string;
		description?: string;
		onClick: () => void;
	}>;
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
	additionalSettingsActions = [],
}) => {
	const activeRoute = useSelector(
		(state: RootState) => state.navigation.activeRoute,
	);
	const [isAdditionalSettingsOpen, setIsAdditionalSettingsOpen] =
		useState(false);
	const additionalSettingsRef = useRef<HTMLDivElement | null>(null);
	const showAdditionalSettings =
		activeRoute === '/properties' && additionalSettingsActions.length > 0;

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

	useEffect(() => {
		if (activeRoute !== '/properties' || isOpen) {
			setIsAdditionalSettingsOpen(false);
		}
	}, [activeRoute, isOpen]);

	useEffect(() => {
		if (!isAdditionalSettingsOpen) return;

		const handlePointerDown = (event: MouseEvent) => {
			if (
				additionalSettingsRef.current &&
				!additionalSettingsRef.current.contains(event.target as Node)
			) {
				setIsAdditionalSettingsOpen(false);
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsAdditionalSettingsOpen(false);
			}
		};

		document.addEventListener('mousedown', handlePointerDown);
		document.addEventListener('keydown', handleKeyDown);
		return () => {
			document.removeEventListener('mousedown', handlePointerDown);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isAdditionalSettingsOpen]);

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
			{showAdditionalSettings && (
				<AdditionalSettingsMenuWrap ref={additionalSettingsRef}>
					<AdditionalSettingsTrigger
						type='button'
						$open={isOpen}
						onClick={() =>
							setIsAdditionalSettingsOpen((current) => !current)
						}
						aria-label='Open property group options'
						aria-expanded={isAdditionalSettingsOpen}>
						<FontAwesomeIcon icon={faFolderOpen} size='sm' />
					</AdditionalSettingsTrigger>
					{isAdditionalSettingsOpen && (
						<AdditionalSettingsMenu>
							{additionalSettingsActions.map((action) => (
								<AdditionalSettingsMenuItem
									key={action.label}
									type='button'
									onClick={() => {
										setIsAdditionalSettingsOpen(false);
										action.onClick();
									}}>
									<strong>{action.label}</strong>
									{action.description && <span>{action.description}</span>}
								</AdditionalSettingsMenuItem>
							))}
						</AdditionalSettingsMenu>
					)}
				</AdditionalSettingsMenuWrap>
			)}

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
						aria-label='Close filters without applying'>
						<FontAwesomeIcon icon={faXmark} />
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
