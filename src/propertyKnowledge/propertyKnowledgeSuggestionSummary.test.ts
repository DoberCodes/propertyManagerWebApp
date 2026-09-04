import { getPropertyKnowledgeSuggestionCount } from './propertyKnowledgeSuggestionSummary';

describe('property knowledge suggestion summaries', () => {
	it('counts every reviewable suggestion category', () => {
		expect(
			getPropertyKnowledgeSuggestionCount({
				extractedFields: [{}] as never[],
				suggestedParts: [{}] as never[],
				suggestedTasks: [{}, {}] as never[],
				suggestedEquipment: [{}] as never[],
			}),
		).toBe(5);
	});

	it('counts inspection suggestions that contain only tasks and equipment', () => {
		expect(
			getPropertyKnowledgeSuggestionCount({
				suggestedTasks: Array.from({ length: 7 }, () => ({})) as never[],
				suggestedEquipment: Array.from({ length: 7 }, () => ({})) as never[],
			}),
		).toBe(14);
	});
});
