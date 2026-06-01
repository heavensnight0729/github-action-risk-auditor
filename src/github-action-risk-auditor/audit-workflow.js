const SUMMARY_SEVERITIES = Object.freeze([
  'critical',
  'high',
  'medium',
  'low',
]);

const FLOATING_REFS = Object.freeze([
  'main',
  'master',
  'latest',
  'stable',
  'trunk',
]);

export function auditWorkflowText({
  filePath,
  workflowText,
}) {
  assertFilePath(filePath);
  assertWorkflowText(workflowText);

  const lines = workflowText.split(/\r?\n/);
  const findings = lines.flatMap((line, index) => findLineRisks({
    filePath,
    line,
    lineNumber: index + 1,
  }));

  return deepFreeze({
    schemaVersion: 'github_action_risk_auditor.report/v1',
    files: [filePath],
    summary: summarizeFindings(findings),
    findings,
  });
}

function findLineRisks({
  filePath,
  line,
  lineNumber,
}) {
  const findings = [];

  if (/^\s*on\s*:\s*pull_request_target\s*(?:#.*)?$/i.test(line)) {
    findings.push(createFinding({
      ruleId: 'pull-request-target-trigger',
      severity: 'high',
      label: 'pull_request_target trigger',
      rationale: 'pull_request_target runs with target repository privileges and needs extra review for forked PR safety.',
      filePath,
      lineNumber,
      snippet: line,
    }));
  }

  if (/^\s*permissions\s*:\s*write-all\s*(?:#.*)?$/i.test(line)) {
    findings.push(createFinding({
      ruleId: 'write-all-permissions',
      severity: 'high',
      label: 'write-all permissions',
      rationale: 'Broad write-all permissions expand blast radius if a workflow step is compromised.',
      filePath,
      lineNumber,
      snippet: line,
    }));
  }

  const usesMatch = line.match(/^\s*-\s*uses\s*:\s*([^@\s]+)@([^\s#]+)/i);
  if (usesMatch && isFloatingActionRef(usesMatch[2])) {
    findings.push(createFinding({
      ruleId: 'unpinned-action-ref',
      severity: 'medium',
      label: 'Unpinned action reference',
      rationale: 'Floating action refs can change without review; pin third-party actions to a commit SHA.',
      filePath,
      lineNumber,
      snippet: line,
    }));
  }

  if (/^\s*-\s*run\s*:\s*.*\becho\b.*\$\{\{\s*secrets\.[A-Za-z0-9_]+\s*}}/i.test(line)) {
    findings.push(createFinding({
      ruleId: 'secret-echo',
      severity: 'medium',
      label: 'Secret echoed in shell step',
      rationale: 'Secrets should not be printed or interpolated into echo commands because logs and shell tracing can leak values.',
      filePath,
      lineNumber,
      snippet: line,
    }));
  }

  return findings;
}

function isFloatingActionRef(ref) {
  return FLOATING_REFS.includes(ref.toLowerCase())
    || /^v?\d+$/.test(ref)
    || /^v?\d+\.\d+$/.test(ref);
}

function createFinding({
  ruleId,
  severity,
  label,
  rationale,
  filePath,
  lineNumber,
  snippet,
}) {
  return {
    ruleId,
    severity,
    label,
    rationale,
    filePath,
    lineNumber,
    snippet: snippet.trim(),
  };
}

function summarizeFindings(findings) {
  const counts = Object.fromEntries(SUMMARY_SEVERITIES.map((severity) => [severity, 0]));

  for (const finding of findings) {
    counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
  }

  return {
    totalFindings: findings.length,
    ...counts,
  };
}

function assertFilePath(filePath) {
  if (typeof filePath !== 'string' || filePath.trim() === '') {
    throw new TypeError('filePath must be a non-empty string');
  }
}

function assertWorkflowText(workflowText) {
  if (typeof workflowText !== 'string') {
    throw new TypeError('workflowText must be a string');
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  for (const childValue of Object.values(value)) {
    deepFreeze(childValue);
  }

  return Object.freeze(value);
}
