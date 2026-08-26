import type { Device } from '../types/Property.types';
import type { PropertyKnowledgeLink } from '../types/PropertyKnowledgeLink.types';
import {
	getAttachedEquipment,
	getEquipmentContextIds,
	getTopLevelEquipment,
	isAttachedEquipment,
	isCombinedEquipment,
	recordReferencesEquipment,
} from './equipmentRelationships';

const equipment = [
	{ id: 'primary', recordScope: 'combined' },
	{ id: 'attached' },
	{ id: 'standalone' },
] as Device[];

const links = [
	{
		id: 'link-1',
		fromType: 'equipment',
		fromId: 'attached',
		relationshipType: 'part_of',
		toType: 'equipment',
		toId: 'primary',
	},
] as PropertyKnowledgeLink[];

describe('equipment relationships', () => {
	it('keeps legacy Equipment physical unless explicitly combined', () => {
		expect(isCombinedEquipment(equipment[1])).toBe(false);
		expect(isCombinedEquipment(equipment[0])).toBe(true);
	});

	it('derives attached and top-level Equipment without mirrored arrays', () => {
		expect(isAttachedEquipment('attached', links)).toBe(true);
		expect(getAttachedEquipment(equipment, links, 'primary').map(({ id }) => id))
			.toEqual(['attached']);
		expect(getTopLevelEquipment(equipment, links).map(({ id }) => id))
			.toEqual(['primary', 'standalone']);
	});

	it('builds combined context without leaking sibling history into a physical profile', () => {
		const primaryContext = getEquipmentContextIds('primary', links);
		const physicalContext = getEquipmentContextIds('attached', links);
		expect(primaryContext).toEqual(['primary', 'attached']);
		expect(physicalContext).toEqual(['attached']);
		expect(
			recordReferencesEquipment({ deviceIds: ['attached'] }, primaryContext),
		).toBe(true);
		expect(
			recordReferencesEquipment({ deviceIds: ['standalone'] }, primaryContext),
		).toBe(false);
		expect(
			recordReferencesEquipment({ deviceId: 'primary' }, physicalContext),
		).toBe(false);
	});
});
