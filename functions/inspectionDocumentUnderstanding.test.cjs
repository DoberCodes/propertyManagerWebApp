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

const COMPOUND_SECTION_INSPECTION_TEXT = `
HOME INSPECTION AND MAINTENANCE PLANNING REPORT
Property 1842 Meadow Ridge Drive
Assessment date August 12, 2026
Inspector Morgan Lee, NC License HI-48210

Executive Summary
The home was generally maintained.

Site, Exterior, Roof, and Structure
Roof covering
Observation Architectural asphalt shingles appear consistent with a 2017 replacement.
Recommendation Have a qualified roofer secure the lifted rear-valley flashing edge before the next heavy storm.
Gutters
Recommendation Clean gutters and confirm downspout flow twice per year.
Foundation
Observation Poured concrete slab and visible stem walls show no structural displacement.
Recommendation Photograph the garage crack and monitor annually.
Landscape irrigation
Observation Rain Bird ESP-TM2 controller responded in manual mode.
Recommendation Adjust the Zone 4 spray head away from the west wall during the next irrigation service.
Recommendation Regrade the left rear corner to direct surface water away from the foundation within 90 days.

Interior and Space-Level Findings
Attached Garage Door auto-reverse failed the obstruction test. Adjust and retest garage door safety reverse before regular use.
Garage door opener LiftMaster 8550WLB; battery-backup unit.

Electrical and Life Safety
Main electrical panel Square D QO; 200 A.
Recommendation Have a licensed electrician evaluate and correct the double-tapped breaker within 30 days.
Recommendation Test smoke and CO alarms monthly.
Recommendation Verify manufacture dates and replace detector batteries as needed.

Heating, Cooling, and Plumbing
Heat pump Trane XR15 installed 2018.
Air handler Trane TEM6; filter 20x25x1.
Tankless water heater Rinnai RU199iN installed 2022.
Recommendation Schedule professional HVAC service annually.
Recommendation Replace the filter within 30 days and repeat every 90 days.
Recommendation Descale the tankless water heater annually.
Recommendation Do not create a tank-flushing task for this tankless unit.
Recommendation Repair the powder-room P-trap connection within 14 days.

Appliances, Pool Equipment, and Supplies
Refrigerator Samsung RF28R7351SG installed 2020.
Dishwasher Bosch SHPM65Z55N installed 2021.
Gas range GE JGB735SPSS installed 2019.
Pool pump Hayward TriStar VS 950. Pool filter Hayward SwimClear C4030.
Recommendation Replace the Samsung HAF-QIN refrigerator water filter now and repeat every 6 months.
Recommendation Clean the dishwasher filter screen monthly.
Recommendation Clean pool filter cartridges when pressure rises 8-10 psi above baseline.
Suggested reusable supplies
20x25x1 HVAC filter (linked to the attic air handler); Samsung HAF-QIN refrigerator filter (linked to the kitchen refrigerator);
Hayward C4030 replacement cartridge set (linked to the pool filter). These are supplies, not separate equipment.

Documented Service History
These actions were already completed and should be treated as maintenance history rather than future recommendations.
The July 2026 HVAC service is complete; no refrigerant was added.
The November 2025 tankless descaling is complete.

Consolidated Maintenance Plan
- Secure lifted rear-valley roof flashing
- Clean gutters and confirm downspout flow twice yearly
- Replace HVAC filter every 90 days
- Professionally clean dryer vent within 30 days

Limitations and Classification Notes
No active water-heater leak was observed. This is not a repair recommendation.
The main water shutoff is already labeled. No task is needed to label it.
A statement that an item was not tested should not automatically create a task.
Expected deduplication behavior tests whether repeated recommendations produce one candidate.
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

test('recognizes compound inspection headings and preserves broad system coverage', () => {
  const understanding = understandInspectionDocument(COMPOUND_SECTION_INSPECTION_TEXT);
  assert.ok(understanding);
  assert.equal(understanding.diagnostics.parserVersion, 'inspection-v3');
  assert.equal(understanding.propertyAddress, '1842 Meadow Ridge Drive');
  assert.equal(understanding.visitDate, 'August 12, 2026');
  assert.equal(understanding.providerName, 'Morgan Lee, NC License HI-48210');

  const compoundSection = understanding.sections.find((section) =>
    /Site, Exterior, Roof/i.test(section.title),
  );
  assert.deepEqual(compoundSection.kinds, ['exterior', 'structural']);

  const equipmentTypes = new Set(
    understanding.equipment.map((equipment) => equipment.assetType),
  );
  for (const expectedType of [
    'HVAC',
    'Water Heater',
    'Electrical Panel',
    'Roof',
    'Gutter System',
    'Foundation',
    'Refrigerator',
    'Dishwasher',
    'Range / Oven',
    'Pool',
    'Garage Door',
    'Irrigation',
  ]) {
    assert.ok(equipmentTypes.has(expectedType), `missing ${expectedType}`);
  }
});

test('keeps compound-layout recommendations distinct and avoids a tank flush', () => {
  const understanding = understandInspectionDocument(COMPOUND_SECTION_INSPECTION_TEXT);
  assert.ok(understanding);
  const taskTitles = new Set(
    understanding.recommendations.map((recommendation) => recommendation.title),
  );

  for (const expectedTitle of [
    'Secure roof flashing',
    'Clean gutters',
    'Adjust irrigation spray head',
    'Adjust and retest garage door safety reverse',
    'Evaluate and correct double-tapped breaker',
    'Test smoke/CO detectors',
    'Verify smoke/CO detectors and batteries',
    'Schedule annual HVAC service',
    'Replace HVAC filter',
    'Descale tankless water heater',
    'Repair powder-room sink P-trap leak',
    'Replace refrigerator water filter',
    'Clean dishwasher filter screen',
    'Clean pool filter cartridges',
    'Professionally clean dryer vent',
    'Improve drainage at the left rear corner',
    'Photograph and monitor garage slab crack',
  ]) {
    assert.ok(taskTitles.has(expectedTitle), `missing ${expectedTitle}`);
  }
  assert.ok(!taskTitles.has('Flush water heater'));
  assert.ok(!taskTitles.has('Label main water shutoff'));
  assert.equal(understanding.recommendations.length, 17);
  assert.equal(
    understanding.recommendations.filter(
      (recommendation) => recommendation.title === 'Replace HVAC filter',
    ).length,
    1,
  );

  const refrigeratorFilter = understanding.recommendations.find(
    (recommendation) => recommendation.title === 'Replace refrigerator water filter',
  );
  assert.match(refrigeratorFilter.description, /every 6 months/i);
  assert.doesNotMatch(refrigeratorFilter.description, /90 days/i);
});

test('extracts row-specific equipment details and property-owned supplies', () => {
  const understanding = understandInspectionDocument(COMPOUND_SECTION_INSPECTION_TEXT);
  assert.ok(understanding);

  const waterHeater = understanding.equipment.find(
    (equipment) => equipment.assetType === 'Water Heater',
  );
  assert.equal(waterHeater.details.installDate, '2022');
  assert.doesNotMatch(waterHeater.details.specNotes, /2018/);

  const heatPump = understanding.equipment.find(
    (equipment) => equipment.label === 'Heat Pump',
  );
  const airHandler = understanding.equipment.find(
    (equipment) => equipment.label === 'Air Handler',
  );
  assert.equal(heatPump.details.model, 'XR15');
  assert.equal(airHandler.details.model, 'TEM6');
  assert.equal(airHandler.details.filterSize, '20x25x1');

  assert.deepEqual(
    understanding.supplies.map((supply) => supply.name).sort(),
    [
      '20x25x1 HVAC filter',
      'Hayward C4030 replacement cartridge set',
      'Samsung HAF-QIN refrigerator filter',
    ].sort(),
  );
  assert.equal(
    understanding.supplies.find((supply) => supply.name === '20x25x1 HVAC filter')
      .relatedAssetVariant,
    'Air Handler',
  );
});

test('does not claim unrelated reports with only a generic report heading', () => {
  assert.equal(
    understandInspectionDocument('SERVICE REPORT\nDescription: Repaired refrigerator'),
    undefined,
  );
});
