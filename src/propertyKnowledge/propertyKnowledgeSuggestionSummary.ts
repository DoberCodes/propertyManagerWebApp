import type { PropertyKnowledgeSuggestion } from '../types/PropertyKnowledge.types';

type CountablePropertyKnowledgeSuggestion = Partial<
	Pick<
		PropertyKnowledgeSuggestion,
		'extractedFields' | 'suggestedParts' | 'suggestedTasks' | 'suggestedEquipment'
	>
>;

export const getPropertyKnowledgeSuggestionCount = (
	suggestion?: CountablePropertyKnowledgeSuggestion,
): number =>
	(suggestion?.extractedFields?.length || 0) +
	(suggestion?.suggestedParts?.length || 0) +
	(suggestion?.suggestedTasks?.length || 0) +
	(suggestion?.suggestedEquipment?.length || 0);
