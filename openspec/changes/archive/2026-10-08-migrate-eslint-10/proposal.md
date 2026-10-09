# Proposal

## Why

The lint toolchain is stuck on ESLint 8, which reached end-of-life in October 2024. The
dependabot bump to ESLint 10 fails twice: `npm install` rejects it because the unused
`eslint-plugin-import` only accepts ESLint up to 9, and ESLint 10 no longer reads the
`eslintConfig` block in `package.json`. The style preset `eslint-config-google` cannot come
along. It was last released in 2019, its repository was archived on 2026-06-01 with no
successor, two of its rules no longer exist and 38 more are deprecated for removal in
ESLint 11.

Separately, the declared Node.js support (`>=8`) is no longer true. The pinned `uuid` 14 is
ESM-only, and `require('uuid')` only works on Node.js versions that can `require()` ES
modules (20.19 and 22.12 or later). The published 1.6.1 declares `uuid >=10.0`, so a fresh
install already resolves to uuid 14 and needs one of those versions.

## What Changes

- **Lint toolchain**: ESLint 10 with an `eslint.config.js`. The `eslintConfig` block and
  the `--ext` flag in `package.json` go away.
- **Rule set**: `@eslint/js` recommended rules for correctness, plus the `@stylistic`
  `customize()` preset for formatting (semicolons, `1tbs` braces, parenthesized arrow
  parameters) with one rule override: `||`, `&&` and `+` stay at the end of a wrapped line
  as before, while `?` and `:` start it. The line limit drops from 140 to 120 characters,
  the width the maintainer's editor is set up for.
  `eslint-plugin-html` stays, so the editor scripts in `nodes/*.html` are still linted.
- **Dev dependencies**: remove `eslint-config-google` and the unused `eslint-plugin-import`,
  `eslint-plugin-n` and `eslint-plugin-promise`. Add `@eslint/js`,
  `@stylistic/eslint-plugin` and `globals`.
- **One-time reformat** of runtime, editor and test code to the preset (about 665
  places, all fixed by `eslint --fix`, mostly `{ id }` and `function ()` spacing).
- **Cleanups** for findings of the recommended rules, without behavior change: unused
  parameters and variables, `hasOwnProperty` calls on objects, needless `= undefined`
  initializations, a declaration in a `case` block, an empty `catch`, and ten
  `no-invalid-this` suppression comments that have nothing left to suppress.
- **Node.js minimum**: `engines.node` changes from `>=8` to `^20.19.0 || >=22.9.0`: what
  uuid 14 needs at runtime, with the 22 line starting at the minimum of Node-RED 5. Fresh
  installs of 1.6.1 already need it, so this is not treated as a breaking change. ESLint 10's narrower range (`^20.19.0 || ^22.13.0 || >=24`) only applies
  to development and doesn't restrict users. The declared Node-RED support
  (`>=1.3.0`) is unchanged.

Flows and already-persisted context data are unaffected. Context key derivation, value
references by UUID or name, and all runtime outputs stay as they are.

The new rules also report two real bugs in the value node's edit dialog as `no-undef`.
They are fixed in their own changes, `fix-editor-context-key-lookup` and
`fix-editor-dialog-state`, which land first, so this change needs no suppression
comment for them.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

_None._ This is a tooling change and declares `skip_specs: true`. The Node.js minimum is
a packaging constraint that no spec describes.

## Impact

- `package.json`: dev dependencies, `engines`, the `lint` script, and removal of
  `eslintConfig`. New file `eslint.config.js`. `.npmignore` keeps it, `openspec/` and `.claude/`
  out of the npm package.
- `nodes/*.js`, `nodes/*.html`, `resources/logger.js`, `test/*_spec.js`: reformat and
  cleanups.
- `CHANGELOG.md` (tooling) and
  the project description in `openspec/config.yaml`, which still names the old preset and
  Node.js `>=8`.
- CI needs no change. The test matrix (20.x, 22.x, 24.x, 26.x) and the lint job (24.x)
  already resolve to supported versions.
- Contributors need Node.js 20.19, 22.13 or 24 and later to run `npm run lint`.
- The dependabot branch `dependabot/npm_and_yarn/eslint-10.6.0` is superseded.
