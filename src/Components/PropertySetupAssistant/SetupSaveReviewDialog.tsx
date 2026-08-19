import React from 'react';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';

export type SetupEquipmentReviewEntry = {
	key: string;
	name: string;
	assetVariant?: string;
	spaceNames: string[];
	isExisting: boolean;
};

export type SetupSpaceReviewEntry = {
	key: string;
	name: string;
	status: 'create' | 'reuse' | 'archived_conflict';
};

export type SetupTaskReviewEntry = {
	key: string;
	title: string;
	intervalLabel: string;
	isExisting: boolean;
};

type SetupSaveReviewDialogProps = {
	equipment: SetupEquipmentReviewEntry[];
	spaces: SetupSpaceReviewEntry[];
	tasks: SetupTaskReviewEntry[];
	isSaving: boolean;
	onBack: () => void;
	onSave: () => void;
};

export const SetupSaveReviewDialog: React.FC<
	SetupSaveReviewDialogProps
> = ({ equipment, spaces, tasks, isSaving, onBack, onSave }) => {
	const newEquipmentCount = equipment.filter((entry) => !entry.isExisting).length;
	const reusedEquipmentCount = equipment.length - newEquipmentCount;
	const newSpaceCount = spaces.filter((entry) => entry.status === 'create').length;
	const reusedSpaceCount = spaces.filter((entry) => entry.status === 'reuse').length;
	const archivedSpaceNames = spaces
		.filter((entry) => entry.status === 'archived_conflict')
		.map((entry) => entry.name);
	const newTaskCount = tasks.filter((entry) => !entry.isExisting).length;
	const reusedTaskCount = tasks.length - newTaskCount;
	const hasArchivedSpaceConflict = archivedSpaceNames.length > 0;

	return (
		<DialogPanel
			role='dialog'
			aria-modal='true'
			aria-labelledby='setup-review-title'>
			<DialogHeader>
				<DialogTitle id='setup-review-title'>Ready to save setup?</DialogTitle>
				<DialogHint>
					Review the summary, then save when everything looks right.
				</DialogHint>
			</DialogHeader>
			<DialogBody data-testid='setup-review-scroll-content'>
				<SummaryGrid aria-label='Setup change summary'>
					<SummaryCard>
						<strong>{equipment.length}</strong>
						<span>Equipment</span>
						<small>
							{newEquipmentCount} new · {reusedEquipmentCount} existing
						</small>
					</SummaryCard>
					<SummaryCard>
						<strong>{spaces.length}</strong>
						<span>Spaces</span>
						<small>
							{newSpaceCount} new · {reusedSpaceCount} existing
						</small>
					</SummaryCard>
					<SummaryCard>
						<strong>{tasks.length}</strong>
						<span>Recurring tasks</span>
						<small>
							{newTaskCount} new · {reusedTaskCount} existing
						</small>
					</SummaryCard>
				</SummaryGrid>

				{hasArchivedSpaceConflict && (
					<ConflictNotice role='alert'>
						<strong>Archived Spaces need review</strong>
						<span>
							Restore or rename {archivedSpaceNames.join(', ')} before saving.
						</span>
					</ConflictNotice>
				)}

				<Disclosure data-testid='setup-review-equipment-spaces'>
					<summary>
						<span>Equipment and Spaces</span>
						<small>{equipment.length + spaces.length} items</small>
					</summary>
					<DisclosureContent>
						<DetailHeading>Equipment</DetailHeading>
						{equipment.length > 0 ? (
							<DetailList>
								{equipment.map((entry) => (
									<li key={entry.key}>
										<DetailCopy>
											<strong>{entry.name}</strong>
											<span>
												{entry.assetVariant ? `${entry.assetVariant} · ` : ''}
												{entry.spaceNames.length > 0
													? entry.spaceNames.join(', ')
													: 'No Space selected'}
											</span>
										</DetailCopy>
										<StatusPill $existing={entry.isExisting}>
											{entry.isExisting ? 'Existing' : 'New'}
										</StatusPill>
									</li>
								))}
							</DetailList>
						) : (
							<EmptyState>No equipment selected.</EmptyState>
						)}

						<DetailHeading>Spaces</DetailHeading>
						{spaces.length > 0 ? (
							<DetailList>
								{spaces.map((entry) => (
									<li key={entry.key}>
										<DetailCopy>
											<strong>{entry.name}</strong>
											<span>
												{entry.status === 'create'
													? 'Will be added'
													: entry.status === 'reuse'
														? 'Already in this property'
														: 'Archived match'}
											</span>
										</DetailCopy>
										<StatusPill
											$existing={entry.status === 'reuse'}
											$conflict={entry.status === 'archived_conflict'}>
											{entry.status === 'create'
												? 'New'
												: entry.status === 'reuse'
													? 'Existing'
													: 'Review'}
										</StatusPill>
									</li>
								))}
							</DetailList>
						) : (
							<EmptyState>No Spaces will change.</EmptyState>
						)}
					</DisclosureContent>
				</Disclosure>

				<Disclosure data-testid='setup-review-tasks'>
					<summary>
						<span>Recurring tasks</span>
						<small>{tasks.length} selected</small>
					</summary>
					<DisclosureContent>
						{tasks.length > 0 ? (
							<DetailList>
								{tasks.map((entry) => (
									<li key={entry.key}>
										<DetailCopy>
											<strong>{entry.title}</strong>
											<span>{entry.intervalLabel}</span>
										</DetailCopy>
										<StatusPill $existing={entry.isExisting}>
											{entry.isExisting ? 'Existing' : 'New'}
										</StatusPill>
									</li>
								))}
							</DetailList>
						) : (
							<EmptyState>No recurring tasks selected.</EmptyState>
						)}
					</DisclosureContent>
				</Disclosure>
			</DialogBody>
			<DialogFooter data-testid='setup-review-actions'>
				<BackButton type='button' onClick={onBack} disabled={isSaving}>
					Back
				</BackButton>
				<SaveButton
					type='button'
					onClick={onSave}
					disabled={isSaving || hasArchivedSpaceConflict}>
					{hasArchivedSpaceConflict
						? 'Review Archived Spaces'
						: isSaving
							? 'Saving...'
							: 'Save setup'}
				</SaveButton>
			</DialogFooter>
		</DialogPanel>
	);
};

const DialogPanel = styled.div`
	position: fixed;
	left: 50%;
	top: 50%;
	z-index: 10001;
	display: flex;
	flex-direction: column;
	width: min(640px, calc(100vw - 32px));
	height: min(680px, 75vh);
	max-height: calc(100vh - 32px);
	transform: translate(-50%, -50%);
	border-radius: 18px;
	background: ${COLORS.white};
	box-shadow: 0 24px 80px rgba(15, 23, 42, 0.36);
	overflow: hidden;

	@supports (height: 100dvh) {
		max-height: calc(100dvh - 32px);
	}

	@media (max-width: 640px) {
		width: calc(100vw - 20px);
		height: calc(100vh - 20px);
		max-height: calc(100vh - 20px);
		border-radius: 16px;

		@supports (height: 100dvh) {
			height: calc(100dvh - 20px);
			max-height: calc(100dvh - 20px);
		}
	}
`;

const DialogHeader = styled.div`
	flex: 0 0 auto;
	padding: 20px 22px 16px;
	border-bottom: 1px solid ${COLORS.border};

	@media (max-width: 640px) {
		padding: 16px;
	}
`;

const DialogTitle = styled.h3`
	margin: 0;
	font-size: 18px;
	color: ${COLORS.textPrimary};
`;

const DialogHint = styled.p`
	margin: 8px 0 0;
	font-size: 13px;
	line-height: 1.5;
	color: ${COLORS.gray600};
`;

const DialogBody = styled.div`
	display: flex;
	flex: 1 1 auto;
	min-height: 0;
	flex-direction: column;
	gap: 12px;
	overflow-y: auto;
	padding: 18px 22px 24px;
	background: ${COLORS.bgLight};

	@media (max-width: 640px) {
		padding: 14px;
	}
`;

const DialogFooter = styled.div`
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	padding: 14px 22px;
	border-top: 1px solid ${COLORS.border};
	background: ${COLORS.white};

	@media (max-width: 640px) {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
		padding: 12px 14px max(12px, env(safe-area-inset-bottom));
	}
`;

const FooterButton = styled.button`
	min-height: 44px;
	padding: 10px 16px;
	border-radius: 9px;
	font-size: 14px;
	font-weight: 900;
	cursor: pointer;

	&:disabled {
		opacity: 0.55;
		cursor: wait;
	}

	@media (max-width: 640px) {
		width: 100%;
	}
`;

const BackButton = styled(FooterButton)`
	border: 1px solid ${COLORS.border};
	background: ${COLORS.white};
	color: ${COLORS.gray700};
`;

const SaveButton = styled(FooterButton)`
	border: 1px solid ${COLORS.primary};
	background: ${COLORS.primary};
	color: ${COLORS.white};

	&:hover:not(:disabled) {
		background: ${COLORS.primaryHover};
	}
`;

const SummaryGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;

	@media (max-width: 520px) {
		gap: 8px;
	}
`;

const SummaryCard = styled.div`
	min-width: 0;
	padding: 13px;
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};

	strong,
	span,
	small {
		display: block;
	}

	strong {
		font-size: 22px;
		line-height: 1;
		color: ${COLORS.primary};
	}

	span {
		margin-top: 7px;
		font-size: 13px;
		font-weight: 900;
		line-height: 1.25;
		color: ${COLORS.textPrimary};
	}

	small {
		margin-top: 4px;
		font-size: 11px;
		line-height: 1.35;
		color: ${COLORS.textSecondary};
	}

	@media (max-width: 520px) {
		padding: 10px 8px;

		strong {
			font-size: 19px;
		}

		span {
			font-size: 11px;
		}

		small {
			font-size: 10px;
		}
	}
`;

const ConflictNotice = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding: 12px 14px;
	border: 1px solid ${COLORS.warning};
	border-radius: 12px;
	background: ${COLORS.warningLight};
	color: ${COLORS.textPrimary};

	strong {
		font-size: 13px;
	}

	span {
		font-size: 12px;
		line-height: 1.45;
		color: ${COLORS.gray700};
	}
`;

const Disclosure = styled.details`
	border: 1px solid ${COLORS.border};
	border-radius: 12px;
	background: ${COLORS.white};
	overflow: hidden;

	summary {
		display: flex;
		min-height: 48px;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 0 14px;
		cursor: pointer;
		list-style: none;
		font-size: 14px;
		font-weight: 900;
		color: ${COLORS.textPrimary};
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary::after {
		content: '+';
		flex: 0 0 auto;
		font-size: 20px;
		font-weight: 500;
		color: ${COLORS.primary};
	}

	&[open] summary {
		border-bottom: 1px solid ${COLORS.border};
	}

	&[open] summary::after {
		content: '−';
	}

	summary > span {
		min-width: 0;
		flex: 1;
	}

	summary small {
		flex: 0 0 auto;
		font-size: 11px;
		font-weight: 800;
		color: ${COLORS.textSecondary};
	}
`;

const DisclosureContent = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 12px;
`;

const DetailHeading = styled.div`
	margin-top: 3px;
	font-size: 11px;
	font-weight: 900;
	letter-spacing: 0.04em;
	text-transform: uppercase;
	color: ${COLORS.textSecondary};
`;

const DetailList = styled.ul`
	display: flex;
	flex-direction: column;
	gap: 6px;
	margin: 0;
	padding: 0;
	list-style: none;

	li {
		display: flex;
		min-width: 0;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 9px 10px;
		border-radius: 9px;
		background: ${COLORS.bgLight};
	}
`;

const DetailCopy = styled.div`
	min-width: 0;

	strong,
	span {
		display: block;
	}

	strong {
		font-size: 13px;
		line-height: 1.3;
		color: ${COLORS.textPrimary};
	}

	span {
		margin-top: 2px;
		font-size: 11px;
		line-height: 1.35;
		color: ${COLORS.textSecondary};
	}
`;

const StatusPill = styled.span<{
	$existing?: boolean;
	$conflict?: boolean;
}>`
	flex: 0 0 auto;
	padding: 4px 8px;
	border-radius: 999px;
	background: ${({ $conflict, $existing }) =>
		$conflict
			? COLORS.warningLight
			: $existing
				? COLORS.borderLight
				: COLORS.successLight};
	color: ${({ $conflict, $existing }) =>
		$conflict
			? COLORS.warningDark
			: $existing
				? COLORS.gray700
				: COLORS.primary};
	font-size: 10px;
	font-weight: 900;
`;

const EmptyState = styled.div`
	padding: 8px 10px;
	font-size: 12px;
	color: ${COLORS.textSecondary};
`;
