#!/usr/bin/env node
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import {
  auditWorkflowText,
} from './audit-workflow.js';
import {
  loadWorkflowFiles,
} from './load-workflows.js';
import {
  renderWorkflowRiskReport,
} from './render-report.js';

const HELP_TEXT = `Usage: github-action-risk-auditor [--workflow <path>]

Audits GitHub Actions workflow files for high-signal maintainer security risks.

Options:
  --workflow <path>   Workflow file or directory. Defaults to .github/workflows.
  --format <format>   Output format: markdown or json. Defaults to markdown.
  --min-severity <s>  Minimum severity that returns exit code 1. Defaults to medium.
  --help              Show this help message.
`;

const SEVERITY_RANK = Object.freeze({
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
});

export async function runGithubActionRiskAuditorCli({
  argv = process.argv.slice(2),
  loadWorkflows = loadWorkflowFiles,
  writeOutput = (value) => process.stdout.write(value),
} = {}) {
  const parsedArgs = parseArgs(argv);

  if (parsedArgs.help) {
    writeOutput(HELP_TEXT);
    return 0;
  }

  const workflows = await loadWorkflows(parsedArgs.workflowPath);
  const report = combineReports(workflows.map(auditWorkflowText));
  const output = parsedArgs.format === 'json'
    ? `${JSON.stringify(report, null, 2)}\n`
    : renderWorkflowRiskReport(report);

  writeOutput(output);

  return hasFindingAtOrAboveSeverity(report.findings, parsedArgs.minSeverity) ? 1 : 0;
}

function combineReports(reports) {
  const files = reports.flatMap((report) => report.files);
  const findings = reports.flatMap((report) => report.findings);

  return {
    schemaVersion: 'github_action_risk_auditor.report/v1',
    files,
    summary: summarizeFindings(findings),
    findings,
  };
}

function summarizeFindings(findings) {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const finding of findings) {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
  }

  return {
    totalFindings: findings.length,
    ...counts,
  };
}

function parseArgs(argv) {
  const parsedArgs = {
    format: 'markdown',
    help: false,
    minSeverity: 'medium',
    workflowPath: '.github/workflows',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      parsedArgs.help = true;
      continue;
    }

    if (arg === '--workflow') {
      parsedArgs.workflowPath = requireValue(argv, index, '--workflow');
      index += 1;
      continue;
    }

    if (arg === '--format') {
      parsedArgs.format = requireOutputFormat(requireValue(argv, index, '--format'));
      index += 1;
      continue;
    }

    if (arg === '--min-severity') {
      parsedArgs.minSeverity = requireSeverity(requireValue(argv, index, '--min-severity'));
      index += 1;
      continue;
    }

    throw new RangeError(`Unsupported argument: ${arg}`);
  }

  return parsedArgs;
}

function hasFindingAtOrAboveSeverity(findings, minSeverity) {
  const minRank = SEVERITY_RANK[minSeverity];

  return findings.some((finding) => SEVERITY_RANK[finding.severity] >= minRank);
}

function requireOutputFormat(value) {
  if (value !== 'markdown' && value !== 'json') {
    throw new RangeError('--format must be markdown or json');
  }

  return value;
}

function requireSeverity(value) {
  if (!Object.hasOwn(SEVERITY_RANK, value)) {
    throw new RangeError('--min-severity must be low, medium, high, or critical');
  }

  return value;
}

function requireValue(argv, index, flagName) {
  const value = argv[index + 1];

  if (!value || value.startsWith('--')) {
    throw new RangeError(`${flagName} requires a value`);
  }

  return value;
}

if (isDirectExecution()) {
  runGithubActionRiskAuditorCli()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 2;
    });
}

function isDirectExecution() {
  return process.argv[1]
    && import.meta.url === pathToFileURL(process.argv[1]).href;
}
