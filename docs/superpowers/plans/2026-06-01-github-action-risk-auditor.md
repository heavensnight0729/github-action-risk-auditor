# GitHub Action Risk Auditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-free CLI that audits GitHub Actions workflow text for high-signal OSS maintainer security risks.

**Architecture:** Keep workflow text auditing, Markdown reporting, filesystem loading, and CLI orchestration separate. The MVP uses deterministic line-based heuristics and does not call external services.

**Tech Stack:** Node.js ESM, `node:test`, `node:assert/strict`, `node:fs/promises`, `node:path`, `node:process`.

---

### Task 1: Workflow Auditor

**Files:**
- Create: `src/github-action-risk-auditor/audit-workflow.js`
- Test: `test/github-action-risk-auditor.test.js`

- [ ] Write failing tests for broad permissions, unpinned actions, pull_request_target, and secret echo risks.
- [ ] Run focused tests and verify RED.
- [ ] Implement pure audit function returning immutable findings.
- [ ] Run focused tests and verify GREEN.

### Task 2: Markdown Reporter

**Files:**
- Create: `src/github-action-risk-auditor/render-report.js`
- Modify: `test/github-action-risk-auditor.test.js`

- [ ] Write failing tests for summary and finding table.
- [ ] Run focused tests and verify RED.
- [ ] Implement deterministic Markdown renderer.
- [ ] Run focused tests and verify GREEN.

### Task 3: CLI and Loader

**Files:**
- Create: `src/github-action-risk-auditor/load-workflows.js`
- Create: `src/github-action-risk-auditor/cli.js`
- Modify: `test/github-action-risk-auditor.test.js`

- [ ] Write failing tests for injected workflow loading, stdout output, `--workflow`, and `--help`.
- [ ] Run focused tests and verify RED.
- [ ] Implement CLI runner and filesystem loader.
- [ ] Run focused tests and verify GREEN.

### Task 4: Publish Prep

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `LICENSE`
- Create: `.github/workflows/ci.yml`
- Create: `examples/unsafe-workflow.yml`
- Create: `package.json`

- [ ] Add docs, package metadata, license, example, and CI.
- [ ] Run `npm test`.
- [ ] Run local secret-pattern scan.
- [ ] Commit and publish to GitHub.
