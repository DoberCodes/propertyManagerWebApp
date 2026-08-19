const test = require('node:test');
const assert = require('node:assert/strict');
const {
  classifyInspectionDocument,
  understandInspectionDocument,
} = require('./lib/inspectionDocumentUnderstanding');

const SAMPLE_INSPECTION_TEXT = `
TEST HOME INSPECTION REPORT

Property Address
4705 Stony Falls Way
Knightdale, NC 27545

General Information
Two-story residential property built in 2014.

Exterior
The asphalt shingle roof is in good condition. Minor debris was observed in the gutters. Recommend cleaning gutters twice yearly.

Foundation & Structure
The slab foundation appears structurally sound. A minor non-structural crack was observed near the garage.

Electrical
The home has a 200 amp service panel. GFCI protection was present. Smoke and CO detectors were present; verify operation and replace batteries annually.

HVAC
The property uses a heat pump system. The 16x25x1 filter was dirty. Replace the HVAC filter every 90 days. Recommend annual professional service.

Plumbing
The electric 50-gallon water heater was reported installed in 2021. Recommend annual flush. The main water shutoff was not labeled; label the main water shutoff.

Kitchen
The refrigerator responded normally. Refrigerator water filter replacement history is unknown.

Interior
Minor drywall nail pops were observed in a bedroom.

Safety Recommendations
Test smoke/CO detectors monthly.

Maintenance Summary
- Replace HVAC filter every 90 days
- Schedule annual HVAC service
- Flush water heater annually
- Clean gutters twice yearly
- Test smoke/CO detectors monthly
- Verify detectors and batteries annually
- Label main water shutoff
`;

test('understands a multi-system inspection before mapping it to Maintley records', () => {
  const understanding = understandInspectionDocument(SAMPLE_INSPECTION_TEXT);

  assert.ok(understanding);
  assert.equal(understanding.documentKind, 'general_inspection');
  assert.equal(understanding.propertyAddress, '4705 Stony Falls Way, Knightdale, NC 27545');
  assert.ok(understanding.sections.length >= 10);
  assert.ok(understanding.observations.length >= 8);

  const equipmentByType = new Map(
    understanding.equipment.map((equipment) => [equipment.assetType, equipment]),
  );
  for (const expectedType of [
    'HVAC',
    'Water Heater',
    'Electrical Panel',
    'Roof',
    'Gutter System',
    'Foundation',
    'Refrigerator',
  ]) {
    assert.ok(equipmentByType.has(expectedType), `missing ${expectedType}`);
  }
  assert.equal(equipmentByType.get('HVAC').assetVariant, 'Heat Pump');
  assert.equal(equipmentByType.get('HVAC').details.filterSize, '16x25x1');
  assert.equal(equipmentByType.get('Water Heater').assetVariant, 'Tank Electric');
  assert.match(equipmentByType.get('Water Heater').details.specNotes, /50-gallon/i);
  assert.match(equipmentByType.get('Water Heater').details.specNotes, /2021/);
  assert.ok(!equipmentByType.has('Safety Device'));
});

test('deduplicates explicit recommendations and keeps them unscheduled', () => {
  const understanding = understandInspectionDocument(SAMPLE_INSPECTION_TEXT);
  assert.ok(understanding);

  assert.deepEqual(
    understanding.recommendations.map((task) => task.title).sort(),
    [
      'Clean gutters',
      'Flush water heater',
      'Label main water shutoff',
      'Replace HVAC filter',
      'Schedule annual HVAC service',
      'Test smoke/CO detectors',
      'Verify smoke/CO detectors and batteries',
    ].sort(),
  );
  assert.ok(
    understanding.recommendations.every(
      (task) => task.scheduleMode === 'unscheduled',
    ),
  );
});

test('does not invent a completed maintenance event without a report date', () => {
  const understanding = understandInspectionDocument(SAMPLE_INSPECTION_TEXT);
  assert.ok(understanding);
  const classified = classifyInspectionDocument(understanding);

  assert.equal(classified.report.visitDate, undefined);
  assert.deepEqual(classified.report.completedWork, []);
  assert.equal(classified.report.suggestedEquipment.length, 7);
  assert.equal(classified.report.suggestedTasks.length, 7);
});

test('does not claim unrelated reports with only a generic report heading', () => {
  assert.equal(
    understandInspectionDocument('SERVICE REPORT\nDescription: Repaired refrigerator'),
    undefined,
  );
});
