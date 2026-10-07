# Tasks

## 1. Prerequisites

- [x] 1.1 Start from a master that contains `fix-editor-config-load-failure`, and verify that the configuration select's change handler in `nodes/persistent-value.html` empties and disables the value list when the configuration doesn't resolve

## 2. Runtime: remove the registry

- [x] 2.1 In `nodes/persistent-values-config.js`, remove the `configs` object, its update in the constructor and the `config/get`, `config/save` and `config/delete` endpoints. Keep `name` and `values` on the runtime node and keep the `generate_uuid` endpoint. Verify `grep -rn 'config/get\|config/save\|config/delete' nodes` finds nothing
- [x] 2.2 Remove the eight endpoint tests from `test/persistent_values_config_spec.js` and keep `should generate a new UUID`. Verify `npm run coverage` is green at 100%

## 3. Editor: configuration node's dialog

- [x] 3.1 In `nodes/persistent-values-config.html`, compute the generated name by counting the other `persistent values config` nodes with `RED.nodes.eachConfig`, and remove the `httpPathConfigGet`, `httpPathConfigSave` and `httpPathConfigDelete` constants and the save and delete posts. Verify `npm run lint` is clean
- [x] 3.2 In a running Node-RED with one undeployed configuration, add a new configuration node. Verify its name field is prefilled with `Persistent Values Config 1`

## 4. Editor: value node's dialog

- [x] 4.1 In `nodes/persistent-value.html`, take `name` and `values` in the configuration select's change handler from `RED.nodes.node(selectedConfigId)` and remove `getConfigFromBackend`. Keep the guard for a configuration that doesn't resolve, and log the `[Persistent Values]` error naming the ID there. Verify `npm run lint` is clean
- [x] 4.2 Import a flow with a configuration and a value node and open the value node's dialog before deploying. Verify the value list offers the configuration's values with the stored value selected and the console shows no error
- [x] 4.3 Add a value to a deployed configuration without deploying, then open a value node of that configuration. Verify the value list offers the added value
- [x] 4.4 In a value node's dialog, create a new configuration through the configuration field and confirm it. Verify the value list offers the new configuration's values

## 5. Docs, specs and examples

- [x] 5.1 Add `#38` to the `Miscellaneous Editor Fixes` entry under `[Unreleased]` → `Fixes` in `CHANGELOG.md`. Verify it is there
- [x] 5.2 Reword the Purpose of `openspec/specs/editor-backend-api/spec.md` to the remaining endpoints (UUID generation and context key), and verify it no longer mentions configuration data
- [x] 5.3 Remove the comment node `*Important*: Make config available` from all four `examples/*.json`, and its ID from its group's `nodes` list. Verify `grep -rl 'Make config available' examples` finds nothing, and that after importing each example, a value node's value list offers the configuration's values before deploying
- [x] 5.4 Re-align the four examples to the layouts arranged in the editor, taking the node positions and group bounds unchanged from the editor's export. Verify that after importing each example its comments and inject nodes line up and no node overlaps another

## 6. Integration

- [x] 6.1 Verify `npm run lint` and `npm run coverage` are green and `npm run node-red-dev-validate` passes, then smoke test both edit dialogs and the examples from `examples/*.json` in a running Node-RED with no errors in the browser console
