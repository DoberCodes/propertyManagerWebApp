import { resolvePropertyKnowledgeRelationships } from './propertyKnowledgeRelationships';

const equipmentSuggestions = [
	{
		id: 'equipment-heat-pump',
		label: 'Heat Pump',
		assetType: 'HVAC',
		assetVariant: 'Heat Pump',
		sourceText: 'Heat pump',
	},
	{
		id: 'equipment-air-handler',
		label: 'Air Handler',
		assetType: 'HVAC',
		assetVariant: 'Air Handler',
		sourceText: 'Air handler',
	},
];

describe('property knowledge relationship defaults', () => {
	it('uses exact suggestion IDs instead of the first broad asset-type match', () => {
		expect(resolvePropertyKnowledgeRelationships({
			relatedEquipmentSuggestionIds: ['equipment-air-handler'],
			relatedAssetTypes: ['HVAC'],
			relatedAssetVariant: 'Air Handler',
			equipmentSuggestions,
			equipmentValues: {
				'equipment-heat-pump': { accepted: true },
				'equipment-air-handler': { accepted: true },
			},
			propertyDevices: [],
		})).toEqual({
			matchedDeviceIds: [],
			pendingEquipmentSuggestionIds: ['equipment-air-handler'],
		});
	});

	it('resolves multiple exact candidates through their reviewed equipment matches', () => {
		expect(resolvePropertyKnowledgeRelationships({
			relatedEquipmentSuggestionIds: [
				'equipment-heat-pump',
				'equipment-air-handler',
			],
			relatedAssetTypes: ['HVAC'],
			equipmentSuggestions,
			equipmentValues: {
				'equipment-heat-pump': {
					accepted: true,
					matchedDeviceId: 'saved-heat-pump',
				},
				'equipment-air-handler': { accepted: true },
			},
			propertyDevices: [],
		})).toEqual({
			matchedDeviceIds: ['saved-heat-pump'],
			pendingEquipmentSuggestionIds: ['equipment-air-handler'],
		});
	});

	it('keeps a type-and-variant fallback for older suggestions', () => {
		expect(resolvePropertyKnowledgeRelationships({
			relatedAssetTypes: ['HVAC'],
			relatedAssetVariant: 'Air Handler',
			equipmentSuggestions,
			equipmentValues: {
				'equipment-heat-pump': { accepted: true },
				'equipment-air-handler': { accepted: true },
			},
			propertyDevices: [],
		})).toEqual({
			matchedDeviceIds: [],
			pendingEquipmentSuggestionIds: ['equipment-air-handler'],
		});
	});
});
