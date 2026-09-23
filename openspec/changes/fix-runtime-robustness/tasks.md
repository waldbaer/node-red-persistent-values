# Tasks

## 1. Collect Values with a `null` property

- [ ] 1.1 In `updateCollectedValues` (`nodes/persistent-value.js`), change the guard to `collectedValues === null || typeof collectedValues !== 'object'`, and verify the existing collection tests in `test/persistent_value_spec.js` still pass
- [ ] 1.2 Add a test in `test/persistent_value_spec.js`: a reading node with collection enabled receives `msg.values = null`. Verify the emitted message carries `{TestConfig_boolean: true}` and that `error` is not called
- [ ] 1.3 Add a `CHANGELOG.md` entry under `[Unreleased]` → `Fixes`, and verify it names the `null` case

## 2. Malformed JSON default

- [ ] 2.1 In the input handler (`nodes/persistent-value.js`), wrap `getDefaultValue` in `try`/`catch`. On failure, call `logger.logError` with a message naming `<config> / <value>` and passing `node` and `msg`, then return. Verify with `npm test` that nothing else changes
- [ ] 2.2 Add a test: read a `json` value whose default is `{not json`. Verify `error` is called with a match on the config and value name, that its second argument is the incoming `msg`, and that `send` is not called
- [ ] 2.3 Add a test: the same value with an existing context entry. Verify the same error, that `send` is not called, and that the context entry is unchanged
- [ ] 2.4 Add a `CHANGELOG.md` entry under `[Unreleased]` → `Fixes`, and verify it describes the new error message

## 3. Backend registry pruning

- [ ] 3.1 In `nodes/persistent-values-config.js`, register `node.on('close', function(removed, done) {…})` that deletes `configs[node.id]` only when `removed` is true and always calls `done()`. Verify with `npm test` that the existing config tests still pass
- [ ] 3.2 Add a test in `test/persistent_values_config_spec.js`: after `await helper.getNode('config1').close(true)`, GET `/persistentvalues/config/get?id=config1` answers 404. Await the request before calling `done`, unlike the existing tests in that file
- [ ] 3.3 Add a test: after `await helper.getNode('config1').close(false)`, the same GET answers 200 with the configuration
- [ ] 3.4 Add a `CHANGELOG.md` entry under `[Unreleased]` → `Fixes`, and verify it names the stale entries after a deploy

## 4. Status with an object-form default store

- [ ] 4.1 In `buildNodeStatus` (`nodes/persistent-value.js`), replace `RED.settings.contextStorage.default !== undefined` with `typeof RED.settings.contextStorage.default === 'string'`. Verify the existing status tests (`default (memory)` and the no-default case) still pass
- [ ] 4.2 Add a test with `contextStorage: {default: {module: 'memory'}}`. Verify the status text is `true [boolean,global,default]`
- [ ] 4.3 Add a `CHANGELOG.md` entry under `[Unreleased]` → `Fixes`, and verify it names the `[object Object]` status

## 5. Integration

- [ ] 5.1 Run `npm run coverage` and verify that all tests pass and nyc reports 100% branches, lines, functions and statements
- [ ] 5.2 Run `npm run lint` and verify it reports no findings
- [ ] 5.3 Run `openspec validate fix-runtime-robustness --strict` and verify the change is valid
