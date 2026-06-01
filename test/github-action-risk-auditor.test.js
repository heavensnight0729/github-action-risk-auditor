import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auditWorkflowText,
} from '../src/github-action-risk-auditor/audit-workflow.js';

test('detects broad permissions unpinned actions pull_request_target and secret echo risks', () => {
  const workflowText = [
    'name: risky-ci',
    'on: pull_request_target',
    'permissions: write-all',
    'jobs:',
    '  test:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: org/custom-action@main',
    '      - run: echo "${{ secrets.NPM_TOKEN }}"',
  ].join('\n');

  const report = auditWorkflowText({
    filePath: '.github/workflows/ci.yml',
    workflowText,
  });

  assert.equal(report.summary.totalFindings, 5);
  assert.equal(report.summary.high, 2);
  assert.equal(report.summary.medium, 3);
  assert.deepEqual(
    report.findings.map((finding) => finding.ruleId),
    [
      'pull-request-target-trigger',
      'write-all-permissions',
      'unpinned-action-ref',
      'unpinned-action-ref',
      'secret-echo',
    ],
  );
  assert.deepEqual(report.files, ['.github/workflows/ci.yml']);
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.findings), true);
});

test('does not flag pinned actions read-only permissions or safe secret env wiring', () => {
  const workflowText = [
    'name: safe-ci',
    'on: pull_request',
    'permissions:',
    '  contents: read',
    'jobs:',
    '  test:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@a5ac7e51b41094c92402da3b24376905380afc29',
    '      - run: npm test',
    '        env:',
    '          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}',
  ].join('\n');

  const report = auditWorkflowText({
    filePath: '.github/workflows/ci.yml',
    workflowText,
  });

  assert.equal(report.summary.totalFindings, 0);
  assert.deepEqual(report.findings, []);
});
