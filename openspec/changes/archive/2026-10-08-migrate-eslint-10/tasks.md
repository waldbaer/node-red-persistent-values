# Tasks

## 1. Prerequisites

- [x] 1.1 Start from a master that contains `fix-editor-context-key-lookup`, `fix-editor-dialog-state` and `replace-config-registry`, and verify in `nodes/persistent-value.html` that `getContextKeyNameFromBackend` awaits `$.getJSON`, and that `grep -rn 'httpPathConfig' nodes` finds nothing

## 2. Node.js minimum

- [x] 2.1 Set `engines.node` in `package.json` to `^20.19.0 || >=22.9.0`, with a `"//"` key that explains the minimum, and verify `npm run coverage` stays green on the local Node.js and that every CI matrix entry in `.github/workflows/test.yml` (20.x, 22.x, 24.x, 26.x) falls within the range
- [x] 2.2 Update the Node.js statements in `openspec/config.yaml` (declared support and the proposal rule) to the new range, and verify `grep -n '>=8\|>= 8' openspec/config.yaml` finds nothing

## 3. Lint toolchain

- [x] 3.1 In `package.json`: remove `eslint-config-google`, `eslint-plugin-import`, `eslint-plugin-n` and `eslint-plugin-promise`; set `eslint` to `10.12.0`; add `@eslint/js` `10.0.1`, `@stylistic/eslint-plugin` `5.10.0` and `globals` `17.13.0` (exact versions, as for the other dev dependencies); keep `eslint-plugin-html` at `8.2.1` or later; delete the `eslintConfig` block. Verify `rm -rf node_modules && npm install` finishes without an `ERESOLVE` error
- [x] 3.2 Create `eslint.config.js` (CommonJS) with `@eslint/js` recommended, `@stylistic` `customize({semi: true, braceStyle: '1tbs', arrowParens: true})`, `@stylistic/max-len` at 120 (`tabWidth: 2`, `ignoreUrls: true`), `@stylistic/operator-linebreak` `after` with `?` and `:` `before`, `eslint-plugin-html` for `nodes/*.html`, and the file groups and globals from design.md. Verify `npx eslint --print-config nodes/persistent-value.html` shows `sourceType: "script"` with `RED` and `logger`, and `npx eslint --print-config test/logger_spec.js` shows `sourceType: "commonjs"` with the mocha globals
- [x] 3.3 Change the `lint` script to `eslint nodes resources test`, and verify `npm run lint` runs without a configuration error and reports findings in both `.js` and `.html` files, none of them `no-undef` (the rest are fixed in groups 4 to 7)
- [x] 3.4 Update the linting line in `openspec/config.yaml` to the new rule set, and verify `grep -n 'eslint-config-google' openspec/config.yaml` finds nothing
- [x] 3.5 Add an entry under `[Unreleased]` in `CHANGELOG.md` (`Improvements`: development infrastructure moved to ESLint 10), and verify it is there
- [x] 3.6 Add `eslint.config.js`, `openspec/` and `.claude/` to `.npmignore`, and verify `npm pack --dry-run` lists none of them

## 4. Reformat

- [x] 4.1 Run `npx eslint --fix nodes resources test`, and verify `npm run lint` reports no `@stylistic/*` findings other than `@stylistic/max-len` (4.2), `git diff -w` shows only moved operators and commas (no changed identifiers or literals), and `npm run coverage` stays green at 100%
- [x] 4.2 Wrap the lines longer than 120 characters by hand (`max-len` has no autofix), keeping every string literal's value unchanged, and verify `npm run lint` reports no `@stylistic/max-len` finding and `npm run coverage` stays green at 100%

## 5. Runtime cleanups (`nodes/*.js`, `resources/logger.js`)

- [x] 5.1 Remove the `no-invalid-this` suppression comments in `nodes/persistent-value.js`, `nodes/persistent-values-config.js` and `resources/logger.js`, and verify `npx eslint nodes/*.js resources` reports no unused directive
- [x] 5.2 In `nodes/persistent-value.js`: drop the needless initial values in `getUsedContext`, `getContext` and `compareToConfiguredDatatype`; wrap the `kConfigDatatypeNumber` case in a block; turn the three `catch (e)` into `catch`, with a comment in the empty one explaining that a failed parse is reported below; replace `.hasOwnProperty(…)` with `Object.hasOwn(…)`. Verify `npx eslint nodes/persistent-value.js` is clean and `npm run coverage` stays green at 100%

## 6. Test cleanups (`test/*.js`)

- [x] 6.1 Remove the unused parameters from the `NodeMock` methods in `test/logger_spec.js`, and verify the logger tests pass
- [x] 6.2 In `test/persistent_value_spec.js`, drop the needless `= undefined` in the context helper and the unused `msg` parameter of the input handler, and verify `npx eslint test` is clean and the value node tests pass

## 7. Editor cleanups (`nodes/*.html`)

- [x] 7.1 Remove the seven `no-invalid-this` suppression comments in `nodes/persistent-value.html` and the unused `id` parameter of `generateUuidFromBackend` in `nodes/persistent-values-config.html`. Verify `npx eslint nodes` is clean and a new value entry in the configuration node's edit dialog still gets a UUID

## 8. Integration

- [x] 8.1 Verify `npm run lint` reports 0 problems (no warnings either), `npm run coverage` is green at 100%, and `npm run node-red-dev-validate` passes
- [x] 8.2 Smoke test both edit dialogs and the examples from `examples/*.json` in a running Node-RED, and verify that the browser console shows no errors, a value node shows the selected value's tip, and deploying and triggering the examples behaves as before
