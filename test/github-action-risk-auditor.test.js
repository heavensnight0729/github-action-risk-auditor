import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  auditWorkflowText,
} from '../src/github-action-risk-auditor/audit-workflow.js';
import {
  renderWorkflowRiskReport,
} from '../src/github-action-risk-auditor/render-report.js';
import {
  runGithubActionRiskAuditorCli,
} from '../src/github-action-risk-auditor/cli.js';

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

test('renders deterministic markdown with summary and finding table', () => {
  const report = auditWorkflowText({
    filePath: '.github/workflows/ci.yml',
    workflowText: [
      'name: risky-ci',
      'on: pull_request_target',
      'permissions: write-all',
    ].join('\n'),
  });

  const markdown = renderWorkflowRiskReport(report);

  assert.match(markdown, /^# GitHub Action Risk Report/);
  assert.match(markdown, /\| Total \| Critical \| High \| Medium \| Low \|/);
  assert.match(markdown, /\| 2 \| 0 \| 2 \| 0 \| 0 \|/);
  assert.match(markdown, /`\.github\/workflows\/ci\.yml:2`/);
  assert.match(markdown, /pull_request_target trigger/);
  assert.match(markdown, /write-all permissions/);
});

test('cli audits injected workflow files and returns failing status when risks exist', async () => {
  const writes = [];
  const loadCalls = [];

  const exitCode = await runGithubActionRiskAuditorCli({
    argv: ['--workflow', '.github/workflows/ci.yml'],
    loadWorkflows: async (workflowPath) => {
      loadCalls.push(workflowPath);
      return [
        {
          filePath: workflowPath,
          workflowText: [
            'name: risky-ci',
            'permissions: write-all',
          ].join('\n'),
        },
      ];
    },
    writeOutput: (value) => writes.push(value),
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(loadCalls, ['.github/workflows/ci.yml']);
  assert.match(writes[0], /^# GitHub Action Risk Report/);
  assert.match(writes[0], /write-all permissions/);
});

test('cli renders help without loading workflows', async () => {
  const writes = [];

  const exitCode = await runGithubActionRiskAuditorCli({
    argv: ['--help'],
    loadWorkflows: async () => {
      throw new Error('loadWorkflows should not be called');
    },
    writeOutput: (value) => writes.push(value),
  });

  assert.equal(exitCode, 0);
  assert.match(writes[0], /Usage: github-action-risk-auditor/);
});
