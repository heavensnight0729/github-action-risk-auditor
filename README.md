# GitHub Action Risk Auditor

Dependency-free CLI that audits GitHub Actions workflow files for high-signal OSS maintainer security risks.

This is a small local-first tool for maintainers who want a quick review layer around CI changes before merging AI-assisted pull requests.

## What It Detects

- `pull_request_target` workflows that need extra forked PR review
- `permissions: write-all`
- Floating action refs such as `@main`, `@master`, `@v4`, or `@latest`
- Shell steps that echo GitHub secrets

## Usage

Audit the default workflow directory:

```bash
node src/github-action-risk-auditor/cli.js
```

Audit one workflow file:

```bash
node src/github-action-risk-auditor/cli.js --workflow .github/workflows/ci.yml
```

When installed as a package:

```bash
github-action-risk-auditor --workflow .github/workflows/ci.yml
```

## Exit Codes

- `0`: no findings
- `1`: one or more findings
- `2`: CLI/runtime error

## Security Notes

This tool is local-only. It does not send workflow contents or findings to any external service.

The rules are intentionally high-signal heuristics and are not a replacement for a full security review.

## Development

```bash
npm test
```

## License

MIT
