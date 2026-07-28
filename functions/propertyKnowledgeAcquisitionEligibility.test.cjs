const test = require('node:test');
const assert = require('node:assert/strict');
const { __test } = require('./lib/propertyKnowledgeAcquisition');

test('backend rejects manual and warranty knowledge scans', () => {
  assert.equal(
    __test.isKnowledgeScanEligibleDocument({
      category: 'manual',
      documentType: 'manual',
      type: 'application/pdf',
    }),
    false,
  );
  assert.equal(
    __test.isKnowledgeScanEligibleDocument({
      category: 'warranty',
      documentType: 'warranty',
      type: 'application/pdf',
    }),
    false,
  );
});

test('backend allows other supported document categories', () => {
  assert.equal(
    __test.isKnowledgeScanEligibleDocument({
      category: 'other',
      documentType: 'inspection_report',
      type: 'application/pdf',
    }),
    true,
  );
});
