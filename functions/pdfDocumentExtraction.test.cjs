const test = require('node:test');
const assert = require('node:assert/strict');
const { extractPdfDocument } = require('./lib/pdfDocumentExtraction');
const { parseServiceReportLayout } = require('./lib/docxServiceReport');

const escapePdfText = (value) => value.replace(/([\\()])/g, '\\$1');

const buildPdf = (textItems) => {
  const commands = textItems
    .map(({ x, y, text }) => `BT /F1 11 Tf 1 0 0 1 ${x} ${y} Tm (${escapePdfText(text)}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(commands)} >>\nstream\n${commands}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
};

test('extracts a digital PDF layout and routes it through service-report interpretation', async () => {
  const pdf = buildPdf([
    { x: 50, y: 750, text: 'SUMMER MAINTENANCE REPORT' },
    { x: 50, y: 730, text: 'Technician Name: Frank Casano' },
    { x: 50, y: 710, text: 'Visit Date: Jul 24, 2026' },
    { x: 50, y: 660, text: 'MAINTENANCE TASKS' },
    { x: 50, y: 640, text: 'Task' },
    { x: 250, y: 640, text: 'Status' },
    { x: 350, y: 640, text: 'Notes & Observations' },
    { x: 50, y: 620, text: 'Clean dishwasher filter' },
    { x: 250, y: 620, text: 'Complete' },
    { x: 50, y: 570, text: 'STATUS CHECKS' },
    { x: 50, y: 550, text: 'Area of Home' },
    { x: 250, y: 550, text: 'Status' },
    { x: 350, y: 550, text: 'Notes & Observations' },
    { x: 50, y: 530, text: 'Water heater' },
    { x: 250, y: 530, text: '3 - Notable Issue' },
    { x: 350, y: 530, text: 'Next Step: Service water heater' },
  ]);

  const extracted = await extractPdfDocument(pdf);
  const report = parseServiceReportLayout(extracted);

  assert.equal(extracted.hasUsableText, true);
  assert.equal(report.technicianName, 'Frank Casano');
  assert.equal(report.visitDate, 'Jul 24, 2026');
  assert.deepEqual(report.completedWork, ['Clean dishwasher filter']);
  assert.equal(report.observations.length, 1);
  assert.equal(report.suggestedTasks[0].title, 'Service water heater');
});
