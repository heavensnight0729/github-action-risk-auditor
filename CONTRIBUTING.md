# Contributing

Thanks for considering a contribution.

## Good First Changes

- Add a focused workflow risk rule with tests.
- Improve false-positive handling for an existing rule.
- Improve README examples.
- Add fixtures for real-world GitHub Actions patterns.

## Development Workflow

```bash
npm test
```

The project uses native Node.js tests and has no runtime dependencies.

## Rule Design

Rules should be:

- high-signal enough to be useful in CI
- deterministic
- covered by tests
- clear about why the finding matters
- careful not to print real secret values

Avoid broad checks that generate noisy findings without a clear maintainer action.

## Pull Request Checklist

- [ ] Tests added or updated
- [ ] `npm test` passes
- [ ] README or examples updated when behavior changes
- [ ] Findings do not expose sensitive values unnecessarily
