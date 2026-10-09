# Design

## Context

See proposal.md for motivation. The facts that shape the approach:

- About half of the JavaScript sits in `<script type="text/javascript">` blocks of
  `nodes/*.html`, next to `<script type="text/html">` blocks that hold the editor templates
  and help text. Only `eslint-plugin-html` lints exactly the JavaScript blocks and leaves the
  rest alone. Prettier and Biome reformat the whole file (Prettier changed 265 of 709 lines
  in `persistent-value.html`, including templates and help text), and oxlint and xo skip
  plain `.html`.
- The current rule set lints these scripts as ES modules (`sourceType: 'module'`), but the
  runtime files are CommonJS and the editor scripts are classic browser scripts. That
  mismatch is why ten `no-invalid-this` suppressions exist.
- The editor scripts share a global across script tags: `resources/logger.js` creates
  `logger` on `window`, and Node-RED loads it into the same editor page as both `.html`
  files. `replace-config-registry`, which lands first, removed the other one,
  `httpPathConfigGet`.
- No ESLint rule check is defined for `examples/*.json` or `openspec/`. The lint scope stays
  `nodes`, `resources` and `test`.
- Measured on ESLint 10.12.0 with `eslint-plugin-html` 8.2.1, `@stylistic/eslint-plugin`
  5.10.0 and `@eslint/js` 10.0.1: the chosen config reports 665 formatting findings, all
  fixed by `--fix`, and 37 other findings once the two editor fix changes have landed.
  `replace-config-registry` removes 13 of them with the code they were in: the three
  `hasOwnProperty` calls of the registry endpoints and the ten unused `res` parameters of
  their tests. The remaining 24 are listed in tasks.md.

## Goals / Non-Goals

**Goals:**
- The configuration consists of maintained presets and only the settings this project
  really needs (file types, globals, line length, operator placement).
- `npm run lint` is clean on ESLint 10 with no rule switched off and no new suppression
  comment.
- The configuration keeps working on ESLint 11, which removes the core formatting rules.

**Non-Goals:**
- Keeping the Google look. The preset's formatting replaces it, accepting a one-time diff.
- `.git-blame-ignore-revs`. Pull requests are squash-merged, so the reformat would land in
  the same commit as the manual cleanups, and ignoring that commit would hide them from
  blame.
- Checking which older Node-RED versions run on Node.js 20. `node-red.version` stays
  `>=1.3.0`.
- Type checking, JSDoc rules or further plugins (`eslint-plugin-n`, import checks).

## Decisions

### Rule set: `@eslint/js` recommended + `@stylistic` `customize()`

The same building blocks Node.js core uses, taken as maintained presets instead of a
hand-written rule list. `@eslint/js` is maintained by the ESLint team, `@stylistic` is the
project ESLint handed its formatting rules to.

Alternatives measured on this code base:

| Option | Why not |
|---|---|
| Copy the 63 remaining Google rules, formatting rules moved to `@stylistic` | We would maintain an archived preset ourselves. |
| neostandard (Fastify, Pino, undici) | Crashes on ESLint 10 (`sourceCode.isSpaceBetweenTokens is not a function`). Even on ESLint 9 it reports 2466 findings, 1719 of them missing semicolons. |
| Prettier + `@eslint/js` (Mocha, Axios) | Reformats the editor templates and help text in `.html`, and can't be limited to the scripts. |
| Biome | HTML formatting is experimental, and its formatter rewrote 267 of 379 lines in `persistent-values-config.html`. |
| xo, oxlint | Don't lint plain `.html`. |

### Preset options: `customize({semi: true, braceStyle: '1tbs', arrowParens: true})`

The bare preset defaults leave out semicolons and use the `stroustrup` brace style. These
three options match the formatting most projects use (Prettier's defaults), at 665
findings instead of 2474. The preset's spacing (`{ id }`, `function ()`, indented `case`
labels) replaces the Google spacing.

One rule is overridden: `@stylistic/operator-linebreak` is `after` instead of the preset's
`before`, so `||`, `&&` and `+` stay at the end of a wrapped line, as the code had them.
`?` and `:` keep `before`, because with `after` the preset's ternary indentation comes out
uneven. The old alignment of continuation lines under the first operand doesn't return:
`@stylistic/indent-binary-ops` requires one indent level.

`@stylistic/max-len` is added explicitly, because the preset has no line length rule. It
drops from 140 to 120 characters, the width the maintainer's editor is set up for. `max-len`
has no autofix, so the 13 longer lines are wrapped by hand, with every string unchanged.

### Config file: `eslint.config.js` as CommonJS

The package has no `"type": "module"`, so a `.js` config is loaded as CommonJS, the same
form Node-RED uses for its own `eslint.config.js`. `.mjs` would mix two module systems in
the repository for no gain.

### Language options per file group

| Files | `sourceType` | Globals |
|---|---|---|
| `**/*.js` | `commonjs` | Node.js |
| `test/**/*.js` | (as above) | + mocha |
| `nodes/*.html` | `script` | browser, jQuery, `RED`, `logger` |

`resources/logger.js` is both required in Node.js and loaded as a browser script. As
CommonJS it sees `exports`, and the browser branch only needs `console` and `this`, which
need no declaration.

Cross-file globals are declared in the config rather than with `/* global */` comments in
the `.html` files. That keeps every lint setting in one place.

No `ecmaVersion` is set. The default (`latest`) fits now that Node.js 20.19 is the minimum.

### Lint script: `eslint nodes resources test`

The config's `files` patterns cover `.js` and `.html`, so the removed `--ext` flag isn't
needed. The directory list keeps today's scope.

### `engines.node`: `^20.19.0 || >=22.9.0`

`engines` states what users need at runtime, so it follows the runtime dependency and not
the dev tooling. uuid 14 is an ES module, and `require('uuid')` only works where
`require()` of ES modules is enabled by default: 20.19, 22.12 and later. A plain `>=20.19`
would wrongly include 21.x and 22.0 to 22.11. Verified with the test suite on the official
builds: 20.18.3 and 22.11.0 fail with `ERR_REQUIRE_ESM`, 20.19.0 and 22.12.0 pass.

The 22 line starts at 22.9 instead of 22.12, the minimum of Node-RED 5. `node-red-dev
validate` (check P07) requires the minimum Node.js of the latest Node-RED to be inside
`engines.node`, and `>=22.12.0` fails it. This declares 22.9 to 22.11, where uuid 14
can't be loaded, which is accepted (see Risks). Node.js 20.19 stays for Node-RED 4.x.

ESLint 10's own range (`^20.19.0 || ^22.13.0 || >=24`) is narrower, but only contributors
run it, so it doesn't go into `engines`. A `"//"` key in `package.json` records the reason
next to `engines`, since JSON has no comments. The README doesn't state a Node.js version.

Not a breaking change: fresh installs of 1.6.1 already need this minimum through uuid 14,
and Node-RED 3.x and older are end-of-life. The CHANGELOG gets no `Breaking Changes` entry.

With this minimum, the cleanups can use `catch {}` without a binding and `Object.hasOwn`
instead of `Object.prototype.hasOwnProperty.call`.

### Editor bugs in their own changes, landing first

`no-undef` reports two real bugs in `nodes/persistent-value.html`: the undefined `id` in
the context key warning and the undeclared `backendConfig`. They are fixed in
`fix-editor-context-key-lookup` and `fix-editor-dialog-state`, not here.

- The fixes don't depend on ESLint 10 and can land on the current toolchain.
- The context key fix goes beyond what lint reports. The rule only flags the undefined
  `id`, while the actual bug is the missing `await`, which no rule in this set detects.
- Inside a squash-merged reformat of 665 places, a behavior fix is hard to review, revert
  or find later.

Alternative: suppress both findings here and fix them afterwards. Rejected because it
would add suppression comments only to remove them again.

### Order of work

Both editor fix changes first, then config and dependencies, then `eslint --fix` on its
own, then the manual cleanups. A pure `--fix` step contains only whitespace and
punctuation, which keeps it easy to review even though it touches every file.

## Risks / Trade-offs

- [`--fix` changes behavior] → `@stylistic` fixes only change whitespace and punctuation.
  The full mocha suite with nyc's 100% coverage gate covers the runtime files, and a manual
  smoke test in the Node-RED editor covers the `.html` scripts.
- [The reformat makes rebasing open branches harder] → No unmerged branches exist today.
  Branches created later can run `npm run lint -- --fix` after rebasing.
- [Users on Node.js below 20.19 lose support] → This includes Node-RED 4.x on Node.js 18,
  which Node-RED 4 still declares (`>=18.5`). Fresh installs of 1.6.1 already fail for
  them through uuid 14. npm only warns about `engines` unless `engine-strict` is set, so
  existing installations keep working until upgraded.
- [Node.js 22.9 to 22.11 are declared but can't load uuid 14] → Node-RED reports the
  failed node registration at startup. Fresh installs of 1.6.1 already fail there, and
  22.x is maintained, so users of these versions can update within the same major.
- [`eslint-plugin-html` declares no supported ESLint range] → Verified on ESLint 10.12.0.
  The CI lint job catches a future break.
- [A new `@stylistic` major version changes preset defaults] → Dev dependencies are pinned
  to exact versions as before, so dependabot shows such a change as a separate update.

## Migration Plan

Users only see the new Node.js minimum. Contributors need Node.js 20.19, 22.13 or 24 and
later to run `npm run lint`, and should delete `node_modules` once to drop the removed
plugins. Rollback is a revert of the change.

## Open Questions

_None._
