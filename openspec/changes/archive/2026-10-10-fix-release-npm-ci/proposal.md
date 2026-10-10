# Proposal

## Why

The release workflow `.github/workflows/release.yml`, added on 2025-11-02 for npm trusted
publishing, installs dependencies with `npm ci`. `npm ci` only works with a committed
`package-lock.json`, but the lockfile has been gitignored since the first commit. The job
stops at that step with `EUSAGE` and never reaches `npm publish`. The workflow has not run
yet (no release since 1.6.1), so the next GitHub release would be the first to fail.

## What Changes

- The release workflow installs dependencies with `npm install` instead of `npm ci`, the
  same command the test workflow (`test.yml`) uses. The lockfile stays uncommitted.

Nothing else in the workflow changes: Node.js 22, the npm upgrade for trusted publishing,
`npm test` as the gate before publishing, and `npm publish` stay as they are.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

_None._ This is a CI change and declares `skip_specs: true`. No spec describes the release
process, and the published package does not change.

## Impact

- `.github/workflows/release.yml`: one step.
- The published package is unchanged: `.npmignore` already keeps `package-lock.json` out of
  it. Runtime behavior, flows, persisted context data, and the declared Node-RED and
  Node.js support are unaffected.
- No `CHANGELOG.md` entry, since nothing user-visible changes.
- Verification is limited before the first real release: the install, test and pack steps
  can be checked on a fresh clone, the trusted publishing step only by a real release.
