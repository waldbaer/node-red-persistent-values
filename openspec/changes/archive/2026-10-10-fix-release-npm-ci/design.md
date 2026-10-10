# Design

## Context

See proposal.md for motivation. The facts that shape the approach:

- `release.yml` runs: checkout, `setup-node` with Node.js 22 and the npm registry,
  `npm install -g npm@latest` (trusted publishing needs npm 11.5.1 or later), `npm ci`,
  `npm run build --if-present`, `npm test`, `npm publish`.
- `test.yml` installs with `npm install` (unit tests) and `npm install --save-dev` (lint).
  Neither uses a lockfile.
- `package-lock.json` is listed in `.gitignore` and `.npmignore`.
- Reproduced on a checkout without a lockfile: `npm ci` exits with `EUSAGE` on npm 10.9.4
  and on npm 12.2.0, the current `npm@latest`.
- The package has no build step, so `npm publish` needs no installed dependencies. The
  install only serves `npm test`.

## Goals / Non-Goals

**Goals:**
- The release job gets past dependency installation and runs the tests and the publish.
- Release and test workflows install the same way, so a release runs the tests the same
  way CI does.

**Non-Goals:**
- Reproducible installs through a committed lockfile.
- Pinning the npm version of the upgrade step (see Risks).
- A manual trigger or a dry-run mode for the release workflow.

## Decisions

### `npm install` instead of `npm ci`

`npm install` resolves the ranges in `package.json`, as the test workflow does. Dev
dependencies are pinned to exact versions, so only transitive dependencies can differ
between two runs, the same as between any two CI runs today.

Alternatives:

| Option | Why not |
|---|---|
| Commit `package-lock.json` and keep `npm ci` | Ends the repository's practice of not committing the lockfile, which the test workflow and dependabot follow today. A lockfile generated behind a private registry mirror records that mirror's URLs, which the GitHub runner can't reach. The test workflow would also have to switch to `npm ci` to test what gets released. |
| Drop the install and test steps | `npm publish` needs no installed dependencies, but the tests are the only gate before publishing. |

### Verification before the first release

On a fresh clone, `npm install`, `npm test` and `npm pack --dry-run` show that the
install and test steps work and that the package contents are as expected. `npm pack
--dry-run` lists the files `npm publish` would upload without contacting the registry.
The trusted publishing step (OIDC token exchange and the trusted publisher configured
on npmjs.com for this repository) can only be checked by a real release.

## Risks / Trade-offs

- [Transitive dependencies resolve differently between the last CI run and the release]
  → The same exposure as between any two CI runs. The published package carries no
  lockfile, so users resolve them on install anyway.
- [`npm install -g npm@latest` floats] → npm 12.2.0, the current latest, requires Node.js
  `^22.22.2 || ^24.15.0 || >=26`, and `node-version: '22'` resolves to 22.23.3 today. A
  later npm major that drops Node.js 22 would break this step. Out of scope here; pinning
  `npm@11` or raising `node-version` fixes it when needed.
- [Trusted publishing fails on the first run] → The GitHub release then exists without an
  npm version. Fix the configuration on npmjs.com and re-run the failed job; no new
  release is needed.

## Migration Plan

Merge, then create the next GitHub release, which triggers the workflow. Check that the
run succeeds and the version appears on npm. Rollback is a revert of the change.
