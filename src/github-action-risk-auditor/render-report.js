export function renderWorkflowRiskReport(report) {
  assertReportObject(report);

  const lines = [
    '# GitHub Action Risk Report',
    '',
    '## Summary',
    '',
    '| Total | Critical | High | Medium | Low |',
    '| ---: | ---: | ---: | ---: | ---: |',
    `| ${report.summary.totalFindings} | ${report.summary.critical} | ${report.summary.high} | ${report.summary.medium} | ${report.summary.low} |`,
    '',
    '## Files',
    '',
    ...renderFiles(report.files),
    '',
    '## Findings',
    '',
    ...renderFindings(report.findings),
  ];

  return `${lines.join('\n')}\n`;
}

function renderFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return ['- None'];
  }

  return files.map((filePath) => `- \`${filePath}\``);
}

function renderFindings(findings) {
  if (!Array.isArray(findings) || findings.length === 0) {
    return ['No high-signal GitHub Actions risks detected.'];
  }

  return [
    '| Severity | Rule | Location | Snippet | Rationale |',
    '| --- | --- | --- | --- | --- |',
    ...findings.map((finding) => [
      `| ${escapeTableCell(finding.severity)}`,
      escapeTableCell(finding.label),
      `\`${formatLocation(finding)}\``,
      `\`${escapeTableCell(finding.snippet)}\``,
      `${escapeTableCell(finding.rationale)} |`,
    ].join(' | ')),
  ];
}

function formatLocation(finding) {
  return `${finding.filePath}:${finding.lineNumber}`;
}

function escapeTableCell(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ');
}

function assertReportObject(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    throw new TypeError('report must be an object');
  }

  if (!report.summary || typeof report.summary !== 'object') {
    throw new TypeError('report.summary must be an object');
  }
}
