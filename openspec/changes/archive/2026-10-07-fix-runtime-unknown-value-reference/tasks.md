# Tasks

## 1. Unresolvable value reference aborts setup

- [x] 1.1 In the setup of `nodes/persistent-value.js`, check after the lookup by UUID or by name whether a value was found. If not, call `reportIncorrectConfiguration(node)` and return `null`, and only then adopt the name of the resolved value. Verify the existing tests in `test/persistent_value_spec.js` still pass
- [x] 1.2 Add a test next to `should be not loaded with an invalid selected value UUID`: `valueId` set to a valid UUID that the test configuration doesn't use. Verify the node has no input callback and `error` is called with a match on `Incorrect or inconsistent configuration`
- [x] 1.3 Add a test: `valueId` removed and `value` set to a name that the test configuration doesn't use. Verify the same, and that `npm run coverage` is green at 100% branches
- [x] 1.4 Add #36 to the `Miscellaneous Editor Fixes` entry under `[Unreleased]` → `Fixes` in `CHANGELOG.md`, and verify it is there
