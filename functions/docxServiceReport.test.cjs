const test = require('node:test');
const assert = require('node:assert/strict');
const { parseDocxServiceReportHtml } = require('./lib/docxServiceReport');

const SAMPLE_REPORT_HTML = `
<p><strong>SUMMER MAINTENANCE REPORT</strong></p>
<table>
  <tr><td>Technician Name:</td><td>Frank Casano</td></tr>
  <tr><td>Visit Date:</td><td>Jul 24, 2026</td></tr>
  <tr><td>Visit Time:</td><td>11:00 AM</td></tr>
</table>
<table>
  <tr><th>Task</th><th>Status</th><th>Notes &amp; Observations</th></tr>
  <tr><td>Clean range hood filter</td><td>Complete</td><td></td></tr>
  <tr><td>Change in-fridge water filter</td><td>Complete</td><td></td></tr>
  <tr><td>Clean dishwasher filter</td><td>Complete</td><td></td></tr>
</table>
<table>
  <tr><th>Area of Home</th><th>Status</th><th>Notes &amp; Observations</th></tr>
  <tr><td>Water heater</td><td>3 - Notable Issue</td><td>Corrosion on pipes. Neutralizer beads need to be replaced.<br><strong>Next Step:</strong> Service on demand water heater (Plumber)</td></tr>
  <tr><td>HVAC System</td><td>1 - All Clear</td><td></td></tr>
  <tr><td>Bedrooms and closets</td><td>1 - All Clear</td><td></td></tr>
</table>`;

test('extracts a DOCX service visit without turning inspection areas into equipment', () => {
  const report = parseDocxServiceReportHtml(SAMPLE_REPORT_HTML);

  assert.equal(report.title, 'SUMMER MAINTENANCE REPORT');
  assert.equal(report.technicianName, 'Frank Casano');
  assert.equal(report.visitDate, 'Jul 24, 2026');
  assert.equal(report.completedWork.length, 3);
  assert.equal(report.observations.length, 3);

  assert.deepEqual(
    report.suggestedTasks.map((task) => task.title),
    ['Service on demand water heater'],
  );
  assert.equal(report.suggestedTasks[0].priority, 'Medium');

  const equipmentTypes = report.suggestedEquipment.map((item) => item.assetType);
  assert.ok(equipmentTypes.includes('Water Heater'));
  assert.ok(equipmentTypes.includes('HVAC'));
  assert.ok(equipmentTypes.includes('Range Hood'));
  assert.ok(equipmentTypes.includes('Refrigerator'));
  assert.ok(equipmentTypes.includes('Dishwasher'));
  assert.ok(!equipmentTypes.includes('Bedrooms and closets'));
});

test('keeps all-clear checks as evidence without creating tasks', () => {
  const report = parseDocxServiceReportHtml(SAMPLE_REPORT_HTML);
  const hvac = report.observations.find((item) => item.area === 'HVAC System');

  assert.equal(hvac?.actionable, false);
  assert.equal(hvac?.status, '1 - All Clear');
  assert.ok(!report.suggestedTasks.some((task) => /HVAC/i.test(task.title)));
});
