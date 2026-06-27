import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import {
	FormInput,
	FormSelect,
} from 'Components/Library';
import { useUpdateDeviceMutation } from 'Redux/API/deviceSlice';
import { useUpdatePropertyMutation } from 'Redux/API/propertySlice';
import {
	useCreateContractorMutation,
	useUpdateContractorMutation,
} from 'Redux/API/contractorSlice';
import type { RootState } from 'Redux/store/store';
import type { Device, Property, PropertyDocument } from 'types/Property.types';
import type {
	PartKnowledgeCategory,
	PropertyKnowledgeSuggestion,
} from 'types/PropertyKnowledge.types';
import {
	acceptKnowledgeSuggestion,
	applyAcceptedKnowledgeSuggestion,
	mergeKnowledgeSuggestion,
	rejectKnowledgeSuggestion,
} from 'propertyKnowledge/propertyKnowledgeAcquisition';
import type { RoleCapabilities } from 'utils/permissions';
import { useAppFeedback } from 'Components/Library/AppFeedback/AppFeedbackProvider';

interface PropertyKnowledgeReviewPanelProps {
	property: Property;
	propertyDevices: Device[];
	propertyContractors?: any[];
	permissions?: RoleCapabilities;
	selectedSuggestionId?: string | null;
	onSelectSuggestion?: (suggestionId: string) => void;
	onAddMaintenanceHistory?: (history: any) => Promise<void> | void;
}

const PART_CATEGORY_OPTIONS: PartKnowledgeCategory[] = [
	'part',
	'supply',
	'consumable',
	'accessory',
	'material',
];

const getKnowledgeSuggestionCount = (suggestion?: PropertyKnowledgeSuggestion) =>
	(suggestion?.extractedFields.length || 0) +
	(suggestion?.suggestedParts?.length || 0);

const normalizeLookupValue = (value?: string) =>
	String(value || '')
		.trim()
		.toLowerCase();

const appendNote = (current?: string, note?: string) => {
	const trimmedNote = String(note || '').trim();
	if (!trimmedNote) return current || '';
	if (String(current || '').includes(trimmedNote)) return current || '';
	return [current, trimmedNote].filter(Boolean).join('\n');
};

const formatSuggestionDate = (value?: string) => {
	if (!value) return 'Date unknown';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Date unknown';
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});
};

const getStatusLabel = (status?: string) => {
	if (status === 'pending') return 'Needs review';
	if (status === 'applied') return 'Saved';
	if (status === 'rejected') return 'Rejected';
	if (status === 'accepted') return 'Accepted';
	return 'Reviewed';
};

export const PropertyKnowledgeReviewPanel: React.FC<
	PropertyKnowledgeReviewPanelProps
> = ({
	property,
	propertyDevices,
	propertyContractors = [],
	permissions,
	selectedSuggestionId,
	onSelectSuggestion,
	onAddMaintenanceHistory,
}) => {
	const feedback = useAppFeedback();
	const currentUser = useSelector((state: RootState) => state.user.currentUser);
	const [updateProperty] = useUpdatePropertyMutation();
	const [updateDevice] = useUpdateDeviceMutation();
	const [createContractor] = useCreateContractorMutation();
	const [updateContractor] = useUpdateContractorMutation();
	const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(
		selectedSuggestionId || null,
	);
	const [knowledgeFieldValues, setKnowledgeFieldValues] = useState<
		Record<string, string>
	>({});
	const [knowledgePartValues, setKnowledgePartValues] = useState<
		Record<string, { name: string; category: string; accepted: boolean }>
	>({});
	const [isSaving, setIsSaving] = useState(false);

	const propertyDocuments = useMemo<PropertyDocument[]>(
		() => (Array.isArray((property as any)?.documents) ? (property as any).documents : []),
		[property],
	);

	const knowledgeSuggestions = useMemo<PropertyKnowledgeSuggestion[]>(
		() =>
			Array.isArray((property as any)?.knowledgeSuggestions)
				? [...(property as any).knowledgeSuggestions].sort((a, b) => {
						const statusWeight = (status: string) =>
							status === 'pending' ? 0 : status === 'accepted' ? 1 : 2;
						const weightDelta = statusWeight(a.status) - statusWeight(b.status);
						if (weightDelta !== 0) return weightDelta;
						return (
							(new Date(b.createdAt).getTime() || 0) -
							(new Date(a.createdAt).getTime() || 0)
						);
				  })
				: [],
		[property],
	);

	const selectedSuggestion = useMemo(
		() =>
			knowledgeSuggestions.find(
				(suggestion) => suggestion.id === activeSuggestionId,
			) || null,
		[knowledgeSuggestions, activeSuggestionId],
	);

	useEffect(() => {
		if (selectedSuggestionId) {
			setActiveSuggestionId(selectedSuggestionId);
		}
	}, [selectedSuggestionId]);

	useEffect(() => {
		if (activeSuggestionId || knowledgeSuggestions.length === 0) return;
		const firstPending =
			knowledgeSuggestions.find((suggestion) => suggestion.status === 'pending') ||
			knowledgeSuggestions[0];
		setActiveSuggestionId(firstPending.id);
	}, [activeSuggestionId, knowledgeSuggestions]);

	useEffect(() => {
		if (!selectedSuggestion) {
			setKnowledgeFieldValues({});
			setKnowledgePartValues({});
			return;
		}

		setKnowledgeFieldValues(
			Object.fromEntries(
				selectedSuggestion.extractedFields.map((field) => [
					field.id,
					field.userEditableValue ?? field.value,
				]),
			),
		);
		setKnowledgePartValues(
			Object.fromEntries(
				(selectedSuggestion.suggestedParts || []).map((part) => [
					part.id,
					{
						name: part.userEditableName ?? part.name,
						category: part.userEditableCategory ?? part.category,
						accepted: part.reviewStatus !== 'rejected',
					},
				]),
			),
		);
	}, [selectedSuggestion]);

	const handleSelectSuggestion = (suggestionId: string) => {
		setActiveSuggestionId(suggestionId);
		onSelectSuggestion?.(suggestionId);
	};

	const getAcceptedByUserId = () =>
		String((currentUser as any)?.id || property?.userId || 'unknown');

	const handleRejectSuggestion = async () => {
		if (!property?.id || !selectedSuggestion || isSaving) return;
		const rejectedSuggestion = rejectKnowledgeSuggestion(selectedSuggestion);

		setIsSaving(true);
		try {
			await updateProperty({
				id: property.id,
				updates: {
					documents: propertyDocuments.map((document) =>
						document.id === rejectedSuggestion.sourceDocumentId
							? {
									...document,
									acquisitionStatus: 'reviewed',
							  }
							: document,
					),
					knowledgeSuggestions: mergeKnowledgeSuggestion(
						knowledgeSuggestions,
						rejectedSuggestion,
					),
				},
			}).unwrap();
			feedback.notify('Suggested details rejected.');
		} catch (error) {
			console.error('Error rejecting knowledge suggestion:', error);
			feedback.notify('Could not reject suggested details. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	const handleApplySuggestion = async () => {
		if (!property?.id || !selectedSuggestion || isSaving) return;
		const acceptedAt = new Date().toISOString();
		const acceptedByUser = getAcceptedByUserId();
		const acceptedSuggestion = acceptKnowledgeSuggestion(selectedSuggestion, {
			reviewedAt: acceptedAt,
			acceptedByUser,
			fieldValues: knowledgeFieldValues,
			partValues: knowledgePartValues,
		});
		const result = applyAcceptedKnowledgeSuggestion({
			suggestion: acceptedSuggestion,
			property,
			systems: propertyDevices,
			acceptedByUser,
			acceptedAt,
		});

		setIsSaving(true);
		try {
			await Promise.all(
				result.systemUpdates.map((systemUpdate) =>
					updateDevice(systemUpdate).unwrap(),
				),
			);

			let completedBy: string | undefined;
			let completedByName: string | undefined;

			if (result.contractorSuggestion && (permissions?.canManageContractors ?? true)) {
				const contractorSuggestion = result.contractorSuggestion;
				const contractorLookup = normalizeLookupValue(contractorSuggestion.name);
				const matchingContractor = propertyContractors.find((contractor: any) => {
					const name = normalizeLookupValue(contractor?.name);
					const company = normalizeLookupValue(contractor?.company);
					return (
						(contractorLookup && name === contractorLookup) ||
						(contractorLookup && company === contractorLookup)
					);
				});

				if (matchingContractor?.id) {
					const contractorUpdates: Record<string, string> = {};
					if (!matchingContractor.phone && contractorSuggestion.phone) {
						contractorUpdates.phone = contractorSuggestion.phone;
					}
					if (!matchingContractor.company && contractorSuggestion.company) {
						contractorUpdates.company = contractorSuggestion.company;
					}
					if (!matchingContractor.category && contractorSuggestion.category) {
						contractorUpdates.category = contractorSuggestion.category;
					}
					const nextNotes = appendNote(
						matchingContractor.notes,
						contractorSuggestion.notes,
					);
					if (nextNotes !== (matchingContractor.notes || '')) {
						contractorUpdates.notes = nextNotes;
					}
					if (Object.keys(contractorUpdates).length > 0) {
						await updateContractor({
							contractorId: matchingContractor.id,
							...contractorUpdates,
						}).unwrap();
					}
					completedBy = matchingContractor.id;
					completedByName = matchingContractor.name || contractorSuggestion.name;
				} else {
					const createdContractor = await createContractor({
						propertyId: property.id,
						name: contractorSuggestion.name,
						company: contractorSuggestion.company,
						category: contractorSuggestion.category,
						phone: contractorSuggestion.phone,
						notes: contractorSuggestion.notes,
					}).unwrap();
					completedBy = createdContractor?.id;
					completedByName = createdContractor?.name || contractorSuggestion.name;
				}
			}

			if (
				result.maintenanceHistorySuggestion &&
				onAddMaintenanceHistory &&
				(permissions?.canManageMaintenanceHistory ?? true)
			) {
				const sourceDocument = propertyDocuments.find(
					(document) =>
						document.id === result.appliedSuggestion.sourceDocumentId,
				);
				await onAddMaintenanceHistory({
					...result.maintenanceHistorySuggestion,
					...(completedBy ? { completedBy } : {}),
					completedByName:
						completedByName ||
						result.maintenanceHistorySuggestion.completedByName,
					...(sourceDocument?.fileUrl || sourceDocument?.url
						? {
								completionFileData: {
									url: sourceDocument.fileUrl || sourceDocument.url,
									name: sourceDocument.fileName || sourceDocument.name,
									size: sourceDocument.size || 0,
									type: sourceDocument.type || 'application/octet-stream',
									usage: 'document',
									uploadedAt: sourceDocument.uploadedAt,
								},
						  }
						: {}),
				});
			}

			await updateProperty({
				id: property.id,
				updates: {
					...result.propertyUpdates,
					documents: propertyDocuments.map((document) =>
						document.id === result.appliedSuggestion.sourceDocumentId
							? {
									...document,
									acquisitionStatus: 'applied',
							  }
							: document,
					),
					knowledgeSuggestions: mergeKnowledgeSuggestion(
						knowledgeSuggestions,
						result.appliedSuggestion,
					),
				},
			}).unwrap();
			feedback.notify('Suggested details saved to the property record.');
		} catch (error) {
			console.error('Error applying knowledge suggestion:', error);
			feedback.notify('Could not save suggested details. Please try again.');
		} finally {
			setIsSaving(false);
		}
	};

	if (knowledgeSuggestions.length === 0) {
		return (
			<PanelShell>
				<PanelHeader>
					<div>
						<PanelTitle>Suggested Details</PanelTitle>
						<PanelText>
							Maintley reviews uploaded documents for possible details that can strengthen this property's memory.
						</PanelText>
					</div>
				</PanelHeader>
				<EmptyState>
					<h3>No suggested details yet</h3>
					<p>
						Upload a document to let Maintley look for property details you can review before saving.
					</p>
				</EmptyState>
			</PanelShell>
		);
	}

	return (
		<PanelShell>
			<PanelHeader>
				<div>
					<PanelTitle>Suggested Details</PanelTitle>
					<PanelText>
						Maintley found possible details in your documents. Review suggestions before saving them to Property Memory.
					</PanelText>
				</div>
			</PanelHeader>

			<ReviewLayout>
				<SuggestionList aria-label='Suggested details'>
					{knowledgeSuggestions.map((suggestion) => {
						const count = getKnowledgeSuggestionCount(suggestion);
						const isActive = suggestion.id === selectedSuggestion?.id;
						return (
							<SuggestionListItem
								key={suggestion.id}
								type='button'
								$active={isActive}
								onClick={() => handleSelectSuggestion(suggestion.id)}>
								<SuggestionItemTopRow>
									<SuggestionName>
										{suggestion.sourceDocumentName || 'Document suggestion'}
									</SuggestionName>
									<StatusBadge $status={suggestion.status}>
										{getStatusLabel(suggestion.status)}
									</StatusBadge>
								</SuggestionItemTopRow>
								<SuggestionMeta>
									{count} suggested detail{count === 1 ? '' : 's'} · {formatSuggestionDate(suggestion.createdAt)}
								</SuggestionMeta>
							</SuggestionListItem>
						);
					})}
				</SuggestionList>

				<ReviewDetail>
					{selectedSuggestion ? (
						<>
							<DetailHeader>
								<div>
									<DetailTitle>
										{selectedSuggestion.sourceDocumentName || 'Review suggested details'}
									</DetailTitle>
									<DetailText>
										Review suggestions before saving. Maintley may not identify every detail correctly.
									</DetailText>
								</div>
								<StatusBadge $status={selectedSuggestion.status}>
									{getStatusLabel(selectedSuggestion.status)}
								</StatusBadge>
							</DetailHeader>

							{getKnowledgeSuggestionCount(selectedSuggestion) === 0 ? (
								<KnowledgeEmptyState>
									Maintley did not find structured details in this document yet. You can keep the document attached and review it again later.
								</KnowledgeEmptyState>
							) : (
								<>
									{(selectedSuggestion.suggestedParts || []).length > 0 && (
										<KnowledgePartSection>
											<KnowledgeSectionHeader>
												<div>
													<KnowledgeSectionTitle>Possible parts & supplies</KnowledgeSectionTitle>
													<KnowledgeSectionText>
														Choose which items should be added to the related system.
													</KnowledgeSectionText>
												</div>
												<KnowledgeBulkActions>
													<button
														type='button'
														onClick={() =>
															setKnowledgePartValues((current) => {
																const next = { ...current };
																selectedSuggestion.suggestedParts?.forEach((part) => {
																	next[part.id] = {
																		name: next[part.id]?.name || part.name,
																		category: next[part.id]?.category || part.category,
																		accepted: true,
																	};
																});
																return next;
															})
														}>
														Add all
													</button>
													<button
														type='button'
														onClick={() =>
															setKnowledgePartValues((current) => {
																const next = { ...current };
																selectedSuggestion.suggestedParts?.forEach((part) => {
																	next[part.id] = {
																		name: next[part.id]?.name || part.name,
																		category: next[part.id]?.category || part.category,
																		accepted: false,
																	};
																});
																return next;
															})
														}>
														Skip all
													</button>
												</KnowledgeBulkActions>
											</KnowledgeSectionHeader>
											<KnowledgePartList>
												{selectedSuggestion.suggestedParts?.map((part) => (
													<KnowledgePartCard
														key={part.id}
														$accepted={knowledgePartValues[part.id]?.accepted !== false}>
														<KnowledgePartTopRow>
															<KnowledgePartTitleBlock>
																<KnowledgePartTitle>{part.label}</KnowledgePartTitle>
																{typeof part.confidence === 'number' && (
																	<KnowledgeConfidence>
																		{Math.round(part.confidence * 100)}% confidence
																	</KnowledgeConfidence>
																)}
															</KnowledgePartTitleBlock>
															<KnowledgeDecisionGroup>
																<button
																	type='button'
																	aria-pressed={
																		knowledgePartValues[part.id]?.accepted !== false
																	}
																	onClick={() =>
																		setKnowledgePartValues((current) => ({
																			...current,
																			[part.id]: {
																				name: current[part.id]?.name || part.name,
																				category:
																					current[part.id]?.category || part.category,
																				accepted: true,
																			},
																		}))
																	}>
																	Add
																</button>
																<button
																	type='button'
																	aria-pressed={
																		knowledgePartValues[part.id]?.accepted === false
																	}
																	onClick={() =>
																		setKnowledgePartValues((current) => ({
																			...current,
																			[part.id]: {
																				name: current[part.id]?.name || part.name,
																				category:
																					current[part.id]?.category || part.category,
																				accepted: false,
																			},
																		}))
																	}>
																	Skip
																</button>
															</KnowledgeDecisionGroup>
														</KnowledgePartTopRow>
														<KnowledgePartEditGrid>
															<FormInput
																id={`knowledge-part-${part.id}`}
																aria-label={`${part.label} name`}
																disabled={knowledgePartValues[part.id]?.accepted === false}
																value={knowledgePartValues[part.id]?.name ?? ''}
																onChange={(event) =>
																	setKnowledgePartValues((current) => ({
																		...current,
																		[part.id]: {
																			name: event.target.value,
																			category:
																				current[part.id]?.category || part.category,
																			accepted: current[part.id]?.accepted !== false,
																		},
																	}))
																}
															/>
															<FormSelect
																aria-label={`${part.label} category`}
																disabled={knowledgePartValues[part.id]?.accepted === false}
																value={
																	knowledgePartValues[part.id]?.category || part.category
																}
																onChange={(event) =>
																	setKnowledgePartValues((current) => ({
																		...current,
																		[part.id]: {
																			name: current[part.id]?.name || part.name,
																			category: event.target.value,
																			accepted: current[part.id]?.accepted !== false,
																		},
																	}))
																}>
																{PART_CATEGORY_OPTIONS.map((category) => (
																	<option key={category} value={category}>
																		{category}
																	</option>
																))}
															</FormSelect>
														</KnowledgePartEditGrid>
														{part.sourceText && (
															<KnowledgeSourceText>
																Source text: {part.sourceText}
															</KnowledgeSourceText>
														)}
													</KnowledgePartCard>
												))}
											</KnowledgePartList>
										</KnowledgePartSection>
									)}

									{selectedSuggestion.extractedFields.length > 0 && (
										<KnowledgeFieldSection>
											<KnowledgeSectionTitle>Property details</KnowledgeSectionTitle>
											<KnowledgeFieldList>
												{selectedSuggestion.extractedFields.map((field) => (
													<KnowledgeFieldRow key={field.id}>
														<KnowledgeFieldLabel htmlFor={`knowledge-field-${field.id}`}>
															<span>{field.label}</span>
															{typeof field.confidence === 'number' && (
																<KnowledgeConfidence>
																	{Math.round(field.confidence * 100)}% confidence
																</KnowledgeConfidence>
															)}
														</KnowledgeFieldLabel>
														<FormInput
															id={`knowledge-field-${field.id}`}
															value={knowledgeFieldValues[field.id] ?? ''}
															onChange={(event) =>
																setKnowledgeFieldValues((current) => ({
																	...current,
																	[field.id]: event.target.value,
																}))
															}
														/>
													</KnowledgeFieldRow>
												))}
											</KnowledgeFieldList>
										</KnowledgeFieldSection>
									)}
								</>
							)}

							<DetailActions>
								<SaveButton
									type='button'
									onClick={handleApplySuggestion}
									disabled={
										selectedSuggestion.status === 'applied' ||
										selectedSuggestion.status === 'rejected' ||
										getKnowledgeSuggestionCount(selectedSuggestion) === 0 ||
										isSaving
									}>
									{isSaving ? 'Saving...' : 'Save review'}
								</SaveButton>
								<RejectButton
									type='button'
									onClick={handleRejectSuggestion}
									disabled={
										selectedSuggestion.status === 'applied' ||
										selectedSuggestion.status === 'rejected' ||
										isSaving
									}>
									Reject suggestions
								</RejectButton>
							</DetailActions>
						</>
					) : (
						<KnowledgeEmptyState>
							Select a document suggestion to review.
						</KnowledgeEmptyState>
					)}
				</ReviewDetail>
			</ReviewLayout>
		</PanelShell>
	);
};

const PanelShell = styled.section`
	display: grid;
	gap: 14px;
`;

const PanelHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 14px;
`;

const PanelTitle = styled.h2`
	margin: 0;
	color: #172033;
	font-size: 20px;
	line-height: 1.2;
`;

const PanelText = styled.p`
	margin: 6px 0 0;
	color: #64748b;
	font-size: 14px;
	line-height: 1.5;
	max-width: 760px;
`;

const EmptyState = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #ffffff;
	padding: 18px;

	h3 {
		margin: 0 0 6px;
		color: #172033;
		font-size: 16px;
	}

	p {
		margin: 0;
		color: #64748b;
		font-size: 14px;
		line-height: 1.5;
	}
`;

const ReviewLayout = styled.div`
	display: grid;
	grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
	gap: 14px;
	align-items: start;

	@media (max-width: 820px) {
		grid-template-columns: 1fr;
	}
`;

const SuggestionList = styled.div`
	display: grid;
	gap: 8px;
`;

const SuggestionListItem = styled.button<{ $active: boolean }>`
	display: grid;
	gap: 5px;
	width: 100%;
	text-align: left;
	border: 1px solid ${({ $active }) => ($active ? '#99f6e4' : '#e2e8f0')};
	border-radius: 8px;
	background: ${({ $active }) => ($active ? '#f0fdfa' : '#ffffff')};
	cursor: pointer;
	padding: 11px;

	&:hover {
		border-color: #99f6e4;
		background: #f8fafc;
	}
`;

const SuggestionItemTopRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 8px;
`;

const SuggestionName = styled.div`
	color: #0f172a;
	font-size: 13px;
	font-weight: 900;
	line-height: 1.35;
	overflow-wrap: anywhere;
`;

const SuggestionMeta = styled.div`
	color: #64748b;
	font-size: 12px;
	font-weight: 700;
	line-height: 1.35;
`;

const StatusBadge = styled.span<{ $status?: string }>`
	width: fit-content;
	border: 1px solid
		${({ $status }) =>
			$status === 'applied'
				? '#bbf7d0'
				: $status === 'rejected'
					? '#fecaca'
					: '#bfdbfe'};
	border-radius: 999px;
	background: ${({ $status }) =>
		$status === 'applied'
			? '#f0fdf4'
			: $status === 'rejected'
				? '#fef2f2'
				: '#eff6ff'};
	color: ${({ $status }) =>
		$status === 'applied'
			? '#166534'
			: $status === 'rejected'
				? '#991b1b'
				: '#1d4ed8'};
	font-size: 11px;
	font-weight: 900;
	line-height: 1.2;
	padding: 4px 7px;
	white-space: nowrap;
`;

const ReviewDetail = styled.div`
	display: grid;
	gap: 14px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #ffffff;
	padding: 14px;
	min-width: 0;
`;

const DetailHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const DetailTitle = styled.h3`
	margin: 0;
	color: #172033;
	font-size: 16px;
	line-height: 1.3;
	overflow-wrap: anywhere;
`;

const DetailText = styled.p`
	margin: 5px 0 0;
	color: #64748b;
	font-size: 13px;
	line-height: 1.45;
`;

const KnowledgeEmptyState = styled.div`
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
	color: #475569;
	font-size: 13px;
	line-height: 1.45;
	padding: 12px;
`;

const KnowledgePartSection = styled.div`
	display: grid;
	gap: 10px;
	padding: 12px;
	border: 1px solid #dbeafe;
	border-radius: 8px;
	background: #eff6ff;
`;

const KnowledgeFieldSection = styled.div`
	display: grid;
	gap: 10px;
	padding: 12px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: #f8fafc;
`;

const KnowledgeSectionHeader = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const KnowledgeSectionTitle = styled.div`
	color: #0f172a;
	font-size: 13px;
	font-weight: 900;
`;

const KnowledgeSectionText = styled.p`
	margin: 0;
	color: #475569;
	font-size: 13px;
	line-height: 1.45;
`;

const KnowledgeBulkActions = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;

	button {
		border: 1px solid #bfdbfe;
		border-radius: 999px;
		background: #ffffff;
		color: #1d4ed8;
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		padding: 5px 9px;
	}
`;

const KnowledgePartList = styled.div`
	display: grid;
	gap: 10px;
`;

const KnowledgePartCard = styled.div<{ $accepted: boolean }>`
	display: grid;
	gap: 8px;
	border: 1px solid ${({ $accepted }) => ($accepted ? '#bfdbfe' : '#e2e8f0')};
	border-radius: 8px;
	background: ${({ $accepted }) => ($accepted ? '#ffffff' : '#f8fafc')};
	opacity: ${({ $accepted }) => ($accepted ? 1 : 0.74)};
	padding: 10px;
`;

const KnowledgePartTopRow = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 10px;

	@media (max-width: 520px) {
		display: grid;
		grid-template-columns: 1fr;
	}
`;

const KnowledgePartTitleBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`;

const KnowledgePartTitle = styled.div`
	color: #0f172a;
	font-size: 13px;
	font-weight: 900;
	overflow-wrap: anywhere;
`;

const KnowledgeDecisionGroup = styled.div`
	display: inline-flex;
	width: fit-content;
	border: 1px solid #cbd5e1;
	border-radius: 999px;
	background: #ffffff;
	padding: 2px;

	button {
		border: none;
		border-radius: 999px;
		background: transparent;
		color: #64748b;
		cursor: pointer;
		font-size: 12px;
		font-weight: 900;
		padding: 5px 10px;
	}

	button[aria-pressed='true'] {
		background: #0f766e;
		color: #ffffff;
	}
`;

const KnowledgePartEditGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 150px;
	gap: 8px;

	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`;

const KnowledgeFieldList = styled.div`
	display: grid;
	gap: 12px;
`;

const KnowledgeFieldRow = styled.div`
	display: grid;
	gap: 6px;
`;

const KnowledgeFieldLabel = styled.label`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	color: #1f2937;
	font-size: 13px;
	font-weight: 800;
`;

const KnowledgeConfidence = styled.span`
	color: #64748b;
	font-size: 11px;
	font-weight: 700;
	white-space: nowrap;
`;

const KnowledgeSourceText = styled.div`
	color: #64748b;
	font-size: 12px;
	line-height: 1.4;
	overflow-wrap: anywhere;
`;

const DetailActions = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	padding-top: 4px;
`;

const SaveButton = styled.button`
	border: none;
	border-radius: 8px;
	background: #0f766e;
	color: #ffffff;
	cursor: pointer;
	font-size: 13px;
	font-weight: 900;
	padding: 9px 12px;

	&:disabled {
		background: #94a3b8;
		cursor: not-allowed;
	}
`;

const RejectButton = styled.button`
	border: none;
	background: transparent;
	color: #b91c1c;
	cursor: pointer;
	font-size: 13px;
	font-weight: 800;
	padding: 4px 0;
	text-decoration: underline;
	text-underline-offset: 3px;

	&:disabled {
		color: #94a3b8;
		cursor: not-allowed;
	}
`;
