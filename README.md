# GitHub Action Risk Auditor

[![CI](https://github.com/heavensnight0729/github-action-risk-auditor/actions/workflows/ci.yml/badge.svg)](https://github.com/heavensnight0729/github-action-risk-auditor/actions/workflows/ci.yml)

Dependency-free CLI that audits GitHub Actions workflow files for high-signal OSS maintainer security risks.

I built this as a small local-first review layer for AI-assisted pull requests. CI workflow changes can look harmless in a diff, but a single line can expand permissions, expose secrets, or run privileged code in the wrong event context.

## Why This Exists

GitHub Actions is part of the trusted maintenance path for many open-source projects. When workflows are changed quickly, these problems are easy to miss:

- a workflow moves from `pull_request` to `pull_request_target`
- repository token permissions become broad with `permissions: write-all`
- third-party actions use floating refs such as `@main` or `@v4`
- shell steps accidentally print secrets into logs

This tool is intentionally small. It does not try to replace a full security review. It catches a focused set of mistakes that are cheap to detect and expensive to miss.

## What It Detects

| Rule | Severity | Why it matters |
| --- | --- | --- |
| `pull-request-target-trigger` | high | `pull_request_target` runs with target repository privileges and needs extra review for forked PR safety. |
| `write-all-permissions` | high | Broad write permissions increase the blast radius of a compromised workflow step. |
| `unpinned-action-ref` | medium | Floating refs can change without review; pin third-party actions to a commit SHA. |
| `secret-echo` | medium | Secrets should not be printed or interpolated into `echo` commands. |

## Install

This project currently has no runtime dependencies.

```bash
npm install
```

## Usage

Audit the default workflow directory:

```bash
node src/github-action-risk-auditor/cli.js
```

Audit one workflow file:

```bash
node src/github-action-risk-auditor/cli.js --workflow .github/workflows/ci.yml
```

Return JSON for automation:

```bash
node src/github-action-risk-auditor/cli.js --workflow .github/workflows/ci.yml --format json
```

Only fail CI for high or critical findings:

```bash
node src/github-action-risk-auditor/cli.js --min-severity high
```

When installed as a package:

```bash
github-action-risk-auditor --workflow .github/workflows/ci.yml
```

## Example Output

```text
# GitHub Action Risk Report

## Summary

| Total | Critical | High | Medium | Low |
| ---: | ---: | ---: | ---: | ---: |
| 5 | 0 | 2 | 3 | 0 |
```

## CI Integration

Add a workflow step after checkout:

```yaml
- name: Audit GitHub Actions workflows
  run: node src/github-action-risk-auditor/cli.js --min-severity high
```

For projects that vendor or install the package, use the bin instead:

```yaml
- name: Audit GitHub Actions workflows
  run: github-action-risk-auditor --min-severity high
```

## Exit Codes

- `0`: no findings at or above `--min-severity`
- `1`: one or more findings at or above `--min-severity`
- `2`: CLI/runtime error

Default `--min-severity` is `medium`.

## Design Choices

- **Local-first:** workflow contents are never sent to an external service.
- **Dependency-free:** no runtime packages are required.
- **Deterministic:** the same workflow text produces the same report.
- **CI-friendly:** Markdown is readable in logs; JSON is available for automation.
- **Conservative scope:** rules are high-signal heuristics, not a full YAML security engine.

## Development

```bash
npm test
```

Run the tool against the intentionally unsafe example:

```bash
node src/github-action-risk-auditor/cli.js --workflow examples/unsafe-workflow.yml
```

Run it against this repository's own CI:

```bash
node src/github-action-risk-auditor/cli.js --workflow .github/workflows/ci.yml
```

## Limitations

- It uses line-based heuristics rather than a full YAML parser.
- It does not resolve reusable workflows.
- It does not inspect action source code.
- It should be paired with human review and platform-native GitHub security features.

## License

MIT
