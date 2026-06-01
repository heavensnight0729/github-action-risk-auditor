# Security Policy

## Scope

This project audits GitHub Actions workflow text locally. It does not send workflow contents, findings, file paths, or repository metadata to any external service.

## Supported Version

The current `main` branch is the supported version while the project is pre-1.0.

## Reporting a Vulnerability

Please open a GitHub issue with:

- the affected rule or CLI path
- a minimal workflow snippet that reproduces the problem
- whether the issue is a false positive, false negative, or data exposure concern

Do not include real secrets, private tokens, or sensitive workflow logs in the report.

## Security Goals

- Avoid leaking secrets in reports.
- Keep workflow analysis local and deterministic.
- Keep dependencies minimal.
- Prefer clear findings over broad noisy scans.

## Known Non-Goals

- This is not a full GitHub Actions policy engine.
- This does not parse every YAML edge case.
- This does not replace manual review for privileged workflows.
